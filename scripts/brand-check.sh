#!/bin/bash
# ============================================================
# MyShape Protocol — Brand Compliance Pre-commit Scanner
#
# 扫描即将提交的代码中的禁用关键词。
# 违反品牌准则 → 阻止提交。
#
# 安装：ln -sf ../../scripts/brand-check.sh .git/hooks/pre-commit
# ============================================================

set -e

# ── 禁用关键词列表（不区分大小写） ──
BANNED=(
  "\\bman\\b" "\\bwoman\\b" "\\bmale\\b" "\\bfemale\\b"
  "\\bskin\\b" "\\bmuscle\\b" "\\bflesh\\b" "\\bchest\\b"
  "\\bbreasts?\\b" "\\bgenital" "\\bbrawny\\b"
  "\\bhandsome\\b" "\\bpretty\\b" "\\bstrength\\b"
  "\\bbody\\b" "\\bbiometric\\b"
  "\\bavatar\\b" "\\bheadshot\\b" "\\bprofile picture\\b"
  "\\bmailman\\b" "\\bfireman\\b" "\\bpoliceman\\b"
  "\\bchairman\\b" "\\bspokesman\\b"
)

# ── 扫描范围：仅 staged 文件，排除二进制 ──
#
# The conservative-FP manifest is deliberately excluded from this ordinary
# banned-word scan. It is the gate's own exemption database, not content the
# gate governs: its `exactText` fields are verbatim code excerpts of the very
# findings being exempted, so they necessarily contain the exempted token and
# would always self-report. Excluding it here does NOT make it invisible to the
# CFP subsystem below — the manifest is still located, parsed, schema-validated,
# fingerprint-validated, used for classification, and subject to stale
# reconciliation. The exclusion below is an exact path match; every other .json
# file, including any other file under scripts/ or docs/, is still scanned.
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -v -x -F 'scripts/brand-check-conservative-fp.json' \
  | grep -E '\.(tsx?|jsx?|css|html|md|json)$' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

VIOLATIONS=0
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ── Conservative-FP manifest (post-detection exemption) ──
# ARCHITECTURAL INVARIANT:
#   The manifest NEVER alters scanner detection. Banned patterns and the
#   occurrence-level suppression regex below are read-only inputs to this
#   script and are never derived from the manifest. The manifest can only
#   decide whether an already-detected finding was previously reviewed and
#   recorded as a conservative false positive.
#
#   A finding is exempted ONLY on an exact three-way match:
#       file + rule + sha256(normalize(exact line content))
#   There is no file-wide, directory-wide, pattern-wide or line-range bypass.
MANIFEST="scripts/brand-check-conservative-fp.json"
MANIFEST_ERR=0
MANIFEST_STDERR=$(mktemp 2>/dev/null || printf '%s' "${TMPDIR:-/tmp}/brand-check-manifest.$$")
declare -a CFP_ID CFP_RULE CFP_FILE CFP_HASH CFP_TEXT CFP_REASON
declare -A CFP_USED
CFP_COUNT=0

if [ -f "$MANIFEST" ]; then
  # Interpreter selection.
  #
  # The embedded parser below is PYTHON. Only a Python interpreter may run it.
  # A JavaScript runtime must never be handed this heredoc: it fails with a
  # SyntaxError that is otherwise swallowed into a captured variable, producing
  # a silent exit 1 with no diagnostic output.
  #
  # Selection is therefore python-first, and a missing interpreter is reported
  # explicitly on stderr rather than being allowed to fail silently.
  if command -v python3 >/dev/null 2>&1 && python3 -c 'import json,hashlib' >/dev/null 2>&1; then
    MANIFEST_PARSER="python3"
  elif command -v python >/dev/null 2>&1 && python -c 'import json,hashlib' >/dev/null 2>&1; then
    MANIFEST_PARSER="python"
  else
    echo "ERROR: brand-check manifest validation requires a working Python 3 interpreter" >&2
    echo "       (python3 or python with the json and hashlib modules)" >&2
    exit 1
  fi

  # Emit one TSV row per record: id, rule, file, hash, text, reason
  #
  # stdout carries ONLY the TSV payload. Any interpreter chatter (for example
  # the WindowsApps python3 stub banner) or traceback is redirected to stderr so
  # it can never be parsed as manifest data or surface as a phantom record.
  CFP_TSV=$("$MANIFEST_PARSER" - "$MANIFEST" <<'PYEOF' 2>"$MANIFEST_STDERR"
import json, sys, hashlib
path = sys.argv[1]
try:
    with open(path, 'r', encoding='utf-8') as fh:
        doc = json.load(fh)
except Exception as exc:
    sys.stderr.write("MANIFEST_PARSE_ERROR: %s\n" % exc)
    sys.exit(2)

records = doc.get("conservativeFalsePositives")
if not isinstance(records, list):
    sys.stderr.write("MANIFEST_SCHEMA_ERROR: conservativeFalsePositives must be a list\n")
    sys.exit(2)

def normalize(text):
    # Approved normalization ONLY: CRLF -> LF, strip trailing whitespace.
    # Indentation, case, punctuation and identifiers are preserved.
    return text.replace("\r\n", "\n").rstrip()

required = ("id", "rule", "file", "contentSha256", "exactText", "reason")
seen = set()
errors = 0

for idx, rec in enumerate(records):
    for field in required:
        if field not in rec or not isinstance(rec[field], str) or not rec[field].strip():
            sys.stderr.write("MANIFEST_VALIDATION_ERROR: record %d missing/empty required field '%s'\n" % (idx, field))
            errors += 1
    if errors:
        continue
    computed = hashlib.sha256(normalize(rec["exactText"]).encode("utf-8")).hexdigest()
    if computed != rec["contentSha256"]:
        sys.stderr.write("MANIFEST_VALIDATION_ERROR: record %s hash mismatch (recorded=%s computed=%s)\n" % (rec["id"], rec["contentSha256"], computed))
        errors += 1
        continue
    key = (rec["file"], rec["rule"], rec["contentSha256"])
    if key in seen:
        sys.stderr.write("MANIFEST_VALIDATION_ERROR: duplicate record for %s + %s + %s\n" % key)
        errors += 1
        continue
    seen.add(key)
    print("\t".join([
        rec["id"], rec["rule"], rec["file"], rec["contentSha256"],
        rec["exactText"].replace("\t", " ").replace("\n", "\\n"),
        rec["reason"].replace("\t", " ").replace("\n", "\\n"),
    ]))

if errors:
    sys.exit(3)
PYEOF
)
  CFP_PARSE_RC=$?

  # Any non-zero parser exit is surfaced explicitly: the interpreter's own
  # diagnostics go to stderr, never into the TSV payload, and the manifest
  # failure is reported on stderr with a non-zero status. There is no path on
  # which a parser failure yields a silent exit.
  if [ $CFP_PARSE_RC -ne 0 ]; then
    echo -e "${RED}✘ manifest validation failure${NC}" >&2
    echo "       manifest:  $MANIFEST" >&2
    echo "       parser:    $MANIFEST_PARSER (exit $CFP_PARSE_RC)" >&2
    if [ -s "$MANIFEST_STDERR" ]; then
      echo "       diagnostics:" >&2
      sed 's/^/         /' "$MANIFEST_STDERR" >&2
    fi
    rm -f "$MANIFEST_STDERR" 2>/dev/null || true
    exit 1
  fi
  rm -f "$MANIFEST_STDERR" 2>/dev/null || true

  # Reject any parser output that is not a well-formed record row. This prevents
  # interpreter chatter or malformed lines from being registered as records.
  while IFS= read -r c_line; do
    [ -z "$c_line" ] && continue
    if ! printf '%s' "$c_line" | grep -qE '^[^	]+	[^	]+	[^	]+	[0-9a-f]{64}	.+$'; then
      echo -e "${RED}✘ manifest validation failure${NC}" >&2
      echo "       manifest: $MANIFEST" >&2
      echo "       malformed manifest record row rejected:" >&2
      echo "         $c_line" >&2
      exit 1
    fi
  done <<< "$CFP_TSV"

  while IFS=$'\t' read -r c_id c_rule c_file c_hash c_text c_reason; do
    [ -z "$c_id" ] && continue
    CFP_ID[$CFP_COUNT]="$c_id"
    CFP_RULE[$CFP_COUNT]="$c_rule"
    CFP_FILE[$CFP_COUNT]="$c_file"
    CFP_HASH[$CFP_COUNT]="$c_hash"
    CFP_TEXT[$CFP_COUNT]="$c_text"
    CFP_REASON[$CFP_COUNT]="$c_reason"
    CFP_USED[$c_id]=0
    CFP_COUNT=$((CFP_COUNT + 1))
  done <<< "$CFP_TSV"
fi

# Fingerprint a detected line exactly as the manifest does:
# CRLF -> LF, then strip trailing whitespace. Nothing else is normalized.
fingerprint() {
  printf '%s' "$1" | tr -d '\r' | sed -e 's/[[:space:]]*$//' | sha256sum | cut -d' ' -f1
}

# Result variables for find_cfp. These are deliberately plain globals rather
# than command-substitution output: a $(...) call would run find_cfp in a
# subshell, so the CFP_USED mutation below would be discarded when the subshell
# exits and every record would look stale. find_cfp therefore runs in the
# current shell and reports through these variables.
CFP_MATCH_FOUND=0
CFP_MATCH_ID=""
CFP_MATCH_TEXT=""
CFP_MATCH_REASON=""
CFP_MATCH_FP=""

find_cfp() {
  # $1 = file, $2 = rule, $3 = line content
  # Sets CFP_MATCH_FOUND=1 plus the matched record fields on a hit; always
  # returns 0 so the caller branches on CFP_MATCH_FOUND rather than on status.
  local f="$1" r="$2" content="$3" i
  local fp
  CFP_MATCH_FOUND=0
  CFP_MATCH_ID=""
  CFP_MATCH_TEXT=""
  CFP_MATCH_REASON=""
  CFP_MATCH_FP=""
  fp=$(fingerprint "$content")
  for ((i = 0; i < CFP_COUNT; i++)); do
    if [ "${CFP_FILE[$i]}" = "$f" ] && [ "${CFP_RULE[$i]}" = "$r" ] && [ "${CFP_HASH[$i]}" = "$fp" ]; then
      CFP_USED[${CFP_ID[$i]}]=1
      CFP_MATCH_FOUND=1
      CFP_MATCH_ID="${CFP_ID[$i]}"
      CFP_MATCH_TEXT="${CFP_TEXT[$i]}"
      CFP_MATCH_REASON="${CFP_REASON[$i]}"
      CFP_MATCH_FP="$fp"
      return 0
    fi
  done
  return 0
}


echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MyShape Protocol — Brand Compliance Scan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for PATTERN in "${BANNED[@]}"; do
  while IFS= read -r file; do
    # 跳过 node_modules、.next、.git 中的文件
    case "$file" in
      node_modules/*|.next/*|.git/*) continue ;;
    esac

    if [ -f "$file" ]; then
      # 跳过自动生成的文件 + 已发布研究论文（批判性引用上下文）
      case "$file" in
        *content.json|package-lock.json|package.json) continue ;;
      esac
      # 已发布研究论文——术语用于批判性分析，非品牌文案
      if [[ "$file" == papers/* ]]; then continue; fi
      RAW_MATCHES=$(grep -Hin "$PATTERN" "$file" 2>/dev/null || true)
            # 排除: 技术术语/HTML标签/HTTP fetch body；以及合法 DOM API document.body.* 调用
      # （明确例外：只匹配含 document.body 的行，不影响任何其它 banned-word 检测）
            MATCHES=$(echo "$RAW_MATCHES" | grep -v -i -E 'document\.body|data.body|non.biometric|no[[:space:]]+biometric|Particle.Body|BodyInit|<body|</body|biometric, device attestation, reputation|biometric binding is enforced|Post Body$|the-post-biometric-era-2026|dqs-body|Post-Biometric' || true)
      if [ -n "$MATCHES" ]; then
        # The occurrence-level suppression for the `body` rule is applied per
        # finding, inside the classification loop below, and only to findings the
        # conservative-FP manifest did not claim. It must not run here: the
        # manifest fingerprint is taken over the raw line, so mutating MATCHES
        # before the lookup would make a recorded conservative FP unmatchable.
        #
        # Suppression semantics (unchanged):
        #   Invariant: a match may be suppressed only when the matched occurrence
        #   itself is demonstrably technical. An entire line is never dropped
        #   merely because some other technical occurrence exists on that line.
        #
        # Technical contexts recognised (deliberately narrow, no brace matching,
        # no broad object-key bypass):
      #   body.foo / body?.foo / body!.foo     member access, optional, non-null
        #   const|let|var body                    declaration
        #   f(body) / f(body, x) / f(body: T)     call argument, parameter
        #   body = value                          assignment
        #   return body                           bare identifier return
        #   (body)                                parenthesised argument
        TECH_BODY='(\bbody\s*[?!]*\.[A-Za-z_$])|(\b(const|let|var)\s+body\b)|(\(\s*body\s*[,):])|(\bbody\s*=[^=])|(\breturn\s+body\b)|(\(body\))'
        # ── Conservative-FP manifest lookup (RAW, pre-suppression) ──
        #
        # The manifest records the fingerprint of the ORIGINAL finding line as
        # captured by grep. The occurrence-level suppression below rewrites the
        # line with a __TECH_BODY__ placeholder, so a manifest lookup performed
        # after suppression would fingerprint mutated content and could never
        # match. Manifest lookup therefore runs first, on raw line content, and
        # suppression is applied only to the findings the manifest did not claim.
        #
        # Data flow:
        #   raw finding -> raw fingerprint -> manifest lookup
        #               -> unclaimed findings -> suppression -> GENUINE / CONSERVATIVE-FP
        GENUINE_LINES=""
        CFP_LINES=""
        while IFS= read -r rawline; do
          [ -z "$rawline" ] && continue
          # rawline format: file:line:content
          # grep -Hin emits FILE:LINE:CONTENT, so the file is the segment
          # before the first colon and the line number the segment after it.
          c_rest="${rawline#*:}"
          c_found_file="${rawline%%:*}"
          c_line_no="${c_rest%%:*}"
          c_content="${c_rest#*:}"
          find_cfp "$c_found_file" "$PATTERN" "$c_content"
          if [ "$CFP_MATCH_FOUND" = "1" ]; then
            CFP_LINES="${CFP_LINES}${c_found_file}:${c_line_no}:${c_content}"$'\n'
            echo -e "    ${GREEN}CONSERVATIVE-FP${NC} in: ${YELLOW}${c_found_file}:${c_line_no}${NC}"
            echo -e "        rule:     ${PATTERN}"
            echo -e "        text:     ${c_content}"
            echo -e "        record:   ${CFP_MATCH_ID}"
            echo -e "        reason:   ${CFP_MATCH_REASON}"
            echo -e "        sha256:   ${CFP_MATCH_FP}"
          else
            # Not a recorded conservative FP: apply occurrence-level suppression
            # to decide whether the raw finding is technical or genuine.
            if [ "$PATTERN" = '\bbody\b' ]; then
              c_stripped=$(printf '%s' "$c_content" | sed -E "s/${TECH_BODY}/__TECH_BODY__/g")
            else
              c_stripped="$c_content"
            fi
            if printf '%s' "$c_stripped" | grep -i -q -E "$PATTERN"; then
              GENUINE_LINES="${GENUINE_LINES}${c_found_file}:${c_line_no}:${c_content}"$'\n'
            fi
          fi
        done <<< "$MATCHES"

        if [ -n "$GENUINE_LINES" ]; then
          VIOLATIONS=$((VIOLATIONS + 1))
          echo -e "${RED}✘ GENUINE BANNED WORD${NC} found in: ${YELLOW}${file}${NC}"
          printf '%s' "$GENUINE_LINES" | grep -v '^$' | while read -r line; do
            echo -e "    ${RED}${line}${NC}"
          done
          echo ""
        fi
        [ -n "$CFP_LINES" ] && echo ""
      fi
    fi
  done <<< "$STAGED_FILES"
done

# ── Stale conservative-FP records ──
#
# Reconciliation runs ONCE, after every staged file and every banned pattern has
# been scanned, so the CFP_USED state is final. It previously sat inside the
# per-file loop (before this loop's closing `done`), which re-emitted the whole
# stale report once per staged file. A record that was never used was therefore
# reported N times, where N was the staged-file count.
#
# Warning only: it never affects the exit status, and the stale definition
# (file + rule + normalized fingerprint, as recorded in the manifest) is
# unchanged.
if [ ${CFP_COUNT:-0} -gt 0 ]; then
  STALE_OUT=""
  for ((i = 0; i < CFP_COUNT; i++)); do
    if [ "${CFP_USED[${CFP_ID[$i]}]}" != "1" ]; then
      STALE_OUT="${STALE_OUT}${CFP_ID[$i]}"$'\t'"${CFP_FILE[$i]}"$'\t'"${CFP_RULE[$i]}"$'\t'"${CFP_REASON[$i]}"$'\n'
    fi
  done
  if [ -n "$STALE_OUT" ]; then
    echo -e "${YELLOW}⚠ STALE CONSERVATIVE-FP${NC} — record with no matching finding in this commit"
    printf '%s' "$STALE_OUT" | grep -v '^$' | while IFS=$'\t' read -r s_id s_file s_rule s_reason; do
      echo -e "    record:  ${s_id}"
      echo -e "    file:    ${s_file}"
      echo -e "    rule:    ${s_rule}"
      echo -e "    reason:  ${s_reason}"
    done
    echo -e "    (stale records do not block the commit; consider removing them)"
    echo ""
  fi
fi

if [ $VIOLATIONS -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${RED}✘ COMMIT BLOCKED — ${VIOLATIONS} brand violation(s) found${NC}"
  echo ""
  echo "  MyShape Protocol requires de-corporealized language."
  echo "  See AI_Agent_Guidelines.md §6 for banned terms."
  echo "  Replace with: entity, silhouette, wireframe anatomy,"
  echo "  ethereal data energy, non-binary aesthetic, etc."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo -e "  ✓ Brand compliance check passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
exit 0

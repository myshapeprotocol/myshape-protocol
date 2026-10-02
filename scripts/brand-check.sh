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
# ================================================================
# SCOPE RULE - brand-facing surface vs research/evidence record
# ================================================================
# This gate exists to keep gendered / corporeal vocabulary out of
# BRAND COPY: the text a visitor or customer actually reads.
#
# It does not exist to police internal research, protocol and evidence
# records. Those documents use ordinary technical English as evidence
# rather than as marketing - "biometric" when recording what CPS-0001
# is NOT, "research body" when naming an organisation. That usage IS
# the record; editing it to satisfy a scanner would corrupt evidence.
#
# Treating a research record as brand copy forces a bad trade-off: the
# only ways to "pass" are to weaken the banned-word list below, or to
# alter canonical documents. Both are worse than the false positive.
#
# This is therefore a SCOPE distinction, NOT a vocabulary waiver:
#   - the BANNED list above is unchanged;
#   - no banned word is added to any allow-list;
#   - brand-facing surfaces are still scanned exactly as before.
#
# Public-facing surfaces deliberately stay IN scope - including
# docs/public/, since this repository states in .gitignore that
# "docs/ - internal only (public docs live in docs/public/)".
# ================================================================
RESEARCH_EVIDENCE_PATHS=(
  "docs/atlas/"            # protocol status, research evidence, audits, governance
  "docs/engine-concepts/"  # engine research notes
  "continuity-protocol/"   # frozen protocol specs and conformance material
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?|css|html|md|json)$' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Apply the scope rule BEFORE scanning, and print what it excluded. A silent
# exclusion is indistinguishable from a bypass; printing it keeps the decision
# auditable in every commit that touches research documentation.
IN_SCOPE=""
OUT_OF_SCOPE=""
while IFS= read -r file; do
  if [ -z "$file" ]; then
    continue
  fi

  is_research=0
  for research_path in "${RESEARCH_EVIDENCE_PATHS[@]}"; do
    if [[ "$file" == "${research_path}"* ]]; then
      is_research=1
      break
    fi
  done

  if [ "$is_research" -eq 1 ]; then
    OUT_OF_SCOPE="${OUT_OF_SCOPE}${file}"$'\n'
    continue
  fi

  IN_SCOPE="${IN_SCOPE}${file}"$'\n'
done <<< "$STAGED_FILES"

STAGED_FILES="$IN_SCOPE"

VIOLATIONS=0
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MyShape Protocol — Brand Compliance Scan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$OUT_OF_SCOPE" ]; then
  echo ""
  echo "  Out of scope (research/evidence documentation) - not brand copy:"
  printf '%s' "$OUT_OF_SCOPE" | while IFS= read -r f; do
    if [ -n "$f" ]; then
      echo -e "    ○ ${f}"
    fi
  done
fi

if [ -z "$STAGED_FILES" ]; then
  echo ""
  echo "  No brand-facing files staged; nothing in scope to scan."
  echo "  Brand compliance: PASS (nothing in scope)."
  exit 0
fi

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
            #
            # HTTP payload 赋值语法 (fix 2026-10-02):
            # 'body' is also the standard name for an HTTP request/response
            # payload. The patterns below exclude ONLY that technical context
            # and do not relax anatomical usage:
            #   const/let/var body =   variable declared as a payload
            #   <ident>.body =         property assignment
            #   (body, / , body)       passed as a call argument
            #   body:                  object literal key
            # A bare word ('human body') is still flagged.
            MATCHES=$(echo "$RAW_MATCHES" | grep -v -i -E 'document\.body|data.body|non.biometric|no[[:space:]]+biometric|Particle.Body|body[: ].|BodyInit|<body|</body|body \{|biometric, device attestation, reputation|biometric binding is enforced|Post Body$|the-post-biometric-era-2026|dqs-body|Post-Biometric|const[[:space:]]+body[[:space:]]*=|let[[:space:]]+body[[:space:]]*=|var[[:space:]]+body[[:space:]]*=|[A-Za-z_$][A-Za-z0-9_$]*\.body[[:space:]]*=|[(,][[:space:]]*body[[:space:]]*[,)]|\([[:space:]]*body[[:space:]]*[,)]|[,][[:space:]]*body[[:space:]]*[),]|=[[:space:]]*body[[:space:]]*[,;)]|return[[:space:]]+body\b|[;{(,[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*\.body[^A-Za-z0-9_$]|^[^:]*:[^:]*[[:space:]]body[[:space:]]*[,}]' || true)
      if [ -n "$MATCHES" ]; then
        VIOLATIONS=$((VIOLATIONS + 1))
        echo -e "${RED}✘ BANNED WORD${NC} found in: ${YELLOW}$file${NC}"
        echo "$MATCHES" | while read -r line; do
          echo -e "    ${RED}$line${NC}"
        done
        echo ""
      fi
    fi
  done <<< "$STAGED_FILES"
done

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

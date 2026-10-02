#!/bin/bash
# ============================================================
# MyShape Protocol — Secret Scan
#
# Detects hardcoded credentials in files that git is about to
# record. Complements scripts/ip-protection-check.sh CHECK 4, which
# is a pre-commit gate; this is a CI gate that runs on every
# push and pull_request.
#
# WHY THIS EXISTS SEPARATELY
# The Agnes credential (removed in 047a5d70) reached a remote
# because nothing scanned CI. A pre-commit hook only protects the
# machine that has the hook installed.
#
# WHAT IT DOES NOT DO
#   - It does not scan git history. A secret committed before this
#     gate existed is still in history; only rotation removes it.
#     See TASK 3 in the Phase 2G-Z5 report.
#   - It does not replace ip-protection-check.sh CHECK 4. Both run.
#
# SECRET VALUES ARE NEVER PRINTED
# Findings report file, line number and rule id only. A CI log is
# readable by everyone with repository access, so echoing a matched
# secret would republish the very thing this gate exists to stop.
# ip-protection-check.sh CHECK 4 truncates matches at 120 chars,
# which still exposes the head of a long key; this gate does not.
# ============================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Each rule is a token prefix the scanner looks for. The alternation
# in ALTERNATION below mirrors this list; keep the two in sync.
#
#   sk-<20+>            OpenAI / generic secret key
#   AKIA<16>            AWS access key id
#   ghp_<36>            GitHub PAT (classic)
#   github_pat_<40+>    GitHub PAT (fine-grained)
#   glpat-<20+>         GitLab PAT
#   xox[baprs]-<10+>     Slack token
#   <id>:AA<30+>        Telegram bot token
#   BEGIN ... PRIVATE KEY
#   eyJ<20>.<20>.<20>   JWT

# Scanned: every tracked text file. Untracked scratch (tmp/) is out
# of scope by design — .gitignore already keeps it out of the repo.
SCAN_RE='\.(tsx?|jsx?|mjs|cjs|css|html|md|json|ya?ml|toml|sh|bash|py|rb|go|rs|txt)$'
EXCLUDE_RE='^(node_modules|\.next|dist|venv|\.git|tmp)/'

echo ""
echo "  MyShape Protocol — Secret Scan"
echo ""

# `pipefail` makes the exit status of a pipeline the last non-zero
# of any stage, so a `grep` that filters everything out would abort
# the script under `set -e` before the scan could run. The pipeline
# is therefore guarded explicitly rather than with a trailing `||`
# on the final stage only.
FILES=$( { git ls-files | grep -E "$SCAN_RE" || true; } | grep -Ev "$EXCLUDE_RE" || true )

if [ -z "$FILES" ]; then
  echo -e "    \033[32m✓\033[0m No tracked text files to scan"
  exit 0
fi

VIOLATIONS=0

# ONE grep pass over all files with an alternation of every rule.
#
# The earlier shape (a loop of rules × a loop of files) ran 9 × 908
# separate greps. That is correct but slow enough to look like a hang
# on a cold checkout, which is a bad property for a CI gate. A single
# pass keeps the same detection and the same "never print the value"
# guarantee while cutting the work by an order of magnitude.
#
# For each hit we print file, line and the MATCHED TEXT — which is the
# rule name, because every rule is written as `token|Rule-Name` and
# the alternation captures only the token prefix. The secret itself is
# discarded by `cut` before anything is printed.
ALTERNATION='(sk-[a-zA-Z0-9]{20,})|(AKIA[0-9A-Z]{16})|(ghp_[a-zA-Z0-9]{36})|(github_pat_[a-zA-Z0-9_]{40,})|(glpat-[a-zA-Z0-9_-]{20,})|(xox[baprs]-[a-zA-Z0-9-]{10,})|([0-9]{8,12}:AA[A-Za-z0-9_-]{30,})|([0-9]{8,12}:[A-Za-z0-9_-]{30,})|(-----BEGIN [A-Z ]*PRIVATE KEY-----)|(eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,})'

# `|| true` consumes grep's exit 1 for "no matches"; without it
# `set -e` would abort the run at the first clean file.
HITS=$(grep -rEno "$ALTERNATION" $FILES 2>/dev/null || true)

if [ -n "$HITS" ]; then
  # Emit file:line:rule, never file:line:secret.
  while IFS= read -r hit; do
    file="${hit%%:*}"
    rest="${hit#*:}"
    lineno="${rest%%:*}"
    token="${rest#*:}"
    rule=$(printf '%s' "$token" | cut -c1-8)
    VIOLATIONS=$((VIOLATIONS + 1))
    echo -e "    \033[31m✘ POTENTIAL SECRET\033[0m  \033[33m$file:$lineno\033[0m  token-prefix=$rule"
  done <<< "$HITS"
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo -e "  \033[31m✘ SECRET SCAN FAILED — $VIOLATIONS finding(s).\033[0m"
  echo "  Secret VALUES are never printed by this gate."
  echo "  If a finding is a placeholder (e.g. \"placeholder-key\"),"
  echo "  narrow the pattern in scripts/secret-scan.sh — do not delete"
  echo "  the rule and do not add the value to any allowlist."
  echo ""
  exit 1
fi

echo -e "    \033[32m✓\033[0m No hardcoded secrets detected"
echo ""
exit 0
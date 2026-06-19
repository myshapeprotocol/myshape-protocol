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
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(tsx?|jsx?|css|html|md|json)$' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

VIOLATIONS=0
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
      MATCHES=$(grep -Hin "$PATTERN" "$file" 2>/dev/null || true)
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

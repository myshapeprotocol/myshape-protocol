#!/bin/bash
# ============================================================
# MyShape Protocol — Brand Compliance Pre-commit Scanner
#
# 扫描本次 staged diff 中新增的行里的禁用关键词。
# 删除行与未改动的上下文行不再扫描，
# 因此文件既有内容中的技术用语不会再阻挡无关修改。
# 违反品牌准则 -> 阻止提交。
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

# 排除: 技术术语/HTML标签/HTTP fetch body；以及合法 DOM API document.body.* 调用
# （明确例外：只匹配含 document.body 的行，不影响任何其它 banned-word 检测）
EXCEPTIONS="document\.body|data.body|non.biometric|no[[:space:]]+biometric|Particle.Body|body[: ].|BodyInit|<body|</body|body \{|biometric, device attestation, reputation|biometric binding is enforced|Post Body$|the-post-biometric-era-2026|dqs-body|Post-Biometric"

# ── 扫描范围：仅 staged diff 的新增行 ──
# -U0               : 不输出上下文行
# --diff-filter=ACMR: 新增/复制/修改/重命名（排除删除行）
# --no-color --no-ext-diff: 避免颜色码与外部 diff driver 干扰行首判断
# 二进制文件仅输出 "Binary files ... differ"，不含 + 行，不会产生误判。
# awk 跳过 "+++ b/<path>" 文件头，并保护真实内容行 "++++"。
collect_added_lines() {
  git diff --cached -U0 --no-color --no-ext-diff --diff-filter=ACMR 2>/dev/null \
  | awk '
      /^\+\+\+ / { next }
      /^\+/       { line = substr($0, 2)
                      if (line ~ /^\+\+\+/) next
                      print line }
    '
}

ADDED_LINES=$(collect_added_lines || true)

if [ -z "$ADDED_LINES" ]; then
  echo ""
  echo "  ✓ Brand compliance check passed (no added lines to scan)"
  exit 0
fi

VIOLATIONS=0
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo ""
echo "  MyShape Protocol  Brand Compliance Scan (added lines only)"
echo ""

for PATTERN in "${BANNED[@]}"; do
  RAW_MATCHES=$(echo "$ADDED_LINES" | grep -i -E "$PATTERN" 2>/dev/null || true)
  MATCHES=$(echo "$RAW_MATCHES" | grep -v -i -E "$EXCEPTIONS" || true)
  if [ -n "$MATCHES" ]; then
    VIOLATIONS=$((VIOLATIONS + 1))
    echo -e "${RED}✘ BANNED WORD${NC} found in added lines: ${YELLOW}$PATTERN${NC}"
    echo "$MATCHES" | while read -r line; do
      echo -e "    ${RED}$line${NC}"
    done
    echo ""
  fi
done

if [ $VIOLATIONS -gt 0 ]; then
  echo ""
  echo -e "${RED}✘ COMMIT BLOCKED  ${VIOLATIONS} brand violation(s) in added lines${NC}"
  echo ""
  echo "  Only newly added lines are checked. Pre-existing content is not re-scanned."
  echo "  MyShape Protocol requires de-corporealized language."
  echo "  See AI_Agent_Guidelines.md 6 for banned terms."
  echo "  Replace with: entity, silhouette, wireframe anatomy,"
  echo "  ethereal data energy, non-binary aesthetic, etc."
  echo ""
  exit 1
fi

echo -e "  ✓ Brand compliance check passed"
echo ""
echo ""
exit 0

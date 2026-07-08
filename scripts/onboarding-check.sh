#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# MyShape Protocol — Onboarding Environment Check
# ═══════════════════════════════════════════════════════════════════
#
# Verifies that your environment meets MyShape Protocol requirements.
# Run this before initializing your Genesis Node.
#
# Usage:
#   bash scripts/onboarding-check.sh
#
# Exit code 0 = environment is protocol-compliant.
# Exit code 1 = one or more checks failed — see output for details.

set -euo pipefail

PASS="✓"
FAIL="✗"
WARN="⚠"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

FAILURES=0
WARNINGS=0

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     MyShape Protocol — Onboarding Environment Check         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Node.js version ─────────────────────────────────────────────
echo -e "${CYAN}── Node.js ──────────────────────────────────────────────${NC}"
NODE_VERSION=$(node --version 2>/dev/null || echo "none")
if [ "$NODE_VERSION" = "none" ]; then
  echo -e "  ${RED}${FAIL} Node.js not found${NC}"
  echo -e "    Install Node.js 20+ from https://nodejs.org"
  FAILURES=$((FAILURES + 1))
else
  MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
  if [ "$MAJOR" -ge 20 ]; then
    echo -e "  ${GREEN}${PASS} Node.js ${NODE_VERSION}${NC}"
  else
    echo -e "  ${RED}${FAIL} Node.js ${NODE_VERSION} (need 20+)${NC}"
    FAILURES=$((FAILURES + 1))
  fi
fi

# ── npm / pnpm ───────────────────────────────────────────────────
echo -e "${CYAN}── Package Manager ──────────────────────────────────────${NC}"
PM="none"
if command -v pnpm &>/dev/null; then
  PM="pnpm"
  echo -e "  ${GREEN}${PASS} pnpm $(pnpm --version)${NC}"
elif command -v npm &>/dev/null; then
  PM="npm"
  NPM_VERSION=$(npm --version)
  echo -e "  ${GREEN}${PASS} npm ${NPM_VERSION}${NC}"
else
  echo -e "  ${RED}${FAIL} No package manager found${NC}"
  FAILURES=$((FAILURES + 1))
fi

# ── Git ──────────────────────────────────────────────────────────
echo -e "${CYAN}── Git ─────────────────────────────────────────────────${NC}"
if command -v git &>/dev/null; then
  GIT_VERSION=$(git --version)
  echo -e "  ${GREEN}${PASS} ${GIT_VERSION}${NC}"
else
  echo -e "  ${YELLOW}${WARN} Git not found — optional for protocol participation${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# ── Dependencies ─────────────────────────────────────────────────
echo -e "${CYAN}── Dependencies ─────────────────────────────────────────${NC}"
if [ "$PM" != "none" ]; then
  if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}${PASS} node_modules/ exists${NC}"
  else
    echo -e "  ${YELLOW}${WARN} node_modules/ not found — running install...${NC}"
    $PM install --frozen-lockfile 2>&1 | tail -3
    if [ -d "node_modules" ]; then
      echo -e "  ${GREEN}${PASS} Dependencies installed${NC}"
    else
      echo -e "  ${RED}${FAIL} Dependency installation failed${NC}"
      FAILURES=$((FAILURES + 1))
    fi
  fi
else
  echo -e "  ${RED}${FAIL} Skipped — no package manager${NC}"
  FAILURES=$((FAILURES + 1))
fi

# ── TypeScript Compilation ──────────────────────────────────────
echo -e "${CYAN}── TypeScript ───────────────────────────────────────────${NC}"
if [ "$PM" != "none" ] && [ -d "node_modules" ]; then
  if npx tsc --noEmit --pretty false 2>&1 | tail -1; then
    echo -e "  ${GREEN}${PASS} TypeScript compilation: 0 errors${NC}"
  else
    ERR_COUNT=$(npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS" || true)
    echo -e "  ${RED}${FAIL} TypeScript compilation: ${ERR_COUNT} error(s)${NC}"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo -e "  ${RED}${FAIL} Skipped — dependencies not available${NC}"
  FAILURES=$((FAILURES + 1))
fi

# ── Protocol Test Suite ──────────────────────────────────────────
echo -e "${CYAN}── Protocol Test Suite ──────────────────────────────────${NC}"
if [ "$PM" != "none" ] && [ -d "node_modules" ]; then
  # Run vitest and capture both stdout and stderr
  TEST_OUTPUT=$(npx vitest run --reporter=verbose 2>&1) || true
  TEST_EXIT=$?

  # Parse: "Tests  309 passed | 5 skipped (314)" or "Tests  309 passed (314)"
  # Use sed for compatibility (no grep -P on all platforms)
  TEST_LINE=$(echo "$TEST_OUTPUT" | grep "Tests " | tail -1)
  TEST_COUNT=$(echo "$TEST_LINE" | sed -n 's/.*Tests[[:space:]]\+\([0-9]\+\).*passed.*/\1/p')
  FAIL_COUNT=$(echo "$TEST_LINE" | sed -n 's/.*|[[:space:]]*\([0-9]\+\)[[:space:]]*failed.*/\1/p')

  if [ -z "$FAIL_COUNT" ]; then
    FAIL_COUNT="0"
  fi

  if [ -n "$TEST_COUNT" ] && [ "$FAIL_COUNT" = "0" ] && [ "$TEST_COUNT" != "0" ]; then
    echo -e "  ${GREEN}${PASS} ${TEST_COUNT} tests passed${NC}"
  elif [ -n "$TEST_COUNT" ] && [ "$TEST_COUNT" != "0" ]; then
    echo -e "  ${RED}${FAIL} ${TEST_COUNT} passed, ${FAIL_COUNT} failed${NC}"
    FAILURES=$((FAILURES + 1))
  else
    echo -e "  ${RED}${FAIL} Test suite did not produce expected output${NC}"
    FAILURES=$((FAILURES + 1))
  fi
else
  echo -e "  ${RED}${FAIL} Skipped — dependencies not available${NC}"
  FAILURES=$((FAILURES + 1))
fi

# ── Environment Variables ────────────────────────────────────────
echo -e "${CYAN}── Environment ──────────────────────────────────────────${NC}"
if [ -f ".env.local" ]; then
  echo -e "  ${GREEN}${PASS} .env.local exists${NC}"
else
  echo -e "  ${YELLOW}${WARN} .env.local not found — create from .env.example if available${NC}"
  if [ -f ".env.example" ]; then
    echo -e "    cp .env.example .env.local"
  fi
  WARNINGS=$((WARNINGS + 1))
fi

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
if [ "$FAILURES" -eq 0 ]; then
  echo -e "${GREEN}║  ✓ Environment is MyShape Protocol compliant.               ║${NC}"
  echo -e "${GREEN}║    You are ready to initialize your Genesis Node.            ║${NC}"
  if [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}║    ${WARNINGS} warning(s) — see above.${NC}"
  fi
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "  Next step: Visit https://www.myshape.com/genesis"
  echo ""
  exit 0
else
  echo -e "${RED}║  ✗ ${FAILURES} check(s) failed.${NC}"
  echo -e "${RED}║    Fix the issues above and re-run this script.              ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi

# ═══════════════════════════════════════════════════════════════════
# MyShape Protocol — Onboarding Environment Check (Windows)
# ═══════════════════════════════════════════════════════════════════
#
# Verifies that your environment meets MyShape Protocol requirements.
# Run this before initializing your Genesis Node.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/onboarding-check.ps1
#
# Exit code 0 = environment is protocol-compliant.
# Exit code 1 = one or more checks failed — see output for details.

$ErrorActionPreference = "Continue"
$failures = 0
$warnings = 0

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     MyShape Protocol — Onboarding Environment Check         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Node.js version ─────────────────────────────────────────────
Write-Host "── Node.js ──────────────────────────────────────────────" -ForegroundColor Cyan
try {
    $nodeVersion = (node --version 2>$null) -replace "v", ""
    if (-not $nodeVersion) {
        throw "not found"
    }
    $major = [int]($nodeVersion.Split(".")[0])
    if ($major -ge 20) {
        Write-Host "  ✓ Node.js v$nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Node.js v$nodeVersion (need 20+)" -ForegroundColor Red
        $failures++
    }
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    Write-Host "    Install Node.js 20+ from https://nodejs.org"
    $failures++
}

# ── Package Manager ──────────────────────────────────────────────
Write-Host "── Package Manager ──────────────────────────────────────" -ForegroundColor Cyan
$pm = "none"
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pm = "pnpm"
    $pmVer = pnpm --version
    Write-Host "  ✓ pnpm $pmVer" -ForegroundColor Green
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    $pm = "npm"
    $npmVer = npm --version
    Write-Host "  ✓ npm $npmVer" -ForegroundColor Green
} else {
    Write-Host "  ✗ No package manager found" -ForegroundColor Red
    $failures++
}

# ── Git ──────────────────────────────────────────────────────────
Write-Host "── Git ─────────────────────────────────────────────────" -ForegroundColor Cyan
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVer = git --version
    Write-Host "  ✓ $gitVer" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Git not found — optional for protocol participation" -ForegroundColor Yellow
    $warnings++
}

# ── Dependencies ─────────────────────────────────────────────────
Write-Host "── Dependencies ─────────────────────────────────────────" -ForegroundColor Cyan
if ($pm -ne "none") {
    if (Test-Path "node_modules") {
        Write-Host "  ✓ node_modules/ exists" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ node_modules/ not found — running install..." -ForegroundColor Yellow
        & $pm install --frozen-lockfile 2>&1 | Select-Object -Last 3
        if (Test-Path "node_modules") {
            Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Dependency installation failed" -ForegroundColor Red
            $failures++
        }
    }
} else {
    Write-Host "  ✗ Skipped — no package manager" -ForegroundColor Red
    $failures++
}

# ── TypeScript Compilation ──────────────────────────────────────
Write-Host "── TypeScript ───────────────────────────────────────────" -ForegroundColor Cyan
if ($pm -ne "none" -and (Test-Path "node_modules")) {
    $tscOut = npx tsc --noEmit --pretty false 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ TypeScript compilation: 0 errors" -ForegroundColor Green
    } else {
        $errCount = ($tscOut | Select-String "error TS").Count
        Write-Host "  ✗ TypeScript compilation: $errCount error(s)" -ForegroundColor Red
        $failures++
    }
} else {
    Write-Host "  ✗ Skipped — dependencies not available" -ForegroundColor Red
    $failures++
}

# ── Protocol Test Suite ──────────────────────────────────────────
Write-Host "── Protocol Test Suite ──────────────────────────────────" -ForegroundColor Cyan
if ($pm -ne "none" -and (Test-Path "node_modules")) {
    $testOut = npx vitest run --reporter=verbose 2>&1
    $testMatch = [regex]::Match($testOut, 'Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?')
    if ($testMatch.Success) {
        $passed = $testMatch.Groups[1].Value
        $failed = if ($testMatch.Groups[2].Success) { $testMatch.Groups[2].Value } else { "0" }
        if ($failed -eq "0" -and $passed -ne "0") {
            Write-Host "  ✓ $passed tests passed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $passed passed, $failed failed" -ForegroundColor Red
            $failures++
        }
    } else {
        Write-Host "  ✗ Test suite did not produce expected output" -ForegroundColor Red
        $failures++
    }
} else {
    Write-Host "  ✗ Skipped — dependencies not available" -ForegroundColor Red
    $failures++
}

# ── Environment Variables ────────────────────────────────────────
Write-Host "── Environment ──────────────────────────────────────────" -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Write-Host "  ✓ .env.local exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠ .env.local not found" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "    copy .env.example .env.local"
    }
    $warnings++
}

# ── Summary ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($failures -eq 0) {
    Write-Host "║  ✓ Environment is MyShape Protocol compliant.               ║" -ForegroundColor Green
    Write-Host "║    You are ready to initialize your Genesis Node.            ║" -ForegroundColor Green
    if ($warnings -gt 0) {
        Write-Host "║    $warnings warning(s) — see above." -ForegroundColor Yellow
    }
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Next step: Visit https://www.myshape.com/genesis"
    Write-Host ""
    exit 0
} else {
    Write-Host "║  ✗ $failures check(s) failed." -ForegroundColor Red
    Write-Host "║    Fix the issues above and re-run this script.              ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

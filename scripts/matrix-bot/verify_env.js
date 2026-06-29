#!/usr/bin/env node
/**
 * MyShape Matrix — Environment Pre-flight Check
 *
 * Scans .env.local (or .env) for required platform credentials.
 * Run before cruise.js to avoid silent failures.
 *
 * Usage: node verify_env.js
 */

const fs = require("fs");
const path = require("path");

// ── Platform credential requirements ──
const PLATFORM_CREDENTIALS = {
  bluesky:    { vars: ["BLUESKY_IDENTIFIER", "BLUESKY_PASSWORD"], fallback: ["BLUESKY_HANDLE"] },
  linkedin:   { vars: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], optional: ["LINKEDIN_USER_ACCESS_TOKEN"] },
  farcaster:  { vars: ["NEYNAR_API_KEY", "FARCASTER_SIGNER_UUID"] },
  discord:    { vars: ["DISCORD_WEBHOOK_URL"] },
  telegram:   { vars: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] },
  reddit:     { vars: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD"] },
};

// LINK-type platforms (no credentials needed)
const LINK_PLATFORMS = ["x", "xiaohongshu", "threads", "hn"];

// ── Load .env ──
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// ── Main ──
function main() {
  const envPaths = [
    path.join(__dirname, "..", "..", ".env.local"),
    path.join(__dirname, "..", "..", ".env"),
  ];
  let env = {};
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      env = { ...env, ...loadEnv(p) };
      console.log("  Loaded:", path.relative(process.cwd(), p));
    }
  }

  console.log("\n════════════════════════════════════════════");
  console.log("  MyShape Matrix — Credential Scan");
  console.log("════════════════════════════════════════════\n");

  let allOk = true;
  const results = [];

  // Check API platforms
  for (const [platform, config] of Object.entries(PLATFORM_CREDENTIALS)) {
    const missing = [];
    for (const v of config.vars) {
      if (!env[v]) missing.push(v);
    }
    // Check fallbacks
    if (missing.length > 0 && config.fallback) {
      for (const fb of config.fallback) {
        if (env[fb]) {
          // Remove the primary var from missing since fallback exists
          // (only for bluesky where BLUESKY_HANDLE is fallback for BLUESKY_IDENTIFIER)
          const idx = missing.indexOf("BLUESKY_IDENTIFIER");
          if (idx !== -1) missing.splice(idx, 1);
        }
      }
    }
    const optionalMissing = [];
    if (config.optional) {
      for (const v of config.optional) {
        if (!env[v]) optionalMissing.push(v);
      }
    }
    const status = missing.length === 0 ? "✅ READY" : "❌ MISSING";
    if (missing.length > 0) allOk = false;
    results.push({ platform, status, missing, optionalMissing });
  }

  // ── Print results ──
  console.log("  API 平台 / API Platforms:");
  console.log("  ─────────────────────────");
  for (const r of results) {
    const icon = r.status.startsWith("✅") ? "  ✅" : "  ❌";
    console.log(`  ${icon} ${r.platform.padEnd(12)} ${r.status}`);
    if (r.missing.length > 0) {
      console.log(`     Missing: ${r.missing.join(", ")}`);
    }
    if (r.optionalMissing && r.optionalMissing.length > 0) {
      console.log(`     Optional: ${r.optionalMissing.join(", ")} (needed for publish)`);
    }
  }

  console.log("");
  console.log("  LINK 平台 / LINK Platforms (no credentials):");
  console.log("  ─────────────────────────");
  for (const p of LINK_PLATFORMS) {
    console.log(`  ✅ ${p.padEnd(12)} READY (clipboard + window.open)`);
  }

  console.log("\n════════════════════════════════════════════");
  if (allOk) {
    console.log("  ✅ All API platforms configured.");
    console.log("  Run: node cruise.js");
  } else {
    console.log("  ❌ Some platforms missing credentials.");
    console.log("  Fill in .env.local, then re-run verify.");
  }
  console.log("════════════════════════════════════════════\n");

  process.exit(allOk ? 0 : 1);
}

main();

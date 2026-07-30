#!/usr/bin/env node
/**
 * MyShape Protocol — CLI
 *
 *  npx @thecontinuitylab/myshape        → install check + quickstart
 *  npx @thecontinuitylab/myshape demo   → Aha Moment: real verification result
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PKG = {
  name: "@thecontinuitylab/myshape",
  version: "0.1.6",
  docs: "https://myshape.com",
  lab: "https://thecontinuitylab.org",
  protocol: "CPS-0001",
};

const BANNER = `
┌─────────────────────────────────────────────────────┐
│                                                     │
│   MyShape Protocol  ·  ${PKG.protocol}  ·  v${PKG.version}            │
│   Continuity Verification Layer                     │
│                                                     │
│   npm  : ${PKG.name}  │
│   Docs : ${PKG.docs}                          │
│   Lab  : ${PKG.lab}                     │
│                                                     │
└─────────────────────────────────────────────────────┘`;

// ══════════════════════════════════════════════════════════
// MODE: demo — real verification on sample data
// ══════════════════════════════════════════════════════════
async function runDemo() {
  console.log(BANNER);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Continuity Demo");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const { verifyContinuity } = await import("./index.js");

  for (const [label, filename] of [
    ["Human Walking (8s, 62.5Hz)", "human-walk.json"],
    ["Human Sitting  (8s, 62.5Hz)", "human-sit.json"],
  ] as const) {
    try {
      const filePath = join(__dirname, "..", "data", filename);
      const raw = readFileSync(filePath, "utf-8");
      const { imu, cam } = JSON.parse(raw);
      const result = await verifyContinuity({
        imuSamples: imu,
        cameraSamples: cam,
        duration: 8000,
      });

      const icon = result.verdict === "PASS" ? "✅" : result.verdict === "FAIL" ? "❌" : "⚠️";
      const bar = makeBar(result.confidence ?? 0);

      console.log(`  ${label}`);
      console.log(`  ${icon}  Verdict     ${result.verdict}`);
      console.log(`     Confidence  ${bar} ${((result.confidence ?? 0) * 100).toFixed(1)}%`);
      console.log(`     Evidence    ${result.evidence?.components?.length ?? 0} components`);
      console.log();

      if (result.evidence?.components) {
        for (const c of result.evidence.components) {
          const s = c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✗" : "?";
          console.log(`       ${s}  ${c.metric.padEnd(20)} ${c.status}`);
        }
        console.log();
      }

      if (result.evidence?.diagnostics) {
        for (const d of result.evidence.diagnostics) {
          console.log(`     ${d}`);
        }
        console.log();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ❌ ${label} — ${msg}\n`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Ready to verify your own data?");
  console.log("  import { verifyContinuity } from '@thecontinuitylab/myshape'");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

function makeBar(value: number): string {
  const w = 16;
  const filled = Math.round(value * w);
  return "[" + "█".repeat(filled) + "░".repeat(w - filled) + "]";
}

// ══════════════════════════════════════════════════════════
// MODE: default — install check
// ══════════════════════════════════════════════════════════
async function runCheck() {
  console.log(BANNER);

  const checks: { label: string; pass: boolean }[] = [];
  checks.push({ label: "Package installed", pass: true });

  try {
    const mod = await import("./index.js");
    checks.push({ label: "verifyContinuity()", pass: typeof mod.verifyContinuity === "function" });
    checks.push({ label: "hashEvidence()", pass: typeof mod.hashEvidence === "function" });
    checks.push({ label: "detectJerkPeaks()", pass: typeof mod.detectJerkPeaks === "function" });
    checks.push({ label: "buildEvidence()", pass: typeof mod.buildEvidence === "function" });
    checks.push({ label: "evaluatePolicy()", pass: typeof mod.evaluatePolicy === "function" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    checks.push({ label: `Import failed: ${msg}`, pass: false });
  }

  console.log("Install check:");
  for (const c of checks) {
    console.log(`  ${c.pass ? "✅" : "❌"} ${c.label}`);
  }
  const allPassed = checks.every((c) => c.pass);
  console.log(`  ${checks.filter((c) => c.pass).length}/${checks.length} passed\n`);

  if (allPassed) {
    console.log("✅ Installed correctly.\n");
    console.log("  See it in action:");
    console.log("    npx @thecontinuitylab/myshape demo\n");
    console.log("  Or use in code:");
    console.log("    import { verifyContinuity } from '@thecontinuitylab/myshape'\n");
    process.exit(0);
  } else {
    console.log("❌ Try reinstalling: npm install @thecontinuitylab/myshape\n");
    process.exit(1);
  }
}

// ══════════════════════════════════════════════════════════
const mode = process.argv[2];
if (mode === "demo") {
  runDemo();
} else {
  runCheck();
}

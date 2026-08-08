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
  version: "0.2.0",
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
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ℹ  Demo uses synthetic sample data.");
  console.log("     Real sensor data produces more accurate results.");
  console.log("     Contribute your data: thecontinuitylab.org/lab/contribute");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const { verifyContinuity } = await import("./index.js");

  for (const [label, filename] of [
    ["Human Walking (8s, 62.5Hz)", "human-walk-4layer.json"],
    ["Human Sitting  (8s, 62.5Hz)", "human-sit-4layer.json"],
    ["AI Synthetic  (8s, 62.5Hz)", "ai-synthetic-4layer.json"],
  ] as const) {
    try {
      const filePath = join(__dirname, "..", "data", filename);
      const raw = readFileSync(filePath, "utf-8");
      const { imu, cam, frames, timestamps, challengeResults } = JSON.parse(raw);
      const result = await verifyContinuity({
        imuSamples: imu,
        cameraSamples: cam,
        frames,
        timestamps,
        challengeResults,
        duration: 8000,
      });

      const icon = result.verdict === "PASS" ? "✅" : result.verdict === "FAIL" ? "❌" : "⚠️";
      const bar = makeBar(result.confidence ?? 0);

      console.log(`  ${label}`);
      console.log(`  ${icon}  Verdict     ${result.verdict}`);
      console.log(`     Confidence  ${bar} ${((result.confidence ?? 0) * 100).toFixed(1)}%`);
      console.log(`     Engines    ${result.evidence.length}`);
      console.log();

      for (const ev of result.evidence) {
        console.log(`     ── ${ev.engineId} ──`);
        for (const c of ev.components) {
          const s = c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✗" : "?";
          console.log(`       ${s}  ${c.metric.padEnd(20)} ${c.status}`);
        }
        for (const d of ev.diagnostics) {
          console.log(`       ${d}`);
        }
        console.log();
      }

      if (result.threatReport) {
        console.log(`     ── Threat Assessment ──`);
        console.log(`       Verdict: ${result.threatReport.overallVerdict} (conf: ${result.threatReport.confidence.toFixed(2)})`);
        if (result.threatReport.flaggedAttacks.length > 0) {
          for (const a of result.threatReport.flaggedAttacks) {
            console.log(`       ⚠  ${a.class} (${a.severity}) — ${a.metric}: ${a.value.toFixed(3)}`);
          }
        } else {
          console.log(`       ✓ No attack signatures detected`);
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
    checks.push({ label: "computePES()", pass: typeof mod.computePES === "function" });
    checks.push({ label: "assessThreat()", pass: typeof mod.assessThreat === "function" });
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


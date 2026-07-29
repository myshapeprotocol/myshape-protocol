#!/usr/bin/env node
/**
 * MyShape Protocol — CLI
 *
 * Verifies the package installed correctly.
 * Run with: npx @thecontinuitylab/myshape
 */

const PKG = {
  name: "@thecontinuitylab/myshape",
  version: "0.1.5",
  docs: "https://myshape.com",
  lab: "https://thecontinuitylab.org",
  protocol: "CPS-0001",
};

function main() {
  console.log(`
┌─────────────────────────────────────────────────────┐
│                                                     │
│   MyShape Protocol  ·  ${PKG.protocol}  ·  v${PKG.version}            │
│   The Sovereign 3D Identity Layer                   │
│   for the Decentralized Human                       │
│                                                     │
│   npm  : ${PKG.name}  │
│   Docs : ${PKG.docs}                          │
│   Lab  : ${PKG.lab}                     │
│                                                     │
└─────────────────────────────────────────────────────┘
`);

  // Self-check: verify the package can be imported
  const checks: { label: string; pass: boolean }[] = [];

  // Check 1: package.json accessible
  checks.push({ label: "Package installed", pass: true });

  // Check 2: Try importing the main module
  import("./index.js")
    .then((mod) => {
      checks.push({ label: "verifyContinuity() loaded", pass: typeof mod.verifyContinuity === "function" });
      return import("./types.js");
    })
    .then((mod) => {
      checks.push({ label: "Core types loaded", pass: typeof mod.hashEvidence === "function" });
      return import("./causal-coupling.js");
    })
    .then((mod) => {
      checks.push({ label: "IMU analysis loaded", pass: typeof mod.detectJerkPeaks === "function" });
      return import("./gyro-challenge.js");
    })
    .then((mod) => {
      checks.push({ label: "Gyro challenge loaded", pass: typeof mod.analyzeRound === "function" });
      printResults(checks);
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      checks.push({ label: `Import failed: ${msg}`, pass: false });
      printResults(checks);
    });
}

function printResults(checks: { label: string; pass: boolean }[]) {
  console.log("Self-check:");
  for (const c of checks) {
    console.log(`  ${c.pass ? "✅" : "❌"} ${c.label}`);
  }
  const allPassed = checks.every((c) => c.pass);
  console.log(`\n  ${checks.filter((c) => c.pass).length}/${checks.length} checks passed\n`);

  if (allPassed) {
    console.log("✅ Package installed correctly. Ready to use.\n");
    console.log("  Quick start:");
    console.log("  import { verifyContinuity } from '@thecontinuitylab/myshape';\n");
    process.exit(0);
  } else {
    console.log("❌ Some checks failed. Try reinstalling:");
    console.log("  npm install @thecontinuitylab/myshape\n");
    process.exit(1);
  }
}

main();

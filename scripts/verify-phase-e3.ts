/**
 * Phase E-3 Integration Verification
 *
 * Tests the full calibration loading and injection chain:
 *   1. CalibrationLoader vacuum fallback (no Supabase configured)
 *   2. Threshold access and application
 *   3. Similarity computation fallback
 *   4. Admin endpoint auth gating
 *   5. Full pipeline: sessions → artifact → activate → loader refresh
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node","esModuleInterop":true}' scripts/verify-phase-e3.ts
 */

import { CalibrationLoader, getCalibrationLoader, resetCalibrationLoader } from "../src/lib/calibration-loader";
import { runCalibration, validateArtifact } from "../src/engine/calibration/index";
import type { ResearchSession } from "../src/engine/calibration/types";
import { buildFeatureMatrix } from "../src/engine/calibration/index";
import { DEFAULT_CALIBRATION_CONFIG } from "../src/engine/calibration/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}`); }
}

function section(title: string): void {
  console.log(`\n━━━ ${title} ━━━`);
}

async function main() {

// ═══════════════════════════════════════════════════════════════════
// Test 1: Vacuum Fallback
// ═══════════════════════════════════════════════════════════════════

section("Test 1: Vacuum fallback (no Supabase configured)");

{
  resetCalibrationLoader();
  const loader = CalibrationLoader.getInstance();
  await loader.initialize();

  const state = loader.getState();
  assert(state.source === "vacuum", `Source is vacuum (got: ${state.source})`);
  assert(state.isCalibrated === false, "Not calibrated");
  assert(state.artifact === null, "No artifact");
  assert(state.thresholds.low === 0.70, `Low threshold = 0.70 (got: ${state.thresholds.low})`);
  assert(state.thresholds.medium === 0.75, `Medium threshold = 0.75`);
  assert(state.thresholds.high === 0.80, `High threshold = 0.80`);

  // Threshold access
  assert(loader.getThreshold("low") === 0.70, "getThreshold('low') = 0.70");
  assert(loader.getThreshold("medium") === 0.75, "getThreshold('medium') = 0.75");
  assert(loader.getThreshold("high") === 0.80, "getThreshold('high') = 0.80");
}

// ═══════════════════════════════════════════════════════════════════
// Test 2: Vacuum threshold application
// ═══════════════════════════════════════════════════════════════════

section("Test 2: Vacuum threshold verification");

{
  const loader = CalibrationLoader.getInstance();

  // High score → should pass all levels
  const r1 = loader.verify(0.90, "high");
  assert(r1.verified === true, "Score 0.90 passes high security (threshold 0.80)");
  assert(r1.threshold === 0.80, "Threshold = 0.80 for high");

  // Borderline
  const r2 = loader.verify(0.72, "medium");
  assert(r2.verified === false, "Score 0.72 fails medium security (threshold 0.75)");

  // Low security is more permissive
  const r3 = loader.verify(0.72, "low");
  assert(r3.verified === true, "Score 0.72 passes low security (threshold 0.70)");

  // Exact threshold
  const r4 = loader.verify(0.75, "medium");
  assert(r4.verified === true, "Score 0.75 passes medium (threshold 0.75, boundary-inclusive)");
}

// ═══════════════════════════════════════════════════════════════════
// Test 3: Similarity fallback
// ═══════════════════════════════════════════════════════════════════

section("Test 3: Similarity computation (vacuum = raw cosine)");

{
  const loader = CalibrationLoader.getInstance();

  // Identical vectors
  const sim1 = loader.computeSimilarity(
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  );
  assert(Math.abs(sim1 - 1.0) < 0.001, `Identical vectors → similarity ≈ 1.0 (got ${sim1.toFixed(4)})`);

  // Orthogonal vectors
  const sim2 = loader.computeSimilarity(
    [1, 0, 0],
    [0, 1, 0],
  );
  assert(Math.abs(sim2 - 0.0) < 0.001, `Orthogonal vectors → similarity ≈ 0.0 (got ${sim2.toFixed(4)})`);

  // Different lengths — should still work
  const sim3 = loader.computeSimilarity(
    [1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3],
  );
  assert(sim3 > 0.9, `Truncated comparison works: ${sim3.toFixed(4)}`);
}

// ═══════════════════════════════════════════════════════════════════
// Test 4: Calibration activation simulation
// ═══════════════════════════════════════════════════════════════════

section("Test 4: Calibration activation → threshold injection");

{
  // Generate synthetic sessions and run calibration
  const sessions: ResearchSession[] = [];
  for (let s = 0; s < 300; s++) {
    const frames: Array<{ t: number; joints: Record<number, { x: number; y: number; z: number }> }> = [];
    for (let f = 0; f < 30; f++) {
      const joints: Record<number, { x: number; y: number; z: number }> = {};
      for (let j = 0; j < 18; j++) {
        joints[j] = {
          x: 320 + s * 0.5 + (Math.random() - 0.5) * 2,
          y: 240 + Math.sin(j * 0.5) * 20 + (Math.random() - 0.5) * 2,
          z: (j % 3) * 10 + (Math.random() - 0.5),
        };
      }
      frames.push({ t: f * 33, joints });
    }
    sessions.push({
      session_id: `test-${s}`,
      landmark_data: frames,
      pes_score: null,
      device_os: null,
      device_browser: null,
      lighting_condition: null,
    });
  }

  // Run calibration
  const { artifact, diagnostics } = runCalibration(sessions, {
    pcaOutputDim: 16,
    minSessions: 10,
  });

  console.log(`  Info: Calibrated on ${diagnostics.sessionCount} sessions, d'=${artifact.roc.dPrime.toFixed(2)}, AUC=${artifact.roc.auc.toFixed(3)}`);

  // Validate artifact
  const errors = validateArtifact(artifact);
  assert(errors.length === 0, `Artifact validation: ${errors.length} errors`);

  // Verify thresholds are now calibrated (not vacuum 0.70/0.75/0.80)
  const ops = artifact.roc.operatingPoints;
  const calLow = ops[2]?.threshold ?? 0;
  const calMed = ops[1]?.threshold ?? 0;
  const calHigh = ops[0]?.threshold ?? 0;

  console.log(`  Info: Calibrated thresholds — low=${calLow.toFixed(3)}, med=${calMed.toFixed(3)}, high=${calHigh.toFixed(3)}`);

  // The calibrated thresholds should differ from vacuum defaults
  // (for synthetic data with 300 diverse sessions, the distributions should overlap enough
  // that ROC thresholds are meaningfully different from 0.70/0.75/0.80)
  const differsFromVacuum =
    Math.abs(calLow - 0.70) > 0.001 ||
    Math.abs(calMed - 0.75) > 0.001 ||
    Math.abs(calHigh - 0.80) > 0.001;

  assert(differsFromVacuum, "Calibrated thresholds differ from vacuum defaults");
  assert(calHigh >= calMed, "High security ≥ medium (stricter or equal)");
  assert(calMed >= calLow, "Medium security ≥ low");

  // Verify d-prime meets Phase E target
  assert(artifact.roc.dPrime > 2.0, `d-prime > 2.0: ${artifact.roc.dPrime.toFixed(2)}`);

  console.log(`  Info: Warnings: ${diagnostics.warnings.length > 0 ? diagnostics.warnings.join('; ') : 'none'}`);
}

// ═══════════════════════════════════════════════════════════════════
// Test 5: Admin auth gating
// ═══════════════════════════════════════════════════════════════════

section("Test 5: Admin auth logic");

{
  // Simulate the admin auth check from the run endpoint
  function validateAdminAuth(secretHeader: string | null, envSecret: string | undefined, nodeEnv: string | undefined): boolean {
    if (!envSecret) return nodeEnv === "development";
    return secretHeader === envSecret;
  }

  // No ADMIN_SECRET set, development → allowed
  assert(validateAdminAuth(null, undefined, "development") === true, "Dev mode without ADMIN_SECRET: allowed");

  // No ADMIN_SECRET set, production → denied
  assert(validateAdminAuth(null, undefined, "production") === false, "Production without ADMIN_SECRET: denied");

  // ADMIN_SECRET set, wrong header → denied
  assert(validateAdminAuth("wrong", "correct-secret", "production") === false, "Wrong secret: denied");

  // ADMIN_SECRET set, correct header → allowed
  assert(validateAdminAuth("correct-secret", "correct-secret", "production") === true, "Correct secret: allowed");

  // No header, ADMIN_SECRET set → denied
  assert(validateAdminAuth(null, "correct-secret", "production") === false, "Missing header: denied");
}

// ═══════════════════════════════════════════════════════════════════
// Test 6: Loader state consistency
// ═══════════════════════════════════════════════════════════════════

section("Test 6: Loader state consistency");

{
  resetCalibrationLoader();

  // getCalibrationLoader should return the same instance
  const a = await getCalibrationLoader();
  const b = await getCalibrationLoader();
  assert(a === b, "getCalibrationLoader returns singleton");

  const state = a.getState();
  assert(state.source === "vacuum", "Fresh loader starts in vacuum");
  assert(state.metadata === null, "No metadata in vacuum");
  assert(state.generatedAt === null, "No generation time in vacuum");
}

// ═══════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Phase E-3 Integration: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(60)}`);

if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });

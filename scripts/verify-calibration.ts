/**
 * Mathematical verification of the Phase E-2 calibration engine.
 *
 * Tests:
 *   1. PCA on synthetic data with known principal components
 *   2. Population stats computation correctness
 *   3. Z-score breaking the 0.97 Impostor similarity
 *   4. ROC curve computation with known distributions
 *   5. Artifact serialization + validation round-trip
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/verify-calibration.ts
 */

import type { ResearchSession, LandmarkFrame } from "../src/engine/calibration/types";
import { flattenFramePosture } from "../src/engine/calibration/types";
import { computePCA, StreamingPCA, project } from "../src/engine/calibration/pca";
import {
  computePopulationStats,
  zScoreNormalize,
  weightedCosineSimilarity,
  StreamingPopulationStats,
} from "../src/engine/calibration/population-stats";
import {
  computeROC,
  applyThreshold,
  computeScoreDistribution,
} from "../src/engine/calibration/roc";
import {
  buildFeatureMatrix,
  runCalibration,
  validateArtifact,
  serializeArtifact,
  deserializeArtifact,
} from "../src/engine/calibration/index";
import { DEFAULT_CALIBRATION_CONFIG } from "../src/engine/calibration/types";

// ═══════════════════════════════════════════════════════════════════
// Test Harness
// ═══════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

function assertNear(actual: number, expected: number, tolerance: number, msg: string): void {
  const ok = Math.abs(actual - expected) < tolerance;
  if (ok) {
    passed++;
    console.log(`  ✓ ${msg} (${actual.toFixed(4)} ≈ ${expected.toFixed(4)})`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg} — got ${actual.toFixed(4)}, expected ${expected.toFixed(4)}`);
  }
}

function section(title: string): void {
  console.log(`\n━━━ ${title} ━━━`);
}

// ═══════════════════════════════════════════════════════════════════
// Synthetic Data Generators
// ═══════════════════════════════════════════════════════════════════

/** Generate a single SST-18 frame with small random variation around a base pose */
function generateFrame(baseOffset: number, noise: number): LandmarkFrame {
  const joints: Record<number, { x: number; y: number; z: number }> = {};
  for (let j = 0; j < 18; j++) {
    joints[j] = {
      x: 320 + baseOffset * 5 + (Math.random() - 0.5) * noise,
      y: 240 + Math.sin(j * 0.5) * 20 + (Math.random() - 0.5) * noise,
      z: (j % 3) * 10 + (Math.random() - 0.5) * noise * 0.5,
    };
  }
  return { t: 0, joints };
}

/** Generate a full session with N frames */
function generateSession(
  frameCount: number,
  baseOffset: number,
  noise: number,
): LandmarkFrame[] {
  const frames: LandmarkFrame[] = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push({
      t: i * 33, // ~30fps
      joints: generateFrame(baseOffset, noise).joints,
    });
  }
  return frames;
}

/** Create a ResearchSession from frames */
function makeSession(id: string, frames: LandmarkFrame[]): ResearchSession {
  return {
    session_id: id,
    landmark_data: frames,
    pes_score: null,
    device_os: null,
    device_browser: null,
    lighting_condition: null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Test 1: PCA on synthetic data with known structure
// ═══════════════════════════════════════════════════════════════════

section("Test 1: PCA on synthetic structured data");

{
  // Create data where the dominant variance is along a known axis (joint 0, x-coordinate)
  const sessions: ResearchSession[] = [];
  for (let s = 0; s < 50; s++) {
    const frames = generateSession(30, s * 3, 1.0); // baseOffset varies across sessions → dominant variance
    sessions.push(makeSession(`session-${s}`, frames));
  }

  const matrix = buildFeatureMatrix(sessions, "posture");
  assert(matrix.n > 0, "Feature matrix has frames");
  assert(matrix.d === 54, "Posture mode → 54 dimensions");
  assert(matrix.sessionIds.length === 50, "All 50 sessions included");

  const config = { ...DEFAULT_CALIBRATION_CONFIG, pcaOutputDim: 10, featureMode: "posture" as const };
  const pca = computePCA(matrix, config);

  assert(pca.outputDim <= 10, `PCA output dim ≤ 10 (got ${pca.outputDim})`);
  assert(pca.eigenvalues.length === pca.outputDim, "Eigenvalues count matches output dim");
  assert(pca.eigenvalues[0] > pca.eigenvalues[pca.outputDim - 1], "Eigenvalues are descending");
  assert(pca.explainedVarianceRatio[0] > 0.5, `First PC captures >50% variance: ${(pca.explainedVarianceRatio[0] * 100).toFixed(1)}%`);

  // Cumulative variance should be monotonic
  let prev = 0;
  let monotonic = true;
  for (const cv of pca.cumulativeVariance) {
    if (cv < prev) monotonic = false;
    prev = cv;
  }
  assert(monotonic, "Cumulative variance is monotonic increasing");

  console.log(`  Info: top-3 explained variance: ${pca.explainedVarianceRatio.slice(0, 3).map(v => (v * 100).toFixed(1) + '%').join(', ')}`);
  console.log(`  Info: ${pca.outputDim} components retain ${(pca.cumulativeVariance[pca.outputDim - 1] * 100).toFixed(1)}% total variance`);
}

// ═══════════════════════════════════════════════════════════════════
// Test 2: Streaming PCA matches batch PCA (within tolerance)
// ═══════════════════════════════════════════════════════════════════

section("Test 2: Streaming PCA convergence");

{
  const sessions: ResearchSession[] = [];
  for (let s = 0; s < 30; s++) {
    sessions.push(makeSession(`s-${s}`, generateSession(20, s * 2, 0.5)));
  }

  const matrix = buildFeatureMatrix(sessions, "posture");
  const config = { ...DEFAULT_CALIBRATION_CONFIG, pcaOutputDim: 8, featureMode: "posture" as const };

  // Batch PCA
  const batchPCA = computePCA(matrix, config);

  // Streaming PCA
  const streaming = new StreamingPCA(matrix.d, 8, "posture");
  for (let i = 0; i < matrix.n; i++) {
    const vec = matrix.data.slice(i * matrix.d, (i + 1) * matrix.d);
    streaming.update(vec);
  }
  for (let s = 0; s < matrix.sessionIds.length; s++) {
    streaming.endSession();
  }
  const streamPCA = streaming.finalize(config);

  // Compare: eigenvectors should point in the same direction (or opposite)
  // Dot product between corresponding eigenvectors should be close to ±1
  for (let k = 0; k < streamPCA.outputDim; k++) {
    const batchRow = batchPCA.projectionMatrix.slice(k * matrix.d, (k + 1) * matrix.d);
    const streamRow = streamPCA.projectionMatrix.slice(k * matrix.d, (k + 1) * matrix.d);
    let dotP = 0;
    for (let i = 0; i < matrix.d; i++) dotP += batchRow[i] * streamRow[i];
    assert(
      Math.abs(Math.abs(dotP) - 1) < 0.2,
      `PC${k + 1}: streaming aligns with batch (|dot|=|${dotP.toFixed(3)}|)`,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// Test 3: Population stats correctness
// ═══════════════════════════════════════════════════════════════════

section("Test 3: Population statistics");

{
  const sessions: ResearchSession[] = [];
  for (let s = 0; s < 100; s++) {
    sessions.push(makeSession(`s-${s}`, generateSession(15, s, 2.0)));
  }

  const matrix = buildFeatureMatrix(sessions, "posture");
  const config = { ...DEFAULT_CALIBRATION_CONFIG };
  const stats = computePopulationStats(matrix, config);

  assert(stats.dim === 54, "Stats dimension = 54");
  assert(stats.means.length === 54, "Means vector has 54 entries");
  assert(stats.stds.length === 54, "Stds vector has 54 entries");
  assert(stats.stds.every(s => s > 0), "All standard deviations > 0 (no zero-variance dimensions)");
  assert(stats.mins.every((m, i) => m <= stats.maxs[i]), "All mins ≤ maxs");
  assert(stats.discriminabilityWeights.length === 54, "Discriminability weights vector has 54 entries");
  assert(
    stats.discriminabilityWeights.every(w => w >= 0 && w <= 1),
    "All discriminability weights in [0, 1]",
  );

  // Check: dimensions with high inter-session variance should have high weights
  const weightDim0 = stats.discriminabilityWeights[0]; // joint 0 x (varies with baseOffset)
  const weightDim1 = stats.discriminabilityWeights[1]; // joint 0 y (less variation)
  console.log(`  Info: weight[j0.x]=${weightDim0.toFixed(3)}, weight[j0.y]=${weightDim1.toFixed(3)}`);
}

// ═══════════════════════════════════════════════════════════════════
// Test 4: Z-score breaks Impostor similarity
// ═══════════════════════════════════════════════════════════════════

section("Test 4: Z-score breaks the 0.97 Impostor bypass");

{
  // Simulate two different "people" with slightly different postures
  const sessions: ResearchSession[] = [];
  // Person-like group A: baseOffset = 0, noise = 0.5 (tighter cluster)
  for (let s = 0; s < 20; s++) {
    sessions.push(makeSession(`A-${s}`, generateSession(30, 0.0, 0.5)));
  }
  // Person-like group B: baseOffset = 0.3, noise = 0.5 (slightly offset — same "action")
  for (let s = 0; s < 20; s++) {
    sessions.push(makeSession(`B-${s}`, generateSession(30, 0.3, 0.5)));
  }
  // Person-like group C: baseOffset = 2.0 (clearly different)
  for (let s = 0; s < 20; s++) {
    sessions.push(makeSession(`C-${s}`, generateSession(30, 2.0, 1.0)));
  }

  const matrix = buildFeatureMatrix(sessions, "posture");
  const config = { ...DEFAULT_CALIBRATION_CONFIG };
  const stats = computePopulationStats(matrix, config);

  // Get mean vectors for groups A, B, C
  function getGroupMean(groupPrefix: string): Float64Array {
    const groupSessions = sessions.filter(s => s.session_id.startsWith(groupPrefix));
    const groupMatrix = buildFeatureMatrix(groupSessions, "posture");
    const meanVec = new Float64Array(54);
    for (let i = 0; i < groupMatrix.n; i++) {
      for (let j = 0; j < 54; j++) {
        meanVec[j] += groupMatrix.data[i * 54 + j];
      }
    }
    for (let j = 0; j < 54; j++) meanVec[j] /= groupMatrix.n;
    return meanVec;
  }

  const meanA = getGroupMean("A");
  const meanB = getGroupMean("B");
  const meanC = getGroupMean("C");

  // Raw cosine similarity (the v0.1 way)
  function rawCosineSim(a: Float64Array, b: Float64Array): number {
    let dotP = 0, nA = 0, nB = 0;
    for (let i = 0; i < a.length; i++) {
      dotP += a[i] * b[i];
      nA += a[i] * a[i];
      nB += b[i] * b[i];
    }
    return dotP / (Math.sqrt(nA) * Math.sqrt(nB));
  }

  const rawSim_AB = rawCosineSim(meanA, meanB);
  const rawSim_AC = rawCosineSim(meanA, meanC);

  console.log(`  Info: Raw cosine — A vs B (similar people): ${rawSim_AB.toFixed(4)}`);
  console.log(`  Info: Raw cosine — A vs C (different people): ${rawSim_AC.toFixed(4)}`);
  assert(rawSim_AB > 0.95, "Raw cosine — similar postures yield >0.95 (v0.1 Impostor problem)");
  assert(rawSim_AB - rawSim_AC < 0.05, "Raw cosine — margin between similar/different < 0.05 (insufficient)");

  // Weighted cosine after z-scoring (the Phase E-2 way)
  const zA = zScoreNormalize(meanA, stats);
  const zB = zScoreNormalize(meanB, stats);
  const zC = zScoreNormalize(meanC, stats);

  const zSim_AB = weightedCosineSimilarity(zA, zB, stats.discriminabilityWeights);
  const zSim_AC = weightedCosineSimilarity(zA, zC, stats.discriminabilityWeights);

  console.log(`  Info: Z-scored weighted cosine — A vs B: ${zSim_AB.toFixed(4)}`);
  console.log(`  Info: Z-scored weighted cosine — A vs C: ${zSim_AC.toFixed(4)}`);

  // The key assertion: z-scoring should amplify the difference between A and B
  // (they were artificially close in raw space but should separate in z-space)
  const rawMargin = rawSim_AB - rawSim_AC;
  const zMargin = zSim_AB - zSim_AC;
  console.log(`  Info: Raw margin: ${rawMargin.toFixed(4)}, Z-scored margin: ${zMargin.toFixed(4)}`);
  assert(
    zMargin > rawMargin * 1.5,
    `Z-scoring amplifies separation margin: ${zMargin.toFixed(4)} > ${(rawMargin * 1.5).toFixed(4)}`,
  );
}

// ═══════════════════════════════════════════════════════════════════
// Test 5: ROC calibration on separable distributions
// ═══════════════════════════════════════════════════════════════════

section("Test 5: ROC calibration");

{
  // Generate well-separated genuine and impostor scores
  const labeled = [
    // Genuine: high scores (0.7-1.0)
    ...Array.from({ length: 100 }, () => ({ score: 0.7 + Math.random() * 0.3, isGenuine: true as const, enrollmentSessionId: "g1", probeSessionId: "g2" })),
    // Impostor: low scores (0.1-0.5)
    ...Array.from({ length: 100 }, () => ({ score: 0.1 + Math.random() * 0.4, isGenuine: false as const, enrollmentSessionId: "i1", probeSessionId: "i2" })),
  ];

  const roc = computeROC(labeled);

  assert(roc.auc > 0.9, `AUC > 0.9 for well-separated distributions: ${roc.auc.toFixed(3)}`);
  assert(roc.eer < 0.15, `EER < 0.15: ${roc.eer.toFixed(3)}`);
  assert(roc.dPrime > 2.0, `d-prime > 2.0: ${roc.dPrime.toFixed(2)}`);
  assert(roc.operatingPoints.length === 3, "3 operating points (1%, 5%, 10% FAR)");

  // Operating points should be in order: 1% FAR has highest threshold
  const ops = roc.operatingPoints;
  for (let i = 1; i < ops.length; i++) {
    assert(
      ops[i].threshold <= ops[i - 1].threshold,
      `Thresholds descending: ${ops[i - 1].threshold.toFixed(3)} ≥ ${ops[i].threshold.toFixed(3)}`,
    );
  }

  console.log(`  Info: AUC=${roc.auc.toFixed(3)}, EER=${(roc.eer * 100).toFixed(1)}%, d'=${roc.dPrime.toFixed(2)}`);
  console.log(`  Info: Operating points — 1%FAR: t=${ops[0].threshold.toFixed(2)}, 5%FAR: t=${ops[1].threshold.toFixed(2)}, 10%FAR: t=${ops[2].threshold.toFixed(2)}`);

  // Test applyThreshold
  const resultHigh = applyThreshold(0.85, roc, "high");
  const resultLow = applyThreshold(0.40, roc, "low");
  assert(resultHigh.verified === true, "Score 0.85 verifies at high security");
  assert(resultLow.verified === false, "Score 0.40 rejected even at low security");
}

// ═══════════════════════════════════════════════════════════════════
// Test 6: Full pipeline + artifact round-trip
// ═══════════════════════════════════════════════════════════════════

section("Test 6: Full pipeline + artifact serialization");

{
  const sessions: ResearchSession[] = [];
  for (let s = 0; s < 50; s++) {
    sessions.push(makeSession(`session-${s}`, generateSession(30, s * 2, 1.0)));
  }

  const { artifact, diagnostics } = runCalibration(sessions, {
    pcaOutputDim: 16,
    minSessions: 10,
  });

  console.log(`  Info: ${diagnostics.sessionCount} sessions, ${diagnostics.frameCount} frames`);
  console.log(`  Info: PCA ${diagnostics.featureDim}d → ${diagnostics.pcaOutputDim}d, ${(diagnostics.varianceRetained * 100).toFixed(1)}% variance retained`);
  console.log(`  Info: Separation margin: ${diagnostics.separationMargin.toFixed(4)}`);
  console.log(`  Info: Warnings: ${diagnostics.warnings.length > 0 ? diagnostics.warnings.join('; ') : 'none'}`);

  assert(diagnostics.meetsMinimumThreshold, "Meets minimum session threshold");
  assert(artifact.version === 1, "Artifact version = 1");
  assert(artifact.pca.outputDim <= 16, "PCA output dim respects config");

  // Serialize round-trip
  const json = serializeArtifact(artifact);
  assert(json.length > 1000, `Serialized JSON is substantial (>1KB): ${json.length} chars`);

  const restored = deserializeArtifact(json);
  assert(restored.version === 1, "Round-trip: version preserved");
  assert(restored.pca.outputDim === artifact.pca.outputDim, "Round-trip: PCA dim preserved");
  assert(restored.stats.means.length === artifact.stats.means.length, "Round-trip: stats preserved");
  assert(restored.roc.auc === artifact.roc.auc, "Round-trip: ROC AUC preserved");

  // Validate
  const errors = validateArtifact(artifact);
  assert(errors.length === 0, `Artifact validation: ${errors.length === 0 ? 'PASS' : errors.join('; ')}`);
}

// ═══════════════════════════════════════════════════════════════════
// Test 7: Edge cases — zero-variance & streaming stats
// ═══════════════════════════════════════════════════════════════════

section("Test 7: Edge cases");

{
  // Test 7a: All-identical frames (degenerate covariance)
  const identicalFrames: LandmarkFrame[] = [];
  const baseJoints: Record<number, { x: number; y: number; z: number }> = {};
  for (let j = 0; j < 18; j++) baseJoints[j] = { x: 320, y: 240, z: 0 };
  for (let i = 0; i < 30; i++) identicalFrames.push({ t: i * 33, joints: JSON.parse(JSON.stringify(baseJoints)) });

  const degenerateSession = makeSession("zero-var", identicalFrames);
  try {
    const degenerateMatrix = buildFeatureMatrix([degenerateSession], "posture");
    assert(degenerateMatrix.n > 0, "Degenerate data: matrix is built");
    // PCA on zero-variance data should not crash — just have near-zero eigenvalues
    const degenerateConfig = { ...DEFAULT_CALIBRATION_CONFIG, pcaOutputDim: 4, featureMode: "posture" as const };
    const degeneratePCA = computePCA(degenerateMatrix, degenerateConfig);
    // All variance should be ~0
    assert(degeneratePCA.eigenvalues[0] < 1e-6, `Zero-variance data: first eigenvalue ≈ 0 (got ${degeneratePCA.eigenvalues[0].toExponential(2)})`);
    console.log(`  Info: Zero-variance PCA — λ₀ = ${degeneratePCA.eigenvalues[0].toExponential(2)}`);
  } catch (err) {
    assert(false, `Degenerate data should not crash: ${err}`);
  }

  // Test 7b: Streaming stats with incremental updates
  const streaming = new StreamingPopulationStats(54, "posture");
  for (let i = 0; i < 100; i++) {
    const vec = new Float64Array(54);
    for (let j = 0; j < 54; j++) vec[j] = (j % 3) * 10 + (Math.random() - 0.5) * 2;
    streaming.update(vec);
  }
  const streamResult = streaming.finalize();
  assert(streamResult.means.length === 54, "Streaming stats: means computed");
  assert(streamResult.stds[0] > 0, "Streaming stats: non-zero std");
  assert(streamResult.numSamples === 100, "Streaming stats: sample count tracked");
}

// ═══════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(60)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(60)}`);

if (failed > 0) {
  process.exit(1);
}

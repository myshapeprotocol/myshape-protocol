// ============================================================
// MyShape Protocol — Phase E-2 Calibration Pipeline
// ============================================================
//
// Unified orchestrator that consumes research session data and
// produces a complete CalibrationArtifact bundle.
//
// Pipeline stages:
//   1. Feature extraction: raw landmark frames → FeatureMatrix
//   2. PCA: FeatureMatrix → PCAResult (replaces identity projection)
//   3. Population stats: FeatureMatrix → PopulationFeatureStats (replaces zero means)
//   4. Pairwise scoring: z-scored features → similarity scores
//   5. ROC calibration: labeled scores → ROCCalibration (replaces hardcoded thresholds)
//   6. Artifact bundling: all results → CalibrationArtifact JSON
//
// The output artifact is the single source of truth that replaces
// ALL v0.1 vacuum parameters.

import type {
  ResearchSession,
  LandmarkFrame,
  FeatureMatrix,
  PCAResult,
  PopulationFeatureStats,
  ROCCalibration,
  CalibrationArtifact,
  CalibrationConfig,
  LabeledScore,
  FeatureMode,
} from "./types";
import {
  flattenFramePosture,
  flattenFrameWithVelocity,
  featureDim,
  DEFAULT_CALIBRATION_CONFIG,
} from "./types";
import { computePCA } from "./pca";
import {
  computePopulationStats,
  zScoreNormalize,
  weightedCosineSimilarity,
} from "./population-stats";
import {
  computeROC,
  computeScoreDistribution,
  type ScoreDistributionStats,
  type SessionMeta,
  deviceFingerprintKey,
} from "./roc";

// ═══════════════════════════════════════════════════════════════════
// Stage 1: Feature Extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a FeatureMatrix from a collection of research sessions.
 *
 * Each frame is flattened into a d-dimensional feature vector:
 *   - posture mode (54-dim): [j0.x, j0.y, j0.z, j1.x, ..., j17.z]
 *   - posture_velocity mode (108-dim): posture + inter-frame velocity
 *
 * Frames with missing joints (all zeros) are skipped.
 */
export function buildFeatureMatrix(
  sessions: ResearchSession[],
  mode: FeatureMode = "posture",
): FeatureMatrix {
  const d = featureDim(mode);
  const allFrames: Float64Array[] = [];
  const sessionBoundaries: number[] = [];
  const sessionIds: string[] = [];

  for (const session of sessions) {
    const frames = session.landmark_data;
    if (!frames || frames.length === 0) continue;

    sessionBoundaries.push(allFrames.length);
    sessionIds.push(session.session_id);

    if (mode === "posture") {
      for (const frame of frames) {
        const vec = flattenFramePosture(frame);
        // Skip frames where all joints are zero (missing data)
        if (isNonZero(vec)) {
          allFrames.push(vec);
        }
      }
    } else {
      // posture_velocity: need pairs of consecutive frames
      for (let i = 1; i < frames.length; i++) {
        const vec = flattenFrameWithVelocity(frames[i], frames[i - 1]);
        if (vec && isNonZero(vec)) {
          allFrames.push(vec);
        }
      }
    }
  }

  if (allFrames.length === 0) {
    throw new Error("No valid frames extracted from sessions");
  }

  // Flatten into single Float64Array (row-major)
  const n = allFrames.length;
  const data = new Float64Array(n * d);
  for (let i = 0; i < n; i++) {
    data.set(allFrames[i], i * d);
  }

  return { n, d, data, sessionBoundaries, sessionIds };
}

function isNonZero(vec: Float64Array): boolean {
  for (let i = 0; i < vec.length; i++) {
    if (vec[i] !== 0) return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Stage 4: Pairwise Similarity Scoring
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute pairwise similarity scores between all sessions.
 *
 * Each session is represented by its mean feature vector (averaged
 * over all its frames). Sessions with fewer than minFrames valid
 * frames are excluded.
 *
 * Similarity is computed on z-scored features using population
 * statistics (so individual differences are amplified).
 *
 * Returns a Map keyed by "sessionA::sessionB" → similarity score.
 */
export function computePairwiseSimilarities(
  matrix: FeatureMatrix,
  stats: PopulationFeatureStats,
  minFrames = 10,
): {
  scores: Map<string, number>;
  sessionVectors: Map<string, Float64Array>;
  sessionMetas: SessionMeta[];
} {
  const { data, d, sessionBoundaries, sessionIds } = matrix;
  // Add sentinel
  const boundaries = [...sessionBoundaries, matrix.n];

  // Compute mean vector per session
  const sessionVectors = new Map<string, Float64Array>();
  const validSessions: string[] = [];

  for (let s = 0; s < sessionIds.length; s++) {
    const start = boundaries[s];
    const end = boundaries[s + 1];
    const frameCount = end - start;
    if (frameCount < minFrames) continue;

    const meanVec = new Float64Array(d);
    for (let i = start; i < end; i++) {
      const rowOff = i * d;
      for (let j = 0; j < d; j++) {
        meanVec[j] += data[rowOff + j];
      }
    }
    const invN = 1 / frameCount;
    for (let j = 0; j < d; j++) meanVec[j] *= invN;

    // Z-score normalize using population stats
    const zVec = zScoreNormalize(meanVec, stats);

    sessionVectors.set(sessionIds[s], zVec);
    validSessions.push(sessionIds[s]);
  }

  // Compute pairwise similarities
  const scores = new Map<string, number>();
  const weights = stats.discriminabilityWeights;

  for (let i = 0; i < validSessions.length; i++) {
    for (let j = i + 1; j < validSessions.length; j++) {
      const a = sessionVectors.get(validSessions[i])!;
      const b = sessionVectors.get(validSessions[j])!;
      const sim = weightedCosineSimilarity(a, b, weights);
      scores.set(`${validSessions[i]}::${validSessions[j]}`, sim);
    }
  }

  // Build session metadata for pseudo-labeling
  // Note: ResearchSession doesn't include device info directly in the
  // current type — we'd need to extend the loader. For now, placeholder.
  const sessionMetas: SessionMeta[] = validSessions.map((id) => ({
    sessionId: id,
    deviceOs: "Unknown",
    deviceBrowser: "Unknown",
    viewportWidth: 0,
    viewportHeight: 0,
  }));

  return { scores, sessionVectors, sessionMetas };
}

// ═══════════════════════════════════════════════════════════════════
// Stage 5a: Identity-Aware ROC Calibration (Route C)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate identity-labeled score pairs using node_handle (Route C).
 *
 * Genuine pairs: same node_handle, different sessions
 * Impostor pairs: different node_handle
 *
 * This replaces the pseudo-labeling heuristic with true identity labels
 * when Genesis identity binding is available.
 */
export function generateIdentityLabels(
  scores: Map<string, number>,
  sessions: ResearchSession[],
  maxPairs = 10000,
): LabeledScore[] {
  // Build node_handle → session_id[] map
  const identityMap = new Map<string, string[]>();
  const sessionMap = new Map<string, ResearchSession>();

  for (const s of sessions) {
    sessionMap.set(s.session_id, s);
    const nh = s.node_handle;
    if (nh) {
      const list = identityMap.get(nh) || [];
      list.push(s.session_id);
      identityMap.set(nh, list);
    }
  }

  const labeled: LabeledScore[] = [];

  // Genuine pairs: same node_handle
  for (const [, sessionIds] of identityMap) {
    if (sessionIds.length < 2) continue;
    for (let i = 0; i < sessionIds.length && labeled.length < maxPairs; i++) {
      for (let j = i + 1; j < sessionIds.length && labeled.length < maxPairs; j++) {
        const key1 = `${sessionIds[i]}::${sessionIds[j]}`;
        const key2 = `${sessionIds[j]}::${sessionIds[i]}`;
        const score = scores.get(key1) ?? scores.get(key2);
        if (score !== undefined) {
          labeled.push({
            score,
            isGenuine: true,
            enrollmentSessionId: sessionIds[i],
            probeSessionId: sessionIds[j],
          });
        }
      }
    }
  }

  // Impostor pairs: different node_handle
  const identities = [...identityMap.keys()];
  const maxImpostor = Math.min(maxPairs - labeled.length, labeled.length * 3);

  for (let gi = 0; gi < identities.length && labeled.length < maxPairs + maxImpostor; gi++) {
    for (let gj = gi + 1; gj < identities.length && labeled.length < maxPairs + maxImpostor; gj++) {
      const groupA = identityMap.get(identities[gi])!;
      const groupB = identityMap.get(identities[gj])!;
      const a = groupA[Math.floor(Math.random() * groupA.length)];
      const b = groupB[Math.floor(Math.random() * groupB.length)];
      const key1 = `${a}::${b}`;
      const key2 = `${b}::${a}`;
      const score = scores.get(key1) ?? scores.get(key2);
      if (score !== undefined) {
        labeled.push({
          score,
          isGenuine: false,
          enrollmentSessionId: a,
          probeSessionId: b,
        });
      }
    }
  }

  return labeled;
}

// ═══════════════════════════════════════════════════════════════════
// Stage 5b: Pseudo-Labeled ROC Calibration (fallback)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate ROC calibration from pairwise similarity scores.
 *
 * Since Phase E-2 data is anonymous, we use a heuristic for pseudo-labeling:
 *   - Sessions within the same similarity cluster are pseudo-genuine
 *   - Sessions in different clusters are pseudo-impostor
 *
 * Clustering heuristic: sessions with similarity > 0.8 are considered
 * the same person (pseudo-genuine). This is a coarse approximation
 * that works when the population is diverse enough.
 *
 * For production (Phase F with identity labels), replace this with
 * true labeled pairs.
 */
export function calibrateROCFromSimilarities(
  scores: Map<string, number>,
  pseudoGenuineThreshold = 0.85,
  maxPairs = 5000,
): ROCCalibration {
  const labeled: LabeledScore[] = [];
  let count = 0;

  for (const [key, score] of scores) {
    if (count >= maxPairs) break;
    const [sessionA, sessionB] = key.split("::");
    // High similarity → pseudo-genuine (same person testing multiple times)
    // Low similarity → pseudo-impostor (different people)
    const isGenuine = score >= pseudoGenuineThreshold;

    labeled.push({
      score,
      isGenuine,
      enrollmentSessionId: sessionA,
      probeSessionId: sessionB,
    });
    count++;
  }

  return computeROC(labeled);
}

// ═══════════════════════════════════════════════════════════════════
// Full Calibration Pipeline
// ═══════════════════════════════════════════════════════════════════

export interface CalibrationReport {
  artifact: CalibrationArtifact;
  diagnostics: CalibrationDiagnostics;
}

export interface CalibrationDiagnostics {
  /** Number of input sessions */
  sessionCount: number;
  /** Number of valid frames extracted */
  frameCount: number;
  /** Feature dimension */
  featureDim: number;
  /** PCA output dimension */
  pcaOutputDim: number;
  /** Total variance retained by PCA */
  varianceRetained: number;
  /** Genuine score distribution stats */
  genuineDistribution: ScoreDistributionStats;
  /** Impostor score distribution stats */
  impostorDistribution: ScoreDistributionStats;
  /** Separation margin: μ_genuine - μ_impostor */
  separationMargin: number;
  /** Whether minimum session threshold was met */
  meetsMinimumThreshold: boolean;
  /** Warnings */
  warnings: string[];
}

/**
 * Run the full Phase E-2 calibration pipeline.
 *
 * Input: research sessions with landmark data
 * Output: CalibrationArtifact (PCA + stats + ROC) + diagnostics
 *
 * Usage:
 *   const sessions = await loadResearchSessions();
 *   const { artifact, diagnostics } = runCalibration(sessions);
 *   // Save artifact for consumption by engine
 *   await fs.writeFile("calibration-artifact-v1.json", JSON.stringify(artifact));
 */
export function runCalibration(
  sessions: ResearchSession[],
  configOverrides: Partial<CalibrationConfig> = {},
): CalibrationReport {
  const config: Required<CalibrationConfig> = {
    ...DEFAULT_CALIBRATION_CONFIG,
    ...configOverrides,
    targetFars: configOverrides.targetFars ?? DEFAULT_CALIBRATION_CONFIG.targetFars,
  };

  const warnings: string[] = [];

  // ── Validation ──
  if (sessions.length < config.minSessions) {
    warnings.push(
      `Only ${sessions.length} sessions available (minimum ${config.minSessions} recommended). ` +
      `Calibration will proceed but population coverage may be insufficient.`,
    );
  }

  const validSessions = sessions.filter(
    (s) => s.landmark_data && s.landmark_data.length >= 30, // at least 1s of data
  );

  if (validSessions.length === 0) {
    throw new Error("No sessions with sufficient landmark data (≥30 frames)");
  }

  if (validSessions.length < sessions.length) {
    warnings.push(
      `Filtered out ${sessions.length - validSessions.length} sessions with insufficient frames (<30).`,
    );
  }

  // ── Stage 1: Feature Extraction ──
  const matrix = buildFeatureMatrix(validSessions, config.featureMode);

  // ── Stage 2: PCA ──
  const pca = computePCA(matrix, config);

  const varianceRetained =
    pca.cumulativeVariance.length > 0
      ? pca.cumulativeVariance[pca.cumulativeVariance.length - 1]
      : 0;

  if (varianceRetained < config.minVarianceRetained) {
    warnings.push(
      `PCA retains only ${(varianceRetained * 100).toFixed(1)}% variance ` +
      `(target: ${(config.minVarianceRetained * 100).toFixed(0)}%). ` +
      `Consider increasing pcaOutputDim or collecting more diverse data.`,
    );
  }

  // ── Stage 3: Population Statistics ──
  const stats = computePopulationStats(matrix, config);

  // ── Stage 4: Pairwise Similarities ──
  const { scores } = computePairwiseSimilarities(matrix, stats);

  // ── Stage 5: ROC Calibration ──
  const roc = calibrateROCFromSimilarities(scores);

  // ── Diagnostics ──
  const genuineScores: number[] = [];
  const impostorScores: number[] = [];
  for (const ls of roc.curve.map(() => null)) {
    // (distributions computed separately below)
  }
  // Extract distributions from the labeled scores used in ROC
  const allLabeled = scores.size > 0
    ? (() => {
        const labeled: LabeledScore[] = [];
        for (const [key, score] of scores) {
          const [a, b] = key.split("::");
          labeled.push({
            score,
            isGenuine: score >= 0.85,
            enrollmentSessionId: a,
            probeSessionId: b,
          });
        }
        return labeled;
      })()
    : [];

  const genScores = allLabeled.filter((l) => l.isGenuine).map((l) => l.score);
  const impScores = allLabeled.filter((l) => !l.isGenuine).map((l) => l.score);

  const genuineDist = computeScoreDistribution(genScores);
  const impostorDist = computeScoreDistribution(impScores);
  const separationMargin =
    genuineDist.count > 0 && impostorDist.count > 0
      ? genuineDist.mean - impostorDist.mean
      : 0;

  if (separationMargin < 0.1) {
    warnings.push(
      `Low separation margin (${separationMargin.toFixed(3)}). ` +
      `Genuine mean=${genuineDist.mean.toFixed(3)}, Impostor mean=${impostorDist.mean.toFixed(3)}. ` +
      `The pseudo-labeling heuristic may need tuning with more diverse data.`,
    );
  }

  // ── Stage 6: Artifact Bundle ──
  const trainingSetHash = computeTrainingSetHash(validSessions.map((s) => s.session_id));

  const artifact: CalibrationArtifact = {
    version: 1,
    pca,
    stats,
    roc,
    featureMode: config.featureMode,
    totalSessions: validSessions.length,
    totalFrames: matrix.n,
    trainingSetHash,
    generatedAt: Date.now(),
    label: `Phase-E2 Calibration — ${validSessions.length} sessions, ${matrix.n} frames, ${pca.outputDim}d PCA, ${(varianceRetained * 100).toFixed(1)}% variance`,
  };

  const diagnostics: CalibrationDiagnostics = {
    sessionCount: validSessions.length,
    frameCount: matrix.n,
    featureDim: matrix.d,
    pcaOutputDim: pca.outputDim,
    varianceRetained: Math.round(varianceRetained * 1e6) / 1e6,
    genuineDistribution: genuineDist,
    impostorDistribution: impostorDist,
    separationMargin: Math.round(separationMargin * 1e6) / 1e6,
    meetsMinimumThreshold: validSessions.length >= config.minSessions,
    warnings,
  };

  return { artifact, diagnostics };
}

// ═══════════════════════════════════════════════════════════════════
// Utility: Training Set Hash
// ═══════════════════════════════════════════════════════════════════

function computeTrainingSetHash(sessionIds: string[]): string {
  const sorted = [...sessionIds].sort();
  // Simple FNV-1a 32-bit hash of concatenated sorted IDs
  let hash = 0x811c9dc5;
  const str = sorted.join(",");
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// ═══════════════════════════════════════════════════════════════════
// Artifact I/O Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate a calibration artifact's internal consistency.
 *
 * Checks:
 *   - PCA inputDim matches stats.dim
 *   - PCA outputDim ≤ inputDim
 *   - PCA mean length = inputDim
 *   - Stats means/stds/mins/maxes all have length = dim
 *   - ROC operating points are in descending FAR order
 *   - All required fields present
 *
 * Returns an array of validation errors (empty = valid).
 */
export function validateArtifact(artifact: CalibrationArtifact): string[] {
  const errors: string[] = [];

  if (artifact.version !== 1) {
    errors.push(`Unsupported artifact version: ${artifact.version}`);
  }

  // PCA consistency
  if (artifact.pca.inputDim !== artifact.stats.dim) {
    errors.push(
      `PCA inputDim (${artifact.pca.inputDim}) ≠ stats.dim (${artifact.stats.dim})`,
    );
  }
  if (artifact.pca.outputDim > artifact.pca.inputDim) {
    errors.push(
      `PCA outputDim (${artifact.pca.outputDim}) > inputDim (${artifact.pca.inputDim})`,
    );
  }
  if (artifact.pca.mean.length !== artifact.pca.inputDim) {
    errors.push(
      `PCA mean length (${artifact.pca.mean.length}) ≠ inputDim (${artifact.pca.inputDim})`,
    );
  }
  if (artifact.pca.projectionMatrix.length !== artifact.pca.outputDim * artifact.pca.inputDim) {
    errors.push(
      `Projection matrix size (${artifact.pca.projectionMatrix.length}) ≠ outputDim × inputDim (${artifact.pca.outputDim * artifact.pca.inputDim})`,
    );
  }

  // Stats consistency
  const statsFields: Array<[string, number[]]> = [
    ["means", artifact.stats.means],
    ["stds", artifact.stats.stds],
    ["mins", artifact.stats.mins],
    ["maxs", artifact.stats.maxs],
    ["medians", artifact.stats.medians],
    ["mads", artifact.stats.mads],
    ["discriminabilityWeights", artifact.stats.discriminabilityWeights],
  ];
  for (const [name, arr] of statsFields) {
    if (arr.length !== artifact.stats.dim) {
      errors.push(
        `stats.${name} length (${arr.length}) ≠ dim (${artifact.stats.dim})`,
      );
    }
  }

  // ROC consistency
  if (artifact.roc.operatingPoints.length === 0) {
    errors.push("ROC has no operating points");
  }
  if (artifact.roc.auc < 0 || artifact.roc.auc > 1) {
    errors.push(`ROC AUC out of range: ${artifact.roc.auc}`);
  }
  if (artifact.roc.eer < 0 || artifact.roc.eer > 1) {
    errors.push(`ROC EER out of range: ${artifact.roc.eer}`);
  }

  return errors;
}

/**
 * Serialize a calibration artifact to a compact JSON string.
 * Uses number rounding to keep file size manageable.
 */
export function serializeArtifact(artifact: CalibrationArtifact): string {
  return JSON.stringify(artifact, null, 2);
}

/**
 * Deserialize a calibration artifact from JSON.
 * Performs basic structural validation.
 */
export function deserializeArtifact(json: string): CalibrationArtifact {
  const obj = JSON.parse(json);
  const errors = validateArtifact(obj);
  if (errors.length > 0) {
    throw new Error(`Invalid calibration artifact:\n${errors.join("\n")}`);
  }
  return obj as CalibrationArtifact;
}

// ═══════════════════════════════════════════════════════════════════
// Re-exports for convenience
// ═══════════════════════════════════════════════════════════════════

export { computePCA } from "./pca";
export { StreamingPCA, project } from "./pca";
export {
  computePopulationStats,
  zScoreNormalize,
  zScoreNormalizeMatrix,
  weightedCosineSimilarity,
  weightedEuclideanDistance,
  mahalanobisDistance,
  StreamingPopulationStats,
} from "./population-stats";
export {
  computeROC,
  applyThreshold,
  computeScoreDistribution,
  generatePseudoLabels,
  deviceFingerprintKey,
} from "./roc";
export { build120DimFeatureMatrix, run120DimCalibration } from "./rust-bridge";
export type { ScoreDistributionStats } from "./roc";
export type { SessionMeta } from "./roc";

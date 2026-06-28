// ============================================================
// MyShape Protocol — Phase E Route B: Rust Calibration Bridge
// ============================================================
//
// Converts research session SST-18 landmark data into the
// Rust engine's native 120-dim feature space, enabling PCA
// and population statistics computation in the exact feature
// space the engine uses.
//
// Pipeline:
//   1. SST-18 frames → MediaPipe 33-keypoint (sstToMediaPipe)
//   2. Build MotionSequence JSON for WASM consumption
//   3. WASM extract_feature_vector() → 120-dim f32 vector
//   4. Accumulate into FeatureMatrix
//   5. Feed into E-2 PCA + stats pipeline
//   6. Generate 120-dim CalibrationArtifact
//
// When this artifact is loaded into the Rust engine,
// with_calibration() passes the calib_dim == DIM_RAW check
// → full PCA projection + z-score normalization activated.

import type { ResearchSession, LandmarkFrame } from "./types";
import type { JointPosition } from "@/types/motion-vector";
import { sstToMediaPipe } from "@/engine/skeleton-topology";
import {
  buildFeatureMatrix,
  computePCA,
  computePopulationStats,
  calibrateROCFromSimilarities,
  computePairwiseSimilarities,
  runCalibration,
} from "./index";
import type { FeatureMatrix, CalibrationArtifact, CalibrationConfig, FeatureMode } from "./types";
import { DEFAULT_CALIBRATION_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════════
// WASM Feature Extraction Interface
// ═══════════════════════════════════════════════════════════════════

interface WasmFeatureExtractor {
  extract_feature_vector(motion_json: string): string; // returns JSON number[]
  get_feature_dim(): number;
}

/**
 * Convert an SST-18 landmark frame to a MediaPipe-format MotionSequence
 * suitable for WASM engine consumption.
 */
function sstFramesToMotionSequence(
  frames: LandmarkFrame[],
  fps: number = 30,
): object {
  return {
    fps,
    frames: frames.map((f) => ({
      t: f.t / 1000, // ms → seconds
      keypoints: sstToMediaPipe(f.joints as Record<number, JointPosition>),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// 120-dim Feature Matrix Builder
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a 120-dim FeatureMatrix from research sessions using the
 * Rust/WASM engine's native feature extraction.
 *
 * Each session contributes one feature vector: the mean of all
 * frame-level 120-dim vectors within that session.
 *
 * @param sessions - Research sessions with SST-18 landmark_data
 * @param wasm - WASM engine instance (must have extract_feature_vector)
 * @param minFrames - Minimum frames per session (default: 10)
 */
export async function build120DimFeatureMatrix(
  sessions: ResearchSession[],
  wasm: WasmFeatureExtractor,
  minFrames: number = 10,
): Promise<FeatureMatrix> {
  const d = wasm.get_feature_dim(); // 120
  const allVectors: Float64Array[] = [];
  const sessionBoundaries: number[] = [];
  const sessionIds: string[] = [];

  for (const session of sessions) {
    const frames = session.landmark_data;
    if (!frames || frames.length < minFrames) continue;

    // Convert SST-18 frames to MediaPipe MotionSequence
    const motionSeq = sstFramesToMotionSequence(frames);

    // Call WASM to extract 120-dim feature vector
    const json = wasm.extract_feature_vector(JSON.stringify(motionSeq));
    const featureVec: number[] = JSON.parse(json);

    if (featureVec.length !== d) {
      console.warn(
        `[rust-bridge] Session ${session.session_id}: expected ${d}-dim vector, got ${featureVec.length}-dim. Skipping.`,
      );
      continue;
    }

    allVectors.push(new Float64Array(featureVec));
    sessionBoundaries.push(allVectors.length - 1);
    sessionIds.push(session.session_id);
  }

  if (allVectors.length === 0) {
    throw new Error("No valid 120-dim feature vectors extracted from sessions");
  }

  // Build flat FeatureMatrix (each session = one row)
  const n = allVectors.length;
  const data = new Float64Array(n * d);
  for (let i = 0; i < n; i++) {
    data.set(allVectors[i], i * d);
  }

  return { n, d, data, sessionBoundaries, sessionIds };
}

// ═══════════════════════════════════════════════════════════════════
// Full 120-dim Calibration Pipeline
// ═══════════════════════════════════════════════════════════════════

/**
 * Run the full calibration pipeline using the Rust engine's native
 * 120-dim feature space.
 *
 * This produces a CalibrationArtifact whose PCA and population stats
 * match the engine's DIM_RAW = 120, enabling full activation of
 * PCA projection and z-score normalization in with_calibration().
 *
 * @param sessions - Research sessions with SST-18 landmark_data
 * @param wasm - WASM engine instance
 * @param configOverrides - Optional calibration config overrides
 */
export async function run120DimCalibration(
  sessions: ResearchSession[],
  wasm: WasmFeatureExtractor,
  configOverrides: Partial<CalibrationConfig> = {},
): Promise<{ artifact: CalibrationArtifact; diagnostics: { sessionCount: number; featureDim: number; warnings: string[] } }> {
  const config: Required<CalibrationConfig> = {
    ...DEFAULT_CALIBRATION_CONFIG,
    ...configOverrides,
    // Override feature mode — we're in 120-dim Rust-native space
    featureMode: "posture" as FeatureMode, // placeholder; actual mode is rust_120
  };

  const warnings: string[] = [];

  // Step 1: Build 120-dim feature matrix
  const matrix = await build120DimFeatureMatrix(sessions, wasm);

  if (matrix.n < config.minSessions) {
    warnings.push(
      `Only ${matrix.n} valid sessions (minimum ${config.minSessions} recommended)`,
    );
  }

  // Step 2: PCA on 120-dim vectors
  // Note: PCA dimension auto-selection is based on variance retention.
  // For 120-dim data with rich population variance, output_dim will
  // typically be 40-80 (vs 8-16 for 54-dim posture data).
  const pca = computePCA(matrix, { ...config, pcaOutputDim: Math.min(config.pcaOutputDim, matrix.d) });

  // Step 3: Population statistics
  const stats = computePopulationStats(matrix, config);

  // Step 4: Pairwise similarities + ROC
  const { scores } = computePairwiseSimilarities(matrix, stats);
  const roc = calibrateROCFromSimilarities(scores);

  // Step 5: Build artifact
  const varianceRetained =
    pca.cumulativeVariance.length > 0
      ? pca.cumulativeVariance[pca.cumulativeVariance.length - 1]
      : 0;

  const artifact: CalibrationArtifact = {
    version: 1,
    pca: {
      ...pca,
      // Override featureMode to indicate Rust-native 120-dim space
      featureMode: "rust_120" as FeatureMode,
    },
    stats: {
      ...stats,
      featureMode: "rust_120" as FeatureMode,
    },
    roc,
    featureMode: "rust_120" as FeatureMode,
    totalSessions: matrix.n,
    totalFrames: matrix.n, // one vector per session
    trainingSetHash: sessions.map(s => s.session_id).sort().join(",").slice(0, 8),
    generatedAt: Date.now(),
    label: `Phase E Route B — Rust-native 120-dim calibration — ${matrix.n} sessions, ${matrix.d}d PCA, ${(varianceRetained * 100).toFixed(1)}% variance`,
  };

  return {
    artifact,
    diagnostics: {
      sessionCount: matrix.n,
      featureDim: matrix.d,
      warnings,
    },
  };
}

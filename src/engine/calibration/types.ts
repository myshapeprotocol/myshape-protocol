// ============================================================
// MyShape Protocol — Phase E-2 Calibration Type System
// ============================================================
//
// Mathematical foundation for replacing the v0.1 vacuum model
// with population-learned parameters.
//
// Three structural fixes:
//   1. PCA projection matrix → replaces identity-filled projection
//   2. Population feature statistics → breaks Impostor 0.97 bypass
//   3. ROC-optimized thresholds → replaces hardcoded 0.70/0.75/0.80
//
// All types are serializable to JSON for cross-engine consumption
// (TypeScript ↔ Rust/WASM via stringified artifact bundles).

// ── Raw Input Types ──

/** A single SST-18 frame, as stored in research_sessions.landmark_data */
export interface LandmarkFrame {
  /** Elapsed ms from capture start */
  t: number;
  /** SST-18 joints. Key = 0-17, Value = {x, y, z} in denormalized reference space */
  joints: Record<number, { x: number; y: number; z: number }>;
}

/** One research session, as loaded from Supabase */
export interface ResearchSession {
  session_id: string;
  /** Route C: Genesis identity anchor. NULL = anonymous. */
  node_handle?: string | null;
  landmark_data: LandmarkFrame[];
  pes_score: number | null;
  device_os: string | null;
  device_browser: string | null;
  lighting_condition: string | null;
}

// ── Feature Matrix ──

/**
 * Flattened feature matrix from a collection of sessions.
 *
 * Layout:
 *   - rows = frames (N total across all sessions)
 *   - cols = features (d = 54 for SST-18 posture, or 108 with velocity concatenation)
 *
 * Each row is one frame's feature vector, flattened in column-major-compatible order:
 *   [joint0.x, joint0.y, joint0.z, joint1.x, ..., joint17.z]
 */
export interface FeatureMatrix {
  /** Number of frames (rows) */
  n: number;
  /** Number of features per frame (columns) */
  d: number;
  /** Flattened data: row-major, length = n * d */
  data: Float64Array;
  /** Session boundaries: sessionBoundaries[i] = first frame index of session i */
  sessionBoundaries: number[];
  /** Session IDs corresponding to each boundary */
  sessionIds: string[];
}

/** Feature extraction mode — what gets flattened into the feature vector */
export type FeatureMode =
  | "posture"               // 54-dim: SST-18 × (x, y, z)
  | "posture_velocity";     // 108-dim: posture + inter-frame velocity

// ── PCA Result ──

/**
 * Learned PCA projection.
 *
 * The projection matrix P maps a d-dimensional feature vector x to a
 * k-dimensional reduced representation:  y = P · (x - μ)
 *
 * Properties:
 *   - P is (k × d) where k ≤ d
 *   - Rows of P are orthonormal (eigenvectors of the covariance matrix)
 *   - explained_variance_ratio[i] is the fraction of total variance captured by component i
 */
export interface PCAResult {
  /** Number of input dimensions */
  inputDim: number;
  /** Number of output (principal) dimensions */
  outputDim: number;
  /** Projection matrix: k × d, row-major flat array of length k*d */
  projectionMatrix: number[];
  /** Mean vector μ: length d */
  mean: number[];
  /** Eigenvalues in descending order: length k */
  eigenvalues: number[];
  /** Explained variance ratio per component: length k, each ∈ [0, 1], sum ≤ 1 */
  explainedVarianceRatio: number[];
  /** Cumulative explained variance: length k, monotonic increasing to ≤ 1 */
  cumulativeVariance: number[];
  /** Feature mode used for this PCA */
  featureMode: FeatureMode;
  /** Number of frames used for training */
  numSamples: number;
  /** Number of sessions used for training */
  numSessions: number;
  /** UTC timestamp of calibration */
  calibratedAt: number;
}

// ── Population Feature Statistics ──

/**
 * Per-dimension population statistics.
 *
 * These replace the v0.1 vacuum defaults:
 *   OLD: feature_means = [0, 0, ..., 0]
 *   OLD: feature_stds  = [1, 1, ..., 1]
 *
 * After z-scoring with population statistics:
 *   z[d] = (x[d] - means[d]) / stds[d]
 *
 * This breaks the Impostor 0.97 bypass because two different people
 * with similar raw postures will have different z-scored deviations
 * from the population mean.
 */
export interface PopulationFeatureStats {
  /** Number of feature dimensions */
  dim: number;
  /** Per-dimension mean μ: length d */
  means: number[];
  /** Per-dimension standard deviation σ: length d */
  stds: number[];
  /** Per-dimension minimum observed value: length d */
  mins: number[];
  /** Per-dimension maximum observed value: length d */
  maxs: number[];
  /** Per-dimension median: length d (robust alternative to mean) */
  medians: number[];
  /** Per-dimension median absolute deviation: length d (robust alternative to std) */
  mads: number[];
  /** Per-dimension discriminability weight w ∈ [0, 1] — higher = better at separating individuals */
  discriminabilityWeights: number[];
  /** Feature mode */
  featureMode: FeatureMode;
  /** Number of frames used */
  numSamples: number;
  /** Number of sessions used */
  numSessions: number;
  /** UTC timestamp */
  calibratedAt: number;
}

// ── ROC Calibration ──

/** A single point on the ROC curve */
export interface ROCPoint {
  /** False Accept Rate (impostor score ≥ threshold) */
  far: number;
  /** True Accept Rate (genuine score ≥ threshold) */
  tar: number;
  /** The threshold that produces this (FAR, TAR) pair */
  threshold: number;
}

/** Target operating point — a specific FAR level and its calibrated threshold */
export interface OperatingPoint {
  /** Target False Accept Rate */
  targetFar: number;
  /** Calibrated threshold that achieves this FAR */
  threshold: number;
  /** Actual FAR at this threshold */
  actualFar: number;
  /** TAR at this threshold (1 - FRR) */
  tar: number;
  /** FRR at this threshold */
  frr: number;
}

/**
 * Full ROC calibration result.
 *
 * Replaces the v0.1 hardcoded thresholds:
 *   OLD: risk_level=low→0.70, medium→0.75, high→0.80
 *   NEW: operatingPoints[risk_level] → ROC-optimized threshold
 */
export interface ROCCalibration {
  /** ROC curve points sorted by threshold descending */
  curve: ROCPoint[];
  /** Area Under Curve ∈ [0, 1] */
  auc: number;
  /** Equal Error Rate — the point where FAR = FRR */
  eer: number;
  /** Threshold at EER */
  eerThreshold: number;
  /** d-prime = Φ⁻¹(TAR) - Φ⁻¹(FAR) at EER operating point */
  dPrime: number;
  /** Operating points for target FAR levels */
  operatingPoints: OperatingPoint[];
  /** Number of genuine comparisons used */
  genuineComparisons: number;
  /** Number of impostor comparisons used */
  impostorComparisons: number;
  /** UTC timestamp */
  calibratedAt: number;
}

// ── Calibration Artifact (Serializable Bundle) ──

/**
 * Complete calibration artifact — the output of Phase E-2.
 *
 * This JSON-serializable bundle replaces ALL v0.1 hardcoded parameters.
 * It can be loaded by both TypeScript PES engine and Rust/WASM engine.
 *
 * Loading path:
 *   TS:  import artifact from "./calibration-artifact-v1.json"
 *   WASM: engine.load_calibration(JSON.stringify(artifact))
 */
export interface CalibrationArtifact {
  /** Schema version for forward compatibility */
  version: 1;
  /** PCA projection — replaces identity projection matrix */
  pca: PCAResult;
  /** Population feature statistics — replaces zero means / unit stds */
  stats: PopulationFeatureStats;
  /** ROC calibration — replaces hardcoded 0.70/0.75/0.80 thresholds */
  roc: ROCCalibration;
  /** Feature mode used for all components */
  featureMode: FeatureMode;
  /** Total sessions in training set */
  totalSessions: number;
  /** Total frames in training set */
  totalFrames: number;
  /** Hash of training session IDs (for reproducibility audit) */
  trainingSetHash: string;
  /** UTC timestamp */
  generatedAt: number;
  /** Human-readable label */
  label: string;
}

// ── Calibration Pipeline Config ──

export interface CalibrationConfig {
  /** PCA target dimension (default: 48 for 54-dim posture, 64 for 108-dim) */
  pcaOutputDim?: number;
  /** Minimum explained variance ratio to retain (default: 0.95) */
  minVarianceRetained?: number;
  /** Feature extraction mode */
  featureMode?: FeatureMode;
  /** Target FAR levels for operating point calibration */
  targetFars?: number[];
  /** Minimum number of sessions required before calibration is valid */
  minSessions?: number;
  /** Whether to use robust statistics (median/MAD) instead of mean/std */
  useRobustStats?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
}

export const DEFAULT_CALIBRATION_CONFIG: Required<CalibrationConfig> = {
  pcaOutputDim: 48,
  minVarianceRetained: 0.95,
  featureMode: "posture",
  targetFars: [0.01, 0.05, 0.10],  // 1%, 5%, 10% FAR — per security spec
  minSessions: 300,                 // Phase E-2 minimum
  useRobustStats: false,
  seed: 0x6d797368,                // "myshape" in hex
};

// ── Session Pair Labeling (for ROC) ──

/**
 * Labeled score pair for ROC calibration.
 *   - genuine: same person, different sessions
 *   - impostor: different people
 *
 * Since research sessions are anonymous (no identity binding),
 * we use a proxy: same-device-same-lighting consecutive sessions
 * from the same coarse device fingerprint as pseudo-genuine pairs,
 * and cross-device sessions as pseudo-impostor pairs.
 *
 * This is a Phase E-2 approximation. Full identity-bound labeling
 * requires the Genesis identity layer (Phase F).
 */
export interface LabeledScore {
  /** Similarity score ∈ [0, 1] */
  score: number;
  /** true = genuine pair, false = impostor pair */
  isGenuine: boolean;
  /** Session ID of the enrollment/template */
  enrollmentSessionId: string;
  /** Session ID of the probe */
  probeSessionId: string;
}

// ── Utility: flatten SST-18 frame to feature vector ──

const SST_JOINT_COUNT = 18;
const COORDS_PER_JOINT = 3;
const POSTURE_DIM = SST_JOINT_COUNT * COORDS_PER_JOINT; // 54

/**
 * Flatten a single SST-18 frame into a 54-dim posture vector.
 * Order: joint 0 (x,y,z), joint 1 (x,y,z), ..., joint 17 (x,y,z)
 */
export function flattenFramePosture(frame: LandmarkFrame): Float64Array {
  const vec = new Float64Array(POSTURE_DIM);
  for (let j = 0; j < SST_JOINT_COUNT; j++) {
    const pos = frame.joints[j];
    const offset = j * COORDS_PER_JOINT;
    if (pos) {
      vec[offset] = pos.x;
      vec[offset + 1] = pos.y;
      vec[offset + 2] = pos.z;
    }
    // missing joints stay 0 (already zero-filled by Float64Array)
  }
  return vec;
}

/**
 * Flatten a frame pair (current + previous) into a 108-dim posture+velocity vector.
 * Velocity is approximated as finite difference: v_j ≈ (pos_j[t] - pos_j[t-1]) / Δt
 */
export function flattenFrameWithVelocity(
  current: LandmarkFrame,
  previous: LandmarkFrame,
): Float64Array | null {
  const dt = (current.t - previous.t) / 1000; // ms → seconds
  if (dt <= 0.001 || dt > 0.5) return null;   // invalid time delta

  const vec = new Float64Array(POSTURE_DIM * 2);
  for (let j = 0; j < SST_JOINT_COUNT; j++) {
    const cp = current.joints[j];
    const pp = previous.joints[j];
    const offset = j * COORDS_PER_JOINT;
    const velOffset = POSTURE_DIM + offset;

    if (cp) {
      vec[offset] = cp.x;
      vec[offset + 1] = cp.y;
      vec[offset + 2] = cp.z;
    }
    if (cp && pp) {
      vec[velOffset] = (cp.x - pp.x) / dt;
      vec[velOffset + 1] = (cp.y - pp.y) / dt;
      vec[velOffset + 2] = (cp.z - pp.z) / dt;
    }
  }
  return vec;
}

/** Get the feature dimension for a given mode */
export function featureDim(mode: FeatureMode): number {
  return mode === "posture" ? POSTURE_DIM : POSTURE_DIM * 2;
}

// ============================================================
// MyShape Protocol — Phase E-2 Population Feature Statistics
// ============================================================
//
// Computes per-dimension population statistics from real-world
// landmark data. These replace the v0.1 vacuum defaults:
//
//   OLD: feature_means = [0, 0, ..., 0]   (vacuum)
//   OLD: feature_stds  = [1, 1, ..., 1]   (unit scale)
//
//   NEW: feature_means = μ (learned from population)
//   NEW: feature_stds  = σ (learned from population)
//
// The z-score normalization with population statistics AMPLIFIES
// individual differences while suppressing common-mode posture:
//
//   z[d] = (x[d] - μ[d]) / (σ[d] + ε)
//
// Two different people with similar raw postures:
//   Raw:    [0.51, 0.30, ...] vs [0.50, 0.31, ...] → cos_sim ≈ 0.97
//   Z-scored after population stats:
//   Person A deviates +0.2σ on dim 3, -0.5σ on dim 7
//   Person B deviates -0.1σ on dim 3, +0.3σ on dim 7
//   → cos_sim drops to 0.4-0.6 (AMPLIFIED individual differences)
//
// This is the mathematical mechanism that breaks the Impostor bypass.

import type {
  FeatureMatrix,
  PopulationFeatureStats,
  FeatureMode,
  CalibrationConfig,
} from "./types";
import { featureDim, DEFAULT_CALIBRATION_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Basic statistics helpers
// ═══════════════════════════════════════════════════════════════════

/** Extract a single column from the feature matrix */
function getColumn(data: Float64Array, n: number, d: number, col: number): Float64Array {
  const colData = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    colData[i] = data[i * d + col];
  }
  return colData;
}

/** Compute mean of an array */
function mean(arr: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum / arr.length;
}

/** Compute variance of an array (population formula: divide by N) */
function variance(arr: Float64Array, mu?: number): number {
  const m = mu ?? mean(arr);
  let sumSq = 0;
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - m;
    sumSq += d * d;
  }
  return sumSq / arr.length;
}

/** Compute standard deviation */
function stdDev(arr: Float64Array, mu?: number): number {
  return Math.sqrt(variance(arr, mu));
}

/** Compute median of a sorted copy */
function median(arr: Float64Array): number {
  const sorted = new Float64Array(arr);
  sorted.sort();
  const mid = arr.length >> 1;
  if (arr.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Compute Median Absolute Deviation */
function mad(arr: Float64Array, med?: number): number {
  const m = med ?? median(arr);
  const absDevs = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) absDevs[i] = Math.abs(arr[i] - m);
  return median(absDevs) * 1.4826; // scale factor for normal consistency
}

// ═══════════════════════════════════════════════════════════════════
// Discriminability Weights
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute per-dimension discriminability weights.
 *
 * Since research sessions are anonymous (no identity labels), we use
 * a proxy F-ratio: between-session variance / within-session variance.
 *
 * Intuition:
 *   - within-session variance: natural postural sway within one 30s capture
 *   - between-session variance: differences in mean posture across sessions
 *   - High F-ratio → this dimension varies more between people than within a person
 *     → good for telling individuals apart → high weight
 *   - Low F-ratio → this dimension is mostly noise or common to everyone
 *     → bad for telling individuals apart → low weight
 *
 * Weight mapping: w[d] = sigmoid(log(F_ratio[d]) - 0.5)
 *   - F=1.0 (no discriminability) → log(1)=0 → w ≈ 0.38
 *   - F=2.0 → log(2)≈0.69 → w ≈ 0.55
 *   - F=5.0 → log(5)≈1.61 → w ≈ 0.75
 *   - F=0.5 (inverse) → log(0.5)≈-0.69 → w ≈ 0.23
 */
function computeDiscriminabilityWeights(
  matrix: FeatureMatrix,
): Float64Array {
  const { data, n, d, sessionBoundaries } = matrix;
  const weights = new Float64Array(d);

  // Add a sentinel boundary for the last session
  const boundaries = [...sessionBoundaries, n];

  for (let col = 0; col < d; col++) {
    // Compute per-session means and pooled within-session variance
    const sessionMeans: number[] = [];
    let pooledWithinVar = 0;
    let totalFramesInSessions = 0;

    for (let s = 0; s < boundaries.length - 1; s++) {
      const start = boundaries[s];
      const end = boundaries[s + 1];
      const sessionN = end - start;
      if (sessionN < 2) continue;

      // Session mean
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i * d + col];
      const sessionMean = sum / sessionN;
      sessionMeans.push(sessionMean);

      // Session variance
      let sumSq = 0;
      for (let i = start; i < end; i++) {
        const diff = data[i * d + col] - sessionMean;
        sumSq += diff * diff;
      }
      pooledWithinVar += sumSq;
      totalFramesInSessions += sessionN;
    }

    if (sessionMeans.length < 2 || totalFramesInSessions < 2) {
      weights[col] = 0.5; // neutral — insufficient data
      continue;
    }

    // Pooled within-session variance
    const withinVar = pooledWithinVar / totalFramesInSessions;

    // Between-session variance (variance of session means)
    const grandMean = sessionMeans.reduce((a, b) => a + b, 0) / sessionMeans.length;
    let betweenVar = 0;
    for (const sm of sessionMeans) {
      betweenVar += (sm - grandMean) ** 2;
    }
    betweenVar /= (sessionMeans.length - 1);

    // F-ratio
    const fRatio = withinVar > 1e-15 ? betweenVar / withinVar : 1.0;

    // Map to [0, 1] via sigmoid of log F-ratio
    // Center at F=1 (log=0): log(F)=0 → sigmoid(-0.5)=0.38 (below 0.5 — needs clear signal)
    const logF = Math.log(Math.max(fRatio, 1e-6));
    const sigmoid = 1 / (1 + Math.exp(-(logF - 0.3)));
    weights[col] = Math.round(sigmoid * 1e6) / 1e6;
  }

  return weights;
}

// ═══════════════════════════════════════════════════════════════════
// Public API: Compute Population Statistics
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute population feature statistics from a collection of landmark frames.
 *
 * Produces per-dimension: mean, std, min, max, median, MAD, and
 * discriminability weights.
 *
 * These statistics replace the v0.1 vacuum defaults:
 *   feature_means = [0, ..., 0]  →  computed μ
 *   feature_stds  = [1, ..., 1]  →  computed σ
 *
 * @param matrix - Feature matrix from research sessions
 * @param config - Calibration configuration
 * @returns PopulationFeatureStats
 */
export function computePopulationStats(
  matrix: FeatureMatrix,
  config: Required<CalibrationConfig>,
): PopulationFeatureStats {
  const { data, n, d } = matrix;

  const means = new Float64Array(d);
  const stds = new Float64Array(d);
  const mins = new Float64Array(d);
  const maxs = new Float64Array(d);
  const medians = new Float64Array(d);
  const mads = new Float64Array(d);

  for (let col = 0; col < d; col++) {
    const colData = getColumn(data, n, d, col);
    const mu = mean(colData);
    const sigma = stdDev(colData, mu);
    const med = median(colData);
    const madVal = mad(colData, med);

    means[col] = mu;
    stds[col] = sigma > 1e-15 ? sigma : 1e-6; // floor: prevent division by zero
    mins[col] = colData.reduce((a, b) => Math.min(a, b), Infinity);
    maxs[col] = colData.reduce((a, b) => Math.max(a, b), -Infinity);
    medians[col] = med;
    mads[col] = madVal;
  }

  // Discriminability weights
  const weights = computeDiscriminabilityWeights(matrix);

  return {
    dim: d,
    means: Array.from(means),
    stds: Array.from(stds),
    mins: Array.from(mins),
    maxs: Array.from(maxs),
    medians: Array.from(medians),
    mads: Array.from(mads),
    discriminabilityWeights: Array.from(weights),
    featureMode: config.featureMode,
    numSamples: n,
    numSessions: matrix.sessionIds.length,
    calibratedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Z-Score Normalization
// ═══════════════════════════════════════════════════════════════════

/**
 * Z-score normalize a feature vector using population statistics.
 *
 *   z[d] = (x[d] - μ[d]) / σ[d]
 *
 * Uses a small epsilon floor on σ to prevent division by zero.
 *
 * This is the core mathematical operation that breaks the Impostor
 * 0.97 bypass: two individuals with similar raw postures will have
 * different z-scored deviations, amplifying their differences.
 *
 * @param x - Raw feature vector (length d)
 * @param stats - Population statistics
 * @param useRobust - If true, use median/MAD instead of mean/std
 * @returns Z-scored feature vector
 */
export function zScoreNormalize(
  x: Float64Array,
  stats: PopulationFeatureStats,
  useRobust = false,
): Float64Array {
  const d = stats.dim;
  const z = new Float64Array(d);
  const centers = useRobust ? stats.medians : stats.means;
  const scales = useRobust ? stats.mads : stats.stds;

  for (let i = 0; i < d; i++) {
    z[i] = (x[i] - centers[i]) / Math.max(scales[i], 1e-8);
  }

  return z;
}

/**
 * Batch z-score normalize: transforms an entire feature matrix in-place on a copy.
 */
export function zScoreNormalizeMatrix(
  matrix: FeatureMatrix,
  stats: PopulationFeatureStats,
  useRobust = false,
): FeatureMatrix {
  const { data, n, d } = matrix;
  const normalized = new Float64Array(n * d);
  const centers = useRobust ? stats.medians : stats.means;
  const scales = useRobust ? stats.mads : stats.stds;

  for (let i = 0; i < n; i++) {
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      normalized[rowOff + j] = (data[rowOff + j] - centers[j]) / Math.max(scales[j], 1e-8);
    }
  }

  return {
    ...matrix,
    data: normalized,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Similarity & Distance Functions (post-calibration)
// ═══════════════════════════════════════════════════════════════════

/**
 * Weighted cosine similarity between two z-scored feature vectors.
 *
 *   sim(a, b) = Σ_d w[d] · a[d] · b[d] / (√Σ w[d]·a[d]² · √Σ w[d]·b[d]²)
 *
 * The discriminability weights w[d] ensure that dimensions with high
 * inter-individual variance contribute more to the similarity score.
 *
 * This is the replacement for the v0.1 raw cosine similarity that
 * produced the 0.97 Impostor bypass.
 *
 * @param a - First z-scored feature vector
 * @param b - Second z-scored feature vector
 * @param weights - Per-dimension discriminability weights
 * @returns Similarity score ∈ [-1, 1], typically [0, 1] for posture data
 */
export function weightedCosineSimilarity(
  a: Float64Array,
  b: Float64Array,
  weights: number[],
): number {
  const d = a.length;
  let dotP = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < d; i++) {
    const w = weights[i];
    const ai = a[i];
    const bi = b[i];
    dotP += w * ai * bi;
    normA += w * ai * ai;
    normB += w * bi * bi;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-15) return 0;
  return dotP / denom;
}

/**
 * Weighted Euclidean distance (inverse similarity).
 *
 *   d(a, b) = √(Σ_d w[d] · (a[d] - b[d])²)
 *
 * Normalized to [0, 1] via exponential decay:
 *   distance_score = exp(-d / scale)
 */
export function weightedEuclideanDistance(
  a: Float64Array,
  b: Float64Array,
  weights: number[],
): number {
  const d = a.length;
  let sumSq = 0;
  let totalWeight = 0;

  for (let i = 0; i < d; i++) {
    const diff = a[i] - b[i];
    sumSq += weights[i] * diff * diff;
    totalWeight += weights[i];
  }

  if (totalWeight < 1e-15) return 0;
  return Math.sqrt(sumSq / totalWeight);
}

/**
 * Mahalanobis distance — accounts for per-dimension variance.
 *
 *   D_M(a, b) = √(Σ_d (a[d] - b[d])² / σ[d]²)
 *
 * This naturally penalizes deviations in low-variance dimensions
 * more heavily than deviations in high-variance dimensions.
 */
export function mahalanobisDistance(
  a: Float64Array,
  b: Float64Array,
  stats: PopulationFeatureStats,
): number {
  const d = stats.dim;
  let sumSq = 0;

  for (let i = 0; i < d; i++) {
    const diff = a[i] - b[i];
    const scale = Math.max(stats.stds[i], 1e-8);
    sumSq += (diff * diff) / (scale * scale);
  }

  return Math.sqrt(sumSq / d);
}

// ═══════════════════════════════════════════════════════════════════
// Population statistics from incremental data
// ═══════════════════════════════════════════════════════════════════

/**
 * StreamingPopulationStats maintains running μ, σ, min, max via
 * Welford's online algorithm. Accepts one feature vector at a time.
 */
export class StreamingPopulationStats {
  private d: number;
  private n: number;
  private means: Float64Array;
  private M2: Float64Array; // sum of squared differences from current mean
  private mins: Float64Array;
  private maxs: Float64Array;
  private featureMode: FeatureMode;
  private sessionCount: number;

  constructor(inputDim: number, featureMode: FeatureMode) {
    this.d = inputDim;
    this.n = 0;
    this.means = new Float64Array(inputDim);
    this.M2 = new Float64Array(inputDim);
    this.mins = new Float64Array(inputDim).fill(Infinity);
    this.maxs = new Float64Array(inputDim).fill(-Infinity);
    this.featureMode = featureMode;
    this.sessionCount = 0;
  }

  get sampleCount(): number {
    return this.n;
  }

  /**
   * Update running statistics with a single feature vector.
   * Welford's algorithm: numerically stable single-pass variance.
   */
  update(x: Float64Array): void {
    this.n++;
    for (let i = 0; i < this.d; i++) {
      const delta = x[i] - this.means[i];
      this.means[i] += delta / this.n;
      const delta2 = x[i] - this.means[i];
      this.M2[i] += delta * delta2;

      if (x[i] < this.mins[i]) this.mins[i] = x[i];
      if (x[i] > this.maxs[i]) this.maxs[i] = x[i];
    }
  }

  endSession(): void {
    this.sessionCount++;
  }

  finalize(): Omit<PopulationFeatureStats, "discriminabilityWeights"> {
    const stds = new Float64Array(this.d);
    for (let i = 0; i < this.d; i++) {
      const variance = this.n > 1 ? this.M2[i] / (this.n - 1) : 0;
      stds[i] = Math.sqrt(Math.max(variance, 1e-15));
    }

    // Note: Streaming stats cannot compute exact medians, MADs, or
    // discriminability weights (those require the full dataset).
    // These fields are filled with mean/std-derived approximations.
    return {
      dim: this.d,
      means: Array.from(this.means),
      stds: Array.from(stds),
      mins: Array.from(this.mins),
      maxs: Array.from(this.maxs),
      medians: Array.from(this.means), // approximation — median ≈ mean for large N
      mads: Array.from(stds.map(s => s * 0.6745)), // approximation — MAD ≈ 0.6745·σ for normal
      featureMode: this.featureMode,
      numSamples: this.n,
      numSessions: this.sessionCount,
      calibratedAt: Date.now(),
    };
  }

  reset(): void {
    this.n = 0;
    this.sessionCount = 0;
    this.means = new Float64Array(this.d);
    this.M2 = new Float64Array(this.d);
    this.mins = new Float64Array(this.d).fill(Infinity);
    this.maxs = new Float64Array(this.d).fill(-Infinity);
  }
}

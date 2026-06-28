// ============================================================
// MyShape Protocol — Phase E-2 PCA Engine
// ============================================================
//
// Replaces the v0.1 identity-filled projection matrix with a
// population-learned PCA projection.
//
// Algorithm: Batch PCA via covariance eigendecomposition using
// power iteration with Gram-Schmidt re-orthogonalization and
// Hotelling deflation.
//
// Numerical properties:
//   - All operations in Float64Array for double precision
//   - Convergence tolerance: 1e-10 (relative change in eigenvalue)
//   - Max iterations per eigenvector: 200 (safety cap; typical: 5-20)
//   - Gram-Schmidt ensures strict orthonormality of output basis
//
// Streaming variant: Incremental PCA via CCIPCA-like update rules
// for memory-constrained or continuous-learning scenarios.

import type { FeatureMatrix, PCAResult, FeatureMode, CalibrationConfig } from "./types";
import { featureDim, DEFAULT_CALIBRATION_CONFIG } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Low-level linear algebra primitives (Float64Array, no external deps)
// ═══════════════════════════════════════════════════════════════════

/** Vector dot product */
function dot(a: Float64Array, b: Float64Array): number {
  const n = a.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

/** Vector L2 norm */
function norm(v: Float64Array): number {
  return Math.sqrt(dot(v, v));
}

/** Scale vector in-place: v *= scalar */
function scale(v: Float64Array, scalar: number): void {
  for (let i = 0; i < v.length; i++) v[i] *= scalar;
}

/** Copy vector */
function copyVec(src: Float64Array): Float64Array {
  return new Float64Array(src);
}

/** axpy: y += a * x */
function axpy(a: number, x: Float64Array, y: Float64Array): void {
  const n = x.length;
  for (let i = 0; i < n; i++) y[i] += a * x[i];
}

/** Outer product: result[i][j] = a[i] * b[j], stored flat row-major */
function outerFlat(a: Float64Array, b: Float64Array, out: Float64Array): void {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out[i * n + j] = a[i] * b[j];
    }
  }
}

/** Matrix-vector multiply: y = A · x, where A is d×d flat row-major */
function matVecMul(A: Float64Array, x: Float64Array, y: Float64Array): void {
  const d = x.length;
  for (let i = 0; i < d; i++) {
    let sum = 0;
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      sum += A[rowOff + j] * x[j];
    }
    y[i] = sum;
  }
}

/** Matrix deflation: A = A - λ · v · v^T (in-place, flat row-major) */
function deflate(A: Float64Array, lambda: number, v: Float64Array): void {
  const d = v.length;
  for (let i = 0; i < d; i++) {
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      A[rowOff + j] -= lambda * v[i] * v[j];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Covariance Matrix Computation
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the covariance matrix C (d × d) from a centered data matrix.
 *
 * X is N × d, stored flat row-major (length N*d).
 * C = (1/N) · X^T · X
 *
 * Complexity: O(N · d²) — for d=54, this is very fast.
 */
function computeCovariance(
  data: Float64Array,
  n: number,
  d: number,
): Float64Array {
  const C = new Float64Array(d * d);

  // C[j][k] = (1/n) · Σ_i X[i][j] · X[i][k]
  for (let i = 0; i < n; i++) {
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      const xj = data[rowOff + j];
      const cRowOff = j * d;
      for (let k = 0; k < d; k++) {
        C[cRowOff + k] += xj * data[rowOff + k];
      }
    }
  }

  const invN = 1 / n;
  for (let i = 0; i < d * d; i++) C[i] *= invN;

  return C;
}

// ═══════════════════════════════════════════════════════════════════
// Power Iteration with Deflation (Batch PCA)
// ═══════════════════════════════════════════════════════════════════

interface PowerIterConfig {
  maxIterations: number;
  tolerance: number;
  /** Random seed for initial vector generation */
  seed: number;
}

const DEFAULT_POWER_ITER: PowerIterConfig = {
  maxIterations: 200,
  tolerance: 1e-10,
  seed: 0x6d797368,
};

/**
 * Simple deterministic pseudo-random number generator (mulberry32).
 * Used for generating initial vectors in power iteration.
 * Deterministic → reproducible PCA results given the same data and seed.
 */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extract top-k eigenvectors of a d×d covariance matrix via
 * power iteration with Hotelling deflation.
 *
 * Returns:
 *   - eigenvectors: k × d matrix (flat row-major)
 *   - eigenvalues: length k, in descending order
 *   - trace: total variance (sum of all eigenvalues, for ratio computation)
 */
function powerIterationEigen(
  C_orig: Float64Array,
  d: number,
  k: number,
  config: PowerIterConfig = DEFAULT_POWER_ITER,
): { eigenvectors: Float64Array; eigenvalues: number[]; trace: number } {
  // Work on a copy since we deflate
  const C = new Float64Array(C_orig);
  const rand = mulberry32(config.seed);

  // Compute trace of original C (total variance)
  let trace = 0;
  for (let i = 0; i < d; i++) trace += C[i * d + i];

  const eigenvectors = new Float64Array(k * d);
  const eigenvalues: number[] = [];

  for (let comp = 0; comp < k; comp++) {
    // Initialize random vector
    const v = new Float64Array(d);
    for (let i = 0; i < d; i++) v[i] = rand() * 2 - 1;
    // Normalize
    const vNorm = norm(v);
    if (vNorm > 0) scale(v, 1 / vNorm);

    const vNew = new Float64Array(d);
    let lambda = 0;
    let prevLambda = -Infinity;

    // Power iteration
    for (let iter = 0; iter < config.maxIterations; iter++) {
      // v_new = C · v
      matVecMul(C, v, vNew);
      // Rayleigh quotient: λ = v^T · C · v = v^T · v_new
      lambda = dot(v, vNew);
      // Normalize
      const nrm = norm(vNew);
      if (nrm < 1e-15) break; // degenerate — zero eigenvalue
      scale(vNew, 1 / nrm);
      // Copy v_new → v
      v.set(vNew);

      // Convergence check
      if (Math.abs(lambda - prevLambda) < config.tolerance * Math.abs(lambda)) {
        break;
      }
      prevLambda = lambda;
    }

    // Gram-Schmidt re-orthogonalization against previous eigenvectors
    for (let prev = 0; prev < comp; prev++) {
      const prevOff = prev * d;
      // projection = dot(v, eigenvector_prev)
      let proj = 0;
      for (let i = 0; i < d; i++) proj += v[i] * eigenvectors[prevOff + i];
      // v = v - proj * eigenvector_prev
      for (let i = 0; i < d; i++) v[i] -= proj * eigenvectors[prevOff + i];
    }
    // Re-normalize after orthogonalization
    const finalNorm = norm(v);
    if (finalNorm > 1e-15) {
      scale(v, 1 / finalNorm);
    }

    // Store eigenvector (row comp of eigenvectors matrix)
    const evOff = comp * d;
    for (let i = 0; i < d; i++) eigenvectors[evOff + i] = v[i];

    eigenvalues.push(lambda);

    // Deflate: C = C - λ · v · v^T
    deflate(C, lambda, v);
  }

  return { eigenvectors, eigenvalues, trace };
}

// ═══════════════════════════════════════════════════════════════════
// Center the feature matrix
// ═══════════════════════════════════════════════════════════════════

/**
 * Center the data matrix: subtract mean from each column.
 * Returns the centered data (in-place modification of a copy) and the mean vector.
 */
function centerData(
  data: Float64Array,
  n: number,
  d: number,
): { centered: Float64Array; mean: Float64Array } {
  const mean = new Float64Array(d);

  // Compute column means
  for (let i = 0; i < n; i++) {
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      mean[j] += data[rowOff + j];
    }
  }
  const invN = 1 / n;
  for (let j = 0; j < d; j++) mean[j] *= invN;

  // Center: X_centered[i][j] = X[i][j] - mean[j]
  const centered = new Float64Array(n * d);
  for (let i = 0; i < n; i++) {
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      centered[rowOff + j] = data[rowOff + j] - mean[j];
    }
  }

  return { centered, mean };
}

// ═══════════════════════════════════════════════════════════════════
// Public API: Batch PCA
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute PCA on a feature matrix.
 *
 * @param matrix - The feature matrix (N frames × d features)
 * @param config - Calibration configuration
 * @returns PCAResult with learned projection matrix
 */
export function computePCA(
  matrix: FeatureMatrix,
  config: Required<CalibrationConfig>,
): PCAResult {
  const d = matrix.d;
  const maxK = Math.min(d, config.pcaOutputDim);

  // Center the data
  const { centered, mean } = centerData(matrix.data, matrix.n, matrix.d);

  // Compute covariance matrix
  const C = computeCovariance(centered, matrix.n, matrix.d);

  // Extract top-maxK eigenvectors
  const { eigenvectors, eigenvalues, trace } = powerIterationEigen(C, d, maxK);

  // Determine output dimension based on variance retention
  let k = maxK;
  if (config.minVarianceRetained > 0) {
    let cumVar = 0;
    for (let i = 0; i < eigenvalues.length; i++) {
      cumVar += eigenvalues[i];
      const ratio = cumVar / trace;
      if (ratio >= config.minVarianceRetained) {
        k = i + 1;
        break;
      }
    }
    // Don't go below 8 components (preserve essential structure)
    k = Math.max(8, Math.min(k, maxK));
  }

  // Build explained variance arrays for the selected k
  const explainedVarianceRatio: number[] = [];
  const cumulativeVariance: number[] = [];
  let cumVar = 0;
  for (let i = 0; i < k; i++) {
    const ratio = trace > 0 ? eigenvalues[i] / trace : 0;
    cumVar += ratio;
    explainedVarianceRatio.push(ratio);
    cumulativeVariance.push(cumVar);
  }

  // Build output projection matrix (k × d, flat row-major)
  // The projection matrix P has eigenvectors as rows
  const projectionMatrix = new Float64Array(k * d);
  for (let i = 0; i < k; i++) {
    const srcOff = i * d;
    const dstOff = i * d;
    for (let j = 0; j < d; j++) {
      projectionMatrix[dstOff + j] = eigenvectors[srcOff + j];
    }
  }

  return {
    inputDim: d,
    outputDim: k,
    projectionMatrix: Array.from(projectionMatrix),
    mean: Array.from(mean),
    eigenvalues: eigenvalues.slice(0, k),
    explainedVarianceRatio,
    cumulativeVariance,
    featureMode: config.featureMode,
    numSamples: matrix.n,
    numSessions: matrix.sessionIds.length,
    calibratedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Projection function
// ═══════════════════════════════════════════════════════════════════

/**
 * Project a feature vector through the learned PCA projection.
 *
 * y = P · (x - μ)
 *
 * where P is (k × d) stored flat row-major, μ is the mean vector.
 *
 * @param x - Raw feature vector (length d)
 * @param pca - Learned PCA result
 * @returns Projected vector (length k = pca.outputDim)
 */
export function project(
  x: Float64Array,
  pca: PCAResult,
): Float64Array {
  const d = pca.inputDim;
  const k = pca.outputDim;
  const P = new Float64Array(pca.projectionMatrix);
  const mean = new Float64Array(pca.mean);

  // Center: z = x - μ
  const z = new Float64Array(d);
  for (let i = 0; i < d; i++) z[i] = x[i] - mean[i];

  // Project: y = P · z
  const y = new Float64Array(k);
  for (let i = 0; i < k; i++) {
    let sum = 0;
    const rowOff = i * d;
    for (let j = 0; j < d; j++) {
      sum += P[rowOff + j] * z[j];
    }
    y[i] = sum;
  }

  return y;
}

// ═══════════════════════════════════════════════════════════════════
// Streaming / Incremental PCA
// ═══════════════════════════════════════════════════════════════════

/**
 * StreamingPCA maintains a running estimate of the top-k principal
 * components, updated one sample at a time.
 *
 * Algorithm: Simplified incremental PCA via running covariance.
 *   - Maintain running mean μ_n and covariance C_n
 *   - Update via Welford-like online algorithm
 *   - Recompute eigenvectors from C_n on demand
 *
 * This is memory-efficient: O(d²) storage regardless of N.
 */
export class StreamingPCA {
  private d: number;
  private k: number;
  private n: number;
  private mean: Float64Array;
  private C: Float64Array; // running covariance accumulator (unnormalized)
  private sessionCount: number;
  private featureMode: FeatureMode;

  constructor(inputDim: number, outputDim: number, featureMode: FeatureMode) {
    this.d = inputDim;
    this.k = Math.min(outputDim, inputDim);
    this.n = 0;
    this.mean = new Float64Array(inputDim);
    this.C = new Float64Array(inputDim * inputDim);
    this.sessionCount = 0;
    this.featureMode = featureMode;
  }

  /** Number of samples processed */
  get sampleCount(): number {
    return this.n;
  }

  /**
   * Update the running statistics with a single feature vector.
   *
   * Uses Welford's online algorithm for mean and an analogous
   * update for the covariance accumulator:
   *
   *   δ = x - μ_old
   *   μ_new = μ_old + δ / n
   *   C_new = C_old + δ · (x - μ_new)^T
   */
  update(x: Float64Array): void {
    this.n++;
    const invN = 1 / this.n;

    // δ = x - μ_old
    const delta = new Float64Array(this.d);
    for (let i = 0; i < this.d; i++) delta[i] = x[i] - this.mean[i];

    // μ_new = μ_old + δ / n
    for (let i = 0; i < this.d; i++) this.mean[i] += delta[i] * invN;

    // x - μ_new = δ · (n-1)/n
    const delta2 = new Float64Array(this.d);
    const scale2 = (this.n - 1) * invN;
    for (let i = 0; i < this.d; i++) delta2[i] = delta[i] * scale2;

    // C += δ · (x - μ_new)^T = δ ⊗ delta2
    for (let i = 0; i < this.d; i++) {
      const rowOff = i * this.d;
      for (let j = 0; j < this.d; j++) {
        this.C[rowOff + j] += delta[i] * delta2[j];
      }
    }
  }

  /** Mark the end of a session (for session counting) */
  endSession(): void {
    this.sessionCount++;
  }

  /**
   * Finalize and return the PCA result from accumulated statistics.
   *
   * Normalizes the covariance accumulator and runs eigendecomposition.
   */
  finalize(config: Required<CalibrationConfig>): PCAResult {
    if (this.n < 2) {
      throw new Error(`StreamingPCA: need at least 2 samples, got ${this.n}`);
    }

    // Normalize: C_normalized = C / (n - 1)
    const C_norm = new Float64Array(this.C);
    const invNm1 = 1 / (this.n - 1);
    for (let i = 0; i < this.d * this.d; i++) C_norm[i] *= invNm1;

    // Eigendecomposition
    const { eigenvectors, eigenvalues, trace } = powerIterationEigen(
      C_norm,
      this.d,
      this.k,
    );

    // Determine output dimension
    let k = this.k;
    if (config.minVarianceRetained > 0) {
      let cumVar = 0;
      for (let i = 0; i < eigenvalues.length; i++) {
        cumVar += eigenvalues[i];
        if (cumVar / trace >= config.minVarianceRetained) {
          k = i + 1;
          break;
        }
      }
      k = Math.max(8, Math.min(k, this.k));
    }

    const explainedVarianceRatio: number[] = [];
    const cumulativeVariance: number[] = [];
    let cumVar = 0;
    for (let i = 0; i < k; i++) {
      const ratio = trace > 0 ? eigenvalues[i] / trace : 0;
      cumVar += ratio;
      explainedVarianceRatio.push(ratio);
      cumulativeVariance.push(cumVar);
    }

    const projectionMatrix = new Float64Array(k * this.d);
    for (let i = 0; i < k; i++) {
      const srcOff = i * this.d;
      for (let j = 0; j < this.d; j++) {
        projectionMatrix[i * this.d + j] = eigenvectors[srcOff + j];
      }
    }

    return {
      inputDim: this.d,
      outputDim: k,
      projectionMatrix: Array.from(projectionMatrix),
      mean: Array.from(this.mean),
      eigenvalues: eigenvalues.slice(0, k),
      explainedVarianceRatio,
      cumulativeVariance,
      featureMode: this.featureMode,
      numSamples: this.n,
      numSessions: this.sessionCount,
      calibratedAt: Date.now(),
    };
  }

  /** Reset all accumulated statistics */
  reset(): void {
    this.n = 0;
    this.sessionCount = 0;
    this.mean = new Float64Array(this.d);
    this.C = new Float64Array(this.d * this.d);
  }
}

// ============================================================
// MyShape Protocol — Phase E-2 ROC Dynamic Calibration
// ============================================================
//
// Replaces the v0.1 hardcoded thresholds:
//   OLD: risk_level=low → 0.70, medium → 0.75, high → 0.80
//   NEW: operatingPoints = ROC-optimized per target FAR level
//
// Takes labeled similarity scores (genuine vs impostor pairs) and
// computes:
//   - Full ROC curve (FAR, TAR at every threshold)
//   - AUC (Area Under Curve)
//   - EER (Equal Error Rate)
//   - d-prime (discriminability index)
//   - Optimal thresholds for target FAR levels
//
// The output ROCCalibration can be serialized to JSON and loaded
// by both TypeScript and Rust/WASM verification engines.
//
// Pair labeling proxy (Phase E-2, anonymous data):
//   Pseudo-genuine: same coarse device fingerprint, consecutive sessions
//   Pseudo-impostor: different device fingerprints
// This is approximate but sufficient for initial calibration.

import type {
  ROCCalibration,
  ROCPoint,
  OperatingPoint,
  LabeledScore,
} from "./types";

// ═══════════════════════════════════════════════════════════════════
// Φ⁻¹ — Inverse Standard Normal CDF (quantile function)
// ═══════════════════════════════════════════════════════════════════
//
// Algorithm: Peter Acklam's approximation.
// Reference: https://web.archive.org/web/20151030212312/http://home.online.no/~pjacklam/notes/invnorm/
//
// Absolute error < 1.15 × 10⁻⁹ in the entire domain [0, 1].

function phiInv(p: number): number {
  // Clamp to domain where approximation is valid
  const pLo = 1e-300;
  const pHi = 1 - 1e-300;
  const clampedP = Math.max(pLo, Math.min(pHi, p));

  // Rational approximation coefficients
  const a1 = -39.6968302866538;
  const a2 = 220.9460984245205;
  const a3 = -275.9285104469687;
  const a4 = 138.3577518672690;
  const a5 = -30.66479806614716;
  const a6 = 2.506628277459239;

  const b1 = -54.47609879822406;
  const b2 = 161.5858368580409;
  const b3 = -155.6989798598866;
  const b4 = 66.80131188771972;
  const b5 = -13.28068155288572;

  const c1 = -7.784894002430293e-3;
  const c2 = -0.3223964580411365;
  const c3 = -2.400758277161838;
  const c4 = -2.549732539343734;
  const c5 = 4.374664141464968;
  const c6 = 2.938163982698783;

  const d1 = 7.784695709041462e-3;
  const d2 = 0.3224671290700398;
  const d3 = 2.445134137142996;
  const d4 = 3.754408661907416;

  // Breakpoints
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (clampedP < pLow) {
    // Lower tail region
    q = Math.sqrt(-2 * Math.log(clampedP));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (clampedP <= pHigh) {
    // Central region
    q = clampedP - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    // Upper tail region (symmetry)
    q = Math.sqrt(-2 * Math.log(1 - clampedP));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ROC Curve Computation
// ═══════════════════════════════════════════════════════════════════

/**
 * Compute the full ROC curve from labeled scores.
 *
 * Algorithm:
 *   1. Separate scores into genuine and impostor sets
 *   2. Iterate over unique score thresholds (sorted descending)
 *   3. At each threshold: FAR = #impostors ≥ t / total_impostors
 *                         TAR = #genuines ≥ t / total_genuines
 *   4. Also compute AUC via trapezoidal integration
 *
 * @param labeledScores - Array of (score, isGenuine) pairs
 * @returns ROCCalibration with full curve and summary metrics
 */
export function computeROC(labeledScores: LabeledScore[]): ROCCalibration {
  if (labeledScores.length === 0) {
    throw new Error("ROC calibration requires at least 1 labeled score");
  }

  // Separate distributions
  const genuineScores: number[] = [];
  const impostorScores: number[] = [];

  for (const ls of labeledScores) {
    if (ls.isGenuine) {
      genuineScores.push(ls.score);
    } else {
      impostorScores.push(ls.score);
    }
  }

  const nGenuine = genuineScores.length;
  const nImpostor = impostorScores.length;

  if (nGenuine === 0 || nImpostor === 0) {
    throw new Error(
      `ROC calibration requires both genuine (${nGenuine}) and impostor (${nImpostor}) scores`,
    );
  }

  // Sort both sets descending
  genuineScores.sort((a, b) => b - a);
  impostorScores.sort((a, b) => b - a);

  // Collect all unique thresholds (descending)
  const allScores = [...genuineScores, ...impostorScores];
  const uniqueThresholds = [...new Set(allScores)].sort((a, b) => b - a);

  // Edge thresholds: inf (accept none) and -inf (accept all)
  uniqueThresholds.push(-Infinity);

  // ── Compute ROC curve points ──
  const curve: ROCPoint[] = [];

  let gi = 0; // index in genuineScores (sorted desc)
  let ii = 0; // index in impostorScores (sorted desc)

  for (const threshold of uniqueThresholds) {
    // Advance past scores ≥ threshold
    while (gi < nGenuine && genuineScores[gi] >= threshold) gi++;
    while (ii < nImpostor && impostorScores[ii] >= threshold) ii++;

    const far = nImpostor > 0 ? ii / nImpostor : 0;
    const tar = nGenuine > 0 ? gi / nGenuine : 0;

    curve.push({ far, tar, threshold: threshold === -Infinity ? 0 : threshold });
  }

  // ── AUC via trapezoidal rule ──
  // AUC = ∫ TAR d(FAR) = Σ (FAR[i] - FAR[i-1]) * (TAR[i] + TAR[i-1]) / 2
  // curve is threshold-descending, which IS FAR-ascending (lower threshold → higher FAR).
  // Iterate in place — no reversal needed.
  let auc = 0;
  for (let i = 1; i < curve.length; i++) {
    const farDelta = curve[i].far - curve[i - 1].far; // positive: FAR increases as threshold drops
    if (farDelta <= 0) continue; // skip duplicate FAR points
    const tarAvg = (curve[i].tar + curve[i - 1].tar) / 2;
    auc += farDelta * tarAvg;
  }
  auc = Math.min(1, Math.max(0, auc));

  // ── EER: Find point where |FAR - FRR| is minimized ──
  // FRR = 1 - TAR. EER = (FAR + FRR) / 2 at the crossing point.
  let eerPoint: ROCPoint | null = null;
  let minDiff = Infinity;

  for (const point of curve) {
    const frr = 1 - point.tar;
    const diff = Math.abs(point.far - frr);
    if (diff < minDiff) {
      minDiff = diff;
      eerPoint = point;
    }
  }

  const eer = eerPoint ? (eerPoint.far + (1 - eerPoint.tar)) / 2 : 0;
  const eerThreshold = eerPoint?.threshold ?? 0.5;

  // ── d-prime ──
  // d' = Φ⁻¹(TAR_at_EER) - Φ⁻¹(FAR_at_EER)
  // At EER, FAR ≈ FRR, so d' ≈ 2 * Φ⁻¹(1 - EER)
  const tarAtEer = eerPoint ? eerPoint.tar : 0.5;
  const farAtEer = eerPoint ? eerPoint.far : 0.5;
  const zTar = phiInv(Math.max(0.001, Math.min(0.999, tarAtEer)));
  const zFar = phiInv(Math.max(0.001, Math.min(0.999, farAtEer)));
  const dPrime = zTar - zFar;

  // ── Operating points for target FAR levels ──
  const operatingPoints = findOperatingPoints(curve, nGenuine, nImpostor);

  return {
    curve,
    auc: Math.round(auc * 1e6) / 1e6,
    eer: Math.round(eer * 1e6) / 1e6,
    eerThreshold: Math.round(eerThreshold * 1e6) / 1e6,
    dPrime: Math.round(dPrime * 1e4) / 1e4,
    operatingPoints,
    genuineComparisons: nGenuine,
    impostorComparisons: nImpostor,
    calibratedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Operating Point Finder
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_TARGET_FARS = [0.01, 0.05, 0.10]; // 1%, 5%, 10%

/**
 * Find operating points (thresholds) for specified target FAR levels.
 *
 * For each target FAR:
 *   1. Find the ROC point whose FAR is closest to (but ≤) the target
 *   2. If no point has FAR exactly ≤ target, use the closest conservative point
 *   3. Return the threshold, actual FAR, TAR, and FRR
 */
function findOperatingPoints(
  curve: ROCPoint[],
  _nGenuine: number,
  _nImpostor: number,
  targetFars: number[] = DEFAULT_TARGET_FARS,
): OperatingPoint[] {
  // Sort curve by FAR ascending
  const sorted = [...curve].sort((a, b) => a.far - b.far);

  return targetFars.map((targetFar) => {
    let bestPoint: ROCPoint | null = null;

    // Find the point with FAR closest to (but not exceeding) target
    for (const point of sorted) {
      if (point.far <= targetFar) {
        // Keep the one with highest TAR among those meeting the FAR constraint
        if (!bestPoint || point.tar > bestPoint.tar) {
          bestPoint = point;
        }
      }
    }

    // Conservative fallback: use the point with smallest FAR > target
    if (!bestPoint) {
      let minFar = Infinity;
      for (const point of sorted) {
        if (point.far < minFar) {
          minFar = point.far;
          bestPoint = point;
        }
      }
    }

    return {
      targetFar,
      threshold: Math.round((bestPoint?.threshold ?? 0.5) * 1e6) / 1e6,
      actualFar: Math.round((bestPoint?.far ?? 0) * 1e6) / 1e6,
      tar: Math.round((bestPoint?.tar ?? 0) * 1e6) / 1e6,
      frr: Math.round(((1 - (bestPoint?.tar ?? 0))) * 1e6) / 1e6,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// Threshold Application
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply a calibrated threshold to a similarity score.
 *
 * Returns the verification decision and the risk level that was applied.
 *
 * risk levels map to target FARs:
 *   low    → target FAR = 10% (higher convenience, some risk)
 *   medium → target FAR = 5%  (balanced)
 *   high   → target FAR = 1%  (highest security)
 */
export function applyThreshold(
  score: number,
  roc: ROCCalibration,
  riskLevel: "low" | "medium" | "high",
): { verified: boolean; threshold: number; actualFar: number } {
  const farIndex = riskLevel === "low" ? 2 : riskLevel === "medium" ? 1 : 0;
  // low→10% (index 2), medium→5% (index 1), high→1% (index 0)
  // This matches DEFAULT_TARGET_FARS = [0.01, 0.05, 0.10]

  const op = roc.operatingPoints[farIndex];
  if (!op) {
    // Fallback: use original hardcoded thresholds
    const fallbackThresholds = { low: 0.70, medium: 0.75, high: 0.80 };
    return {
      verified: score >= fallbackThresholds[riskLevel],
      threshold: fallbackThresholds[riskLevel],
      actualFar: 0,
    };
  }

  return {
    verified: score >= op.threshold,
    threshold: op.threshold,
    actualFar: op.actualFar,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Distribution Statistics (for diagnostics)
// ═══════════════════════════════════════════════════════════════════

export interface ScoreDistributionStats {
  /** Number of scores */
  count: number;
  /** Mean score */
  mean: number;
  /** Standard deviation */
  std: number;
  /** Minimum score */
  min: number;
  /** Maximum score */
  max: number;
  /** 25th percentile */
  p25: number;
  /** 50th percentile (median) */
  p50: number;
  /** 75th percentile */
  p75: number;
}

/**
 * Compute distribution statistics for a set of scores.
 * Useful for diagnosing the separation between genuine and impostor distributions.
 */
export function computeScoreDistribution(scores: number[]): ScoreDistributionStats {
  if (scores.length === 0) {
    return { count: 0, mean: 0, std: 0, min: 0, max: 0, p25: 0, p50: 0, p75: 0 };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mu = sum / n;
  const variance = sorted.reduce((s, v) => s + (v - mu) ** 2, 0) / n;

  const percentile = (p: number): number => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  return {
    count: n,
    mean: Math.round(mu * 1e6) / 1e6,
    std: Math.round(Math.sqrt(variance) * 1e6) / 1e6,
    min: sorted[0],
    max: sorted[n - 1],
    p25: Math.round(percentile(25) * 1e6) / 1e6,
    p50: Math.round(percentile(50) * 1e6) / 1e6,
    p75: Math.round(percentile(75) * 1e6) / 1e6,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Pseudo-Label Generator (for anonymous Phase E-2 data)
// ═══════════════════════════════════════════════════════════════════

/**
 * Session metadata needed for pseudo-labeling.
 *
 * Since Phase E-2 sessions are anonymous, we use a coarse device
 * fingerprint as a proxy for identity: sessions from the same
 * device+browser+viewport combination are likely the same person.
 */
export interface SessionMeta {
  sessionId: string;
  deviceOs: string;
  deviceBrowser: string;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Generate a device fingerprint key from session metadata.
 * Coarse enough to protect privacy, specific enough for pseudo-labeling.
 */
export function deviceFingerprintKey(meta: SessionMeta): string {
  // Bin viewport to 100px buckets to group similar window sizes
  const wBin = Math.round(meta.viewportWidth / 100) * 100;
  const hBin = Math.round(meta.viewportHeight / 100) * 100;
  return `${meta.deviceOs}|${meta.deviceBrowser}|${wBin}x${hBin}`;
}

/**
 * Generate pseudo-labeled score pairs for ROC calibration.
 *
 * Strategy:
 *   - Pseudo-genuine: all pairs within the same device fingerprint group
 *     (excluding self-pairs)
 *   - Pseudo-impostor: pairs from different device fingerprints
 *     (sampled to balance the dataset)
 *
 * @param sessions - Session metadata keyed by session ID
 * @param scores - Map of "sessionA::sessionB" → similarity score
 * @param maxPairs - Maximum total pairs to generate (limits computation)
 */
export function generatePseudoLabels(
  sessions: SessionMeta[],
  scores: Map<string, number>,
  maxPairs = 10000,
): LabeledScore[] {
  // Group sessions by device fingerprint
  const groups = new Map<string, SessionMeta[]>();
  for (const session of sessions) {
    const key = deviceFingerprintKey(session);
    const group = groups.get(key) || [];
    group.push(session);
    groups.set(key, group);
  }

  const labeled: LabeledScore[] = [];

  // Generate pseudo-genuine pairs (within same fingerprint group)
  for (const [, group] of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (labeled.length >= maxPairs) break;
        const key1 = `${group[i].sessionId}::${group[j].sessionId}`;
        const key2 = `${group[j].sessionId}::${group[i].sessionId}`;
        const score = scores.get(key1) ?? scores.get(key2);
        if (score !== undefined) {
          labeled.push({
            score,
            isGenuine: true,
            enrollmentSessionId: group[i].sessionId,
            probeSessionId: group[j].sessionId,
          });
        }
      }
    }
  }

  // Generate pseudo-impostor pairs (across different fingerprint groups)
  const groupKeys = [...groups.keys()];
  let impostorCount = 0;
  const maxImpostor = Math.min(maxPairs - labeled.length, labeled.length * 3); // balance

  for (let gi = 0; gi < groupKeys.length && impostorCount < maxImpostor; gi++) {
    for (let gj = gi + 1; gj < groupKeys.length && impostorCount < maxImpostor; gj++) {
      const groupA = groups.get(groupKeys[gi])!;
      const groupB = groups.get(groupKeys[gj])!;
      // Sample one pair per group pair (avoid quadratic explosion)
      const a = groupA[Math.floor(Math.random() * groupA.length)];
      const b = groupB[Math.floor(Math.random() * groupB.length)];
      const key1 = `${a.sessionId}::${b.sessionId}`;
      const key2 = `${b.sessionId}::${a.sessionId}`;
      const score = scores.get(key1) ?? scores.get(key2);
      if (score !== undefined) {
        labeled.push({
          score,
          isGenuine: false,
          enrollmentSessionId: a.sessionId,
          probeSessionId: b.sessionId,
        });
        impostorCount++;
      }
    }
  }

  return labeled;
}

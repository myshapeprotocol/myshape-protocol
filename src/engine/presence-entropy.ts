// ============================================================
// MyShape Protocol — Presence Entropy Score Engine
// Derived from: Technical Specification v1.0 §3.5
// ============================================================

import type { JointPosition } from "@/types/motion-vector";

// ── §3.5.1 — Micro-timing Variance ──

export function computeMicroTimingVariance(timestamps: number[]): number {
  if (timestamps.length < 4) return 0;
  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    deltas.push(timestamps[i] - timestamps[i - 1]);
  }
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  if (mean === 0) return 0;
  const variance = deltas.reduce((s, d) => s + (d - mean) ** 2, 0) / deltas.length;
  // Coefficient of variation: σ/μ. Real: 0.03–0.30. AI: < 0.01.
  const cv = Math.sqrt(variance) / mean;
  return 1 - Math.exp(-cv / 0.12);
}

// ── §3.5.2 — Noise Residual ──

function movingAverage(signal: number[], window: number): number[] {
  const result: number[] = [];
  const half = Math.floor(window / 2);
  for (let i = 0; i < signal.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - half); j < Math.min(signal.length, i + half + 1); j++) {
      sum += signal[j];
      count++;
    }
    result.push(count > 0 ? sum / count : signal[i]);
  }
  return result;
}

export function computeNoiseResidual(
  frames: Array<Record<number, JointPosition>>,
  jointId: number,
): number {
  if (frames.length < 8) return 0;
  const signal = frames.map(f => f[jointId]?.x ?? 0);

  // Signal standard deviation for adaptive normalization
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const std = Math.sqrt(signal.reduce((s, v) => s + (v - mean) ** 2, 0) / signal.length);
  if (std < 0.1) return 0; // no meaningful signal

  const predicted = movingAverage(signal, 7);
  const residuals = signal.map((s, i) => (s - predicted[i]) ** 2);
  const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length);

  // Noise-to-signal ratio. Real: 0.10–1.0+ (depending on stillness). AI: < 0.02.
  // Use exponential mapping: no hard ceiling, graceful saturation.
  const nsr = rmse / std;
  return 1 - Math.exp(-nsr / 0.25);
}

// ── §3.5.3 — Frequency Entropy ──

export function computeFrequencyEntropy(signal: number[]): number {
  if (signal.length < 16) return 0;
  const N = signal.length;
  const magnitudes: number[] = [];
  for (let k = 0; k < Math.floor(N / 2); k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im += signal[n] * Math.sin(angle);
    }
    magnitudes.push(Math.sqrt(re * re + im * im) / N);
  }
  const total = magnitudes.reduce((a, b) => a + b, 0) || 1;
  const normalized = magnitudes.map(m => m / total);
  const entropy = -normalized.reduce((s, p) => s + (p > 1e-9 ? p * Math.log2(p) : 0), 0);
  const maxEntropy = Math.log2(normalized.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

// ── §3.5.4 — Biological Perturbation Score ──

function discreteJerk(signal: number[]): number[] {
  const jerk: number[] = [];
  for (let i = 3; i < signal.length; i++) {
    jerk.push(signal[i] - 3 * signal[i - 1] + 3 * signal[i - 2] - signal[i - 3]);
  }
  return jerk;
}

export function computeBiologicalPerturbation(
  frames: Array<Record<number, JointPosition>>,
  jointIds: number[],
): number {
  // §3.5.4: Biological perturbation = cross-joint jerk correlation.
  // Real motion: joints jerk together (coordinated by nervous system).
  // AI motion: jerk is either absent (too smooth) or uncorrelated noise.
  if (frames.length < 8 || jointIds.length < 2) return 0;

  // Compute jerk signal for each joint
  const jerkSignals: number[][] = [];
  for (const jid of jointIds) {
    const signal = frames.map(f => f[jid]?.x ?? 0);
    const smoothed = movingAverage(signal, 5);
    const jerk = discreteJerk(smoothed);
    if (jerk.length < 4) continue;
    // Only include joints with meaningful motion
    const range = Math.max(...jerk) - Math.min(...jerk);
    if (range < 0.01) continue;
    jerkSignals.push(jerk);
  }

  if (jerkSignals.length < 2) return 0;

  // Compute pairwise cross-correlations
  let totalCorrelation = 0;
  let pairCount = 0;

  for (let i = 0; i < jerkSignals.length; i++) {
    for (let j = i + 1; j < jerkSignals.length; j++) {
      const a = jerkSignals[i];
      const b = jerkSignals[j];
      const n = Math.min(a.length, b.length);

      const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
      const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
      let cov = 0, varA = 0, varB = 0;
      for (let k = 0; k < n; k++) {
        const da = a[k] - meanA;
        const db = b[k] - meanB;
        cov += da * db;
        varA += da * da;
        varB += db * db;
      }
      if (varA < 1e-7 || varB < 1e-7) continue; // signals too smooth — no meaningful jerk
      const r = cov / Math.sqrt(varA * varB);
      // Real motion: r ≈ 0.3–0.8 (coordinated). AI/unreal: r ≈ 0–0.2.
      totalCorrelation += Math.abs(r);
      pairCount++;
    }
  }

  if (pairCount === 0) return 0;
  const avgCorrelation = totalCorrelation / pairCount;
  // Exponential mapping: r=0→0, r=0.3→0.65, r=0.6→0.92
  return 1 - Math.exp(-avgCorrelation / 0.22);
}

// ── §3.5.5 — Presence Entropy Score (PES) ──

export interface PESComponents {
  microTimingVariance: number;
  noiseResidual: number;
  frequencyEntropy: number;
  biologicalPerturbation: number;
}

export function computePES(components: PESComponents): number {
  // v2 weights — calibrated on n=54 real human samples (2026-07-04)
  // Frequency Entropy removed: FFT on MediaPipe joint signals produces negligible
  // content in 30s windows (mean F=0.065 across 54 real samples).
  // Weights redistributed: μT 0.25 / N 0.30 / B 0.45
  const w = { timing: 0.25, noise: 0.30, frequency: 0.0, biological: 0.45 };
  const raw =
    w.timing * components.microTimingVariance +
    w.noise * components.noiseResidual +
    w.biological * components.biologicalPerturbation;
  return Math.min(Math.max(raw, 0), 1);
}

// ── Full pipeline: frames → PES (§2.4: 1–2s window) ──

const PES_WINDOW_FRAMES = 60; // §2.4 upper bound: 2 seconds at 30fps

export function computeFullPES(
  frames: Array<Record<number, JointPosition>>,
  timestamps: number[],
): { pes: number; components: PESComponents } {
  // Use only the most recent window for PES (spec §2.4)
  const start = Math.max(0, frames.length - PES_WINDOW_FRAMES);
  const windowFrames = frames.slice(start);
  const windowTimestamps = timestamps.slice(start);

  // Use multiple key joints for bio perturbation (shoulders, elbows, wrists)
  const bioJointIds = [3, 4, 5, 6, 7, 8];

  const components: PESComponents = {
    microTimingVariance: computeMicroTimingVariance(windowTimestamps),
    noiseResidual: computeNoiseResidual(windowFrames, 11), // left shoulder
    frequencyEntropy: computeFrequencyEntropy(
      windowFrames.map(f => f[11]?.x ?? 0),
    ),
    biologicalPerturbation: computeBiologicalPerturbation(windowFrames, bioJointIds),
  };

  return { pes: computePES(components), components };
}

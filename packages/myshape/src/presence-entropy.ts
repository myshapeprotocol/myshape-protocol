// ═══════════════════════════════════════════════════════════════════
// EE-001 · Presence Entropy Score (PES) — Pure signal-processing core
//
// 4-dimensional biological noise analysis.
// Detects whether sensor data carries the statistical signature
// of a living entity vs AI-generated synthetic data.
//
// Extracted from src/engine/presence-entropy.ts and adapted for
// the SDK package — no external dependencies, pure functions.
// ═══════════════════════════════════════════════════════════════════

import {
  type ComponentEvidence,
  type EngineEvidence,
  computeStatus,
  computeHint,
} from "./types.js";

// ── Types ──

export interface JointPosition {
  x: number;
  y: number;
  z: number;
}

export interface PESComponents {
  microTimingVariance: number;
  noiseResidual: number;
  frequencyEntropy: number;
  biologicalPerturbation: number;
}

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
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const std = Math.sqrt(signal.reduce((s, v) => s + (v - mean) ** 2, 0) / signal.length);
  if (std < 0.1) return 0;
  const predicted = movingAverage(signal, 7);
  const residuals = signal.map((s, i) => (s - predicted[i]) ** 2);
  const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length);
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
  if (frames.length < 8 || jointIds.length < 2) return 0;
  const jerkSignals: number[][] = [];
  for (const jid of jointIds) {
    const signal = frames.map(f => f[jid]?.x ?? 0);
    const smoothed = movingAverage(signal, 5);
    const jerk = discreteJerk(smoothed);
    if (jerk.length < 4) continue;
    const range = Math.max(...jerk) - Math.min(...jerk);
    if (range < 0.01) continue;
    jerkSignals.push(jerk);
  }
  if (jerkSignals.length < 2) return 0;
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
      if (varA < 1e-7 || varB < 1e-7) continue;
      const r = cov / Math.sqrt(varA * varB);
      totalCorrelation += Math.abs(r);
      pairCount++;
    }
  }
  if (pairCount === 0) return 0;
  const avgCorrelation = totalCorrelation / pairCount;
  return 1 - Math.exp(-avgCorrelation / 0.22);
}

// ── §3.5.5 — Presence Entropy Score (PES) ──

export function computePES(components: PESComponents): number {
  const w = { timing: 0.25, noise: 0.30, frequency: 0.0, biological: 0.45 };
  const raw =
    w.timing * components.microTimingVariance +
    w.noise * components.noiseResidual +
    w.biological * components.biologicalPerturbation;
  return Math.min(Math.max(raw, 0), 1);
}

// ── Full pipeline: frames → PES ──

const PES_WINDOW_FRAMES = 60;

export function computeFullPES(
  frames: Array<Record<number, JointPosition>>,
  timestamps: number[],
): { pes: number; components: PESComponents } {
  const start = Math.max(0, frames.length - PES_WINDOW_FRAMES);
  const windowFrames = frames.slice(start);
  const windowTimestamps = timestamps.slice(start);
  const bioJointIds = [3, 4, 5, 6, 7, 8];
  const components: PESComponents = {
    microTimingVariance: computeMicroTimingVariance(windowTimestamps),
    noiseResidual: computeNoiseResidual(windowFrames, 11),
    frequencyEntropy: computeFrequencyEntropy(
      windowFrames.map(f => f[11]?.x ?? 0),
    ),
    biologicalPerturbation: computeBiologicalPerturbation(windowFrames, bioJointIds),
  };
  return { pes: computePES(components), components };
}

// ── Evidence Builder ──

export function buildPESEvidence(
  pes: number,
  components: PESComponents,
): EngineEvidence {
  const componentList: ComponentEvidence[] = [];
  const diagnostics: string[] = [];

  // Micro-timing Variance
  const mtStatus = computeStatus(components.microTimingVariance, 0.10);
  componentList.push({
    engine: "EE-001",
    metric: "IMU_PES",
    value: components.microTimingVariance,
    threshold: 0.10,
    status: mtStatus,
    explanation: `Micro-timing CV: ${(components.microTimingVariance).toFixed(3)} (need ≥0.10)`,
    hint: computeHint("IMU_PES", mtStatus),
  });

  // Noise Residual
  const nrStatus = computeStatus(components.noiseResidual, 0.15);
  componentList.push({
    engine: "EE-001",
    metric: "Camera_PES",
    value: components.noiseResidual,
    threshold: 0.15,
    status: nrStatus,
    explanation: `Noise-to-signal ratio: ${(components.noiseResidual).toFixed(3)} (need ≥0.15)`,
    hint: computeHint("Camera_PES", nrStatus),
  });

  // Frequency Entropy
  const feStatus = computeStatus(components.frequencyEntropy, 0.05);
  componentList.push({
    engine: "EE-001",
    metric: "FrequencyEntropy",
    value: components.frequencyEntropy,
    threshold: 0.05,
    status: feStatus,
    explanation: `Spectral entropy: ${(components.frequencyEntropy).toFixed(3)} (need ≥0.05)`,
    hint: computeHint("CausalEvidence", feStatus),
  });

  // Biological Perturbation
  const bioStatus = computeStatus(components.biologicalPerturbation, 0.25);
  componentList.push({
    engine: "EE-001",
    metric: "BiologicalPerturbation",
    value: components.biologicalPerturbation,
    threshold: 0.25,
    status: bioStatus,
    explanation: `Cross-joint jerk correlation: ${(components.biologicalPerturbation).toFixed(3)} (need ≥0.25)`,
    hint: computeHint("IMU_Similarity", bioStatus),
  });

  // Aggregate PES
  const pesStatus = computeStatus(pes, 0.40);
  componentList.push({
    engine: "EE-001",
    metric: "PresenceEntropyScore",
    value: pes,
    threshold: 0.40,
    status: pesStatus,
    explanation: `PES aggregate: ${pes.toFixed(3)} (μT×0.25 + N×0.30 + B×0.45)`,
    hint: computeHint("CausalEvidence", pesStatus),
  });

  if (pesStatus === "PASS") diagnostics.push("✓ PES — biological presence detected");
  else if (pesStatus === "FAIL") diagnostics.push("✗ PES — sensor data lacks biological signature");
  else diagnostics.push("⚠ PES — insufficient data for presence determination");

  return {
    engineId: "EE-001",
    timestamp: new Date().toISOString(),
    components: componentList,
    diagnostics,
    confidence: pes,
  };
}
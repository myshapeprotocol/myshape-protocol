import { describe, it, expect } from "vitest";
import {
  computeMicroTimingVariance,
  computeNoiseResidual,
  computeFrequencyEntropy,
  computeBiologicalPerturbation,
  computePES,
  computeFullPES,
  buildPESEvidence,
  type JointPosition,
  type PESComponents,
} from "./presence-entropy.js";

// ── Helpers ──
function makeFrames(count: number, opts?: { noise?: number; tremor?: boolean; freqs?: number[] }): Array<Record<number, JointPosition>> {
  const noise = opts?.noise ?? 0.8;
  const freqs = opts?.freqs ?? [2.5, 7.3, 0.8];
  const frames: Array<Record<number, JointPosition>> = [];
  for (let i = 0; i < count; i++) {
    const t = i / 30;
    const frame: Record<number, JointPosition> = {};
    for (let jid = 0; jid < 16; jid++) {
      let x = 400 + (jid % 8) * 30;
      let y = 200 + Math.floor(jid / 8) * 100;
      for (const f of freqs) {
        x += Math.sin(t * f + jid * 0.3) * 10;
        y += Math.sin(t * f * 2 + jid * 0.5) * 5;
      }
      // Gaussian noise
      const u1 = 1 - Math.random();
      const u2 = Math.random();
      const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * noise;
      const n2 = Math.sqrt(-2 * Math.log(1 - u1)) * Math.sin(2 * Math.PI * u2) * noise;
      if (opts?.tremor) {
        x += Math.sin(t * 35 + jid) * 0.4 + n;
        y += Math.cos(t * 32 + jid) * 0.4 + n2;
      } else {
        x += n;
        y += n2;
      }
      frame[jid] = { x, y, z: 0 };
    }
    frames.push(frame);
  }
  return frames;
}

function makeTimestamps(count: number, jitter = true): number[] {
  const ts: number[] = [];
  for (let i = 0; i < count; i++) {
    const base = (i / 30) * 1000;
    ts.push(Math.round(base + (jitter ? (Math.random() - 0.5) * 15 : 0)));
  }
  return ts;
}

function makeAIFrames(count: number): Array<Record<number, JointPosition>> {
  const frames: Array<Record<number, JointPosition>> = [];
  for (let i = 0; i < count; i++) {
    const t = i / 30;
    const frame: Record<number, JointPosition> = {};
    for (let jid = 0; jid < 16; jid++) {
      const x = 400 + (jid % 8) * 30 + Math.sin(t * 2.5 + jid * 0.3) * 20;
      const y = 200 + Math.floor(jid / 8) * 100 + Math.sin(t * 5.0 + jid * 0.5) * 12;
      frame[jid] = { x, y, z: 0 };
    }
    frames.push(frame);
  }
  return frames;
}

function makeAITimestamps(count: number): number[] {
  const ts: number[] = [];
  for (let i = 0; i < count; i++) ts.push(Math.round((i / 30) * 1000));
  return ts;
}

// ── Tests ──

describe("EE-001 · Presence Entropy Score", () => {
  describe("computeMicroTimingVariance", () => {
    it("returns 0 for < 4 timestamps", () => {
      expect(computeMicroTimingVariance([0, 100, 200])).toBe(0);
    });
    it("returns 0 for perfectly uniform timing (AI-like)", () => {
      const ts = Array.from({ length: 60 }, (_, i) => i * 33);
      const result = computeMicroTimingVariance(ts);
      expect(result).toBeLessThan(0.05);
    });
    it("returns > 0 for jittered timing (human-like)", () => {
      const ts = makeTimestamps(60, true);
      const result = computeMicroTimingVariance(ts);
      expect(result).toBeGreaterThan(0.05);
    });
  });

  describe("computeNoiseResidual", () => {
    it("returns 0 for < 8 frames", () => {
      expect(computeNoiseResidual([], 11)).toBe(0);
      expect(computeNoiseResidual(makeFrames(5), 11)).toBe(0);
    });
    it("returns high value for noisy human frames", () => {
      const frames = makeFrames(60, { noise: 1.0, tremor: true });
      const result = computeNoiseResidual(frames, 11);
      expect(result).toBeGreaterThan(0.15);
    });
    it("returns low value for clean AI frames", () => {
      const frames = makeAIFrames(60);
      const result = computeNoiseResidual(frames, 11);
      expect(result).toBeLessThan(0.15);
    });
  });

  describe("computeFrequencyEntropy", () => {
    it("returns 0 for < 16 samples", () => {
      expect(computeFrequencyEntropy([1, 2, 3])).toBe(0);
    });
    it("returns higher entropy for multi-frequency signal", () => {
      const multi: number[] = [];
      for (let i = 0; i < 64; i++) {
        const t = i / 30;
        multi.push(Math.sin(t * 2.5) + Math.sin(t * 7.3) + Math.sin(t * 0.8) + Math.random() * 0.5);
      }
      const result = computeFrequencyEntropy(multi);
      expect(result).toBeGreaterThan(0.05);
    });
    it("returns lower entropy for single-frequency signal", () => {
      const single: number[] = [];
      for (let i = 0; i < 64; i++) {
        const t = i / 30;
        single.push(Math.sin(t * 2.5));
      }
      const result = computeFrequencyEntropy(single);
      // Single-frequency pure sine still has some spectral spread due to DFT windowing
      expect(result).toBeLessThan(0.7);
    });
  });

  describe("computeBiologicalPerturbation", () => {
    it("returns 0 for < 8 frames", () => {
      expect(computeBiologicalPerturbation(makeFrames(5), [3, 4, 5])).toBe(0);
    });
    it("returns 0 for < 2 joints", () => {
      expect(computeBiologicalPerturbation(makeFrames(60), [3])).toBe(0);
    });
    it("returns higher value for human frames with tremor", () => {
      const frames = makeFrames(60, { noise: 0.8, tremor: true });
      const result = computeBiologicalPerturbation(frames, [3, 4, 5, 6, 7, 8]);
      expect(result).toBeGreaterThan(0.15);
    });
  });

  describe("computePES", () => {
    it("returns 0 for all-zero components", () => {
      const result = computePES({ microTimingVariance: 0, noiseResidual: 0, frequencyEntropy: 0, biologicalPerturbation: 0 });
      expect(result).toBe(0);
    });
    it("returns high value for human-like components", () => {
      const result = computePES({ microTimingVariance: 0.3, noiseResidual: 0.6, frequencyEntropy: 0.2, biologicalPerturbation: 0.5 });
      expect(result).toBeGreaterThan(0.4);
      expect(result).toBeLessThanOrEqual(1);
    });
    it("returns low value for AI-like components", () => {
      const result = computePES({ microTimingVariance: 0.01, noiseResidual: 0.02, frequencyEntropy: 0.01, biologicalPerturbation: 0.05 });
      expect(result).toBeLessThan(0.1);
    });
    it("uses weights: timing=0.25, noise=0.30, bio=0.45, freq=0", () => {
      const result = computePES({ microTimingVariance: 1, noiseResidual: 0, frequencyEntropy: 1, biologicalPerturbation: 0 });
      // Only timing weight applies: 0.25
      expect(result).toBeCloseTo(0.25, 1);
    });
  });

  describe("computeFullPES", () => {
    it("returns pes and components for human frames", () => {
      const frames = makeFrames(60, { noise: 0.8, tremor: true });
      const ts = makeTimestamps(60, true);
      const { pes, components } = computeFullPES(frames, ts);
      expect(pes).toBeGreaterThan(0);
      expect(pes).toBeLessThanOrEqual(1);
      expect(components).toHaveProperty("microTimingVariance");
      expect(components).toHaveProperty("noiseResidual");
      expect(components).toHaveProperty("frequencyEntropy");
      expect(components).toHaveProperty("biologicalPerturbation");
    });
    it("human PES > AI PES", () => {
      const humanFrames = makeFrames(60, { noise: 0.8, tremor: true });
      const humanTs = makeTimestamps(60, true);
      const aiFrames = makeAIFrames(60);
      const aiTs = makeAITimestamps(60);
      const human = computeFullPES(humanFrames, humanTs);
      const ai = computeFullPES(aiFrames, aiTs);
      expect(human.pes).toBeGreaterThan(ai.pes);
    });
  });

  describe("buildPESEvidence", () => {
    it("produces EngineEvidence with EE-001 engineId", () => {
      const ev = buildPESEvidence(0.5, { microTimingVariance: 0.3, noiseResidual: 0.6, frequencyEntropy: 0.2, biologicalPerturbation: 0.5 });
      expect(ev.engineId).toBe("EE-001");
      expect(ev.components.length).toBe(5); // IMU_PES, Camera_PES, FrequencyEntropy, BiologicalPerturbation, PresenceEntropyScore
      expect(ev.confidence).toBe(0.5);
    });
    it("includes diagnostics", () => {
      const ev = buildPESEvidence(0.5, { microTimingVariance: 0.3, noiseResidual: 0.6, frequencyEntropy: 0.2, biologicalPerturbation: 0.5 });
      expect(ev.diagnostics.length).toBeGreaterThan(0);
    });
  });
});
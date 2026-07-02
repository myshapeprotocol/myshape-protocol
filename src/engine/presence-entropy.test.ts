import { describe, it, expect } from "vitest";
import {
  computeMicroTimingVariance,
  computeFrequencyEntropy,
  computePES,
  computeFullPES,
  type PESComponents,
} from "./presence-entropy";
import type { JointPosition } from "@/types/motion-vector";

// ── Micro-Timing Variance (§3.5.1) ──

describe("computeMicroTimingVariance", () => {
  it("returns 0 for too few timestamps", () => {
    expect(computeMicroTimingVariance([1000])).toBe(0);
    expect(computeMicroTimingVariance([1000, 1033, 1066])).toBe(0);
  });

  it("returns low score for perfectly regular (AI-like) timing", () => {
    // Exactly 33ms apart — synthetic regularity
    const timestamps = Array.from({ length: 60 }, (_, i) => i * 33);
    const score = computeMicroTimingVariance(timestamps);
    // AI-like timing → CV close to 0 → score close to 0
    expect(score).toBeLessThan(0.1);
  });

  it("returns higher score for irregular (human-like) timing", () => {
    // Realistic frame intervals with human jitter (28–38ms)
    const base = Array.from({ length: 60 }, (_, i) => i * 33.33);
    const jittered = base.map((t, i) => t + (Math.sin(i * 0.7) * 5 + Math.random() * 3));
    const score = computeMicroTimingVariance(jittered);
    // Human-like CV should produce a non-zero score
    expect(score).toBeGreaterThan(0);
  });

  it("returns bounded result [0, 1]", () => {
    const random = Array.from({ length: 30 }, (_, i) => i * 33 + Math.random() * 20);
    const score = computeMicroTimingVariance(random);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ── Frequency Entropy (§3.5.3) ──

describe("computeFrequencyEntropy", () => {
  it("returns 0 for too few samples", () => {
    expect(computeFrequencyEntropy(Array.from({ length: 10 }, () => 1))).toBe(0);
  });

  it("returns high entropy for noise (human-like broad spectrum)", () => {
    // White noise → flat spectrum → high entropy
    const noise = Array.from({ length: 64 }, () => Math.random() * 2 - 1);
    const entropy = computeFrequencyEntropy(noise);
    expect(entropy).toBeGreaterThan(0.5);
  });

  it("returns low entropy for pure sine (AI-like narrow spectrum)", () => {
    // Pure 2Hz sine → single peak → low entropy
    const sine = Array.from({ length: 64 }, (_, i) => Math.sin(2 * Math.PI * 2 * i / 64));
    const entropy = computeFrequencyEntropy(sine);
    expect(entropy).toBeLessThan(0.5);
  });

  it("returns bounded result [0, 1]", () => {
    const signal = Array.from({ length: 64 }, () => Math.random());
    const entropy = computeFrequencyEntropy(signal);
    expect(entropy).toBeGreaterThanOrEqual(0);
    expect(entropy).toBeLessThanOrEqual(1);
  });
});

// ── PES Aggregate (§3.5.5) ──

describe("computePES", () => {
  it("returns weighted aggregate of four components", () => {
    const components: PESComponents = {
      microTimingVariance: 0.4,
      noiseResidual: 0.6,
      frequencyEntropy: 0.8,
      biologicalPerturbation: 0.3,
    };
    const pes = computePES(components);
    // Weights: timing 20%, noise 25%, frequency 20%, bio 35%
    const expected = 0.4 * 0.2 + 0.6 * 0.25 + 0.8 * 0.2 + 0.3 * 0.35;
    expect(pes).toBeCloseTo(expected, 6);
  });

  it("returns 0 for all-zero components", () => {
    const components: PESComponents = {
      microTimingVariance: 0,
      noiseResidual: 0,
      frequencyEntropy: 0,
      biologicalPerturbation: 0,
    };
    expect(computePES(components)).toBe(0);
  });

  it("returns 1 for all-one components", () => {
    const components: PESComponents = {
      microTimingVariance: 1,
      noiseResidual: 1,
      frequencyEntropy: 1,
      biologicalPerturbation: 1,
    };
    expect(computePES(components)).toBe(1);
  });

  it("is bounded [0, 1]", () => {
    const components: PESComponents = {
      microTimingVariance: 0.75,
      noiseResidual: 0.75,
      frequencyEntropy: 0.75,
      biologicalPerturbation: 0.75,
    };
    const pes = computePES(components);
    expect(pes).toBeGreaterThanOrEqual(0);
    expect(pes).toBeLessThanOrEqual(1);
    expect(pes).toBe(0.75); // equal weights sum to 1
  });
});

// ── Full PES Pipeline (§3.5) ──

describe("computeFullPES", () => {
  function makeFrame(x: number, y: number, z: number): JointPosition {
    return { x, y, z };
  }

  it("returns zero PES for stationary frames", () => {
    const timestamps = Array.from({ length: 30 }, (_, i) => i * 33);
    const frames = timestamps.map(() => {
      const joints: Record<number, JointPosition> = {};
      for (let j = 0; j < 18; j++) {
        joints[j] = makeFrame(320, 240, 0);
      }
      return joints;
    });

    const result = computeFullPES(frames, timestamps);
    // Stationary → no micro-timing variance, zero noise, zero frequency entropy
    expect(result.pes).toBeLessThan(0.15);
    expect(result.components.microTimingVariance).toBeLessThan(0.1);
  });

  it("returns non-zero PES for frames with motion", () => {
    const timestamps = Array.from({ length: 30 }, (_, i) => i * 33 + Math.random() * 8);
    const frames = timestamps.map((_, fi) => {
      const joints: Record<number, JointPosition> = {};
      for (let j = 0; j < 18; j++) {
        // Add sinusoidal motion with phase per joint
        joints[j] = makeFrame(
          320 + Math.sin(fi * 0.3 + j * 0.5) * 15 + Math.random() * 3,
          240 + Math.cos(fi * 0.25 + j * 0.4) * 10 + Math.random() * 3,
          Math.sin(fi * 0.2) * 5 + Math.random() * 2,
        );
      }
      return joints;
    });

    const result = computeFullPES(frames, timestamps);
    // Motion should produce measurable entropy
    expect(result.pes).toBeGreaterThan(0);
    expect(result.pes).toBeLessThanOrEqual(1);
  });

  it("includes all four component scores", () => {
    const timestamps = Array.from({ length: 30 }, (_, i) => i * 33);
    const frames = timestamps.map((_, fi) => {
      const joints: Record<number, JointPosition> = {};
      for (let j = 0; j < 18; j++) {
        joints[j] = makeFrame(
          320 + Math.sin(fi * 0.3 + j) * 10,
          240 + Math.cos(fi * 0.3 + j) * 10,
          Math.sin(fi * 0.2) * 5,
        );
      }
      return joints;
    });

    const result = computeFullPES(frames, timestamps);
    expect(typeof result.components.microTimingVariance).toBe("number");
    expect(typeof result.components.noiseResidual).toBe("number");
    expect(typeof result.components.frequencyEntropy).toBe("number");
    expect(typeof result.components.biologicalPerturbation).toBe("number");
  });
});

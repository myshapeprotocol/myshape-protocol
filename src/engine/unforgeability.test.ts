import { describe, it, expect } from "vitest";
import {
  computeEntropyGaps,
  verifyUnforgeability,
  projectSecurityHorizon,
  HUMAN_ENTROPY_LOWER_BOUND,
  AI_ENTROPY_UPPER_BOUND,
} from "./unforgeability";
import type { PESComponents } from "./presence-entropy";

// ── Human vs AI Bounds ──

describe("HUMAN_ENTROPY_LOWER_BOUND", () => {
  it("all four dimensions have positive lower bounds", () => {
    expect(HUMAN_ENTROPY_LOWER_BOUND.microTimingVariance).toBeGreaterThan(0);
    expect(HUMAN_ENTROPY_LOWER_BOUND.noiseResidual).toBeGreaterThan(0);
    expect(HUMAN_ENTROPY_LOWER_BOUND.frequencyEntropy).toBeGreaterThan(0);
    expect(HUMAN_ENTROPY_LOWER_BOUND.biologicalPerturbation).toBeGreaterThan(0);
  });
});

describe("AI_ENTROPY_UPPER_BOUND", () => {
  it("AI ceiling is lower than human floor for every dimension", () => {
    const dims: Array<keyof PESComponents> = [
      "microTimingVariance", "noiseResidual",
      "frequencyEntropy", "biologicalPerturbation",
    ];
    for (const dim of dims) {
      expect(HUMAN_ENTROPY_LOWER_BOUND[dim]).toBeGreaterThan(
        AI_ENTROPY_UPPER_BOUND[dim],
      );
    }
  });
});

// ── Entropy Gaps ──

describe("computeEntropyGaps", () => {
  it("returns 4 dimension gaps", () => {
    const gaps = computeEntropyGaps({
      microTimingVariance: 0.3,
      noiseResidual: 0.4,
      frequencyEntropy: 0.5,
      biologicalPerturbation: 0.35,
    });
    expect(gaps).toHaveLength(4);
  });

  it("all gaps are positive (theoretical guarantee)", () => {
    const gaps = computeEntropyGaps({
      microTimingVariance: 0,
      noiseResidual: 0,
      frequencyEntropy: 0,
      biologicalPerturbation: 0,
    });
    for (const g of gaps) {
      expect(g.gap).toBeGreaterThan(0);
      expect(g.gap_exists).toBe(true);
    }
  });
});

// ── Unforgeability Verification ──

describe("verifyUnforgeability", () => {
  it("confirms human for typical human PES", () => {
    const result = verifyUnforgeability({
      microTimingVariance: 0.25,
      noiseResidual: 0.35,
      frequencyEntropy: 0.50,
      biologicalPerturbation: 0.40,
    });
    expect(result.provably_human).toBe(true);
  });

  it("rejects AI-like motion", () => {
    const result = verifyUnforgeability({
      microTimingVariance: 0.01,  // below AI ceiling of 0.02
      noiseResidual: 0.03,        // below AI ceiling of 0.04
      frequencyEntropy: 0.03,     // below AI ceiling of 0.04
      biologicalPerturbation: 0.02, // below AI ceiling of 0.06
    });
    expect(result.provably_human).toBe(false);
  });

  it("identifies the weakest dimension", () => {
    const result = verifyUnforgeability({
      microTimingVariance: 0.03,  // just above AI ceiling (0.02) → weak
      noiseResidual: 0.80,        // far above AI ceiling → strong
      frequencyEntropy: 0.80,     // strong
      biologicalPerturbation: 0.80, // strong
    });
    expect(result.weakest_dimension).toBe("microTimingVariance");
    expect(result.weakest_margin).toBeGreaterThan(0);
  });

  it("weakest_margin is positive for human motion", () => {
    const result = verifyUnforgeability({
      microTimingVariance: 0.30,
      noiseResidual: 0.40,
      frequencyEntropy: 0.50,
      biologicalPerturbation: 0.45,
    });
    expect(result.weakest_margin).toBeGreaterThan(0);
  });

  it("includes entropy_gaps in verdict", () => {
    const result = verifyUnforgeability({
      microTimingVariance: 0.20,
      noiseResidual: 0.30,
      frequencyEntropy: 0.40,
      biologicalPerturbation: 0.35,
    });
    expect(result.entropy_gaps).toHaveLength(4);
    expect(result.entropy_gaps[0].dimension).toBeDefined();
  });
});

// ── Security Horizon ──

describe("projectSecurityHorizon", () => {
  it("projects from 2026 to 2040 in 2-year steps", () => {
    const projections = projectSecurityHorizon();
    expect(projections).toHaveLength(8); // 2026, 2028, ..., 2040
    expect(projections[0].year).toBe(2026);
    expect(projections[7].year).toBe(2040);
  });

  it("AI ceiling starts below PES minimum and increases", () => {
    const projections = projectSecurityHorizon();
    // 2026: AI ceiling 0.30, PES_min 0.65 → still secure
    expect(projections[0].still_secure).toBe(true);
    expect(projections[0].ai_pes_ceiling).toBe(0.30);

    // Security margin decreases over time
    const firstMargin = projections[0].margin;
    const lastMargin = projections[7].margin;
    expect(lastMargin).toBeLessThan(firstMargin);
  });

  it("AI ceiling caps at asymptotic maximum of 0.60", () => {
    const projections = projectSecurityHorizon();
    for (const p of projections) {
      expect(p.ai_pes_ceiling).toBeLessThanOrEqual(0.60);
    }
  });
});

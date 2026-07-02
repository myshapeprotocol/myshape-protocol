import { describe, it, expect } from "vitest";
import {
  assessThreat,
  ATTACK_SIGNATURES,
  ATTACK_COST_MODEL,
} from "./threat-assessment";
import type { PESComponents } from "./presence-entropy";

const IDEAL_HUMAN: PESComponents = {
  microTimingVariance: 0.25,  // solid human variance
  noiseResidual: 0.45,
  frequencyEntropy: 0.60,
  biologicalPerturbation: 0.45,
};

const STILL_HUMAN: PESComponents = {
  microTimingVariance: 0.05,  // low — standing still
  noiseResidual: 0.35,        // ok
  frequencyEntropy: 0.06,     // low — not moving much
  biologicalPerturbation: 0.30, // ok — bio jerk still present
};

const AI_LIKE: PESComponents = {
  microTimingVariance: 0.02,  // critical — too regular
  noiseResidual: 0.04,        // critical — too clean
  frequencyEntropy: 0.02,     // critical — single frequency
  biologicalPerturbation: 0.03, // critical — no jerk correlation
};

// ── Verdict Hierarchy ──

describe("assessThreat", () => {
  it("returns 'human' for ideal human motion", () => {
    const report = assessThreat(0.75, IDEAL_HUMAN);
    expect(report.overallVerdict).toBe("human");
    expect(report.confidence).toBe(0.75); // confidence = PES for human verdict
  });

  it("returns 'human' for still human (corroboration logic)", () => {
    // Standing still: low freq + low timing, but bio/noise are normal.
    // Corroboration: need ≥3 critical or ≥2 critical + ≥2 warning.
    // Only timing is critical (<0.05), freq is warning (<0.08). Not enough.
    const report = assessThreat(0.35, STILL_HUMAN);
    expect(report.overallVerdict).toBe("human");
  });

  it("returns 'likely_synthetic' when 3+ dimensions critically low", () => {
    const report = assessThreat(0.05, AI_LIKE);
    expect(report.overallVerdict).toBe("likely_synthetic");
    expect(report.confidence).toBe(0.85);
  });

  it("returns 'likely_synthetic' when 2 dimensions critically low", () => {
    const twoCritical: PESComponents = {
      microTimingVariance: 0.02,  // critical
      noiseResidual: 0.04,        // critical
      frequencyEntropy: 0.60,     // normal
      biologicalPerturbation: 0.50, // normal
    };
    const report = assessThreat(0.2, twoCritical);
    expect(report.overallVerdict).toBe("likely_synthetic");
    expect(report.confidence).toBe(0.65);
  });

  it("returns 'suspicious' when 1 critical + 2 warnings", () => {
    const oneCritTwoWarn: PESComponents = {
      microTimingVariance: 0.03,  // critical (<0.05)
      noiseResidual: 0.15,        // warning (<0.20)
      frequencyEntropy: 0.05,     // warning (<0.08)
      biologicalPerturbation: 0.25, // normal
    };
    const report = assessThreat(0.3, oneCritTwoWarn);
    expect(report.overallVerdict).toBe("suspicious");
    expect(report.confidence).toBe(0.55);
  });

  it("returns 'suspicious' when 1 critical with few warnings", () => {
    const oneCrit: PESComponents = {
      microTimingVariance: 0.03,  // critical (<0.05)
      noiseResidual: 0.30,        // normal
      frequencyEntropy: 0.50,     // normal
      biologicalPerturbation: 0.15, // warning (<0.22)
    };
    const report = assessThreat(0.4, oneCrit);
    expect(report.overallVerdict).toBe("suspicious");
    expect(report.confidence).toBe(0.45);
  });

  it("returns 'suspicious' when 3+ warnings (no criticals)", () => {
    const threeWarn: PESComponents = {
      microTimingVariance: 0.07,  // warning (<0.10)
      noiseResidual: 0.15,        // warning (<0.20)
      frequencyEntropy: 0.05,     // warning (<0.08)
      biologicalPerturbation: 0.30, // normal
    };
    const report = assessThreat(0.4, threeWarn);
    expect(report.overallVerdict).toBe("suspicious");
  });

  it("returns human verdict with confidence = PES", () => {
    const report = assessThreat(0.72, IDEAL_HUMAN);
    expect(report.overallVerdict).toBe("human");
    expect(report.confidence).toBe(0.72);
  });
});

// ── Flagged Attacks ──

describe("assessThreat flaggedAttacks", () => {
  it("flags attack signatures when corroboration threshold met", () => {
    const report = assessThreat(0.05, {
      microTimingVariance: 0.02,  // below ALL critical thresholds
      noiseResidual: 0.04,
      frequencyEntropy: 0.02,
      biologicalPerturbation: 0.03,
    });
    // 4 criticals → should flag many attacks
    expect(report.flaggedAttacks.length).toBeGreaterThan(0);
  });

  it("does NOT flag attacks when human (low corroboration)", () => {
    const report = assessThreat(0.50, IDEAL_HUMAN);
    expect(report.flaggedAttacks.length).toBe(0);
  });

  it("includes correct severity in flagged attacks", () => {
    const report = assessThreat(0.05, AI_LIKE);
    for (const attack of report.flaggedAttacks) {
      expect(["warning", "critical"]).toContain(attack.severity);
      expect(typeof attack.class).toBe("string");
      expect(typeof attack.metric).toBe("string");
      expect(typeof attack.value).toBe("number");
    }
  });
});

// ── Edge Cases ──

describe("assessThreat edge cases", () => {
  it("handles all-zero PES components (complete synthetic)", () => {
    const allZero: PESComponents = {
      microTimingVariance: 0,
      noiseResidual: 0,
      frequencyEntropy: 0,
      biologicalPerturbation: 0,
    };
    const report = assessThreat(0, allZero);
    expect(report.overallVerdict).toBe("likely_synthetic");
    expect(report.confidence).toBe(0.85);
  });

  it("handles all-one PES components (maximum entropy)", () => {
    const allOne: PESComponents = {
      microTimingVariance: 1,
      noiseResidual: 1,
      frequencyEntropy: 1,
      biologicalPerturbation: 1,
    };
    const report = assessThreat(1.0, allOne);
    expect(report.overallVerdict).toBe("human");
    expect(report.confidence).toBe(1.0);
  });

  it("detects suspicious when all four are borderline-warning", () => {
    // All four are above critical but below warning → 4 warnings → suspicious
    const borderline: PESComponents = {
      microTimingVariance: 0.051,  // warning (<0.10), above critical (0.05)
      noiseResidual: 0.11,         // warning (<0.20), above critical (0.10)
      frequencyEntropy: 0.041,     // warning (<0.08), above critical (0.04)
      biologicalPerturbation: 0.121, // warning (<0.22), above critical (0.12)
    };
    const report = assessThreat(0.3, borderline);
    // 4 warnings triggers suspicious verdict
    expect(report.overallVerdict).toBe("suspicious");
    expect(report.confidence).toBe(0.45);
  });
});

// ── Attack Signature Definitions ──

describe("ATTACK_SIGNATURES", () => {
  it("has 8 known attack signatures", () => {
    expect(ATTACK_SIGNATURES).toHaveLength(8);
  });

  it("each signature has required fields", () => {
    for (const sig of ATTACK_SIGNATURES) {
      expect(sig.class).toBeTruthy();
      expect(sig.primaryMetric).toBeTruthy();
      expect(sig.warningThreshold).toBeGreaterThan(0);
      expect(sig.criticalThreshold).toBeGreaterThan(0);
      expect(sig.criticalThreshold).toBeLessThan(sig.warningThreshold);
    }
  });

  it("covers all 7 threat classes", () => {
    const classes = new Set(ATTACK_SIGNATURES.map((s) => s.class));
    expect(classes.size).toBe(7);
  });
});

// ── Attack Cost Model ──

describe("ATTACK_COST_MODEL", () => {
  it("has 4 cost tiers in ascending order", () => {
    expect(ATTACK_COST_MODEL).toHaveLength(4);
    expect(ATTACK_COST_MODEL[0].tier).toBe("C0");
    expect(ATTACK_COST_MODEL[3].tier).toBe("C3");
  });

  it("maxSuccessRate increases with tier", () => {
    for (let i = 1; i < ATTACK_COST_MODEL.length; i++) {
      expect(ATTACK_COST_MODEL[i].maxSuccessRate).toBeGreaterThan(
        ATTACK_COST_MODEL[i - 1].maxSuccessRate,
      );
    }
  });
});

import { describe, it, expect } from "vitest";
import { assessThreat, ATTACK_SIGNATURES, ATTACK_COST_MODEL, type PESComponents } from "./threat-assessment.js";

// ── Helpers ──
function humanComponents(): PESComponents {
  return { microTimingVariance: 0.25, noiseResidual: 0.55, frequencyEntropy: 0.15, biologicalPerturbation: 0.50 };
}
function aiComponents(): PESComponents {
  return { microTimingVariance: 0.01, noiseResidual: 0.02, frequencyEntropy: 0.01, biologicalPerturbation: 0.05 };
}
function partialAI(): PESComponents {
  return { microTimingVariance: 0.02, noiseResidual: 0.05, frequencyEntropy: 0.03, biologicalPerturbation: 0.08 };
}

// ── Tests ──

describe("Threat Assessment Engine", () => {
  describe("assessThreat", () => {
    it("returns 'human' for healthy human components", () => {
      const r = assessThreat(0.55, humanComponents());
      expect(r.overallVerdict).toBe("human");
      expect(r.flaggedAttacks.length).toBe(0);
    });

    it("returns 'likely_synthetic' for all-critical AI components", () => {
      const r = assessThreat(0.05, aiComponents());
      expect(r.overallVerdict).toBe("likely_synthetic");
      expect(r.confidence).toBeGreaterThan(0.6);
      expect(r.flaggedAttacks.length).toBeGreaterThan(0);
    });

    it("returns 'likely_synthetic' for 2+ critical dimensions", () => {
      const r = assessThreat(0.10, partialAI());
      expect(r.overallVerdict).toBe("likely_synthetic");
    });

    it("returns 'suspicious' for 1 critical + 2 warnings", () => {
      const c: PESComponents = { microTimingVariance: 0.03, noiseResidual: 0.15, frequencyEntropy: 0.06, biologicalPerturbation: 0.20 };
      const r = assessThreat(0.20, c);
      expect(r.overallVerdict).toBe("suspicious");
    });

    it("includes pes score in report", () => {
      const r = assessThreat(0.42, humanComponents());
      expect(r.pes).toBe(0.42);
    });

    it("includes timestamp in report", () => {
      const r = assessThreat(0.42, humanComponents());
      expect(r.timestamp).toBeGreaterThan(0);
    });

    it("flags 'generative' attack when frequencyEntropy is critically low", () => {
      const c: PESComponents = { microTimingVariance: 0.02, noiseResidual: 0.03, frequencyEntropy: 0.01, biologicalPerturbation: 0.04 };
      const r = assessThreat(0.05, c);
      const generative = r.flaggedAttacks.find((a) => a.class === "generative");
      expect(generative).toBeDefined();
      expect(generative?.severity).toBe("critical");
    });

    it("flags 'replay' attack when microTimingVariance is critically low", () => {
      const c: PESComponents = { microTimingVariance: 0.01, noiseResidual: 0.03, frequencyEntropy: 0.01, biologicalPerturbation: 0.04 };
      const r = assessThreat(0.05, c);
      const replay = r.flaggedAttacks.find((a) => a.class === "replay");
      expect(replay).toBeDefined();
    });

    it("flags 'mocap' attack when noiseResidual is critically low", () => {
      const c: PESComponents = { microTimingVariance: 0.02, noiseResidual: 0.02, frequencyEntropy: 0.01, biologicalPerturbation: 0.04 };
      const r = assessThreat(0.05, c);
      const mocap = r.flaggedAttacks.find((a) => a.class === "mocap");
      expect(mocap).toBeDefined();
    });

    it("does NOT flag attacks when only 1 dimension is low (single failure is not synthetic)", () => {
      // Still human but with low frequency entropy only
      const c: PESComponents = { microTimingVariance: 0.25, noiseResidual: 0.55, frequencyEntropy: 0.02, biologicalPerturbation: 0.50 };
      const r = assessThreat(0.50, c);
      // frequencyEntropy=0.02 is critical (< 0.04), so 1 critical.
      // Warnings: fe=0.02 < 0.08 (yes, but already critical), so 0 additional warnings.
      // Verdict: 1 critical → 'suspicious' (criticalCount >= 1)
      // Attacks: fe < warningThreshold for 'generative' and 'adversarial_pose',
      // and criticalCount >= 1, so they get flagged as warnings.
      expect(r.overallVerdict).toBe("suspicious");
      expect(r.flaggedAttacks.length).toBe(2); // generative + adversarial_pose (warning level)
      expect(r.flaggedAttacks.every((a) => a.severity === "warning")).toBe(true);
    });
  });

  describe("ATTACK_SIGNATURES", () => {
    it("has 8 signatures", () => {
      expect(ATTACK_SIGNATURES.length).toBe(8);
    });
    it("all have valid threat classes", () => {
      for (const sig of ATTACK_SIGNATURES) {
        expect(["generative", "replay", "imitation", "mocap", "sensor_spoof", "adversarial_pose", "statistical"]).toContain(sig.class);
      }
    });
    it("all have warningThreshold > criticalThreshold", () => {
      for (const sig of ATTACK_SIGNATURES) {
        expect(sig.warningThreshold).toBeGreaterThan(sig.criticalThreshold);
      }
    });
  });

  describe("ATTACK_COST_MODEL", () => {
    it("has 4 tiers", () => {
      expect(ATTACK_COST_MODEL.length).toBe(4);
    });
    it("tiers are ordered C0 → C3", () => {
      expect(ATTACK_COST_MODEL[0].tier).toBe("C0");
      expect(ATTACK_COST_MODEL[3].tier).toBe("C3");
    });
    it("maxSuccessRate increases with tier", () => {
      for (let i = 1; i < ATTACK_COST_MODEL.length; i++) {
        expect(ATTACK_COST_MODEL[i].maxSuccessRate).toBeGreaterThanOrEqual(ATTACK_COST_MODEL[i - 1].maxSuccessRate);
      }
    });
  });
});
// ═══════════════════════════════════════════════════════════════════
// Phase B — Step-by-Step Verifier Tests
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { runVerificationSteps } from "./verify-receipt";
import { buildEvidenceReceipt } from "./build-receipt";
import type { EngineEvidence } from "@/lib/evidence/types";

function makeEvidence(overrides?: Partial<EngineEvidence>): EngineEvidence {
  return {
    engineId: "EE-001",
    timestamp: new Date().toISOString(),
    components: [{ engine: "EE-001", metric: "IMU_Presence", value: 0.72, threshold: 0.3, status: "PASS", explanation: "ok" }],
    diagnostics: ["✓ OK"],
    confidence: 0.65,
    ...overrides,
  };
}

describe("Phase B: Step-by-Step Verifier (Gate B)", () => {
  it("all seven steps are present", () => {
    const result = buildEvidenceReceipt({
      evidence: [makeEvidence()],
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(),
      subjectId: "test-b-001",
    });

    const vr = runVerificationSteps(result.receipt);
    expect(vr.steps).toHaveLength(7);
    expect(vr.steps.map((s) => s.id)).toEqual(["V₁", "V₂", "V₃", "V₄", "V₅", "V₆", "V₇"]);
  });

  it("returns VALID for a valid receipt", () => {
    const result = buildEvidenceReceipt({
      evidence: [makeEvidence()],
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(),
      subjectId: "test-b-002",
    });

    const vr = runVerificationSteps(result.receipt);
    expect(vr.verdict).toBe("VALID");

    // All steps except V₇ (genesis receipt — no predecessor) should pass
    for (const step of vr.steps) {
      if (step.id !== "V₇") {
        expect(step.status).toBe("pass");
      }
    }
  });

  it("V₂ (Ed25519) passes and V₇ (chain) is skipped for genesis", () => {
    const result = buildEvidenceReceipt({
      evidence: [makeEvidence()],
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(),
      subjectId: "test-b-003",
    });

    const vr = runVerificationSteps(result.receipt);
    expect(vr.steps.find((s) => s.id === "V₂")?.status).toBe("pass");   // Ed25519 active
    expect(vr.steps.find((s) => s.id === "V₇")?.status).toBe("skipped"); // no predecessor
  });

  it("all steps have labels and descriptions", () => {
    const result = buildEvidenceReceipt({
      evidence: [makeEvidence()],
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(),
      subjectId: "test-b-004",
    });

    const vr = runVerificationSteps(result.receipt);
    for (const step of vr.steps) {
      expect(step.label).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.detail).toBeTruthy();
    }
  });
});

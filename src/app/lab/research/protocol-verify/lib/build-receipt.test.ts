// ═══════════════════════════════════════════════════════════════════
// Phase A — Receipt Builder Test
//
// Gate A: Receipt must be:
//  1. Schema-valid (passes V₁)
//  2. Downloadable as JSON
//  3. Independently verifiable (Reference Verifier returns VALID)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildEvidenceReceipt } from "./build-receipt";
import { verifyReceipt, verifySchema, verifyEvidenceIntegrity, type ContinuityReceipt } from "@/lib/evidence/cps0001";
import type { EngineEvidence } from "@/lib/evidence/types";

function makeEngineEvidence(overrides?: Partial<EngineEvidence>): EngineEvidence {
  return {
    engineId: "EE-001",
    timestamp: new Date().toISOString(),
    components: [{
      engine: "EE-001",
      metric: "IMU_Presence",
      value: 0.72,
      threshold: 0.3,
      status: "PASS",
      explanation: "density 5.2/s rate 62.5/s",
    }],
    diagnostics: ["✓ Passive Evidence — IMU presence 62 samples/s"],
    confidence: 0.65,
    evidenceDigest: undefined,
    ...overrides,
  };
}

describe("Phase A: Receipt Builder (Gate A)", () => {
  it("produces a valid receipt from single evidence block", () => {
    const start = new Date(Date.now() - 60000);
    const end = new Date();

    const result = buildEvidenceReceipt({
      evidence: [makeEngineEvidence()],
      startTime: start,
      endTime: end,
      subjectId: "test-subject-001",
    });

    // Must pass V₁ schema
    expect(verifySchema(result.receipt as ContinuityReceipt)).toBeNull();

    // Must pass V₅ evidence integrity
    expect(verifyEvidenceIntegrity(result.receipt as ContinuityReceipt)).toBeNull();

    // Full verification must succeed
    expect(result.verification.status).toBe("VALID");

    // Receipt must be serializable JSON
    const json = JSON.stringify(result.receipt);
    const parsed = JSON.parse(json);
    expect(parsed.receiptId).toBe(result.receipt.receiptId);
    expect(parsed.protocolVersion).toBe("1.0");
  });

  it("produces a valid receipt from dual-engine evidence", () => {
    const start = new Date(Date.now() - 120000);
    const end = new Date();

    const result = buildEvidenceReceipt({
      evidence: [
        makeEngineEvidence({ engineId: "EE-001" }),
        makeEngineEvidence({
          engineId: "EE-003",
          components: [{
            engine: "EE-003",
            metric: "ChallengeResponse",
            value: 0.81,
            threshold: 0.5,
            status: "PASS",
            explanation: "3/3 rounds matched",
          }],
          diagnostics: ["✓ Gyroscope challenge passed"],
          confidence: 0.81,
        }),
      ],
      startTime: start,
      endTime: end,
      subjectId: "test-subject-002",
    });

    expect(verifySchema(result.receipt as ContinuityReceipt)).toBeNull();
    expect(verifyEvidenceIntegrity(result.receipt as ContinuityReceipt)).toBeNull();
    expect(result.verification.status).toBe("VALID");

    // Must have both evidence blocks
    expect(result.receipt.evidence).toHaveLength(2);

    // interval must be reasonable
    expect(result.receipt.interval.coverageMs).toBeGreaterThan(0);
    expect(result.receipt.interval.coverageMs).toBeLessThan(300000); // 5 min max
  });

  it("produces deterministic interval from wall-clock times", () => {
    const start = new Date("2026-12-01T10:00:00.000Z");
    const end = new Date("2026-12-01T10:00:08.000Z");

    const result = buildEvidenceReceipt({
      evidence: [makeEngineEvidence()],
      startTime: start,
      endTime: end,
      subjectId: "test-subject-003",
    });

    expect(result.receipt.interval.start).toBe("2026-12-01T10:00:00.000Z");
    expect(result.receipt.interval.end).toBe("2026-12-01T10:00:08.000Z");
    expect(result.receipt.interval.coverageMs).toBe(8000);
  });

  it("receipt is JSON-serializable and parseable", () => {
    const start = new Date(Date.now() - 30000);
    const end = new Date();

    const result = buildEvidenceReceipt({
      evidence: [makeEngineEvidence()],
      startTime: start,
      endTime: end,
      subjectId: "test-subject-004",
    });

    const json = JSON.stringify(result.receipt);
    const parsed = JSON.parse(json);

    // All required fields survive JSON round-trip
    expect(parsed.protocolVersion).toBe("1.0");
    expect(parsed.receiptId).toBeTruthy();
    expect(parsed.interval).toBeTruthy();
    expect(parsed.subject).toBeTruthy();
    expect(parsed.evidence).toHaveLength(1);
    expect(parsed.assertions).toBeTruthy();
    expect(parsed.issuer).toBeTruthy();
    expect(parsed.signature).toBeTruthy();
    expect(parsed.previousReceiptHash).toBeNull();
    expect(Array.isArray(parsed.references)).toBe(true);
  });

  it("does NOT make business decisions (no verdict)", () => {
    const start = new Date(Date.now() - 30000);
    const end = new Date();

    const result = buildEvidenceReceipt({
      evidence: [makeEngineEvidence()],
      startTime: start,
      endTime: end,
      subjectId: "test-subject-005",
    });

    // Builder must not assign verdict — that's a business decision
    expect(result.receipt.verdict).toBeUndefined();
  });
});

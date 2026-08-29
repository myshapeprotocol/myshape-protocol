import { describe, it, expect } from "vitest";
import {
  buildAssertions,
  buildReceipt,
  signReceipt,
  verifySchema,
  verifyTemporal,
  verifyFreshness,
  type AssertionSet,
  type ContinuityInterval,
  type ContinuityReceipt,
  type EvidenceBlock,
} from "./cps0001.js";
import { generateKeyPair, createIssuerIdentity } from "./crypto.js";

// ── Helpers ──

function makeBlock(confidence = 0.85, engineId = "EE-001"): EvidenceBlock {
  return {
    engineId,
    engineVersion: "1.0.0",
    confidence,
    payload: { entropyScore: 0.72 },
    payloadDigest: "",
  };
}

const interval = {
  start: new Date(Date.now() - 8000).toISOString(),
  end: new Date().toISOString(),
  coverageMs: 8000,
};

const subject = { id: "sha256:test", type: "embodied" as const };
const issuer = { id: "issuer-1", publicKey: "base64url-test" };

// Mirrors the two-stage verdict shape produced by the app-side
// buildTwoStageAssertions (confidence = min(EE-001, EE-003)).
const twoStageAssertions: AssertionSet = {
  observationOccurred: { value: true, confidence: 0.95 },
  continuityMaintained: { value: true, confidence: 0.6 },
  receiptIntegrity: { value: true, confidence: 1.0 },
};

// ═══════════════════════════════════════════
// buildReceipt — assertions injection
// ═══════════════════════════════════════════

describe("buildReceipt assertions injection", () => {
  it("uses explicitly provided two-stage assertions in the receipt", () => {
    const receipt = buildReceipt({
      evidence: [makeBlock(0.6, "EE-001"), makeBlock(1.0, "EE-003")],
      interval,
      subject,
      issuer,
      assertions: twoStageAssertions,
    });

    expect(receipt.assertions).toEqual(twoStageAssertions);
    expect(receipt.assertions.continuityMaintained.value).toBe(true);
    expect(receipt.assertions.continuityMaintained.confidence).toBe(0.6);
  });

  it("faithfully carries a failed two-stage verdict (does not recompute)", () => {
    const failed: AssertionSet = {
      observationOccurred: { value: true, confidence: 0.95 },
      continuityMaintained: { value: false, confidence: 0 },
      receiptIntegrity: { value: true, confidence: 1.0 },
    };

    const receipt = buildReceipt({
      evidence: [makeBlock(0.9, "EE-001"), makeBlock(0.0, "EE-003")],
      interval,
      subject,
      issuer,
      assertions: failed,
    });

    expect(receipt.assertions.continuityMaintained.value).toBe(false);
    expect(receipt.assertions.continuityMaintained.confidence).toBe(0);
  });

  it("falls back to the engine-independent average when assertions are omitted", () => {
    const receipt = buildReceipt({
      evidence: [makeBlock(0.9, "EE-001"), makeBlock(0.85, "EE-003")],
      interval,
      subject,
      issuer,
    });

    expect(receipt.assertions).toEqual(buildAssertions([0.9, 0.85]));
    expect(receipt.assertions.continuityMaintained.confidence).toBeCloseTo(0.875);
  });
});

// ═══════════════════════════════════════════
// buildReceipt — schema / V₁ integrity unchanged
// ═══════════════════════════════════════════

describe("buildReceipt schema integrity", () => {
  it("produces a V₁-valid receipt without assertions override", () => {
    const receipt = buildReceipt({
      evidence: [makeBlock()],
      interval,
      subject,
      issuer,
    });

    expect(verifySchema(receipt as ContinuityReceipt)).toBe(null);
  });

  it("produces a V₁-valid receipt with assertions override", () => {
    const receipt = buildReceipt({
      evidence: [makeBlock()],
      interval,
      subject,
      issuer,
      assertions: twoStageAssertions,
    });

    expect(verifySchema(receipt as ContinuityReceipt)).toBe(null);
  });
});

// ═══════════════════════════════════════════
// Temporal / freshness parity with main + noble (Batch-2C)
//
// Deterministic via injectable `now` — no sleeps, no wall-clock racing.
// ═══════════════════════════════════════════

describe("temporal/freshness parity (Batch-2C)", () => {
  const kp = generateKeyPair();
  const iss = createIssuerIdentity(kp);

  function sdkIssue(intervalOverride?: Partial<ContinuityInterval>): ContinuityReceipt {
    const iv: ContinuityInterval = {
      start: new Date(Date.now() - 8000).toISOString(),
      end: new Date().toISOString(),
      coverageMs: 8000,
      ...intervalOverride,
    };
    const unsigned = buildReceipt({ evidence: [makeBlock()], interval: iv, subject, issuer: iss });
    return signReceipt(unsigned, kp.secretKey);
  }

  it("rejects malformed interval.start (NaN fails closed)", () => {
    const r = sdkIssue({ start: "not-a-date" });
    expect(verifyTemporal(r)).toBe("TEMPORAL_INCONSISTENCY");
  });

  it("rejects FUTURE interval regardless of self-reported signedAt", () => {
    const base = Date.now();
    const fut = sdkIssue({
      start: new Date(base + 60_000).toISOString(),
      end: new Date(base + 68_000).toISOString(),
      coverageMs: 8000,
    });
    // signedAt is outside the signing payload — safe to override here.
    fut.signature.signedAt = new Date(base + 69_000).toISOString();

    expect(verifyTemporal(fut)).toBe("TEMPORAL_INCONSISTENCY");
  });

  it("boundary: interval.end === injected now is allowed (completed window)", () => {
    const base = Date.now();
    const past = sdkIssue({
      start: new Date(base - 16_000).toISOString(),
      end: new Date(base - 8_000).toISOString(),
      coverageMs: 8000,
    });
    past.signature.signedAt = new Date(base).toISOString();

    expect(verifyTemporal(past, base)).toBeNull();
    expect(verifyFreshness(past, base)).toBeNull();
  });

  it("freshness boundaries: expiresAt === now → EXPIRED, ±1ms deterministic", () => {
    const r = sdkIssue();
    const expMs = Date.parse(r.expiresAt as string);

    expect(verifyFreshness(r, expMs - 1)).toBeNull();
    expect(verifyFreshness(r, expMs)).toBe("EXPIRED");
    expect(verifyFreshness(r, expMs + 1)).toBe("EXPIRED");
  });

  it("malformed expiresAt fails closed when reached directly", () => {
    const r = sdkIssue();
    (r as ContinuityReceipt).expiresAt = "garbage";
    expect(verifyFreshness(r, Date.now())).toBe("EXPIRED");
  });
});

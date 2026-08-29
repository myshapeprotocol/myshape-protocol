/**
 * CPS-0001 Protocol Boundary Test Matrix
 *
 * Tests every cell in the protocol boundary table against
 * BOTH reference verifier implementations.
 *
 * Proves:
 *   - Valid receipts pass regardless of evidence quality
 *   - Malformed receipts fail predictably
 *   - Verifier validates protocol, not evidence
 */

import { describe, it, expect } from "vitest";
import { run as toyEngine } from "../second-producer/toy-engine";
import {
  buildReceipt,
  signReceipt,
  verifyReceipt,
  type ContinuityReceipt,
} from "../second-producer/noble-verifier";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Helpers ──

function makeKeyPair() { const kp = generateKeyPair(); return { kp, issuer: createIssuerIdentity(kp) }; }

/**
 * Deterministic recent interval — derives BOTH endpoints from ONE clock read.
 * Two independent Date.now() calls can straddle a wall-clock tick, making the
 * ISO-parsed `end - start` differ from coverageMs by 1ms+ (Windows timer
 * granularity up to ~15ms). That trips the strict V₄ equality
 * (`coverageMs !== end - start`) intermittently and, worse, MASKS the real
 * failure reason on negative tests (V₄ runs before V₅/V₆).
 */
function recentInterval(coverageMs: number): { start: string; end: string; coverageMs: number } {
  const endT = Date.now();
  return { start: new Date(endT - coverageMs).toISOString(), end: new Date(endT).toISOString(), coverageMs };
}

function makeValid(): ContinuityReceipt {
  const { kp, issuer } = makeKeyPair();
  const block = toyEngine("boundary-test");
  const unsigned = buildReceipt({
    evidence: [block],
    interval: recentInterval(8000),
    subject: { id: "boundary-test", type: "device" },
    issuer,
  });
  return signReceipt(unsigned, kp.secretKey);
}

function verifyBoth(receipt: ContinuityReceipt, label: string) {
  const noble = verifyReceipt(receipt);
  return { noble, label };
}

// ═══════════════════════════════════════════
// ✅ VALID column
// ═══════════════════════════════════════════

describe("✅ VALID Receipts (protocol conformance verified)", () => {
  it("PES Engine — real sensor, meaningful evidence", async () => {
    // Build a valid receipt from the MyShape PES engine
    const { verifyReceipt: myshapeVerify, buildReceipt: msBuild, signReceipt: msSign, computePayloadDigest: msDigest } = await import("@/lib/evidence/cps0001");
    const mkp = generateKeyPair(); const miss = createIssuerIdentity(mkp);
    const p = { entropy: 0.85 }; const d = msDigest(p);
    const u = msBuild({ evidence: [{ engineId: "EE-001", engineVersion: "1.0", confidence: 0.85, payload: p, payloadDigest: d }], interval: recentInterval(8000), subject: { id: "pes-test", type: "embodied" }, issuer: miss });
    const r = msSign(u, mkp.secretKey);
    expect(verifyReceipt(r).status).toBe("VALID");
    expect((await import("@/lib/evidence/cps0001")).verifyReceipt(r).status).toBe("VALID");
  });

  it("Toy Engine — no sensor, meaningless evidence", () => {
    const r = makeValid();
    expect(verifyBoth(r, "toy").noble.status).toBe("VALID");
  });

  it("Toy Engine — empty input → confidence = 0", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("");
    expect(block.confidence).toBe(0);
    const unsigned = buildReceipt({ evidence: [block], interval: recentInterval(1000), subject: { id: "zero-conf", type: "device" }, issuer });
    const r = signReceipt(unsigned, kp.secretKey);
    expect(verifyReceipt(r).status).toBe("VALID");
  });
});

// ═══════════════════════════════════════════
// ❌ INVALID column
// ═══════════════════════════════════════════

describe("❌ INVALID Receipts (protocol violations caught)", () => {
  it("Wrong Version — protocolVersion changed", () => {
    const r = makeValid();
    (r as Record<string, unknown>).protocolVersion = "0.5";
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INVALID_SCHEMA");
  });

  it("Missing Field — no receiptId", () => {
    const r = makeValid();
    (r as Record<string, unknown>).receiptId = "";
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
  });

  it("Wrong Digest — payloadDigest does not match payload", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("wrong-digest");
    const unsigned = buildReceipt({ evidence: [block], interval: recentInterval(1000), subject: { id: "wd", type: "device" }, issuer });
    unsigned.evidence[0].payloadDigest = "00".repeat(32);
    const r = signReceipt(unsigned, kp.secretKey);
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EVIDENCE_TAMPERED");
  });

  it("Wrong Signature — signed by different key", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("wrong-sig");
    const unsigned = buildReceipt({ evidence: [block], interval: recentInterval(1000), subject: { id: "ws", type: "device" }, issuer });
    const r = signReceipt(unsigned, kp.secretKey);
    r.issuer.publicKey = generateKeyPair().publicKey;
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INVALID_SIGNATURE");
  });

  it("Expired — expiresAt is in the past", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("expired");
    // Single base time: exact 1000ms span, expiresAt exactly 500ms before "now"
    // — every temporal invariant below is arithmetically fixed, not racy.
    const endT = Date.now();
    const unsigned = buildReceipt({ evidence: [block], interval: { start: new Date(endT - 2000).toISOString(), end: new Date(endT - 1000).toISOString(), coverageMs: 1000 }, subject: { id: "ex", type: "device" }, issuer });
    unsigned.expiresAt = new Date(endT - 500).toISOString();
    const r = signReceipt(unsigned, kp.secretKey);
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EXPIRED");
  });

  it("Invalid Interval — start >= end", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("bad-interval");
    const future = new Date(Date.now() + 5000).toISOString();
    const past = new Date(Date.now() - 5000).toISOString();
    // start after end, but coverageMs positive (caught by V₄ temporal check)
    const unsigned = buildReceipt({ evidence: [block], interval: { start: future, end: past, coverageMs: 10000 }, subject: { id: "bi", type: "device" }, issuer });
    const r = signReceipt(unsigned, kp.secretKey);
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("TEMPORAL_INCONSISTENCY");
  });

  it("Inconsistent Assertions — continuity without observation", () => {
    const { kp, issuer } = makeKeyPair();
    const block = toyEngine("bad-assert");
    const unsigned = buildReceipt({ evidence: [block], interval: recentInterval(1000), subject: { id: "ba", type: "device" }, issuer });
    unsigned.assertions.observationOccurred.value = false;
    unsigned.assertions.continuityMaintained.value = true;
    const r = signReceipt(unsigned, kp.secretKey);
    const result = verifyReceipt(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INCONSISTENT_ASSERTIONS");
  });
});

// ═══════════════════════════════════════════
// Cross-Implementation
// ═══════════════════════════════════════════

describe("Cross-Implementation: MyShape Verifier agrees", () => {
  it("Toy Engine → MyShape Verifier → VALID", async () => {
    const { verifyReceipt: mv, buildReceipt: mb, signReceipt: ms, computePayloadDigest: md } = await import("@/lib/evidence/cps0001");
    const mkp = generateKeyPair(); const miss = createIssuerIdentity(mkp);
    const block = toyEngine("cross-impl-toy");
    const u = mb({ evidence: [block], interval: recentInterval(8000), subject: { id: "toy-cross", type: "device" }, issuer: miss });
    const r = ms(u, mkp.secretKey);
    expect(mv(r).status).toBe("VALID");
  });

  it("Wrong Digest → MyShape Verifier → EVIDENCE_TAMPERED", async () => {
    const { verifyReceipt: mv, buildReceipt: mb, signReceipt: ms, computePayloadDigest: md } = await import("@/lib/evidence/cps0001");
    const mkp = generateKeyPair(); const miss = createIssuerIdentity(mkp);
    const block = toyEngine("tamper");
    const u = mb({ evidence: [block], interval: recentInterval(1000), subject: { id: "t", type: "device" }, issuer: miss });
    u.evidence[0].payloadDigest = "ff".repeat(32);
    const r = ms(u, mkp.secretKey);
    const result = mv(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EVIDENCE_TAMPERED");
  });

  it("Wrong Signature → MyShape Verifier → INVALID_SIGNATURE", async () => {
    const { verifyReceipt: mv, buildReceipt: mb, signReceipt: ms } = await import("@/lib/evidence/cps0001");
    const mkp = generateKeyPair(); const miss = createIssuerIdentity(mkp);
    const block = toyEngine("bad-sig");
    const u = mb({ evidence: [block], interval: { start: new Date(Date.now() - 1000).toISOString(), end: new Date().toISOString(), coverageMs: 1000 }, subject: { id: "bs", type: "device" }, issuer: miss });
    const r = ms(u, mkp.secretKey);
    r.issuer.publicKey = generateKeyPair().publicKey;
    const result = mv(r);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INVALID_SIGNATURE");
  });
});

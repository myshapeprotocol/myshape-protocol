import { describe, it, expect } from "vitest";

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import {
  verifyAssertion as verifyWithReference,
  verifyPayloadDigest as referenceVerifyPayloadDigest,
  buildCanonicalAssertionPayload as referenceCanonicalPayload,
  computeReceiptHash as referenceComputeReceiptHash,
} from "../cps-0002-toy-attester/verifier";

import {
  verifyAssertion as verifyWithSecond,
  verifyPayloadDigest as secondVerifyPayloadDigest,
  reconstructSigningInput as secondCanonicalPayload,
  computeReceiptHash as secondComputeReceiptHash,
} from "../cps-0002-second-verifier/verifier";

import { canonicalSerialize } from "../shared/jcs";
import { ed25519 } from "@noble/curves/ed25519.js";

import assertion01 from "../test-vectors/cps0002/human-signal-01.json";
import receipt01 from "../test-vectors/valid/single-engine.json";
import invModifiedSig from "../test-vectors/cps0002/invalid-modified-signature.json";
import invWrongReceipt from "../test-vectors/cps0002/invalid-wrong-receipt.json";
import invExpired from "../test-vectors/cps0002/invalid-expired.json";

const sha256Hex = (s: string) => bytesToHex(sha256(new TextEncoder().encode(s)));

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

const NOW = Date.parse("2026-08-30T00:00:00.000Z");

describe("Cross-Implementation Interoperability", () => {
  it("should accept a valid assertion via the reference verifier", () => {
    const result = verifyWithReference(assertion01 as any, receipt01 as any, NOW);
    expect(result.status).toBe("VALID");
  });

  it("should accept the SAME valid assertion via the second verifier", () => {
    const result = verifyWithSecond(assertion01 as any, receipt01 as any, NOW);
    expect(result.status).toBe("VALID");
  });

  it("should produce identical canonical signing payloads", () => {
    const refPayload = referenceCanonicalPayload(assertion01 as any);
    const secondPayload = secondCanonicalPayload(assertion01 as any);
    expect(secondPayload).toBe(refPayload);
  });

  it("should produce identical receipt hashes", () => {
    const refHash = referenceComputeReceiptHash(receipt01 as any);
    const secondHash = secondComputeReceiptHash(receipt01 as any);
    expect(secondHash).toBe(refHash);
  });

  it("should produce identical signing-input hash (SHA-256)", () => {
    const refPayload = referenceCanonicalPayload(assertion01 as any);
    const secondPayload = secondCanonicalPayload(assertion01 as any);
    expect(sha256Hex(secondPayload)).toBe(sha256Hex(refPayload));
  });

  // ── Negative: mutating a SIGNED field breaks the signature in BOTH verifiers ──
  // subject.id, reference.receiptHash, reference.receiptId, validity.expiresAt,
  // and signature.value are all part of the 12-field canonical signing input.
  // Both verifiers apply the SAME ordered algorithm (schema → signature →
  // receipt-ref → freshness), so these mutations surface as INVALID_SIGNATURE.

  it("should reject a tampered signature with identical results", () => {
    const tampered = clone(assertion01 as any);
    const sig = tampered.signature.value;
    tampered.signature.value =
      (parseInt(sig[0], 16) ^ 1).toString(16) + sig.slice(1);

    const refResult = verifyWithReference(tampered, receipt01 as any, NOW);
    const secondResult = verifyWithSecond(tampered, receipt01 as any, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(secondResult.reason).toBe("INVALID_SIGNATURE");
    expect(refResult.reason).toBe(secondResult.reason);
  });

  it("should reject a modified signed field (subject.id) identically as INVALID_SIGNATURE", () => {
    const tampered = clone(assertion01 as any);
    tampered.subject.id = "wrong-subject";

    const refResult = verifyWithReference(tampered, receipt01 as any, NOW);
    const secondResult = verifyWithSecond(tampered, receipt01 as any, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_SIGNATURE");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject a modified signed field (assertion.receiptHash) identically as INVALID_SIGNATURE", () => {
    const tampered = clone(assertion01 as any);
    tampered.reference.receiptHash = "0".repeat(64);

    const refResult = verifyWithReference(tampered, receipt01 as any, NOW);
    const secondResult = verifyWithSecond(tampered, receipt01 as any, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_SIGNATURE");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject a modified signed field (expiresAt) identically as INVALID_SIGNATURE", () => {
    const tampered = clone(assertion01 as any);
    tampered.validity.expiresAt = "2000-01-01T00:00:00.000Z";

    const refResult = verifyWithReference(tampered, receipt01 as any, NOW);
    const secondResult = verifyWithSecond(tampered, receipt01 as any, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_SIGNATURE");
    expect(secondResult.reason).toBe(refResult.reason);
  });
});

// ── Negative: mutating the RECEIPT object (assertion signature unchanged) ──
// These exercise the semantic reason codes: INVALID_RECEIPT_HASH,
// INVALID_RECEIPT_REFERENCE, and EXPIRED.

describe("Cross-Implementation Receipt-Binding Negatives", () => {
  it("should reject a modified receipt (hash mismatch) identically as INVALID_RECEIPT_HASH", () => {
    const alteredReceipt = clone(receipt01 as any);
    (alteredReceipt.evidence as any[])[0] = {
      ...(alteredReceipt.evidence as any[])[0],
      payloadDigest: "ab".repeat(32),
    };

    const refResult = verifyWithReference(assertion01 as any, alteredReceipt, NOW);
    const secondResult = verifyWithSecond(assertion01 as any, alteredReceipt, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_RECEIPT_HASH");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject a wrong receipt.receiptId identically as INVALID_RECEIPT_REFERENCE", () => {
    const alteredReceipt = clone(receipt01 as any);
    alteredReceipt.receiptId = "wrong-id";

    const refResult = verifyWithReference(assertion01 as any, alteredReceipt, NOW);
    const secondResult = verifyWithSecond(assertion01 as any, alteredReceipt, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_RECEIPT_REFERENCE");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject a wrong receipt.subject.id identically as INVALID_RECEIPT_REFERENCE", () => {
    const alteredReceipt = clone(receipt01 as any);
    alteredReceipt.subject.id = "wrong-subject";

    const refResult = verifyWithReference(assertion01 as any, alteredReceipt, NOW);
    const secondResult = verifyWithSecond(assertion01 as any, alteredReceipt, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("INVALID_RECEIPT_REFERENCE");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject an expired assertion identically as EXPIRED", () => {
    const past = Date.parse("2100-01-01T00:00:00.000Z"); // beyond expiresAt

    const refResult = verifyWithReference(assertion01 as any, receipt01 as any, past);
    const secondResult = verifyWithSecond(assertion01 as any, receipt01 as any, past);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(refResult.reason).toBe("EXPIRED");
    expect(secondResult.reason).toBe(refResult.reason);
  });

  it("should reject a wrong protocolType identically as INVALID_PROTOCOL_TYPE", () => {
    const tampered = clone(assertion01 as any);
    tampered.protocolType = "wrong-type";

    const refResult = verifyWithReference(tampered, receipt01 as any, NOW);
    const secondResult = verifyWithSecond(tampered, receipt01 as any, NOW);

    expect(refResult.status).toBe("INVALID");
    expect(secondResult.status).toBe("INVALID");
    expect(secondResult.reason).toBe("INVALID_PROTOCOL_TYPE");
    expect(refResult.reason).toBe(secondResult.reason);
  });
});

// ═══════════════════════════════════════════
// P1-3: VECTOR CONSUMPTION — reference + second verifier agreement
// ═══════════════════════════════════════════

type InvalidVector = {
  expect: { status: string; reason: string };
  assertion: unknown;
  receipt: unknown;
  verifyAt: string;
};

describe("Vector consumption — reference + second verifier agreement (P1-3)", () => {
  const invalidVectors: InvalidVector[] = [
    invModifiedSig as unknown as InvalidVector,
    invWrongReceipt as unknown as InvalidVector,
    invExpired as unknown as InvalidVector,
  ];

  for (const v of invalidVectors) {
    it(`vector ${v.expect.reason}: both verifiers agree on status+reason`, () => {
      const now = Date.parse(v.verifyAt);
      const ref = verifyWithReference(v.assertion, v.receipt, now);
      const sec = verifyWithSecond(v.assertion, v.receipt, now);

      expect(ref.status).toBe(v.expect.status);
      expect(ref.reason).toBe(v.expect.reason);
      expect(sec.status).toBe(v.expect.status);
      expect(sec.reason).toBe(v.expect.reason);
      expect(ref.reason).toBe(sec.reason);
    });
  }

  it("valid vector human-signal-01: both verifiers agree on VALID", () => {
    const ref = verifyWithReference(assertion01 as any, receipt01 as any, NOW);
    const sec = verifyWithSecond(assertion01 as any, receipt01 as any, NOW);
    expect(ref.status).toBe("VALID");
    expect(sec.status).toBe("VALID");
  });
});

// ═══════════════════════════════════════════
// F7 PAYLOAD DIGEST INTEGRITY — both verifiers (BATCH-0002-3-F8)
// ═══════════════════════════════════════════

describe("F7 payload digest integrity — both verifiers (BATCH-0002-3-F8)", () => {
  const ATTESTER_SECRET =
    "37e91b18c7b9d3a6f8e4c2b1a0d9f8e7c6b5a4d3e2f1a0b9c8d7e6f5a4b3c2d1";
  const hexToBytes = (hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  };

  it("should reject payload tampering identically as INVALID_PAYLOAD_DIGEST", () => {
    const tampered = clone(assertion01 as any);
    (tampered.evidence.payload as any).note = "MUTATED-BY-F8-INTEROP";
    const ref = verifyWithReference(tampered, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(tampered), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_PAYLOAD_DIGEST");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_PAYLOAD_DIGEST");
    expect(sec.reason).toBe(ref.reason);
  });

  it("should reject payload tampering + recomputed digest + stale signature identically as INVALID_SIGNATURE", () => {
    const tampered = clone(assertion01 as any);
    (tampered.evidence.payload as any).note = "MUTATED-BY-F8-INTEROP-2";
    tampered.evidence.payloadDigest = sha256Hex(
      canonicalSerialize(tampered.evidence.payload),
    );
    const ref = verifyWithReference(tampered, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(tampered), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SIGNATURE");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SIGNATURE");
    expect(sec.reason).toBe(ref.reason);
  });

  it("should accept payload tampering + recomputed digest + re-signed assertion as VALID (both)", () => {
    const tampered = clone(assertion01 as any);
    (tampered.evidence.payload as any).note = "MUTATED-BY-F8-INTEROP-3";
    tampered.evidence.payloadDigest = sha256Hex(
      canonicalSerialize(tampered.evidence.payload),
    );
    const payload = referenceCanonicalPayload(tampered);
    const sig = ed25519.sign(
      new TextEncoder().encode(payload),
      hexToBytes(ATTESTER_SECRET),
    );
    tampered.signature.value = bytesToHex(sig);
    const ref = verifyWithReference(tampered, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(tampered), receipt01 as any, NOW);
    expect(ref.status).toBe("VALID");
    expect(sec.status).toBe("VALID");
  });

  it("should reject a malformed digest identically as INVALID_SCHEMA (P5 divergence closed)", () => {
    const malformed = clone(assertion01 as any);
    malformed.evidence.payloadDigest = "zz";
    const ref = verifyWithReference(malformed, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(malformed), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SCHEMA");
    expect(sec.reason).toBe(ref.reason);

    const prefixed = clone(assertion01 as any);
    prefixed.evidence.payloadDigest =
      "sha256:" + (assertion01 as any).evidence.payloadDigest;
    const ref2 = verifyWithReference(prefixed, receipt01 as any, NOW);
    const sec2 = verifyWithSecond(clone(prefixed), receipt01 as any, NOW);
    expect(ref2.reason).toBe("INVALID_SCHEMA");
    expect(sec2.reason).toBe("INVALID_SCHEMA");
    expect(sec2.reason).toBe(ref2.reason);
  });

  it("should agree on payload digest recomputation for the valid vector", () => {
    expect(referenceVerifyPayloadDigest(assertion01 as any)).toBeNull();
    expect(secondVerifyPayloadDigest(assertion01 as any)).toBeNull();
  });
});

// ═══════════════════════════════════════════
// F8-M1: UPPERCASE HEX BOUNDARY — both verifiers (BATCH-0002-3-F9)
// Schema/reference verifier require lowercase hex; second verifier
// must agree after the /i flag was removed.
// ═══════════════════════════════════════════

describe("F8-M1: uppercase hex boundary — both verifiers (BATCH-0002-3-F9)", () => {
  const hexToBytes = (hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  };

  it("uppercase publicKey → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.attester.publicKey = a.attester.publicKey.toUpperCase();
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SCHEMA");
    expect(sec.reason).toBe(ref.reason);
  });

  it("uppercase signature.value → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.signature.value = a.signature.value.toUpperCase();
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SCHEMA");
    expect(sec.reason).toBe(ref.reason);
  });

  it("mixed-case publicKey → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.attester.publicKey =
      a.attester.publicKey.slice(0, 32).toUpperCase() +
      a.attester.publicKey.slice(32).toLowerCase();
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SCHEMA");
  });

  it("lowercase valid values → VALID (both verifiers, baseline)", () => {
    const ref = verifyWithReference(assertion01 as any, receipt01 as any, NOW);
    const sec = verifyWithSecond(assertion01 as any, receipt01 as any, NOW);
    expect(ref.status).toBe("VALID");
    expect(sec.status).toBe("VALID");
  });
});

// ═══════════════════════════════════════════
// Strictness closure: unknown ROOT property → INVALID_SCHEMA (both verifiers)
// Normative: root-level additionalProperties:false (schema). Nested open.
// ═══════════════════════════════════════════

describe("Strictness closure — unknown root property", () => {
  it("valid assertion → VALID (both verifiers, baseline)", () => {
    const ref = verifyWithReference(assertion01 as any, receipt01 as any, NOW);
    const sec = verifyWithSecond(assertion01 as any, receipt01 as any, NOW);
    expect(ref.status).toBe("VALID");
    expect(sec.status).toBe("VALID");
  });

  it("valid assertion + unknown root property → INVALID_SCHEMA (both verifiers)", () => {
    const withExtra = clone(assertion01 as any);
    withExtra.unexpectedField = "x";
    const ref = verifyWithReference(withExtra, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(withExtra), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(ref.reason).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(sec.reason).toBe("INVALID_SCHEMA");
    expect(sec.reason).toBe(ref.reason);
  });
});

// ═══════════════════════════════════════════
// B1: V0 SCHEMA-STRICTNESS ALIGNMENT — both verifiers
// Regression for the second verifier's V0 gaps: `evidence.confidence` range
// and `reference.receiptHash` format. Both are V0 (schema) checks, so both
// verifiers MUST agree on INVALID_SCHEMA rather than diverging.
// ═══════════════════════════════════════════

describe("B1: V0 schema strictness — both verifiers agree (regression)", () => {
  // Type-safe accessor: both verifier result unions omit `reason` on the VALID
  // branch, so read it through a helper instead of after an `expect` call.
  const reasonOf = (r: { status: string; reason?: string }): string | undefined =>
    r.reason;

  it("baseline: valid assertion → VALID (both verifiers)", () => {
    const ref = verifyWithReference(assertion01 as any, receipt01 as any, NOW);
    const sec = verifyWithSecond(assertion01 as any, receipt01 as any, NOW);
    expect(ref.status).toBe("VALID");
    expect(sec.status).toBe("VALID");
  });

  it("confidence > 1 → INVALID_SCHEMA (both verifiers)", () => {
    // confidence is NOT part of the signed 12-field payload, so this mutation
    // leaves the signature intact — only a V0 range check can catch it.
    const a = clone(assertion01 as any);
    a.evidence.confidence = 5;
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(reasonOf(ref)).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(reasonOf(sec)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("confidence < 0 → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.evidence.confidence = -0.1;
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(reasonOf(ref)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("confidence boundary values 0, 0.5, 1 → VALID (both verifiers)", () => {
    for (const c of [0, 0.5, 1]) {
      const a = clone(assertion01 as any);
      a.evidence.confidence = c;
      const ref = verifyWithReference(a, receipt01 as any, NOW);
      const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
      expect(ref.status).toBe("VALID");
      expect(sec.status).toBe("VALID");
    }
  });

  it("malformed receiptHash (non-hex) → INVALID_SCHEMA (both verifiers)", () => {
    // receiptHash IS a signed field (#6). Pre-fix, the second verifier's V0
    // only checked non-emptiness, so this value passed V0 and surfaced at V2
    // as INVALID_SIGNATURE, while the reference verifier returned
    // INVALID_SCHEMA for the identical input.
    const a = clone(assertion01 as any);
    a.reference.receiptHash = "zz";
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(ref.status).toBe("INVALID");
    expect(reasonOf(ref)).toBe("INVALID_SCHEMA");
    expect(sec.status).toBe("INVALID");
    expect(reasonOf(sec)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("short receiptHash (32 hex chars) → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.reference.receiptHash = "ab".repeat(16);
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(reasonOf(ref)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("uppercase receiptHash → INVALID_SCHEMA (both verifiers)", () => {
    const a = clone(assertion01 as any);
    a.reference.receiptHash = (a.reference.receiptHash as string).toUpperCase();
    const ref = verifyWithReference(a, receipt01 as any, NOW);
    const sec = verifyWithSecond(clone(a), receipt01 as any, NOW);
    expect(reasonOf(ref)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe("INVALID_SCHEMA");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });
});

// ═══════════════════════════════════════════
// B2: DOUBLE-FAULT RECEIPT MISMATCH — ordering regression
// VERIFIER-CONTRACT §4 (aligned to the implementation) checks
// receiptId → subject.id → receiptHash. When a presented receipt has BOTH a
// wrong receiptId AND altered content, the first failing step decides the
// reason code: INVALID_RECEIPT_REFERENCE (not INVALID_RECEIPT_HASH). Both
// verifiers MUST agree, and the contract MUST document this order.
// ═══════════════════════════════════════════

describe("B2: double-fault receipt mismatch — ordering (regression)", () => {
  const reasonOf = (r: { status: string; reason?: string }): string | undefined =>
    r.reason;

  it("wrong receiptId AND altered content → INVALID_RECEIPT_REFERENCE (both verifiers)", () => {
    const doubleFault = clone(receipt01 as any);
    doubleFault.receiptId = "wrong-id";
    doubleFault.protocolVersion = "9.9";

    const ref = verifyWithReference(assertion01 as any, doubleFault, NOW);
    const sec = verifyWithSecond(assertion01 as any, clone(doubleFault), NOW);

    expect(ref.status).toBe("INVALID");
    expect(reasonOf(ref)).toBe("INVALID_RECEIPT_REFERENCE");
    expect(sec.status).toBe("INVALID");
    expect(reasonOf(sec)).toBe("INVALID_RECEIPT_REFERENCE");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("wrong subject.id AND altered content → INVALID_RECEIPT_REFERENCE (both verifiers)", () => {
    const doubleFault = clone(receipt01 as any);
    doubleFault.subject.id = "wrong-subject";
    doubleFault.protocolVersion = "9.9";

    const ref = verifyWithReference(assertion01 as any, doubleFault, NOW);
    const sec = verifyWithSecond(assertion01 as any, clone(doubleFault), NOW);

    expect(reasonOf(ref)).toBe("INVALID_RECEIPT_REFERENCE");
    expect(reasonOf(sec)).toBe("INVALID_RECEIPT_REFERENCE");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });

  it("intact receiptId/subject with altered content → INVALID_RECEIPT_HASH (both verifiers)", () => {
    // Control for the two cases above: with the reference bindings intact,
    // the hash check is the first (and only) failure.
    const altered = clone(receipt01 as any);
    altered.protocolVersion = "9.9";

    const ref = verifyWithReference(assertion01 as any, altered, NOW);
    const sec = verifyWithSecond(assertion01 as any, clone(altered), NOW);

    expect(reasonOf(ref)).toBe("INVALID_RECEIPT_HASH");
    expect(reasonOf(sec)).toBe("INVALID_RECEIPT_HASH");
    expect(reasonOf(sec)).toBe(reasonOf(ref));
  });
});
/**
 * CPS-0002 Second Verifier — Independent Implementation
 *
 * Purpose: prove independent interoperability by providing a second, independently-
 * structured verifier that MUST reject all protocol-invalid assertions and
 * accept all protocol-valid ones, using the same externally observable
 * VALID / INVALID classification semantics as the reference verifier.
 *
 * Independence:
 *   This file does NOT import from `cps-0002-toy-attester/`.
 *   It re-implements canonical signing-input reconstruction and does
 *   NOT reuse the toy-attester's signing logic or helpers.
 *   Only `@noble/hashes`, `@noble/curves`, and `shared/jcs` are used as
 *   low-level primitives — the same minimal primitive set as the
 *   noble-verifier in the CPS-0001 project.
 *
 * F7 fix (BATCH-0002-3-F8):
 *   - V2.5 payload-digest verification:
 *     SHA-256(UTF8(canonicalJSON(evidence.payload))) is recomputed
 *     independently and compared with the signed evidence.payloadDigest
 *     (field #9) — mismatch → INVALID_PAYLOAD_DIGEST. canonicalJSON =
 *     MyShape canonical JSON (VERIFIER-CONTRACT §5.0).
 *   - Malformed payloadDigest is rejected at V0 with INVALID_SCHEMA
 *     (previously it reached V2 and surfaced as INVALID_SIGNATURE — closed).
 *
 * B1 fix (V0 schema-strictness alignment):
 *   - V0 now enforces `evidence.confidence` in [0, 1] and
 *     `reference.receiptHash` as 64 lowercase hex chars, matching the
 *     reference verifier. Previously these were unchecked here, producing
 *     VALID vs INVALID_SCHEMA and INVALID_RECEIPT_HASH vs INVALID_SCHEMA
 *     divergences on the same input.
 *
 * TOY / PROTOTYPE / NOT PROOF OF HUMAN
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { canonicalSerialize } from "../shared/jcs";

// ── Types ──

export interface CPS0002Assertion {
  protocolType: string;
  assertionId: string;
  attester: { id: string; publicKey: string };
  subject: { id: string; type?: string };
  reference: { receiptHash: string; receiptId: string };
  evidence: {
    engineId: string;
    confidence: number;
    payload: Record<string, unknown>;
    payloadDigest: string;
  };
  validity: { issuedAt: string; expiresAt: string };
  signature: { algorithm: string; value: string; signedAt: string };
}

export interface CPS0001Receipt {
  protocolVersion: string;
  receiptId: string;
  interval: { start: string; end: string; coverageMs: number };
  subject: { id: string; type?: string };
  evidence: { payloadDigest: string; [key: string]: unknown }[];
  assertions: Record<string, unknown>;
  issuer: { id: string; publicKey: string };
  previousReceiptHash: string | null;
  references: string[];
  signature: { algorithm: string; value: string; signedAt: string };
  expiresAt?: string;
  verdict?: string;
}

export type FailureCode =
  | "INVALID_PROTOCOL_TYPE"
  | "INVALID_SCHEMA"
  | "INVALID_SIGNATURE"
  | "INVALID_PAYLOAD_DIGEST"
  | "INVALID_RECEIPT_HASH"
  | "INVALID_RECEIPT_REFERENCE"
  | "EXPIRED"
  | "MALFORMED_TIMESTAMP";

export type VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: FailureCode; detail: string };

// ── Low-level primitives (re-implemented for independence) ──

function sha256Hex(data: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("hex string has odd length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── Receipt Hash (CPS-0001 definition: SHA-256(JCS(receipt))) ──

export function computeReceiptHash(receipt: CPS0001Receipt): string {
  return sha256Hex(canonicalSerialize(receipt));
}

// ── Canonical Signing-Input Reconstruction ──
// INDEPENDENTLY structured: plain array + join, per-field null-coalescing.
// 12-field order is protocol-defined and MUST match exactly:
//   1. protocolType   2. assertionId   3. attester.id
//   4. attester.pubKey 5. subject.id   6. reference.receiptHash
//   7. reference.receiptId 8. evidence.engineId
//   9. evidence.payloadDigest 10. validity.issuedAt
//  11. validity.expiresAt 12. signature.signedAt

const FIELD_SEPARATOR = ":";

export function reconstructSigningInput(a: CPS0002Assertion): string {
  const fields: string[] = [
    a.protocolType ?? "",
    a.assertionId ?? "",
    a.attester?.id ?? "",
    a.attester?.publicKey ?? "",
    a.subject?.id ?? "",
    a.reference?.receiptHash ?? "",
    a.reference?.receiptId ?? "",
    a.evidence?.engineId ?? "",
    a.evidence?.payloadDigest ?? "",
    a.validity?.issuedAt ?? "",
    a.validity?.expiresAt ?? "",
    a.signature?.signedAt ?? "",
  ];
    return fields.join(FIELD_SEPARATOR);
}

// ── V0: Schema Validation ──
// Normative: root-level additionalProperties:false — unknown root keys INVALID_SCHEMA.

export function verifySchema(a: unknown): FailureCode | null {
  if (typeof a !== "object" || a === null) return "INVALID_SCHEMA";
  const obj = a as Record<string, unknown>;

  // Strictness closure (normative): root-level additionalProperties:false.
  // MUST reject unknown root-level properties at V0 with INVALID_SCHEMA.
  // Nested objects remain open per the current schema.
  const ALLOWED_ROOT_KEYS = new Set([
    "protocolType",
    "assertionId",
    "attester",
    "subject",
    "reference",
    "evidence",
    "validity",
    "signature",
  ]);
  for (const k of Object.keys(obj)) {
    if (!ALLOWED_ROOT_KEYS.has(k)) return "INVALID_SCHEMA";
  }

  if (obj.protocolType !== "cps-hsa-0.1-draft") return "INVALID_PROTOCOL_TYPE";

  const checkStr = (v: unknown): boolean => typeof v === "string" && v.length > 0;

  if (!checkStr(obj.assertionId)) return "INVALID_SCHEMA";

  if (typeof obj.attester !== "object" || obj.attester === null) return "INVALID_SCHEMA";
  const at = obj.attester as Record<string, unknown>;
  if (!checkStr(at.id)) return "INVALID_SCHEMA";
  if (typeof at.publicKey !== "string" || !/^[0-9a-f]{64}$/.test(at.publicKey)) return "INVALID_SCHEMA";

  if (typeof obj.subject !== "object" || obj.subject === null) return "INVALID_SCHEMA";
  const sub = obj.subject as Record<string, unknown>;
  if (!checkStr(sub.id)) return "INVALID_SCHEMA";

  if (typeof obj.reference !== "object" || obj.reference === null) return "INVALID_SCHEMA";
  const ref = obj.reference as Record<string, unknown>;
  if (!checkStr(ref.receiptHash)) return "INVALID_SCHEMA";
  // Malformed receipt hash must fail at V0 — same rule as the reference
  // verifier (B1 fix): 64 lowercase hex chars. receiptHash IS a signed field
  // (field #6), so previously a malformed value passed V0 and surfaced at V2
  // as INVALID_SIGNATURE, while the reference verifier returned
  // INVALID_SCHEMA for the same input.
  if (!/^([0-9a-f]{2}){32}$/.test(ref.receiptHash as string)) return "INVALID_SCHEMA";
  if (!checkStr(ref.receiptId)) return "INVALID_SCHEMA";

  if (typeof obj.evidence !== "object" || obj.evidence === null) return "INVALID_SCHEMA";
  const ev = obj.evidence as Record<string, unknown>;
  if (!checkStr(ev.engineId)) return "INVALID_SCHEMA";
  if (typeof ev.confidence !== "number") return "INVALID_SCHEMA";
  // Range check — same rule as the reference verifier (B1 fix). confidence is
  // NOT part of the signed 12-field payload, so an unchecked out-of-range
  // value previously stayed VALID here while the reference verifier returned
  // INVALID_SCHEMA — a VALID-vs-INVALID split on the same input.
  if (ev.confidence < 0 || ev.confidence > 1) return "INVALID_SCHEMA";
  if (typeof ev.payload !== "object" || ev.payload === null) return "INVALID_SCHEMA";
  if (!checkStr(ev.payloadDigest)) return "INVALID_SCHEMA";
  // Malformed digest must fail at V0 (F7 fix, BATCH-0002-3-F8; P5 divergence
  // closed): 64 lowercase hex chars — same rule as the reference verifier.
  if (!/^([0-9a-f]{2}){32}$/.test(ev.payloadDigest as string)) return "INVALID_SCHEMA";

  if (typeof obj.validity !== "object" || obj.validity === null) return "INVALID_SCHEMA";
  const val = obj.validity as Record<string, unknown>;
  if (!checkStr(val.issuedAt)) return "INVALID_SCHEMA";
  if (!checkStr(val.expiresAt)) return "INVALID_SCHEMA";

  if (typeof obj.signature !== "object" || obj.signature === null) return "INVALID_SCHEMA";
  const sig = obj.signature as Record<string, unknown>;
  if (sig.algorithm !== "Ed25519") return "INVALID_SCHEMA";
  if (typeof sig.value !== "string" || !/^[0-9a-f]{128}$/.test(sig.value)) return "INVALID_SCHEMA";
  if (!checkStr(sig.signedAt)) return "INVALID_SCHEMA";

  return null;
}

// ── V2: Signature Verification ──

export function verifySignature(a: CPS0002Assertion): FailureCode | null {
  const payload = reconstructSigningInput(a);
  const msgBytes = new TextEncoder().encode(payload);
  const sigBytes = hexToBytes(a.signature.value);
  const pkBytes = hexToBytes(a.attester.publicKey);
  try {
    if (!ed25519.verify(sigBytes, msgBytes, pkBytes)) return "INVALID_SIGNATURE";
  } catch {
    return "INVALID_SIGNATURE";
  }
  return null;
}

// ── V2.5: Payload Digest Verification (BATCH-0002-3-F8, F7 fix) ──

/**
 * Independently implemented (same minimal primitive set): recompute
 *
 *   SHA-256( UTF8( canonicalJSON( evidence.payload ) ) )
 *
 * via the shared canonicalizer (MyShape canonical JSON —
 * CPS-0002-VERIFIER-CONTRACT.md §5.0; byte-compatible with RFC 8785 for
 * I-JSON-conformant input, not a validator) + local sha256Hex, and compare
 * with the signed evidence.payloadDigest (field #9). Ordering identical to
 * the reference verifier: AFTER V2 (signature), BEFORE V3 (receipt
 * reference).
 */
export function verifyPayloadDigest(a: CPS0002Assertion): FailureCode | null {
  const recomputed = sha256Hex(canonicalSerialize(a.evidence.payload));
  if (recomputed !== a.evidence.payloadDigest) return "INVALID_PAYLOAD_DIGEST";
  return null;
}

// ── V3: Receipt Reference Verification ──

export function verifyReceiptReference(
  a: CPS0002Assertion,
  receipt: CPS0001Receipt,
): FailureCode | null {
  if (receipt.receiptId !== a.reference.receiptId) return "INVALID_RECEIPT_REFERENCE";
  if (receipt.subject.id !== a.subject.id) return "INVALID_RECEIPT_REFERENCE";
  const expectedHash = computeReceiptHash(receipt);
  if (expectedHash !== a.reference.receiptHash) return "INVALID_RECEIPT_HASH";
  return null;
}

// ── V4: Freshness Check ──

export function verifyFreshness(
  a: CPS0002Assertion,
  now: number = Date.now(),
): FailureCode | null {
  try {
    const issuedAtMs = Date.parse(a.validity.issuedAt);
    if (Number.isNaN(issuedAtMs)) return "MALFORMED_TIMESTAMP";
    const expiresAtMs = Date.parse(a.validity.expiresAt);
    if (Number.isNaN(expiresAtMs)) return "MALFORMED_TIMESTAMP";
    if (now >= expiresAtMs) return "EXPIRED";
  } catch {
    return "MALFORMED_TIMESTAMP";
  }
  return null;
}

// ── Full Verification ──

export function verifyAssertion(
  assertion: CPS0002Assertion,
  receipt: CPS0001Receipt,
  now: number = Date.now(),
): VerificationResult {
  const schemaErr = verifySchema(assertion);
  if (schemaErr) {
    return {
      status: "INVALID",
      reason: schemaErr,
      detail:
        schemaErr === "INVALID_PROTOCOL_TYPE"
          ? `Expected "cps-hsa-0.1-draft", got "${assertion.protocolType}"`
          : "Assertion does not conform to CPS-0002 schema.",
    };
  }

  const sigErr = verifySignature(assertion);
  if (sigErr) {
    return {
      status: "INVALID",
      reason: sigErr,
      detail: "Ed25519 signature verification failed.",
    };
  }

  // V2.5 — payload digest integrity (F7 fix, BATCH-0002-3-F8):
  // independently recomputed; ordering identical to the reference verifier
  // (after signature, before receipt reference).
  const digestErr = verifyPayloadDigest(assertion);
  if (digestErr) {
    return {
      status: "INVALID",
      reason: digestErr,
      detail:
        "evidence.payloadDigest does not match SHA-256(UTF8(JCS(evidence.payload))).",
    };
  }

  const refErr = verifyReceiptReference(assertion, receipt);
  if (refErr) {
    return {
      status: "INVALID",
      reason: refErr,
      detail:
        refErr === "INVALID_RECEIPT_HASH"
          ? "receiptHash does not match SHA-256(JCS(receipt))"
          : "receiptId or subject.id does not match the presented receipt",
    };
  }

  const freshErr = verifyFreshness(assertion, now);
  if (freshErr) {
    return {
      status: "INVALID",
      reason: freshErr,
      detail:
        freshErr === "EXPIRED"
          ? "Assertion has expired."
          : "Malformed timestamp.",
    };
  }

  return { status: "VALID" };
}
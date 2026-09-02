/**
 * CPS-0002 — Reference Verifier (Prototype)
 *
 * TOY / PROTOTYPE / NOT PROOF OF HUMAN
 *
 * Zero MyShape application dependencies.
 * Uses @noble/hashes + @noble/curves + ../shared/jcs (protocol utility).
 *
 * Verification levels:
 *   V0   — Schema conformance (structural shape; incl. evidence.payload
 *          presence and payloadDigest 64-hex format)
 *   V1   — Canonical payload reconstruction (implicit in V2)
 *   V2   — Ed25519 signature validity
 *   V2.5 — Evidence payload digest integrity (BATCH-0002-3-F8, F7 fix):
 *          SHA-256( UTF8( JCS( evidence.payload ) ) ) must equal the
 *          signed evidence.payloadDigest (field #9), else
 *          INVALID_PAYLOAD_DIGEST
 *   V3   — Referenced CPS-0001 receipt hash match
 *   V4   — Freshness
 *
 * Output: VALID | INVALID (with failure code and detail)
 *
 * "VALID" means: the assertion is structurally conformant, the Ed25519
 * signature is valid for the reconstructed 12-field canonical payload,
 * the evidence payload digest independently recomputes to the signed
 * evidence.payloadDigest (V2.5), and the referenced receipt hash matches
 * the presented CPS-0001 receipt.
 *
 * "VALID" does NOT mean: proof of human, proof of liveness, proof of truth.
 * The relying application must make additional authorization decisions.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { canonicalSerialize } from "../shared/jcs";

// ── Types (re-declared — zero MyShape imports) ──

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

export type CPS0002FailureCode =
  | "INVALID_PROTOCOL_TYPE"
  | "INVALID_SCHEMA"
  | "INVALID_SIGNATURE"
  | "INVALID_PAYLOAD_DIGEST"
  | "INVALID_RECEIPT_HASH"
  | "INVALID_RECEIPT_REFERENCE"
  | "EXPIRED"
  | "MALFORMED_TIMESTAMP";

export type CPS0002VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: CPS0002FailureCode; detail: string };

// ── Crypto Helpers ──

function sha256Hex(data: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── Receipt Hash (SAME definition as CPS-0001) ──

/**
 * CPS-0001 receipt hash:
 *   SHA-256( JCS( ContinuityReceipt ) )
 */
export function computeReceiptHash(receipt: CPS0001Receipt): string {
  return sha256Hex(canonicalSerialize(receipt));
}

// ── Canonical Assertion Payload (12 fields) ──

/**
 * Field order:
 *   1.  protocolType
 *   2.  assertionId
 *   3.  attester.id
 *   4.  attester.publicKey
 *   5.  subject.id
 *   6.  reference.receiptHash
 *   7.  reference.receiptId
 *   8.  evidence.engineId
 *   9.  evidence.payloadDigest
 *   10. validity.issuedAt
 *   11. validity.expiresAt
 *   12. signedAt  (from signature.signedAt)
 */
export function buildCanonicalAssertionPayload(a: CPS0002Assertion): string {
  return [
    a.protocolType,
    a.assertionId,
    a.attester.id,
    a.attester.publicKey,
    a.subject.id,
    a.reference.receiptHash,
    a.reference.receiptId,
    a.evidence.engineId,
    a.evidence.payloadDigest,
    a.validity.issuedAt,
    a.validity.expiresAt,
    a.signature.signedAt,
  ].join(":");
}

export function reconstructPayload(a: CPS0002Assertion): string {
  return buildCanonicalAssertionPayload(a);
}

// ── V0: Schema Validation ──

export function verifySchema(a: CPS0002Assertion): CPS0002FailureCode | null {
  if (typeof a !== "object" || a === null) return "INVALID_SCHEMA";

  if (a.protocolType !== "cps-hsa-0.1-draft") return "INVALID_PROTOCOL_TYPE";

      if (!a.assertionId || typeof a.assertionId !== "string") return "INVALID_SCHEMA";

  if (!a.attester || typeof a.attester !== "object") return "INVALID_SCHEMA";
  if (!a.attester.id || typeof a.attester.id !== "string") return "INVALID_SCHEMA";
  if (!a.attester.publicKey || typeof a.attester.publicKey !== "string") return "INVALID_SCHEMA";
  if (!/^[0-9a-f]{64}$/.test(a.attester.publicKey)) return "INVALID_SCHEMA";

  if (!a.subject || typeof a.subject !== "object") return "INVALID_SCHEMA";
  if (!a.subject.id || typeof a.subject.id !== "string") return "INVALID_SCHEMA";

  if (!a.reference || typeof a.reference !== "object") return "INVALID_SCHEMA";
  if (!a.reference.receiptHash || typeof a.reference.receiptHash !== "string") return "INVALID_SCHEMA";
  if (!/^([0-9a-f]{2}){32}$/.test(a.reference.receiptHash)) return "INVALID_SCHEMA";
  if (!a.reference.receiptId || typeof a.reference.receiptId !== "string") return "INVALID_SCHEMA";

  if (!a.evidence || typeof a.evidence !== "object") return "INVALID_SCHEMA";
  if (!a.evidence.engineId || typeof a.evidence.engineId !== "string") return "INVALID_SCHEMA";
  if (typeof a.evidence.confidence !== "number") return "INVALID_SCHEMA";
  if (a.evidence.confidence < 0 || a.evidence.confidence > 1) return "INVALID_SCHEMA";
  // evidence.payload MUST be present (object) — required by the JSON schema.
  // (BATCH-0002-3-F8: closes the "payload deletable while VALID" gap.)
  if (typeof a.evidence.payload !== "object" || a.evidence.payload === null) return "INVALID_SCHEMA";
  if (!a.evidence.payloadDigest || typeof a.evidence.payloadDigest !== "string") return "INVALID_SCHEMA";
  if (!/^([0-9a-f]{2}){32}$/.test(a.evidence.payloadDigest)) return "INVALID_SCHEMA";

  if (!a.validity || typeof a.validity !== "object") return "INVALID_SCHEMA";
  if (!a.validity.issuedAt || typeof a.validity.issuedAt !== "string") return "INVALID_SCHEMA";
  if (!a.validity.expiresAt || typeof a.validity.expiresAt !== "string") return "INVALID_SCHEMA";

  if (!a.signature || typeof a.signature !== "object") return "INVALID_SCHEMA";
  if (a.signature.algorithm !== "Ed25519") return "INVALID_SCHEMA";
  if (!a.signature.value || typeof a.signature.value !== "string") return "INVALID_SCHEMA";
  if (!/^[0-9a-f]{128}$/.test(a.signature.value)) return "INVALID_SCHEMA";
  if (!a.signature.signedAt || typeof a.signature.signedAt !== "string") return "INVALID_SCHEMA";

  return null;
}

// ── V2: Signature Verification ──

export function verifySignature(a: CPS0002Assertion): CPS0002FailureCode | null {
  const payload = buildCanonicalAssertionPayload(a);
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
 * Independently recompute the evidence payload digest and compare it with
 * the signed evidence.payloadDigest (field #9 of the canonical signing
 * payload):
 *
 *   payloadDigest = lowercase_hex( SHA-256( UTF8( JCS( payload ) ) ) )
 *
 * JCS = RFC 8785 canonical JSON serialization (shared canonicalizer),
 * applied to the parsed in-memory JSON object (I-JSON constraints apply).
 *
 * Ordering: runs AFTER V2 (signature) — the digest is part of the signed
 * 12-field input, so any payload+digest+signature rewrite still fails at
 * V2 first — and BEFORE V3 (receipt reference) so that an internally
 * inconsistent assertion is rejected before any cross-object binding is
 * evaluated.
 */
export function verifyPayloadDigest(a: CPS0002Assertion): CPS0002FailureCode | null {
  const recomputed = sha256Hex(canonicalSerialize(a.evidence.payload));
  if (recomputed !== a.evidence.payloadDigest) return "INVALID_PAYLOAD_DIGEST";
  return null;
}

// ── V3: Receipt Hash Verification ──

export function verifyReceiptReference(
  a: CPS0002Assertion,
  receipt: CPS0001Receipt,
): CPS0002FailureCode | null {
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
): CPS0002FailureCode | null {
  try {
    const issuedAtMs = new Date(a.validity.issuedAt).getTime();
    if (Number.isNaN(issuedAtMs)) return "MALFORMED_TIMESTAMP";
    const expiresAtMs = new Date(a.validity.expiresAt).getTime();
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
): CPS0002VerificationResult {
  const schemaErr = verifySchema(assertion);
  if (schemaErr) {
    return {
      status: "INVALID",
      reason: schemaErr,
      detail: schemaErr === "INVALID_PROTOCOL_TYPE"
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
  // the signature covers evidence.payloadDigest (field #9); recompute the
  // digest from the presented evidence.payload and require an exact match.
  // Payload tampering can no longer verify VALID with a stale digest.
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
      detail: refErr === "INVALID_RECEIPT_HASH"
        ? "receiptHash does not match SHA-256(JCS(receipt))"
        : "receiptId or subject.id does not match the presented receipt",
    };
  }

  const freshErr = verifyFreshness(assertion, now);
  if (freshErr) {
    return {
      status: "INVALID",
      reason: freshErr,
      detail: freshErr === "EXPIRED" ? "Assertion has expired." : "Malformed timestamp.",
    };
  }

  return { status: "VALID" };
}

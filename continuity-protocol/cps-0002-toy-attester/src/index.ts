/**
 * CPS-0002 — Toy Human Signal Attester (Prototype)
 *
 * TOY / PROTOTYPE / NOT PROOF OF HUMAN
 *
 * CPS-0002 is an ADDITIVE Human Signal Assertion layer that references
 * an existing CPS-0001 Continuity Receipt by hash. It does NOT modify
 * CPS-0001, its canonical signing payload, its schema, or its
 * verification semantics (V1-V7). All existing CPS-0001 receipts
 * remain independently verifiable.
 *
 * Dependencies (same set as the Second Producer / noble-verifier):
 *   @noble/hashes, @noble/curves, ../shared/jcs (protocol utility)
 *
 * Zero MyShape application dependencies.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { canonicalSerialize } from "../../shared/jcs";

// ── Types ──

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

export interface AttesterKeyPair {
  secretKey: string;
  publicKey: string;
  id: string;
}

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

// ── Receipt Hash (reuses CPS-0001 definition) ──

/**
 * CPS-0001 receipt hash:
 *   SHA-256( JCS( ContinuityReceipt ) )
 *
 * Uses the shared JCS canonicalizer (../shared/jcs) to guarantee
 * byte-for-byte agreement with the Main and Reference verifiers.
 */
export function computeReceiptHash(receipt: CPS0001Receipt): string {
  return sha256Hex(canonicalSerialize(receipt));
}

// ── Ed25519 Key Pair Generation ──

export function deriveKeyPair(secretKeyHex: string): AttesterKeyPair {
  const sk = hexToBytes(secretKeyHex);
  const publicKey = bytesToHex(ed25519.getPublicKey(sk));
  const id = sha256Hex(publicKey).slice(0, 16);
  return { secretKey: secretKeyHex, publicKey, id };
}

export function generateKeyPair(): AttesterKeyPair {
  const secretKey = bytesToHex(ed25519.utils.randomSecretKey());
  const publicKey = bytesToHex(ed25519.getPublicKey(hexToBytes(secretKey)));
  const id = sha256Hex(publicKey).slice(0, 16);
  return { secretKey, publicKey, id };
}

// ── UUIDv7 ──

function createAssertionId(seed?: string): string {
  if (seed !== undefined) {
    const digest = sha256Hex(seed);
    const hex = digest.slice(0, 32);
    return [
      hex.slice(0, 8), hex.slice(8, 12),
      "7" + hex.slice(13, 16), "8" + hex.slice(16, 19),
      hex.slice(19, 31),
    ].join("-");
  }
  const ts = Date.now().toString(16).padStart(12, "0");
  const rand = Array.from(
    ed25519.utils.randomSecretKey().slice(0, 10),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8), hex.slice(8, 12),
    "7" + hex.slice(13, 16), "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

// ── Canonical Assertion Payload (12 fields) ──

/**
 * CPS-0002 Canonical Assertion Payload (12 fields).
 *
 * SEPARATE from CPS-0001's 13-field canonical signing payload.
 * CPS-0002 does NOT modify, replace, or extend CPS-0001's payload.
 *
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

/**
 * Compute payloadDigest (normative since BATCH-0002-3-F8 / F7 fix):
 *
 *   payloadDigest = lowercase_hex( SHA-256( UTF8( JCS( payload ) ) ) )
 *
 * where JCS is RFC 8785 canonical JSON serialization (the shared
 * canonicalizer — byte-for-byte identical across producer and both
 * verifiers), applied to the parsed in-memory JSON object. The payload
 * MUST satisfy I-JSON constraints (unique keys, valid UTF-8, numbers
 * within IEEE-754 double range).
 *
 * This replaces the prototype-era SHA-256(JSON.stringify(payload)):
 * JSON.stringify is JS-implementation-defined (key insertion order,
 * number formatting, escaping) and cannot serve as a cross-language
 * verifier contract. JCS (RFC 8785) is fully specified and deterministic.
 *
 * NOTE: the frozen CPS-0001 EvidenceBlock.payloadDigest keeps its own
 * (JSON.stringify-based) definition; CPS-0001 is NOT modified by this
 * change. The commitment pattern — digest signed as field #9 of the
 * 12-field canonical assertion payload — is unchanged.
 */
export function computePayloadDigest(payload: Record<string, unknown>): string {
  return sha256Hex(canonicalSerialize(payload));
}

// ── Toy Evidence ──

export interface ToyEvidenceInput {
  challenge?: string;
}

/**
 * Toy evidence for CPS-0002.
 *
 * Explicitly labeled as TOY / NON-PRODUCTION:
 *   - engineId: "TOY-HSA-999"
 *   - confidence: 0.0 (zero — no real evidence)
 *   - payload: contains a clear non-production label
 */
export function toyEvidence(input?: ToyEvidenceInput): {
  engineId: string;
  confidence: number;
  payload: Record<string, unknown>;
  payloadDigest: string;
} {
  const challenge = input?.challenge ?? "cps-0002-toy-attester-demo";
  const payload = {
    label: "TOY / PROTOTYPE / NOT PROOF OF HUMAN",
    engine: "CPS-0002 Toy Human Signal Attester",
    version: "0.1-draft",
    challenge,
    timestamp: new Date().toISOString(),
    note: "This evidence contains no biometric, physiological, or liveness data. Confidence is 0.0 by design.",
  };
  return {
    engineId: "TOY-HSA-999",
    confidence: 0.0,
    payload: payload as Record<string, unknown>,
    payloadDigest: computePayloadDigest(payload),
  };
}

// ── Assertion Builder ──

export interface BuildAssertionInput {
  receipt: CPS0001Receipt;
  attester: AttesterKeyPair;
  evidence?: ReturnType<typeof toyEvidence>;
  validityMinutes?: number;
  issuedAt?: string;
  expiresAt?: string;
  assertionSeed?: string;
  signedAtOverride?: string;
}

/**
 * Build and sign a CPS-0002 Human Signal Assertion.
 *
 * Produces: CPS-0001 receipt → compute receipt hash →
 * construct assertion → canonicalize → sign with Ed25519 → output.
 */
export function buildAssertion(input: BuildAssertionInput): CPS0002Assertion {
  const {
    receipt,
    attester,
    evidence = toyEvidence(),
    validityMinutes = 60,
    issuedAt: issuedAtOverride,
    expiresAt: expiresAtOverride,
    assertionSeed,
    signedAtOverride,
  } = input;

  const receiptHash = computeReceiptHash(receipt);
  const subjectId = receipt.subject.id;
  const receiptId = receipt.receiptId;
  const subjectType = receipt.subject.type;

  const issuedAt = issuedAtOverride ?? new Date().toISOString();
  const issuedAtMs = new Date(issuedAt).getTime();
  const expiresAt = expiresAtOverride ?? new Date(issuedAtMs + validityMinutes * 60_000).toISOString();
  const assertionId = createAssertionId(assertionSeed);
  const signedAt = signedAtOverride ?? new Date().toISOString();

  const assertion: CPS0002Assertion = {
    protocolType: "cps-hsa-0.1-draft",
    assertionId,
    attester: { id: attester.id, publicKey: attester.publicKey },
    subject: { id: subjectId, ...(subjectType ? { type: subjectType } : {}) },
    reference: { receiptHash, receiptId },
    evidence: {
      engineId: evidence.engineId,
      confidence: evidence.confidence,
      payload: evidence.payload,
      payloadDigest: evidence.payloadDigest,
    },
    validity: { issuedAt, expiresAt },
    signature: { algorithm: "Ed25519", value: "", signedAt },
  };

  const payload = buildCanonicalAssertionPayload(assertion);
  const sig = ed25519.sign(new TextEncoder().encode(payload), hexToBytes(attester.secretKey));
  assertion.signature.value = bytesToHex(sig);
  return assertion;
}

// ── Deterministic Toy Assertion (for test vectors) ──

/**
 * Generate a deterministic CPS-0002 assertion from a deterministic
 * CPS-0001 receipt and a fixed attester key. Used for test vector
 * generation.
 */
export function buildDeterministicAssertion(
  receipt: CPS0001Receipt,
  attesterSecretHex: string,
  options: {
    issuedAt?: string;
    expiresAt?: string;
    assertionSeed?: string;
    evidenceSeed?: string;
  } = {},
): CPS0002Assertion {
  const attester = deriveKeyPair(attesterSecretHex);
  const challenge = options.evidenceSeed ?? "cps-0002-toy-deterministic";
  const ev = toyEvidence({ challenge });

    const issuedAt = options.issuedAt ?? "2026-08-29T00:00:00.000Z";
  const expiresAt = options.expiresAt ?? "2099-12-31T23:59:59.000Z";

  const receiptHash = computeReceiptHash(receipt);
  const assertionId = createAssertionId(options.assertionSeed ?? "cps-0002-deterministic");

  const assertion: CPS0002Assertion = {
    protocolType: "cps-hsa-0.1-draft",
    assertionId,
    attester: { id: attester.id, publicKey: attester.publicKey },
    subject: {
      id: receipt.subject.id,
      ...(receipt.subject.type ? { type: receipt.subject.type } : {}),
    },
    reference: { receiptHash, receiptId: receipt.receiptId },
    evidence: {
      engineId: ev.engineId,
      confidence: ev.confidence,
      payload: ev.payload,
      payloadDigest: ev.payloadDigest,
    },
    validity: { issuedAt, expiresAt },
    signature: { algorithm: "Ed25519", value: "", signedAt: issuedAt },
  };

  const payload = buildCanonicalAssertionPayload(assertion);
  const sig = ed25519.sign(new TextEncoder().encode(payload), hexToBytes(attester.secretKey));
  assertion.signature.value = bytesToHex(sig);
  return assertion;
}

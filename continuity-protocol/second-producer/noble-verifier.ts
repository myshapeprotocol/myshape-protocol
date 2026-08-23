/**
 * CPS-0001 Reference Implementation — Noble-based Verifier
 *
 * SECOND INDEPENDENT PRODUCER.
 *
 * This file implements CPS-0001 using @noble/hashes + @noble/curves.
 * It has ZERO dependencies on MyShape engine code.
 *
 * Why this exists:
 *   The existing reference-verifier/verifier.ts uses Web Crypto API
 *   (crypto.subtle.digest). This implementation uses @noble/* instead,
 *   proving that CPS-0001 does not depend on any specific crypto stack.
 *
 *   Two independent implementations → same protocol object shape →
 *   interoperable verification. This is how you prove a protocol spec
 *   is actually implementable by anyone.
 *
 * Usage:
 *   import { buildReceipt, verifyReceipt } from "./noble-verifier";
 *
 * Dependencies (same as main MyShape project):
 *   @noble/hashes
 *   @noble/curves
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { canonicalSerialize } from "../shared/jcs";

// ═══════════════════════════════════════════
// Types (re-declared — zero MyShape imports)
// ═══════════════════════════════════════════

export interface AssertionEntry {
  value: boolean;
  confidence: number;
}

export interface AssertionSet {
  observationOccurred: AssertionEntry;
  continuityMaintained: AssertionEntry;
  receiptIntegrity: AssertionEntry;
}

export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE" | "CONTRADICTORY" | "EXPIRED";

export interface EvidenceBlock {
  engineId: string;
  engineVersion: string;
  confidence: number;
  payload: Record<string, unknown>;
  payloadDigest: string;
}

export interface ContinuityInterval {
  start: string;
  end: string;
  coverageMs: number;
}

export interface SubjectRef {
  id: string;
  type?: "embodied" | "device" | "agent" | string;
}

export interface IssuerIdentity {
  id: string;
  publicKey: string;
}

export interface ReceiptSignature {
  algorithm: string;
  value: string;
  signedAt: string;
}

export interface ContinuityReceipt {
  protocolVersion: string;
  assertions: AssertionSet;
  verdict?: Verdict;
  evidence: EvidenceBlock[];
  receiptId: string;
  interval: ContinuityInterval;
  subject: SubjectRef;
  expiresAt?: string;
  previousReceiptHash: string | null;
  references: string[];
  issuer: IssuerIdentity;
  signature: ReceiptSignature;
}

export type FailureCode =
  | "INVALID_SCHEMA"
  | "INVALID_SIGNATURE"
  | "INCONSISTENT_ASSERTIONS"
  | "TEMPORAL_INCONSISTENCY"
  | "EVIDENCE_TAMPERED"
  | "EXPIRED"
  | "CHAIN_BROKEN"
  | "PREDECESSOR_MISSING"
  | "SUBJECT_MISMATCH"
  | "ISSUER_MISMATCH"
  | "TEMPORAL_VIOLATION";

export type VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: FailureCode; detail: string };

// ═══════════════════════════════════════════
// Crypto helpers
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// Receipt ID generation
// ═══════════════════════════════════════════

export function createReceiptId(): string {
  const ts = Date.now().toString(16).padStart(12, "0");
  const randBytes = new Uint8Array(20);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(randBytes);
  } else {
    for (let i = 0; i < randBytes.length; i++) randBytes[i] = Math.floor(Math.random() * 256);
  }
  const rand = Array.from(randBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

// ═══════════════════════════════════════════
// Evidence digest
// ═══════════════════════════════════════════

export function computePayloadDigest(payload: Record<string, unknown>): string {
  return sha256Hex(JSON.stringify(payload));
}

// ═══════════════════════════════════════════
// Assertions
// ═══════════════════════════════════════════

export function buildAssertions(engineConfidences: number[]): AssertionSet {
  const avg =
    engineConfidences.length > 0
      ? engineConfidences.reduce((a, b) => a + b, 0) / engineConfidences.length
      : 0;
  const hasEvidence = engineConfidences.length > 0;

  return {
    observationOccurred: { value: hasEvidence, confidence: hasEvidence ? 0.95 : 0 },
    continuityMaintained: { value: avg >= 0.5, confidence: avg },
    receiptIntegrity: { value: true, confidence: 1.0 },
  };
}

// ═══════════════════════════════════════════
// Builder
// ═══════════════════════════════════════════

export function buildReceipt(params: {
  evidence: EvidenceBlock[];
  interval: ContinuityInterval;
  subject: SubjectRef;
  issuer: IssuerIdentity;
  previousReceiptHash?: string | null;
  verdict?: Verdict;
}): Omit<ContinuityReceipt, "signature"> {
  const confidences = params.evidence.map((e) => e.confidence);

  return {
    protocolVersion: "1.0",
    receiptId: createReceiptId(),
    interval: params.interval,
    subject: params.subject,
    evidence: params.evidence,
    assertions: buildAssertions(confidences),
    verdict: params.verdict,
    previousReceiptHash: params.previousReceiptHash ?? null,
    references: [],
    issuer: params.issuer,
    expiresAt: params.interval.end
      ? new Date(new Date(params.interval.end).getTime() + 5 * 60 * 1000).toISOString()
      : undefined,
  };
}

// ═══════════════════════════════════════════
// Canonical signing payload
// ═══════════════════════════════════════════

function canonicalSigningPayload(receipt: Omit<ContinuityReceipt, "signature">): string {
  const evidenceDigests = receipt.evidence.map((e) => e.payloadDigest).join(":");
  return [
    receipt.receiptId,
    receipt.interval.start,
    receipt.interval.end,
    receipt.interval.coverageMs.toString(),
    receipt.subject.id,
    evidenceDigests,
    receipt.issuer.id,
    receipt.issuer.publicKey,
  ].join(":");
}

// ═══════════════════════════════════════════
// Signing (Ed25519 via @noble/curves)
// ═══════════════════════════════════════════

export function signReceipt(
  unsigned: Omit<ContinuityReceipt, "signature">,
  secretKeyHex: string,
): ContinuityReceipt {
  const payload = canonicalSigningPayload(unsigned);
  const sk = hexToBytes(secretKeyHex);
  const sig = ed25519.sign(new TextEncoder().encode(payload), sk);
  return {
    ...unsigned,
    signature: {
      algorithm: "Ed25519",
      value: bytesToHex(sig),
      signedAt: new Date().toISOString(),
    },
  };
}

export function verifySignature(
  receipt: ContinuityReceipt,
  publicKeyHex: string,
): FailureCode | null {
  if (!receipt.signature) return "INVALID_SIGNATURE";
  if (receipt.signature.algorithm !== "Ed25519") return "INVALID_SIGNATURE";

  const { signature, ...unsigned } = receipt;
  const payload = canonicalSigningPayload(unsigned);
  const pk = hexToBytes(publicKeyHex);
  const sig = hexToBytes(signature.value);

  try {
    const valid = ed25519.verify(sig, new TextEncoder().encode(payload), pk);
    return valid ? null : "INVALID_SIGNATURE";
  } catch {
    return "INVALID_SIGNATURE";
  }
}

// ═══════════════════════════════════════════
// Verifiers (V₁, V₃, V₄, V₅, V₆)
// ═══════════════════════════════════════════

export function verifySchema(receipt: ContinuityReceipt): FailureCode | null {
  if (receipt.protocolVersion !== "1.0") return "INVALID_SCHEMA";
  if (!receipt.receiptId || typeof receipt.receiptId !== "string") return "INVALID_SCHEMA";
  if (!receipt.interval?.start || !receipt.interval?.end) return "INVALID_SCHEMA";
  if (typeof receipt.interval.coverageMs !== "number" || receipt.interval.coverageMs <= 0)
    return "INVALID_SCHEMA";
  if (!receipt.subject?.id || typeof receipt.subject.id !== "string") return "INVALID_SCHEMA";
  if (!Array.isArray(receipt.evidence)) return "INVALID_SCHEMA";
  if (!receipt.assertions) return "INVALID_SCHEMA";
  if (!receipt.issuer?.id || !receipt.issuer?.publicKey) return "INVALID_SCHEMA";
  if (!receipt.signature?.algorithm || !receipt.signature?.value) return "INVALID_SCHEMA";
  return null;
}

export function verifyAssertions(receipt: ContinuityReceipt): FailureCode | null {
  const { assertions } = receipt;
  if (assertions.continuityMaintained.value && !assertions.observationOccurred.value) {
    return "INCONSISTENT_ASSERTIONS";
  }
  return null;
}

export function verifyTemporal(receipt: ContinuityReceipt): FailureCode | null {
  const start = new Date(receipt.interval.start).getTime();
  const end = new Date(receipt.interval.end).getTime();
  if (start >= end) return "TEMPORAL_INCONSISTENCY";
  if (receipt.interval.coverageMs !== end - start) return "TEMPORAL_INCONSISTENCY";

  if (receipt.signature?.signedAt) {
    const signedAt = new Date(receipt.signature.signedAt).getTime();
    if (signedAt < end) return "TEMPORAL_INCONSISTENCY";
  }
  if (receipt.expiresAt) {
    if (new Date(receipt.expiresAt).getTime() <= end) return "TEMPORAL_INCONSISTENCY";
  }
  return null;
}

export function verifyEvidenceIntegrity(receipt: ContinuityReceipt): FailureCode | null {
  for (const block of receipt.evidence) {
    const expected = computePayloadDigest(block.payload);
    if (expected !== block.payloadDigest) return "EVIDENCE_TAMPERED";
  }
  return null;
}

export function verifyFreshness(receipt: ContinuityReceipt): FailureCode | null {
  if (receipt.expiresAt && Date.now() >= new Date(receipt.expiresAt).getTime()) {
    return "EXPIRED";
  }
  return null;
}

// ── V₇: Predecessor Reference (requires predecessor receipt) ─────

/** CPS-0001 receipt hash: SHA-256 over the canonical (JCS) serialization. */
export function computeReceiptHash(receipt: ContinuityReceipt): string {
  return sha256Hex(canonicalSerialize(receipt));
}

/**
 * V₇ predecessor chain verification.
 *
 * Predecessor hash check uses the canonical receipt hash
 * SHA-256( JCS( predecessor ) ), identical to Main and Reference, so
 * all three implementations agree on the hash. (Subject/issuer/temporal
 * binding is enforced by the authoritative Main verifier.)
 */
export function verifyPredecessor(
  receipt: ContinuityReceipt,
  predecessor: ContinuityReceipt,
): FailureCode | null {
  if (computeReceiptHash(predecessor) !== receipt.previousReceiptHash) return "CHAIN_BROKEN";
  return null;
}

// ═══════════════════════════════════════════
// Full verification (V₁, V₂, V₃, V₄, V₅, V₆)
// ═══════════════════════════════════════════

export function verifyReceipt(receipt: ContinuityReceipt): VerificationResult {
  const schemaErr = verifySchema(receipt);
  if (schemaErr)
    return {
      status: "INVALID",
      reason: schemaErr,
      detail: "Receipt does not conform to CPS-0001 schema.",
    };

  const sigErr = verifySignature(receipt, receipt.issuer.publicKey);
  if (sigErr)
    return {
      status: "INVALID",
      reason: sigErr,
      detail: "Signature verification failed.",
    };

  const assertionErr = verifyAssertions(receipt);
  if (assertionErr)
    return {
      status: "INVALID",
      reason: assertionErr,
      detail: "Assertion consistency violation.",
    };

  const temporalErr = verifyTemporal(receipt);
  if (temporalErr)
    return { status: "INVALID", reason: temporalErr, detail: "Temporal model violated." };

  const evidenceErr = verifyEvidenceIntegrity(receipt);
  if (evidenceErr)
    return { status: "INVALID", reason: evidenceErr, detail: "Evidence tampered." };

  const freshnessErr = verifyFreshness(receipt);
  if (freshnessErr) return { status: "INVALID", reason: freshnessErr, detail: "Receipt expired." };

  return { status: "VALID" };
}

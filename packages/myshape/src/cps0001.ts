// ═══════════════════════════════════════════════════════════════════
// CPS-0001 — Continuity Protocol Core Types
//
// Protocol-level types implementing the CPS-0001 specification
// (src/app/research/notes/008-continuity-protocol-core).
//
// These types are ENGINE-INDEPENDENT. They describe the protocol object
// (ContinuityReceipt), not how evidence is produced.
//
// Engine-level types (ComponentEvidence, EngineEvidence, etc.)
// remain in types.ts — they are internal to evidence engines.
// ═══════════════════════════════════════════════════════════════════

// ── Assertion (§1.1, §6.1) — what is claimed ──

export interface AssertionEntry {
  /** Whether this assertion holds */
  value: boolean;
  /** Confidence [0, 1] */
  confidence: number;
}

export interface AssertionSet {
  observationOccurred: AssertionEntry;
  continuityMaintained: AssertionEntry;
  receiptIntegrity: AssertionEntry;
}

export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE" | "CONTRADICTORY" | "EXPIRED";

// ── Evidence Block (§6.3) — why it is believed ──

export interface EvidenceBlock {
  /** Evidence engine identifier (e.g. "EE-001") */
  engineId: string;
  /** Semver of the engine */
  engineVersion: string;
  /** Engine-specific confidence [0, 1] */
  confidence: number;
  /** Engine-specific evidence payload — OPAQUE to the protocol */
  payload: Record<string, unknown>;
  /** SHA-256 of payload for integrity verification */
  payloadDigest: string;
}

// ── Context (§6.1) — when / where / subject ──

export interface ContinuityInterval {
  start: string;   // ISO 8601
  end: string;     // ISO 8601
  coverageMs: number;
}

export interface SubjectRef {
  /** Opaque pseudonym. RECOMMENDED: SHA-256 of device-stable secret + public key */
  id: string;
  /** Optional hint. Values not normative. */
  type?: "embodied" | "device" | "agent" | string;
}

// ── Composability (§5, §6.1) — links to other receipts ──

/** Cryptographic reference to predecessor receipt. null = genesis. */
export type PredecessorRef = string | null;

// ── Signature (§6.4) — who claims it ──

export interface IssuerIdentity {
  /** Opaque issuer identifier */
  id: string;
  /** Public key (base64url) */
  publicKey: string;
}

export interface ReceiptSignature {
  /** Signature algorithm. RECOMMENDED: "Ed25519" */
  algorithm: string;
  /** Signature value (base64url) */
  value: string;
  /** When the signature was produced (ISO 8601) */
  signedAt: string;
}

// ── ContinuityReceipt (§6.1) — the protocol object ──

export interface ContinuityReceipt {
  // Assertion — what is claimed
  protocolVersion: string;
  assertions: AssertionSet;
  verdict?: Verdict;

  // Evidence — why it is believed
  evidence: EvidenceBlock[];

  // Context — when / where / subject
  receiptId: string;
  interval: ContinuityInterval;
  subject: SubjectRef;
  expiresAt?: string;

  // Composability — links to other receipts
  previousReceiptHash: PredecessorRef;
  references: string[];

  // Signature — who claims it
  issuer: IssuerIdentity;
  signature: ReceiptSignature;
}

// ── Verification Contract (§7) ──

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

/** Authoritative predecessor resolution for V₇ chain verification (Model 3). */
export interface ChainStore {
  resolve(hash: string): ContinuityReceipt | null;
}

export type VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: FailureCode; detail: string };

// ── Builder ──

/** Generate a time-sortable receipt ID (UUIDv7-like: timestamp + crypto random). */
export function createReceiptId(): string {
  const ts = Date.now().toString(16).padStart(12, "0");
  // Use crypto.getRandomValues when available, fall back to Math.random
  const randBytes = new Uint8Array(20);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(randBytes);
  } else {
    for (let i = 0; i < randBytes.length; i++) randBytes[i] = Math.floor(Math.random() * 256);
  }
  const rand = Array.from(randBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  // Format: 00000000-0000-7000-8000-000000000000 (UUIDv7 layout)
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

/** Compute payloadDigest for an evidence payload. Uses sync SHA-256 (@noble/hashes). */
export function computePayloadDigest(payload: Record<string, unknown>): string {
  return sha256(JSON.stringify(payload));
}

/**
 * Build the three normative assertions from engine confidence scores.
 *
 * This is the engine-independent fallback: it averages the provided engine
 * confidence scores into a single `continuityMaintained` assertion
 * (`avg >= 0.5`). It is NOT the CPS-0001 v0.2 two-stage verdict.
 *
 * The two-stage verdict (Stage 1 EE-001 ≥ 0.50 AND Stage 2 EE-003 = 1.0,
 * confidence = min) requires engine identity and MUST be computed by the
 * caller and passed into `buildReceipt({ assertions })`. This function cannot
 * apply that gate because it receives only bare confidence numbers.
 */
export function buildAssertions(engineConfidences: number[]): AssertionSet {
  const avg = engineConfidences.length > 0
    ? engineConfidences.reduce((a, b) => a + b, 0) / engineConfidences.length
    : 0;
  const hasEvidence = engineConfidences.length > 0;

  return {
    observationOccurred: {
      value: hasEvidence,
      confidence: hasEvidence ? 0.95 : 0,
    },
    continuityMaintained: {
      value: avg >= 0.5,
      confidence: avg,
    },
    receiptIntegrity: {
      value: true,
      confidence: 1.0,
    },
  };
}

/** Build a ContinuityReceipt from evidence blocks and context. */
export function buildReceipt(params: {
  evidence: EvidenceBlock[];
  interval: ContinuityInterval;
  subject: SubjectRef;
  issuer: IssuerIdentity;
  previousReceiptHash?: PredecessorRef;
  verdict?: Verdict;
  /** Optional pre-computed assertions. Defaults to the engine-independent average. */
  assertions?: AssertionSet;
}): Omit<ContinuityReceipt, "signature"> {
  const confidences = params.evidence.map((e) => e.confidence);

  return {
    protocolVersion: "1.0",
    receiptId: createReceiptId(),
    interval: params.interval,
    subject: params.subject,
    evidence: params.evidence,
    assertions: params.assertions ?? buildAssertions(confidences),
    verdict: params.verdict,
    previousReceiptHash: params.previousReceiptHash ?? null,
    references: [],
    issuer: params.issuer,
    expiresAt: params.interval.end
      ? new Date(new Date(params.interval.end).getTime() + 5 * 60 * 1000).toISOString()
      : undefined,
  };
}

// ── Verification (§7.1) ──

/** V₁: Schema validity check. Returns null if valid, or a FailureCode. */
export function verifySchema(receipt: ContinuityReceipt): FailureCode | null {
  if (receipt.protocolVersion !== "1.0") return "INVALID_SCHEMA";
  if (!receipt.receiptId || typeof receipt.receiptId !== "string") return "INVALID_SCHEMA";
  if (!receipt.interval?.start || !receipt.interval?.end) return "INVALID_SCHEMA";
  if (typeof receipt.interval.coverageMs !== "number" || receipt.interval.coverageMs <= 0) return "INVALID_SCHEMA";
  if (!receipt.subject?.id || typeof receipt.subject.id !== "string") return "INVALID_SCHEMA";
  if (!Array.isArray(receipt.evidence)) return "INVALID_SCHEMA";
  if (!receipt.assertions) return "INVALID_SCHEMA";
  if (!receipt.issuer?.id || !receipt.issuer?.publicKey) return "INVALID_SCHEMA";
  return null;
}

/** V₃: Assertion consistency. */
export function verifyAssertions(receipt: ContinuityReceipt): FailureCode | null {
  const { assertions } = receipt;
  // continuity → observation (continuity without observation is incoherent)
  if (assertions.continuityMaintained.value && !assertions.observationOccurred.value) {
    return "INCONSISTENT_ASSERTIONS";
  }
  return null;
}

/** V₄: Temporal consistency. */
export function verifyTemporal(receipt: ContinuityReceipt): FailureCode | null {
  const start = new Date(receipt.interval.start).getTime();
  const end = new Date(receipt.interval.end).getTime();
  if (start >= end) return "TEMPORAL_INCONSISTENCY";

  // coverageMs must match
  if (receipt.interval.coverageMs !== end - start) return "TEMPORAL_INCONSISTENCY";

  // signedAt must be ≥ interval.end
  if (receipt.signature?.signedAt) {
    const signedAt = new Date(receipt.signature.signedAt).getTime();
    if (signedAt < end) return "TEMPORAL_INCONSISTENCY";
  }

  // expiresAt must be after interval.end
  if (receipt.expiresAt) {
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (expiresAt <= end) return "TEMPORAL_INCONSISTENCY";
  }

  return null;
}

/** V₅: Evidence reference integrity. */
export function verifyEvidenceIntegrity(receipt: ContinuityReceipt): FailureCode | null {
  for (const block of receipt.evidence) {
    const expected = computePayloadDigest(block.payload);
    if (expected !== block.payloadDigest) return "EVIDENCE_TAMPERED";
  }
  return null;
}

/** V₆: Freshness. */
export function verifyFreshness(receipt: ContinuityReceipt): FailureCode | null {
  if (receipt.expiresAt) {
    const now = Date.now();
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (now >= expiresAt) return "EXPIRED";
  }
  return null;
}

/** Run all verifiable checks (V₁, V₂, V₃, V₄, V₅, V₆, and V₇ when chained).
 *
 * V₇ requires a trusted `ChainStore` for authoritative predecessor resolution.
 * Genesis receipts (`previousReceiptHash === null`) skip V₇. A non-null pointer
 * without a store fails closed.
 */
export function verifyReceipt(receipt: ContinuityReceipt, store?: ChainStore): VerificationResult {
  const schemaErr = verifySchema(receipt);
  if (schemaErr) return { status: "INVALID", reason: schemaErr, detail: "Receipt does not conform to CPS-0001 schema." };

  // V₂: Signature verification (must precede V₇ — the pointer is unsigned in v1.0)
  const sigErr = verifySignature(receipt);
  if (sigErr) return { status: "INVALID", reason: sigErr, detail: "Signature verification failed — receipt may be forged or tampered." };

  // V₇: Predecessor chain (store-backed, authoritative)
  if (receipt.previousReceiptHash !== null) {
    if (!store) {
      return {
        status: "INVALID",
        reason: "CHAIN_BROKEN",
        detail: "V₇ predecessor chain requires a trusted ChainStore for authoritative resolution.",
      };
    }
    const predecessor = store.resolve(receipt.previousReceiptHash);
    if (!predecessor) {
      return {
        status: "INVALID",
        reason: "PREDECESSOR_MISSING",
        detail: "Predecessor receipt not found in trusted chain store.",
      };
    }
    const chainErr = verifyPredecessor(receipt, predecessor);
    if (chainErr) {
      const detail =
        chainErr === "CHAIN_BROKEN"
          ? "Predecessor hash mismatch — receipt does not follow the referenced predecessor."
          : chainErr === "SUBJECT_MISMATCH"
            ? "Chain subject mismatch — predecessor subject differs from current."
            : chainErr === "ISSUER_MISMATCH"
              ? "Chain issuer mismatch — predecessor issuer differs from current."
              : "Chain temporal violation — predecessor interval does not end before current interval starts.";
      return { status: "INVALID", reason: chainErr, detail };
    }
  }

  const assertionErr = verifyAssertions(receipt);
  if (assertionErr) return { status: "INVALID", reason: assertionErr, detail: "Assertion consistency violation — continuity claimed without observation." };

  const temporalErr = verifyTemporal(receipt);
  if (temporalErr) return { status: "INVALID", reason: temporalErr, detail: "Temporal model violated." };

  const evidenceErr = verifyEvidenceIntegrity(receipt);
  if (evidenceErr) return { status: "INVALID", reason: evidenceErr, detail: "Evidence payloadDigest does not match payload." };

  const freshnessErr = verifyFreshness(receipt);
  if (freshnessErr) return { status: "INVALID", reason: freshnessErr, detail: "Receipt has expired." };

  return { status: "VALID" };
}

// ── Signing (§6.4) — Ed25519 ──

import { sign as edSign, verify as edVerify } from "./crypto.js";

/**
 * Build the canonical signing payload for a receipt.
 *
 * Deterministic: receiptId + interval + subject + evidence digests.
 * This is what gets signed — any tampering with these fields
 * invalidates the signature.
 */
export function canonicalSigningPayload(receipt: Omit<ContinuityReceipt, "signature">): string {
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

/**
 * Sign a receipt with an Ed25519 secret key.
 * Returns the signed receipt (with signature field populated).
 */
export function signReceipt(
  unsigned: Omit<ContinuityReceipt, "signature">,
  secretKeyHex: string,
): ContinuityReceipt {
  const payload = canonicalSigningPayload(unsigned);
  const sigValue = edSign(payload, secretKeyHex);
  const signedAt = new Date().toISOString();

  return {
    ...unsigned,
    signature: {
      algorithm: "Ed25519",
      value: sigValue,
      signedAt,
    },
  };
}

/** V₂: Verify the receipt's Ed25519 signature against the issuer's public key. */
export function verifySignature(receipt: ContinuityReceipt): FailureCode | null {
  if (!receipt.signature) return "INVALID_SIGNATURE";
  if (receipt.signature.algorithm !== "Ed25519") return "INVALID_SIGNATURE";

  const { signature, ...unsigned } = receipt;
  const payload = canonicalSigningPayload(unsigned);
  const valid = edVerify(signature.value, payload, receipt.issuer.publicKey);

  return valid ? null : "INVALID_SIGNATURE";
}

/**
 * V₇: Verify the predecessor chain binding for a non-genesis receipt.
 * Assumes `current.previousReceiptHash !== null`. Enforces predecessor hash,
 * subject binding, issuer binding, and temporal ordering. In v1.0 the pointer is
 * UNSIGNED — only secure when `predecessor` comes from a TRUSTED store.
 */
export function verifyPredecessor(
  current: ContinuityReceipt,
  predecessor: ContinuityReceipt,
): FailureCode | null {
  if (computeReceiptHash(predecessor) !== current.previousReceiptHash) return "CHAIN_BROKEN";
  if (current.subject.id !== predecessor.subject.id) return "SUBJECT_MISMATCH";
  if (current.issuer.id !== predecessor.issuer.id) return "ISSUER_MISMATCH";

  const predEnd = new Date(predecessor.interval.end).getTime();
  const curStart = new Date(current.interval.start).getTime();
  if (isNaN(predEnd) || isNaN(curStart) || predEnd > curStart) return "TEMPORAL_VIOLATION";

  return null;
}

// ── Conversion: EngineEvidence → EvidenceBlock ──

import type { EngineEvidence } from "./types.js";
import { sha256Hex } from "./hash.js";

// ── Crypto (sync — @noble/hashes, works browser + SSR) ──

/** SHA-256 hex digest of a string payload. */
function sha256(data: string): string {
  return sha256Hex(data);
}

/** RFC 8785 (JCS)-compatible canonical serialization (recursive key sort, no whitespace). */
export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(sortForCanonicalization(value));
}

function sortForCanonicalization(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonicalization);
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const v = obj[key];
      if (v === undefined) continue;
      sorted[key] = sortForCanonicalization(v);
    }
    return sorted;
  }
  return value;
}

/** CPS-0001 receipt hash: SHA-256 over the canonical serialization of the full receipt. */
export function computeReceiptHash(receipt: ContinuityReceipt): string {
  return sha256(canonicalSerialize(receipt));
}

/** Convert an internal EngineEvidence to a CPS-0001 EvidenceBlock. */
export function engineEvidenceToBlock(
  engineEvidence: EngineEvidence,
  engineVersion = "1.0.0",
): EvidenceBlock {
  // Build opaque payload from engine evidence components + diagnostics
  const payload: Record<string, unknown> = {
    components: engineEvidence.components.map((c) => ({
      metric: c.metric,
      value: c.value,
      threshold: c.threshold,
      status: c.status,
      explanation: c.explanation,
    })),
    diagnostics: engineEvidence.diagnostics,
  };

  const payloadDigest = computePayloadDigest(payload);

  return {
    engineId: engineEvidence.engineId,
    engineVersion,
    confidence: engineEvidence.confidence ?? 0,
    payload,
    payloadDigest,
  };
}

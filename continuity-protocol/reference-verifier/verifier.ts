// ═══════════════════════════════════════════════════════════════════
// CPS-0001 Reference Verifier
//
// ZERO dependencies on MyShape, IMU, Camera, EE-001, or any engine.
// This file is the protocol. If you can produce receipts that pass
// this verifier — using any sensor, any algorithm — you implement CPS-0001.
//
// v1.0-RC · Apache 2.0 · The Continuity Lab
// ═══════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────

export interface AssertionEntry {
  value: boolean;
  confidence: number;
}

export interface AssertionSet {
  observationOccurred: AssertionEntry;
  continuityMaintained: AssertionEntry;
  receiptIntegrity: AssertionEntry;
}

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
  type?: string;
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
  // Assertion
  protocolVersion: string;
  assertions: AssertionSet;
  verdict?: Verdict;

  // Evidence
  evidence: EvidenceBlock[];

  // Context
  receiptId: string;
  interval: ContinuityInterval;
  subject: SubjectRef;
  expiresAt?: string;

  // Composability
  previousReceiptHash: string | null;
  references: string[];

  // Signature
  issuer: IssuerIdentity;
  signature: ReceiptSignature;
}

export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE" | "CONTRADICTORY" | "EXPIRED";

export type FailureCode =
  | "INVALID_SCHEMA"
  | "INVALID_SIGNATURE"
  | "INCONSISTENT_ASSERTIONS"
  | "TEMPORAL_INCONSISTENCY"
  | "EVIDENCE_TAMPERED"
  | "EXPIRED"
  | "CHAIN_BROKEN";

export type VerificationResult =
  | { status: "VALID" }
  | { status: "INVALID"; reason: FailureCode; detail: string };

// ── V₁: Schema Validity ──────────────────────────────────────────

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
  if (!receipt.signature?.algorithm || !receipt.signature?.value || !receipt.signature?.signedAt)
    return "INVALID_SCHEMA";
  return null;
}

// ── V₃: Assertion Consistency ────────────────────────────────────

export function verifyAssertions(receipt: ContinuityReceipt): FailureCode | null {
  const { assertions } = receipt;
  // continuity → observation (incoherent to claim continuity without observation)
  if (assertions.continuityMaintained.value && !assertions.observationOccurred.value) {
    return "INCONSISTENT_ASSERTIONS";
  }
  return null;
}

// ── V₄: Temporal Consistency ─────────────────────────────────────

export function verifyTemporal(receipt: ContinuityReceipt): FailureCode | null {
  const start = new Date(receipt.interval.start).getTime();
  const end = new Date(receipt.interval.end).getTime();

  if (isNaN(start) || isNaN(end)) return "TEMPORAL_INCONSISTENCY";
  if (start >= end) return "TEMPORAL_INCONSISTENCY";
  if (receipt.interval.coverageMs !== end - start) return "TEMPORAL_INCONSISTENCY";

  // signedAt must be >= interval.end
  const signedAt = new Date(receipt.signature.signedAt).getTime();
  if (isNaN(signedAt) || signedAt < end) return "TEMPORAL_INCONSISTENCY";

  // expiresAt must be after interval.end
  if (receipt.expiresAt) {
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (isNaN(expiresAt) || expiresAt <= end) return "TEMPORAL_INCONSISTENCY";
  }

  return null;
}

// ── V₅: Evidence Reference Integrity ─────────────────────────────

async function sha256(data: string): Promise<string> {
  const buf = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyEvidenceIntegrity(receipt: ContinuityReceipt): Promise<FailureCode | null> {
  for (const block of receipt.evidence) {
    const computed = await sha256(JSON.stringify(block.payload));
    if (computed !== block.payloadDigest) return "EVIDENCE_TAMPERED";
  }
  return null;
}

// ── V₆: Freshness ────────────────────────────────────────────────

export function verifyFreshness(receipt: ContinuityReceipt): FailureCode | null {
  if (receipt.expiresAt) {
    const now = Date.now();
    const expiresAt = new Date(receipt.expiresAt).getTime();
    if (isNaN(expiresAt) || now >= expiresAt) return "EXPIRED";
  }
  return null;
}

// ── V₇: Predecessor Reference (requires predecessor receipt) ─────

export function verifyPredecessor(
  receipt: ContinuityReceipt,
  predecessor: ContinuityReceipt,
): Promise<FailureCode | null> {
  return sha256(JSON.stringify(predecessor)).then((expected) => {
    if (receipt.previousReceiptHash !== expected) return "CHAIN_BROKEN";
    return null;
  });
}

// ── verifyReceipt (V₁, V₃, V₄, V₅, V₆) ──────────────────────────

export async function verifyReceipt(receipt: ContinuityReceipt): Promise<VerificationResult> {
  // V₁
  const schemaErr = verifySchema(receipt);
  if (schemaErr) return { status: "INVALID", reason: schemaErr, detail: "Receipt does not conform to CPS-0001 schema." };

  // V₂ (signature verification) — requires crypto.subtle.verify against issuer.publicKey.
  // This implementation defers signature verification to the caller.
  // Callers MUST verify the signature before trusting the receipt.

  // V₃
  const assertionErr = verifyAssertions(receipt);
  if (assertionErr) return { status: "INVALID", reason: assertionErr, detail: "Continuity claimed without observation." };

  // V₄
  const temporalErr = verifyTemporal(receipt);
  if (temporalErr) return { status: "INVALID", reason: temporalErr, detail: "Temporal model violated." };

  // V₅
  const evidenceErr = await verifyEvidenceIntegrity(receipt);
  if (evidenceErr) return { status: "INVALID", reason: evidenceErr, detail: "Evidence payloadDigest mismatch." };

  // V₆
  const freshnessErr = verifyFreshness(receipt);
  if (freshnessErr) return { status: "INVALID", reason: freshnessErr, detail: "Receipt has expired." };

  return { status: "VALID" };
}

// ── Builder (convenience, not required for verification) ─────────

export function createReceiptId(): string {
  const ts = Date.now().toString(16).padStart(12, "0");
  const rand = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const hex = (ts + rand).slice(0, 32).padEnd(32, "0");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "7" + hex.slice(13, 16),
    "8" + hex.slice(16, 19),
    hex.slice(19, 31),
  ].join("-");
}

export async function computePayloadDigest(payload: Record<string, unknown>): Promise<string> {
  return sha256(JSON.stringify(payload));
}

export function buildAssertions(engineConfidences: number[]): AssertionSet {
  const avg = engineConfidences.length > 0
    ? engineConfidences.reduce((a, b) => a + b, 0) / engineConfidences.length
    : 0;
  const hasEvidence = engineConfidences.length > 0;

  return {
    observationOccurred: { value: hasEvidence, confidence: hasEvidence ? 0.95 : 0 },
    continuityMaintained: { value: avg >= 0.5, confidence: avg },
    receiptIntegrity: { value: true, confidence: 1.0 },
  };
}

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

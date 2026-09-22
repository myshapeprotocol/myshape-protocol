// ═══════════════════════════════════════════════════════════════════
// Phase B — Step-by-Step Verifier
//
// Runs CPS-0001 Reference Verifier checks (V₁–V₇) individually
// and returns the result of each step. Designed for animated UI
// display — each step is independent.
//
// V₂ (Ed25519 signature) and V₇ (chain) are VERIFIED.
// ═══════════════════════════════════════════════════════════════════

import {
  verifySchema,
  verifySignature,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  verifyPredecessor,
  type ContinuityReceipt,
  type FailureCode,
} from "@/lib/evidence/cps0001";

export type StepStatus = "pending" | "running" | "pass" | "fail" | "skipped";

export interface VerificationStep {
  id: string;
  label: string;
  description: string;
  detail: string;
  status: StepStatus;
  error?: string;
}

export interface VerificationStepsResult {
  steps: VerificationStep[];
  verdict: "VALID" | "INVALID";
}

/**
 * Run all verifiable checks (V₁, V₃, V₄, V₅, V₆) and return step results.
 * V₂ and V₇ are marked as "skipped" with explanation.
 *
 * This is a non-short-circuiting verifier — all steps run even if one fails.
 * Each step is independent; the overall verdict is INVALID if any step fails.
 */
export function runVerificationSteps(
  receipt: ContinuityReceipt,
  predecessor?: ContinuityReceipt,
): VerificationStepsResult {
  const steps: VerificationStep[] = [];

  // V₁: Schema Validity
  const v1 = verifySchema(receipt);
  steps.push({
    id: "V₁",
    label: "Schema Validity",
    description: "Receipt conforms to CPS-0001 schema",
    detail: "Checks protocolVersion, receiptId, interval, subject, evidence, assertions, issuer, signature fields.",
    status: v1 ? "fail" : "pass",
    error: v1 ?? undefined,
  });

  // V₂: Ed25519 Signature Verification
  const v2 = verifySignature(receipt);
  steps.push({
    id: "V₂",
    label: "Signature Verification",
    description: "Ed25519 signature matches issuer public key",
    detail: "Verifies the canonical signing payload signature against the issuer's Ed25519 public key.",
    status: v2 ? "fail" : "pass",
    error: v2 ?? undefined,
  });

  // V₃: Assertion Consistency
  const v3 = verifyAssertions(receipt);
  steps.push({
    id: "V₃",
    label: "Assertion Consistency",
    description: "Claimed continuities are internally consistent",
    detail: "Verifies continuityMaintained cannot be true when observationOccurred is false.",
    status: v3 ? "fail" : "pass",
    error: v3 ?? undefined,
  });

  // V₄: Temporal Consistency
  const v4 = verifyTemporal(receipt);
  steps.push({
    id: "V₄",
    label: "Temporal Consistency",
    description: "Timeline is coherent",
    detail: "Verifies start < end, coverageMs matches, signedAt ≥ end, expiresAt > end.",
    status: v4 ? "fail" : "pass",
    error: v4 ?? undefined,
  });

  // V₅: Evidence Reference Integrity
  const v5 = verifyEvidenceIntegrity(receipt);
  steps.push({
    id: "V₅",
    label: "Evidence Integrity",
    description: "Payload digest matches evidence content",
    detail: "Computes SHA-256 of each evidence payload and compares against payloadDigest.",
    status: v5 ? "fail" : "pass",
    error: v5 ?? undefined,
  });

  // V₆: Freshness
  const v6 = verifyFreshness(receipt);
  steps.push({
    id: "V₆",
    label: "Freshness",
    description: "Receipt has not expired",
    detail: "Checks current time against expiresAt field.",
    status: v6 ? "fail" : "pass",
    error: v6 ?? undefined,
  });

  // V₇: Predecessor Chain
  // Genesis (previousReceiptHash === null) is skipped. A non-null pointer is
  // verified when a predecessor object is available; otherwise it fails closed
  // because V₇ requires a trusted store / supplied predecessor for resolution.
  if (receipt.previousReceiptHash === null) {
    steps.push({
      id: "V₇",
      label: "Predecessor Chain",
      description: "Hash chain links to predecessor receipt",
      detail: "This is a genesis receipt (no predecessor). V₇ applies when previousReceiptHash is non-null.",
      status: "skipped",
    });
  } else if (predecessor) {
    const v7 = verifyPredecessor(receipt, predecessor);
    steps.push({
      id: "V₇",
      label: "Predecessor Chain",
      description: "Hash chain links to predecessor receipt",
      detail: v7
        ? `Chain verification failed (${v7}).`
        : "Predecessor hash, subject, issuer, and temporal order all valid.",
      status: v7 ? "fail" : "pass",
      error: v7 ?? undefined,
    });
  } else {
    steps.push({
      id: "V₇",
      label: "Predecessor Chain",
      description: "Hash chain links to predecessor receipt",
      detail:
        "Non-null previousReceiptHash present but no predecessor supplied. V₇ requires a trusted store or predecessor object for authoritative verification.",
      status: "fail",
    });
  }

  // Overall verdict: VALID only if all non-skipped steps pass
  const failures = steps.filter((s) => s.status === "fail");
  const verdict = failures.length === 0 ? "VALID" : "INVALID";

  return { steps, verdict };
}

// ═══════════════════════════════════════════════════════════════════
// Phase B — Step-by-Step Verifier
//
// Runs CPS-0001 Reference Verifier checks (V₁–V₇) individually
// and returns the result of each step. Designed for animated UI
// display — each step is independent.
//
// V₂ (signature) is skipped — requires external key material.
// V₇ (chain) is conditional — requires a predecessor receipt.
// ═══════════════════════════════════════════════════════════════════

import {
  verifySchema,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
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
export async function runVerificationSteps(
  receipt: ContinuityReceipt,
): Promise<VerificationStepsResult> {
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

  // V₂: Signature Verification (skipped)
  steps.push({
    id: "V₂",
    label: "Signature Verification",
    description: "Cryptographic signature matches issuer public key",
    detail: "This demonstration uses unsigned receipts. V₂ requires a trusted issuer key and is skipped.",
    status: "skipped",
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
  const v5 = await verifyEvidenceIntegrity(receipt);
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

  // V₇: Predecessor Chain (skipped — needs external context)
  steps.push({
    id: "V₇",
    label: "Predecessor Chain",
    description: "Hash chain links to predecessor receipt",
    detail: "This is a genesis receipt (no predecessor). V₇ applies when previousReceiptHash is non-null.",
    status: "skipped",
  });

  // Overall verdict: VALID only if all non-skipped steps pass
  const failures = steps.filter((s) => s.status === "fail");
  const verdict = failures.length === 0 ? "VALID" : "INVALID";

  return { steps, verdict };
}

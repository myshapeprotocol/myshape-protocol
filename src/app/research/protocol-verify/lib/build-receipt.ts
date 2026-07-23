// ═══════════════════════════════════════════════════════════════════
// Phase A — Receipt Builder
//
// Pure: EngineEvidence[] → ContinuityReceipt
// Does NOT make business decisions (no allow/deny, no risk, no verdict).
// It only converts collected evidence into a protocol object.
//
// Every receipt is sidecar-verified immediately after generation
// using the CPS-0001 Reference Verifier.
// ═══════════════════════════════════════════════════════════════════

import {
  engineEvidenceToBlock,
  buildReceipt,
  verifyReceipt,
  createReceiptId,
  type ContinuityReceipt,
  type SubjectRef,
  type IssuerIdentity,
  type VerificationResult,
} from "@/lib/evidence/cps0001";
import type { EngineEvidence } from "@/lib/evidence/types";

export interface BuildReceiptParams {
  /** Collected evidence from all engines */
  evidence: EngineEvidence[];
  /** Wall-clock time when evidence collection started */
  startTime: Date;
  /** Wall-clock time when evidence collection ended (all engines) */
  endTime: Date;
  /** Optional subject pseudonym. Generated if omitted. */
  subjectId?: string;
  /** Previous receipt hash for chain linking. null = genesis. */
  previousReceiptHash?: string | null;
}

export interface BuildReceiptResult {
  /** The signed receipt */
  receipt: ContinuityReceipt;
  /** Immediate verification result from Reference Verifier */
  verification: VerificationResult;
}

/**
 * Build a CPS-0001 ContinuityReceipt from collected evidence.
 *
 * This is the sole bridge between the evidence layer and the protocol layer.
 * It does NOT:
 *  - Compute confidence scores
 *  - Make allow/deny decisions
 *  - Assign verdicts
 *  - Handle policies
 *
 * It only: EngineEvidence[] → EvidenceBlock[] → ContinuityReceipt
 */
export async function buildEvidenceReceipt(
  params: BuildReceiptParams,
): Promise<BuildReceiptResult> {
  const { evidence, startTime, endTime, previousReceiptHash } = params;

  // Resolve subject ID from localStorage or generate fresh
  const subjectId = params.subjectId ?? getOrCreateSubjectId();

  // Step 1: Convert EngineEvidence[] → EvidenceBlock[]
  const evidenceBlocks = await Promise.all(
    evidence.map((e) => engineEvidenceToBlock(e)),
  );

  // Step 2: Build interval from wall-clock times
  const coverageMs = endTime.getTime() - startTime.getTime();

  // Step 3: Create subject reference
  const subject: SubjectRef = {
    id: `sha256:${subjectId}`,
    type: "embodied",
  };

  // Step 4: Create demo issuer (not a real key)
  const issuer: IssuerIdentity = {
    id: "sha256:myshape-protocol-walkthrough",
    publicKey: "demo-placeholder-unsigned",
  };

  // Step 5: Build receipt (without signature)
  const receiptWithoutSig = buildReceipt({
    evidence: evidenceBlocks,
    interval: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      coverageMs,
    },
    subject,
    issuer,
    previousReceiptHash: previousReceiptHash ?? null,
    // No verdict — builder does not decide
  });

  // Step 6: Add unsigned placeholder signature
  // The receipt is signed with algorithm "unsigned" to indicate this is
  // a demonstration. V₂ (signature verification) is skipped by the
  // Reference Verifier. The receipt is structurally valid and passes V₁.
  const signedAt = new Date().toISOString();
  const receipt: ContinuityReceipt = {
    ...receiptWithoutSig,
    signature: {
      algorithm: "unsigned",
      value: "cps-0001-unsigned-demonstration",
      signedAt,
    },
  };

  // Step 7: Sidecar — verify immediately with Reference Verifier
  const verification = await verifyReceipt(receipt);

  return { receipt, verification };
}

/**
 * Get or create a stable pseudonym from localStorage.
 * Same pattern as /verify page.
 */
function getOrCreateSubjectId(): string {
  if (typeof window === "undefined") return `demo-${Date.now()}`;
  let id = localStorage.getItem("vfy-dev");
  if (!id) {
    id = createReceiptId();
    localStorage.setItem("vfy-dev", id);
  }
  return id;
}

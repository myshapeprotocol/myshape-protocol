// ═══════════════════════════════════════════════════════════════════
// Phase A — Receipt Builder
//
// Pure: EngineEvidence[] → ContinuityReceipt
// Does NOT make business decisions (no allow/deny, no risk, no verdict).
// =====================================================================

import {
  engineEvidenceToBlock,
  buildReceipt,
  verifyReceipt,
  signReceipt,
  createReceiptId,
  canonicalSigningPayload,
  type ContinuityReceipt,
  type SubjectRef,
  type IssuerIdentity,
  type VerificationResult,
} from "@/lib/evidence/cps0001";
import type { EngineEvidence } from "@/lib/evidence/types";
import { getOrCreateKeyPair, createIssuerIdentity } from "@/lib/crypto";
import { getOrCreateBrowserSigner } from "@/lib/browser-keys";

// ⚠️ P0-KEYS: the sync variant below is RESEARCH ONLY.
// getOrCreateKeyPair() is now EPHEMERAL (no localStorage persistence) and the
// issuer identity is not stable across sessions. The production path is
// buildEvidenceReceiptAsync() below, which uses the WebCrypto non-extractable
// browser signer (IndexedDB). The sync variant is retained solely for
// deterministic test fixtures — it is NOT reachable from any production page.

export interface BuildReceiptParams {
  evidence: EngineEvidence[];
  startTime: Date;
  endTime: Date;
  subjectId?: string;
  previousReceiptHash?: string | null;
}

export interface BuildReceiptResult {
  receipt: ContinuityReceipt;
  verification: VerificationResult;
}

export function buildEvidenceReceipt(params: BuildReceiptParams): BuildReceiptResult {
  const subjectId = params.subjectId ?? getOrCreateSubjectId();
  const keyPair = getOrCreateKeyPair();
  const issuer = createIssuerIdentity(keyPair);
  const unsigned = composeEvidenceUnsigned(params, subjectId, issuer);
  const receipt = signReceipt(unsigned, keyPair.secretKey);
  const verification = verifyReceipt(receipt);
  return { receipt, verification };
}

/**
 * Browser-hardened variant: signs with the non-extractable WebCrypto identity
 * (IndexedDB-backed) instead of the legacy localStorage hex key. The receipt
 * shape and verification are identical to the sync version.
 */
export async function buildEvidenceReceiptAsync(params: BuildReceiptParams): Promise<BuildReceiptResult> {
  const subjectId = params.subjectId ?? getOrCreateSubjectId();
  const signer = await getOrCreateBrowserSigner();
  const issuer: IssuerIdentity = { id: signer.id, publicKey: signer.publicKey };
  const unsigned = composeEvidenceUnsigned(params, subjectId, issuer);
  const sig = await signer.sign(canonicalSigningPayload(unsigned));
  const receipt: ContinuityReceipt = {
    ...unsigned,
    signature: { algorithm: "Ed25519", value: sig, signedAt: new Date().toISOString() },
  };
  const verification = verifyReceipt(receipt);
  return { receipt, verification };
}

function composeEvidenceUnsigned(
  params: BuildReceiptParams,
  subjectId: string,
  issuer: IssuerIdentity,
): Omit<ContinuityReceipt, "signature"> {
  const { evidence, startTime, endTime, previousReceiptHash } = params;

  // Step 1: Convert EngineEvidence[] → EvidenceBlock[]
  const evidenceBlocks = evidence.map((e) => engineEvidenceToBlock(e));

  // Step 2: Build interval
  const coverageMs = endTime.getTime() - startTime.getTime();

  // Step 3: Subject reference
  const subject: SubjectRef = {
    id: `sha256:${subjectId}`,
    type: "embodied",
  };

  // Build unsigned receipt
  return buildReceipt({
    evidence: evidenceBlocks,
    interval: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      coverageMs,
    },
    subject,
    issuer,
    previousReceiptHash: previousReceiptHash ?? null,
  });
}

function getOrCreateSubjectId(): string {
  if (typeof window === "undefined") return `demo-${Date.now()}`;
  let id = localStorage.getItem("vfy-dev");
  if (!id) {
    id = createReceiptId();
    localStorage.setItem("vfy-dev", id);
  }
  return id;
}

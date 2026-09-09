// ═══════════════════════════════════════════════════════════════════
// Continuity Verification — composition of existing evidence engines
//
// Composes two verified, browser-capturable engines into a single signed
// CPS-0001 ContinuityReceipt:
//   EE-001  Presence Entropy Score (MediaPipe pose → PES)
//   EE-003  Gyroscope Challenge-Response (DeviceMotion rotationRate)
//
// This module does NOT re-implement any detector logic. It only wires
// existing pure functions together:
//   computeFullPES            (src/engine/presence-entropy.ts)
//   pesToEngineEvidence       (src/sdk/presence-v2.ts)
//   analyzeRound / buildChallengeEvidence (src/lib/evidence/gyro-challenge.ts)
//   buildReceipt / signReceipt / engineEvidenceToBlock (src/lib/evidence/cps0001.ts)
//
// Returns null when there is not enough data for a valid verification —
// callers MUST surface that honestly ("Unable to verify"), never fabricate.
// ═══════════════════════════════════════════════════════════════════

import { computeFullPES, type PESComponents } from "@/engine/presence-entropy";
import { pesToEngineEvidence } from "@/lib/continuity/presence-adapter";
import { buildChallengeEvidence, type RoundResult } from "@/lib/evidence/gyro-challenge";
import {
  buildReceipt,
  signReceipt,
  engineEvidenceToBlock,
  type ContinuityReceipt,
  type AssertionSet,
} from "@/lib/evidence/cps0001";
import { getDeviceSalt } from "@/engine/local-identity";
import { getOrCreateKeyPair, createIssuerIdentity } from "@/lib/crypto";
import { getOrCreateBrowserSigner } from "@/lib/browser-keys";
import { canonicalSigningPayload } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";
import type { JointPosition } from "@/types/motion-vector";

export interface ContinuityVerificationResult {
  /** Signed CPS-0001 ContinuityReceipt (self-issued by this device) */
  receipt: ContinuityReceipt;
  /** continuityMaintained assertion — two-stage (Stage1 AND Stage2) verdict */
  verified: boolean;
  /** Weakest-link confidence [0, 1] (min of EE-001 and EE-003 confidences) */
  confidence: number;
  /** Raw Presence Entropy Score [0, 1] */
  pes: number;
  pesComponents: PESComponents;
  evidenceEngines: string[];
}

// ── Two-stage verdict (EE-001 presence → EE-003 challenge-response) ──

export const PRESENCE_THRESHOLD = 0.5;        // EE-001 confidence ≥ 0.5  → presence established
export const CHALLENGE_PASS_CONFIDENCE = 1.0; // EE-003 confidence === 1.0 → challenge passed (3/3)

export interface TwoStageVerdict {
  stage1Pass: boolean;
  stage2Pass: boolean;
  verified: boolean;
  confidence: number;
}

/**
 * Evaluate the two-stage protocol verdict.
 * Stage 1 = EE-001 presence; Stage 2 = EE-003 challenge-response.
 * Verdict requires BOTH stages — EE-001 must not compensate for EE-003.
 */
export function evaluateTwoStage(ee001Confidence: number, ee003Confidence: number): TwoStageVerdict {
  const stage1Pass = ee001Confidence >= PRESENCE_THRESHOLD;
  const stage2Pass = ee003Confidence >= CHALLENGE_PASS_CONFIDENCE;
  return {
    stage1Pass,
    stage2Pass,
    verified: stage1Pass && stage2Pass,
    confidence: Math.min(ee001Confidence, ee003Confidence),
  };
}

/**
 * Build the two-stage assertions for the /try receipt.
 * continuityMaintained reflects the two-stage verdict; confidence is weakest-link.
 */
export function buildTwoStageAssertions(
  ee001Confidence: number,
  ee003Confidence: number,
): AssertionSet {
  const { verified, confidence } = evaluateTwoStage(ee001Confidence, ee003Confidence);
  return {
    observationOccurred: { value: true, confidence: 0.95 },
    continuityMaintained: { value: verified, confidence },
    receiptIntegrity: { value: true, confidence: 1.0 },
  };
}

/**
 * Run EE-001 + EE-003 over captured data and produce a signed receipt.
 *
 * @param sstFrames    Pose frames in SST-18 topology (mediaPipeToSST output)
 * @param timestamps   Per-frame monotonic timestamps (same length as sstFrames)
 * @param challengeResults  EE-003 round results (from analyzeRound, one per round)
 * @param windowSeconds  Nominal continuity interval (default 8s — the pose capture length)
 * @returns result, or null if insufficient data (fewer than 8 pose frames or no challenge rounds)
 */
export function runContinuityVerification(
  sstFrames: Array<Record<number, JointPosition>>,
  timestamps: number[],
  challengeResults: RoundResult[],
  windowSeconds = 8,
): ContinuityVerificationResult | null {
  const composed = composeTwoStage(sstFrames, timestamps, challengeResults, windowSeconds);
  if (!composed) return null;

  const keyPair = getOrCreateKeyPair();
  const issuer = createIssuerIdentity(keyPair);
  const unsigned = buildReceipt({ ...composed.receiptArgs, issuer });
  const receipt = signReceipt(unsigned, keyPair.secretKey);

  return {
    receipt,
    verified: receipt.assertions.continuityMaintained.value,
    confidence: receipt.assertions.continuityMaintained.confidence,
    pes: composed.pes,
    pesComponents: composed.components,
    evidenceEngines: composed.evidence.map((e) => e.engineId),
  };
}

/**
 * Browser-hardened variant of runContinuityVerification: signs with the
 * non-extractable WebCrypto identity (IndexedDB-backed) instead of the
 * legacy localStorage hex key. Signatures are verifier-identical.
 */
export async function runContinuityVerificationAsync(
  sstFrames: Array<Record<number, JointPosition>>,
  timestamps: number[],
  challengeResults: RoundResult[],
  windowSeconds = 8,
): Promise<ContinuityVerificationResult | null> {
  const composed = composeTwoStage(sstFrames, timestamps, challengeResults, windowSeconds);
  if (!composed) return null;

  const signer = await getOrCreateBrowserSigner();
  const issuer = { id: signer.id, publicKey: signer.publicKey };
  const unsigned = buildReceipt({ ...composed.receiptArgs, issuer });
  const sig = await signer.sign(canonicalSigningPayload(unsigned));
  const receipt: ContinuityReceipt = {
    ...unsigned,
    signature: { algorithm: "Ed25519", value: sig, signedAt: new Date().toISOString() },
  };

  return {
    receipt,
    verified: receipt.assertions.continuityMaintained.value,
    confidence: receipt.assertions.continuityMaintained.confidence,
    pes: composed.pes,
    pesComponents: composed.components,
    evidenceEngines: composed.evidence.map((e) => e.engineId),
  };
}

/** Shared composition for sync/async variants. Returns null when data insufficient. */
function composeTwoStage(
  sstFrames: Array<Record<number, JointPosition>>,
  timestamps: number[],
  challengeResults: RoundResult[],
  windowSeconds: number,
): { receiptArgs: Omit<Parameters<typeof buildReceipt>[0], "issuer">; pes: number; components: PESComponents; evidence: ReturnType<typeof engineEvidenceToBlock>[] } | null {
  if (sstFrames.length < 8 || timestamps.length < 8 || challengeResults.length === 0) {
    return null;
  }

  const { pes, components } = computeFullPES(sstFrames, timestamps);

  const ee001 = pesToEngineEvidence(pes, components, new Date().toISOString());
  const ee003 = buildChallengeEvidence(challengeResults);

  const assertions = buildTwoStageAssertions(ee001.confidence ?? 0, ee003.confidence ?? 0);

  const evidence = [engineEvidenceToBlock(ee001), engineEvidenceToBlock(ee003)];

  const now = new Date();
  const intervalStart = new Date(now.getTime() - windowSeconds * 1000);

  const subject = { id: sha256Hex(getDeviceSalt()), type: "embodied" as const };

  return {
    receiptArgs: {
      evidence,
      interval: {
        start: intervalStart.toISOString(),
        end: now.toISOString(),
        coverageMs: windowSeconds * 1000,
      },
      subject,
      assertions,
    },
    pes,
    components,
    evidence,
  };
}

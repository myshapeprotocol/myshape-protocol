/**
 * MyShape Protocol — verifyContinuity()
 *
 * Single entry point for motion-signature verification.
 * RFC-0001 conformant. Reference implementation.
 *
 * Two-stage verification (v0.2):
 *   Stage 1: EE-001 Presence Entropy Score (PES) — presence established (≥ 0.50)
 *   Stage 2: EE-003 Challenge-Response — all 3 rounds pass (=== 1.000)
 *   EE-002 (Cross-Modal Causal Coupling) remains informational — not in verdict
 *
 * @example
 * ```ts
 * import { verifyContinuity } from "@thecontinuitylab/myshape";
 *
 * const result = await verifyContinuity({
 *   imuSamples: [...],
 *   cameraSamples: [...],
 *   frames: [...],          // optional: for PES
 *   timestamps: [...],      // optional: for PES
 *   challengeResults: [...],// optional: for EE-003
 * });
 * // → { verdict, confidence, evidence, threatReport }
 * ```
 */

// ── Public types ──
// Two-stage verdict output types (current).
export type {
  EngineEvidence,
  ComponentEvidence,
  Verdict,
  EvidenceStatus,
} from "./types.js";

// ── Legacy weighted-policy types (deprecated — NOT the CPS-0001 v0.2 verdict) ──
export type {
  EvidenceReceipt,
  VerificationPolicy,
  VerificationSession,
  SessionPhase,
  EscalationStrategy,
  EscalationStep,
} from "./types.js";

export type {
  IMUSample,
  CameraSample,
  JerkEvent,
  DirChangeEvent,
  MatchedEvent,
} from "./causal-coupling.js";

export type {
  Direction,
  RoundResult,
  GyroSample,
  GyroAnalysis,
} from "./gyro-challenge.js";

export type {
  JointPosition,
  PESComponents,
} from "./presence-entropy.js";

export type {
  ThreatClass,
  AttackSignature,
  AttackCostTier,
  AttackCost,
  ThreatReport,
} from "./threat-assessment.js";

// ── Core functions ──
export {
  computeStatus,
  computeHint,
  hashEvidence,
} from "./types.js";

// Legacy weighted-policy evaluator (deprecated — NOT the CPS-0001 v0.2 verdict).
export { evaluatePolicy } from "./types.js";

export {
  median,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
  MATCH_WINDOW_MS,
  JERK_MIN_THRESHOLD,
  TEMPORAL_ALIGNMENT_THRESHOLD,
  DIRECTION_AGREEMENT_THRESHOLD,
  EVENT_DENSITY_THRESHOLD,
} from "./causal-coupling.js";

export {
  analyzeRound,
  buildChallengeEvidence,
  pick,
  DIRECTIONS,
  DIRECTION_ARROW,
  BASE_COUNTDOWN_MS,
  CAPTURE_DURATION_MS,
} from "./gyro-challenge.js";

export {
  computeMicroTimingVariance,
  computeNoiseResidual,
  computeFrequencyEntropy,
  computeBiologicalPerturbation,
  computePES,
  computeFullPES,
  buildPESEvidence,
} from "./presence-entropy.js";

export {
  assessThreat,
  ATTACK_SIGNATURES,
  ATTACK_COST_MODEL,
} from "./threat-assessment.js";

// ── CPS-0001 Protocol Layer ──
export type {
  AssertionEntry,
  AssertionSet,
  EvidenceBlock,
  ContinuityInterval,
  SubjectRef,
  PredecessorRef,
  IssuerIdentity,
  ReceiptSignature,
  ContinuityReceipt,
  FailureCode,
  VerificationResult,
} from "./cps0001.js";

// Note: Verdict is already exported from types.js — CPS-0001 re-exports the same type
export {
  createReceiptId,
  computePayloadDigest,
  buildAssertions,
  buildReceipt,
  verifySchema,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  verifyReceipt,
  canonicalSigningPayload,
  signReceipt,
  verifySignature,
  engineEvidenceToBlock,
  canonicalSerialize,
  computeReceiptHash,
  verifyPredecessor,
} from "./cps0001.js";

export type { ChainStore } from "./cps0001.js";

export {
  generateKeyPair,
  getPublicKey,
  sign,
  verify,
  createIssuerIdentity,
  getOrCreateKeyPair,
} from "./crypto.js";

export type { KeyPair } from "./crypto.js";

// ── High-level API ──

import type { IMUSample, CameraSample } from "./causal-coupling.js";
import type { RoundResult } from "./gyro-challenge.js";
import type { JointPosition, PESComponents } from "./presence-entropy.js";
import type { EngineEvidence, Verdict, VerificationPolicy } from "./types.js";
import type { ThreatReport } from "./threat-assessment.js";

import { detectJerkPeaks, detectDirectionChanges, matchEvents, buildEvidence } from "./causal-coupling.js";
import { buildChallengeEvidence } from "./gyro-challenge.js";
import { computeFullPES, buildPESEvidence } from "./presence-entropy.js";
import { assessThreat } from "./threat-assessment.js";

export interface VerifyContinuityInput {
  /** IMU sensor samples (required for EE-002) */
  imuSamples: IMUSample[];
  /** Camera motion samples (optional, for EE-002 cross-modal) */
  cameraSamples?: CameraSample[];
  /** Pose frames for PES (optional, for EE-001) */
  frames?: Array<Record<number, JointPosition>>;
  /** Timestamps for PES frames (optional, for EE-001) */
  timestamps?: number[];
  /** Challenge round results (optional, for EE-003) */
  challengeResults?: RoundResult[];
  /**
   * @deprecated Legacy weighted-policy override. The CPS-0001 v0.2 two-stage
   * verdict uses fixed thresholds (EE-001 ≥ 0.50, EE-003 = 1.000) and ignores
   * this field entirely. It does not participate in the v0.2 verdict.
   */
  policy?: VerificationPolicy;
  /** Sampling duration in ms (default 8000) */
  duration?: number;
}

export interface VerifyContinuityOutput {
  verdict: Verdict;
  confidence: number;
  evidence: EngineEvidence[];
  threatReport?: ThreatReport;
}

// ── Two-stage verdict thresholds (v0.2) ──
const PRESENCE_THRESHOLD = 0.5;        // Stage 1: EE-001 confidence ≥ 0.5  → presence established
const CHALLENGE_PASS_CONFIDENCE = 1.0; // Stage 2: EE-003 confidence === 1.0 → all 3 rounds passed

/**
 * verifyContinuity — two-stage continuity verification (v0.2).
 *
 * Stage 1 (EE-001): Presence Entropy Score — presence established when ≥ 0.50
 *   Requires: frames + timestamps
 *
 * Stage 2 (EE-003): Challenge-Response — all 3 rounds must pass (=== 1.000)
 *   Requires: challengeResults
 *
 * Both stages are mandatory: presence must not compensate for an
 * incomplete challenge. EE-002 (Cross-Modal Causal Coupling) is still
 * computed when imuSamples are provided, but does not participate in the verdict.
 * verdict = stage1Pass && stage2Pass; confidence = min(EE-001, EE-003).
 */
export async function verifyContinuity(input: VerifyContinuityInput): Promise<VerifyContinuityOutput> {
  const { imuSamples, cameraSamples, frames, timestamps, challengeResults, duration = 8000 } = input;

  const allEvidence: EngineEvidence[] = [];

  // ── Layer 1: EE-001 — Presence Entropy Score ──
  if (frames && frames.length > 0 && timestamps && timestamps.length > 0) {
    const { pes, components } = computeFullPES(frames, timestamps);
    const pesEvidence = buildPESEvidence(pes, components);
    allEvidence.push(pesEvidence);
  }

  // ── Layer 2: EE-002 — Cross-Modal Causal Coupling ──
  if (imuSamples && imuSamples.length > 0) {
    const imuEvents = detectJerkPeaks(imuSamples);
    const camEvents = cameraSamples ? detectDirectionChanges(cameraSamples) : [];
    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);

    const lastImuT = imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0;
    const lastCamT = camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0;
    const totalDuration = Math.max(lastImuT, lastCamT, duration);

    const causalEvidence = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, totalDuration);
    allEvidence.push(causalEvidence);
  }

  // ── Layer 3: EE-003 — Challenge-Response ──
  if (challengeResults && challengeResults.length > 0) {
    const challengeEvidence = buildChallengeEvidence(challengeResults);
    allEvidence.push(challengeEvidence);
  }

  // ── Two-stage verdict (v0.2) ──
  // Stage 1 = EE-001 presence (≥ 0.50); Stage 2 = EE-003 challenge (=== 1.000).
  // Both mandatory — presence must not compensate for an incomplete challenge.
  const ee001 = allEvidence.find((e) => e.engineId === "EE-001");
  const ee003 = allEvidence.find((e) => e.engineId === "EE-003");

  // Threat assessment (if PES evidence available)
  let threatReport: ThreatReport | undefined;
  if (ee001) {
    const mtComp = ee001.components.find((c) => c.metric === "IMU_PES");
    const nrComp = ee001.components.find((c) => c.metric === "Camera_PES");
    const feComp = ee001.components.find((c) => c.metric === "FrequencyEntropy");
    const bioComp = ee001.components.find((c) => c.metric === "BiologicalPerturbation");
    const pesComp = ee001.components.find((c) => c.metric === "PresenceEntropyScore");

    if (mtComp && nrComp && bioComp && pesComp) {
      const components: PESComponents = {
        microTimingVariance: mtComp.value,
        noiseResidual: nrComp.value,
        frequencyEntropy: feComp?.value ?? 0,
        biologicalPerturbation: bioComp.value,
      };
      threatReport = assessThreat(pesComp.value, components);
    }
  }

  // Both stages are required for a verdict.
  if (!ee001 || !ee003) {
    return {
      verdict: "INSUFFICIENT_EVIDENCE",
      confidence: 0,
      evidence: allEvidence,
      threatReport,
    };
  }

  const ee001Confidence = ee001.confidence ?? 0;
  const ee003Confidence = ee003.confidence ?? 0;
  const stage1Pass = ee001Confidence >= PRESENCE_THRESHOLD;
  const stage2Pass = ee003Confidence >= CHALLENGE_PASS_CONFIDENCE;
  const verified = stage1Pass && stage2Pass;
  const confidence = Math.min(ee001Confidence, ee003Confidence);
  const verdict: Verdict = verified ? "PASS" : "FAIL";

  return {
    verdict,
    confidence,
    evidence: allEvidence,
    threatReport,
  };
}
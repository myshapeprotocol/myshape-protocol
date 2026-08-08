/**
 * MyShape Protocol — verifyContinuity()
 *
 * Single entry point for motion-signature verification.
 * RFC-0001 conformant. Reference implementation.
 *
 * 4-layer pipeline:
 *   1. EE-001: Presence Entropy Score (PES) — is there a living entity?
 *   2. EE-002: Cross-Modal Causal Coupling — do sensors see the same event?
 *   3. EE-003: Challenge-Response — randomized gyro challenge defeats replay
 *   4. VS-001: Verification Session — aggregate confidence + escalation
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
export type {
  EngineEvidence,
  ComponentEvidence,
  Verdict,
  EvidenceReceipt,
  VerificationPolicy,
  VerificationSession,
  SessionPhase,
  EscalationStrategy,
  EscalationStep,
  EvidenceStatus,
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
  evaluatePolicy,
} from "./types.js";

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

// ── High-level API ──

import type { IMUSample, CameraSample } from "./causal-coupling.js";
import type { RoundResult } from "./gyro-challenge.js";
import type { JointPosition, PESComponents } from "./presence-entropy.js";
import type { EngineEvidence, Verdict, VerificationPolicy } from "./types.js";
import type { ThreatReport } from "./threat-assessment.js";

import { evaluatePolicy } from "./types.js";
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
  /** Verification policy override */
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

/**
 * verifyContinuity — 4-layer continuity verification pipeline.
 *
 * Layer 1 (EE-001): PES — passive biological presence detection
 *   Requires: frames + timestamps (optional but recommended)
 *
 * Layer 2 (EE-002): Cross-Modal Causal Coupling — sensor agreement
 *   Requires: imuSamples + cameraSamples
 *
 * Layer 3 (EE-003): Challenge-Response — active replay defeat
 *   Requires: challengeResults (optional, used when escalation needed)
 *
 * Layer 4 (VS-001): Session aggregation — confidence merge + policy
 *   Always runs — aggregates all available evidence
 */
export async function verifyContinuity(input: VerifyContinuityInput): Promise<VerifyContinuityOutput> {
  const { imuSamples, cameraSamples, frames, timestamps, challengeResults, policy, duration = 8000 } = input;

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

  // ── Layer 4: VS-001 — Session Aggregation ──
  if (allEvidence.length === 0) {
    return {
      verdict: "INSUFFICIENT_EVIDENCE",
      confidence: 0,
      evidence: [],
    };
  }

  // Weighted confidence aggregation
  // PES (EE-001): weight 0.35 — strongest single signal
  // Causal (EE-002): weight 0.40 — primary cross-modal check
  // Challenge (EE-003): weight 0.25 — active confirmation
  const weights: Record<string, number> = {
    "EE-001": 0.35,
    "EE-002": 0.40,
    "EE-003": 0.25,
  };

  let totalWeight = 0;
  let weightedConfidence = 0;

  for (const ev of allEvidence) {
    const w = weights[ev.engineId] ?? 0.20;
    totalWeight += w;
    weightedConfidence += w * (ev.confidence ?? 0);
  }

  const aggregateConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;

  // Threat assessment (if PES evidence available)
  let threatReport: ThreatReport | undefined;
  const pesEvidence = allEvidence.find((e) => e.engineId === "EE-001");
  if (pesEvidence) {
    const mtComp = pesEvidence.components.find((c) => c.metric === "IMU_PES");
    const nrComp = pesEvidence.components.find((c) => c.metric === "Camera_PES");
    const feComp = pesEvidence.components.find((c) => c.metric === "FrequencyEntropy");
    const bioComp = pesEvidence.components.find((c) => c.metric === "BiologicalPerturbation");
    const pesComp = pesEvidence.components.find((c) => c.metric === "PresenceEntropyScore");

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

  // Policy evaluation
  const defaultPolicy: VerificationPolicy = {
    policyId: "default",
    acceptThreshold: 0.70,
    rejectThreshold: 0.35,
    ...policy,
  };

  const verdict = evaluatePolicy(defaultPolicy, aggregateConfidence);

  return {
    verdict,
    confidence: aggregateConfidence,
    evidence: allEvidence,
    threatReport,
  };
}
/**
 * MyShape Protocol — verifyContinuity()
 *
 * Single entry point for motion-signature verification.
 * RFC-0001 conformant. Reference implementation.
 *
 * @example
 * ```ts
 * import { verifyContinuity } from "myshape";
 *
 * const result = await verifyContinuity({
 *   imuSamples: [...],
 *   cameraSamples: [...],
 * });
 * // → { verdict, confidence, evidence }
 * ```
 */

// ── Public types ──
export type {
  EngineEvidence,
  ComponentEvidence,
  Verdict,
  EvidenceReceipt,
  VerificationPolicy,
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
} from "./gyro-challenge.js";

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

// ── High-level API ──

import type { IMUSample, CameraSample } from "./causal-coupling.js";
import type { EngineEvidence, Verdict, VerificationPolicy } from "./types.js";
import { evaluatePolicy } from "./types.js";
import { detectJerkPeaks, detectDirectionChanges, matchEvents, buildEvidence } from "./causal-coupling.js";

export interface VerifyContinuityInput {
  imuSamples: IMUSample[];
  cameraSamples?: CameraSample[];
  policy?: VerificationPolicy;
  duration?: number;
}

export interface VerifyContinuityOutput {
  verdict: Verdict;
  confidence: number;
  evidence: EngineEvidence;
}

export async function verifyContinuity(input: VerifyContinuityInput): Promise<VerifyContinuityOutput> {
  const { imuSamples, cameraSamples, policy, duration = 8000 } = input;

  const imuEvents = detectJerkPeaks(imuSamples);
  const camEvents = cameraSamples ? detectDirectionChanges(cameraSamples) : [];
  const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);

  const lastImuT = imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0;
  const lastCamT = camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0;
  const totalDuration = Math.max(lastImuT, lastCamT, duration);

  const evidence = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, totalDuration);

  const defaultPolicy: VerificationPolicy = {
    policyId: "default",
    acceptThreshold: 0.70,
    rejectThreshold: 0.35,
    ...policy,
  };

  return {
    verdict: evaluatePolicy(defaultPolicy, evidence.confidence ?? 0),
    confidence: evidence.confidence ?? 0,
    evidence,
  };
}

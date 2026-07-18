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
 *   cameraSamples: [...], // optional
 * });
 * // → { verdict, confidence, evidence }
 * ```
 *
 * @packageDocumentation
 */

// Re-export public types
export type {
  IMUSample,
  CameraSample,
  EngineEvidence,
  ComponentEvidence,
  Verdict,
  EvidenceReceipt,
  VerificationPolicy,
} from "../../../src/lib/evidence/types";

export type {
  JerkEvent,
  DirChangeEvent,
  MatchedEvent,
} from "../../../src/lib/evidence/causal-coupling";

export type {
  Direction,
  RoundResult,
} from "../../../src/lib/evidence/gyro-challenge";

// Re-export core functions
export {
  computeStatus,
  computeHint,
  hashEvidence,
  evaluatePolicy,
} from "../../../src/lib/evidence/types";

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
} from "../../../src/lib/evidence/causal-coupling";

export {
  analyzeRound,
  buildChallengeEvidence,
  pick,
  DIRECTIONS,
  DIRECTION_ARROW,
  BASE_COUNTDOWN_MS,
  CAPTURE_DURATION_MS,
} from "../../../src/lib/evidence/gyro-challenge";

// ── High-level API ──

import type { IMUSample, CameraSample, EngineEvidence, Verdict, VerificationPolicy } from "../../../src/lib/evidence/types";
import { evaluatePolicy } from "../../../src/lib/evidence/types";
import { detectJerkPeaks, detectDirectionChanges, matchEvents, buildEvidence } from "../../../src/lib/evidence/causal-coupling";

export interface VerifyContinuityInput {
  /** IMU samples from accelerometer + gyroscope */
  imuSamples: IMUSample[];
  /** Optional camera samples from motion tracker */
  cameraSamples?: CameraSample[];
  /** Policy configuration */
  policy?: VerificationPolicy;
  /** Total duration in ms (default: 8000) */
  duration?: number;
}

export interface VerifyContinuityOutput {
  verdict: Verdict;
  confidence: number;
  evidence: EngineEvidence;
}

/**
 * Verify continuity of presence from IMU and optional camera data.
 *
 * This is the primary entry point for MyShape Protocol verification.
 * Pass IMU samples (required) and camera samples (optional) to receive
 * a structured verdict with per-component evidence.
 *
 * @param input — IMU samples, optional camera samples, and policy config
 * @returns verdict, confidence score, and structured evidence
 *
 * @example
 * ```ts
 * const result = await verifyContinuity({
 *   imuSamples: deviceMotionEvents,
 *   cameraSamples: videoMotionFrames,
 * });
 *
 * if (result.verdict === "PASS") {
 *   console.log(`Verified: ${result.confidence * 100}% confidence`);
 * }
 * ```
 */
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

  const verdict = evaluatePolicy(defaultPolicy, evidence.confidence ?? 0);

  return { verdict, confidence: evidence.confidence ?? 0, evidence };
}

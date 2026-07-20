// ═══════════════════════════════════════════════════════════════════
// EE-003 · Gyroscope Challenge — shared pure functions
//
// Extracted from ChallengeClient.tsx and ProtocolVerifyClient.tsx
// to eliminate duplication. Both components share the same gyro
// analysis and evidence-building logic with different UI wrappers.
// ═══════════════════════════════════════════════════════════════════

import { type ComponentEvidence, type EngineEvidence, computeHint } from "./types.js";

// ── Types ──

export type Direction = "←" | "↑" | "→" | "↓";

export interface GyroSample {
  t: number;
  ax: number; ay: number; az: number;
  rx: number; ry: number; rz: number;
}

export interface RoundResult {
  round: number;
  direction: Direction;
  jitterMs: number;
  angleDeg: number;
  directionMatch: boolean;
  peakG: number;
  magnitudeStatus: "PASS" | "FAIL" | "INSUFFICIENT";
  sampleCount: number;
}

export interface GyroAnalysis {
  meanAngle: number;
  angleDeg: number;
  directionMatch: boolean;
  peakG: number;
  magnitudeStatus: "PASS" | "FAIL" | "INSUFFICIENT";
}

// ── Configuration ──

export const DIRECTION_ARROW: Record<Direction, string> = {
  "←": "⟵", "↑": "⟰", "→": "⟶", "↓": "⟱",
};

export const DIRECTIONS: Direction[] = ["←", "↑", "→", "↓"];

export const TOTAL_ROUNDS = 3;
export const BASE_COUNTDOWN_MS = 2000;
export const MAX_JITTER_MS = 1000;
export const CAPTURE_DURATION_MS = 2000;
export const GYRO_THRESHOLD_DEG_S = 40;  // minimum rotation rate °/s for motion detection
export const MAGNITUDE_PASS_G = 0.22;    // minimum peak g for PASS (phone-calibrated)
export const MAGNITUDE_MIN_G = 0.10;     // minimum peak g for INSUFFICIENT
export const PREDICTABILITY_ANGLE_VAR_THRESHOLD = 100;
export const PREDICTABILITY_MAG_VAR_THRESHOLD = 0.05;

// ── Utilities ──

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function angleDiffDeg(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a - b));
  return (Math.min(diff, 2 * Math.PI - diff) * 180) / Math.PI;
}

// ── Gyro axis mapping ──

/** Which gyro axis to use for each target direction */
export function gyroAxisFor(dir: Direction): "rx" | "ry" {
  return dir === "←" || dir === "→" ? "rx" : "ry";
}

/** Expected sign for the peak rotation rate */
export function expectedSign(dir: Direction): number {
  // Empirically calibrated from 20 live runs (2026-07-14):
  //   ⟱ (tilt away)  = -1  → 100%  ✓
  //   ⟶ (rotate right) = +1 → 80%   ✓
  //   ⟰ (tilt toward) ⇒ -1 (was +1)  → was 18%
  //   ⟵ (rotate left)  ⇒ +1 (was -1) → was 0%
  return dir === "↓" || dir === "↑" ? -1 : 1;
}

// ── Core analysis ──

/**
 * Analyze gyroscope samples for a single challenge round.
 * Pure function — no DOM, no state, no randomness.
 *
 * directionMatch: did the peak rotation direction match the challenge?
 * magnitudeStatus: was the rotation rate sufficient?
 */
export function analyzeRound(
  samples: GyroSample[],
  targetDir: Direction,
): GyroAnalysis {
  let peakG = 0;
  const axis = gyroAxisFor(targetDir);
  const sign = expectedSign(targetDir);
  let peakRot = 0;
  let maxAbsRotation = 0;

  for (const s of samples) {
    const g = Math.sqrt(s.ax * s.ax + s.ay * s.ay + s.az * s.az) / 9.8;
    if (g > peakG) peakG = g;

    const rate = axis === "rx" ? s.rx : s.ry;
    if (Math.abs(rate) > Math.abs(peakRot)) peakRot = rate;
    if (Math.abs(rate) > maxAbsRotation) maxAbsRotation = Math.abs(rate);
  }

  const directionMatch = (sign > 0 && peakRot > 0) || (sign < 0 && peakRot < 0);

  let magnitudeStatus: "PASS" | "FAIL" | "INSUFFICIENT";
  if (maxAbsRotation >= GYRO_THRESHOLD_DEG_S) magnitudeStatus = "PASS";
  else if (maxAbsRotation >= GYRO_THRESHOLD_DEG_S * 0.5) magnitudeStatus = "INSUFFICIENT";
  else magnitudeStatus = "FAIL";

  const angleDeg = Math.round(Math.abs(peakRot));

  return { meanAngle: peakRot, angleDeg, directionMatch, peakG, magnitudeStatus };
}

// ── Evidence builder ──

/**
 * Build EngineEvidence from 3-round challenge results.
 * Pure function — no side effects (timestamp is the only impurity).
 */
export function buildChallengeEvidence(
  results: RoundResult[],
): EngineEvidence {
  const components: ComponentEvidence[] = [];
  const diagnostics: string[] = [];

  const directionPasses = results.filter((r) => r.directionMatch).length;
  const directionRate = results.length > 0 ? directionPasses / results.length : 0;

  const magnitudePasses = results.filter((r) => r.magnitudeStatus === "PASS").length;
  const magnitudeRate = results.length > 0 ? magnitudePasses / results.length : 0;

  // DirectionMatch
  const dirStatus: "PASS" | "FAIL" | "INSUFFICIENT" =
    directionRate >= 0.66 ? "PASS" : directionRate >= 0.33 ? "FAIL" : "INSUFFICIENT";
  components.push({
    engine: "EE-003",
    metric: "DirectionMatch",
    value: directionRate,
    threshold: 0.66,
    status: dirStatus,
    explanation: `${directionPasses}/${results.length} rounds matched direction (need ≥2)`,
    hint: computeHint("DirectionAgreement", dirStatus),
  });

  if (dirStatus === "PASS") diagnostics.push("✓ direction match — motion follows challenge");
  else if (directionPasses === 0) diagnostics.push("✗ CFC-007 · Challenge Mismatch: no rounds matched direction");
  else diagnostics.push(`✗ weak direction match (${directionPasses}/${results.length})`);

  // MovementMagnitude
  const magStatus: "PASS" | "FAIL" | "INSUFFICIENT" =
    magnitudeRate >= 0.66 ? "PASS" : magnitudeRate >= 0.33 ? "FAIL" : "INSUFFICIENT";
  components.push({
    engine: "EE-003",
    metric: "MovementMagnitude",
    value: magnitudeRate,
    threshold: 0.66,
    status: magStatus,
    explanation: `${magnitudePasses}/${results.length} rounds had sufficient force (need ≥${MAGNITUDE_PASS_G}g)`,
    hint: computeHint("DirectionAgreement", magStatus),
  });

  if (magStatus === "PASS") diagnostics.push("✓ movement magnitude sufficient");
  else if (magnitudePasses === 0) diagnostics.push("✗ CFC-006 · Challenge Non-Response: no rounds had detectable motion");
  else diagnostics.push(`⚠ weak movement magnitude (${magnitudePasses}/${results.length} rounds)`);

  // ChallengeResponse (aggregate)
  const challengeValue = directionRate * 0.55 + magnitudeRate * 0.45;
  const challengeStatus: "PASS" | "FAIL" | "INSUFFICIENT" =
    challengeValue >= 0.66 ? "PASS" : challengeValue >= 0.33 ? "FAIL" : "INSUFFICIENT";

  components.push({
    engine: "EE-003",
    metric: "ChallengeResponse",
    value: challengeValue,
    threshold: 0.5,
    status: challengeStatus,
    explanation: "directionMatch×0.55 + movementMagnitude×0.45",
    hint: computeHint("CausalEvidence", challengeStatus),
  });

  if (challengeStatus === "PASS") diagnostics.push("✓ Additional Evidence collected");
  else if (challengeStatus === "FAIL") diagnostics.push("✗ Additional Evidence insufficient");

  // CFC-008 Predictability check
  if (results.length >= 3 && directionPasses === results.length && magnitudePasses === results.length) {
    const angles = results.map((r) => r.angleDeg);
    const mags = results.map((r) => r.peakG);
    const angleMean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const magMean = mags.reduce((a, b) => a + b, 0) / mags.length;
    const angleVar = angles.reduce((s, a) => s + (a - angleMean) ** 2, 0) / angles.length;
    const magVar = mags.reduce((s, m) => s + (m - magMean) ** 2, 0) / mags.length;

    if (angleVar < PREDICTABILITY_ANGLE_VAR_THRESHOLD && magVar < PREDICTABILITY_MAG_VAR_THRESHOLD) {
      diagnostics.push(
        `⚠ CFC-008 · Challenge Predictability: motion too consistent ` +
        `(angleVar=${angleVar.toFixed(0)}, magVar=${magVar.toFixed(3)}) — may be mechanical/replayed`,
      );
    }
  }

  // Round detail diagnostics
  results.forEach((r) => {
    const ok = r.directionMatch && r.magnitudeStatus === "PASS";
    diagnostics.push(
      `${ok ? "✓" : "✗"} Round ${r.round} ${DIRECTION_ARROW[r.direction]} | ` +
      `gyro:${r.angleDeg}°/s | accel:${r.peakG.toFixed(2)}g | jitter:${r.jitterMs}ms | ${ok ? "PASS" : "FAIL"}`,
    );
  });

  const chalComp = components.find((c) => c.metric === "ChallengeResponse");
  const confidence = chalComp?.value ?? 0;

  return {
    engineId: "EE-003",
    timestamp: new Date().toISOString(),
    components,
    diagnostics,
    confidence,
  };
}

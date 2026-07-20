// ═══════════════════════════════════════════════════════════════════
// EE-002 · Event-Level Causal Coupling — Pure signal-processing core
//
// Extracted from CausalCouplingClient.tsx so the algorithm can be
// tested independently of the browser capture UI.
//
// All functions are pure: same input → same output.
// No DOM, no window, no navigator, no side effects.
// ═══════════════════════════════════════════════════════════════════

import {
  type ComponentEvidence,
  type EngineEvidence,
  computeStatus,
  computeHint,
} from "./types.js";

// ── Internal types ──

export interface IMUSample { t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number; }
export interface CameraSample { t: number; x: number; y: number; z: number; }
export interface JerkEvent { t: number; magnitude: number; ax: number; ay: number; }
export interface DirChangeEvent { t: number; angleDeg: number; fromDx: number; fromDy: number; toDx: number; toDy: number; }
export interface MatchedEvent { imu: JerkEvent; cam: DirChangeEvent; dtMs: number; directionAligned: boolean; }

// ── Candidate Parameters v0.1 ──

export const DIRECTION_TOLERANCE_DEG = 90;  // empirical — evaluate 45°/60°/120°
export const MATCH_WINDOW_MS = 500;  // v0.2: phone-calibrated (was 200)
export const JERK_MIN_THRESHOLD = 0.15;  // v0.3: natural hand motion (was 0.5→0.2→0.10→0.15)
// Note: PE-001 (EE-002) is a concept validation. The single-device constraint
// (camera on the same phone as IMU) limits causal discriminability — hand tremor
// couples both channels even during "uncoupled" tests. A production implementation
// needs an independent camera or a higher-order causal model (Granger, transfer entropy).
export const DIR_CHANGE_MIN_ANGLE_DEG = 45;
export const MIN_SPEED = 0.2;  // v0.2: phone-calibrated (was 0.3)
export const CAMERA_PIPELINE_LATENCY_MS = 80;  // v0.2: camera leads IMU by ~80ms on iPhone
export const CFC_005_INVERSION_THRESHOLD_MS = 250;  // v0.2: phone-calibrated (was 50)

// Thresholds for ComponentEvidence status
export const TEMPORAL_ALIGNMENT_THRESHOLD = 0.25;  // v0.2: phone-calibrated (was 0.40)
export const DIRECTION_AGREEMENT_THRESHOLD = 0.50;
export const EVENT_DENSITY_THRESHOLD = 0.2;  // v0.2: phone-calibrated (was 0.3)
export const CAUSAL_EVIDENCE_THRESHOLD = 0.30;  // v0.2: phone-calibrated (was 0.40)

// ── Utilities ──

export function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

// ── Jerk peak detection ──

/**
 * Detect jerk peaks using MAD-based (Median Absolute Deviation) thresholding.
 * Jerk = derivative of acceleration: sqrt((dax/dt)² + (day/dt)² + (daz/dt)²)
 * Peaks are local maxima exceeding median + 3×MAD, with ≥200ms refractory period.
 */
export function detectJerkPeaks(samples: IMUSample[]): JerkEvent[] {
  if (samples.length < 10) return [];
  const jerkMag: number[] = [];
  const jerkVec: { ax: number; ay: number; t: number }[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].t - samples[i - 1].t) / 1000;
    if (dt <= 0 || dt > 0.5) continue;
    const jx = (samples[i].ax - samples[i - 1].ax) / dt;
    const jy = (samples[i].ay - samples[i - 1].ay) / dt;
    const jz = (samples[i].az - samples[i - 1].az) / dt;
    jerkMag.push(Math.sqrt(jx * jx + jy * jy + jz * jz));
    jerkVec.push({ ax: jx, ay: jy, t: samples[i].t });
  }
  if (jerkMag.length < 5) return [];
  const med = median(jerkMag);
  const absDevs = jerkMag.map((v) => Math.abs(v - med));
  const mad = median(absDevs);
  const threshold = Math.max(med + 2 * mad, JERK_MIN_THRESHOLD);
  const peaks: JerkEvent[] = [];
  let lastPeakT = -Infinity;
  for (let i = 1; i < jerkMag.length - 1; i++) {
    if (jerkMag[i] > threshold && jerkMag[i] > jerkMag[i - 1] && jerkMag[i] > jerkMag[i + 1]) {
      if (jerkVec[i].t - lastPeakT >= 150) {
        peaks.push({ t: jerkVec[i].t, magnitude: jerkMag[i], ax: jerkVec[i].ax, ay: jerkVec[i].ay });
        lastPeakT = jerkVec[i].t;
      }
    }
  }
  return peaks;
}

// ── Direction change detection ──

/**
 * Detect trajectory turning points from camera landmark samples.
 * Uses 3-point moving average smoothing, velocity from 2-frame stride,
 * and angle thresholding on the dot/cross product.
 * Returns direction change events where the angle exceeds DIR_CHANGE_MIN_ANGLE_DEG,
 * with ≥300ms refractory period.
 */
export function detectDirectionChanges(samples: CameraSample[]): DirChangeEvent[] {
  if (samples.length < 6) return [];
  const smoothed: CameraSample[] = [];
  for (let i = 0; i < samples.length; i++) {
    let sx = samples[i].x, sy = samples[i].y, sz = samples[i].z, c = 1;
    if (i > 0) { sx += samples[i - 1].x; sy += samples[i - 1].y; sz += samples[i - 1].z; c++; }
    if (i < samples.length - 1) { sx += samples[i + 1].x; sy += samples[i + 1].y; sz += samples[i + 1].z; c++; }
    smoothed.push({ t: samples[i].t, x: sx / c, y: sy / c, z: sz / c });
  }
  const velocities: { t: number; dx: number; dy: number; speed: number }[] = [];
  for (let i = 2; i < smoothed.length; i++) {
    const dt = (smoothed[i].t - smoothed[i - 2].t) / 1000;
    if (dt <= 0 || dt > 0.5) continue;
    const dx = (smoothed[i].x - smoothed[i - 2].x) / dt;
    const dy = (smoothed[i].y - smoothed[i - 2].y) / dt;
    velocities.push({ t: smoothed[i].t, dx, dy, speed: Math.sqrt(dx * dx + dy * dy) });
  }
  if (velocities.length < 4) return [];
  const events: DirChangeEvent[] = [];
  let lastEventT = -Infinity;
  for (let i = 2; i < velocities.length; i++) {
    const prev = velocities[i - 2]; const curr = velocities[i];
    if (prev.speed < MIN_SPEED || curr.speed < MIN_SPEED) continue;
    const dot = prev.dx * curr.dx + prev.dy * curr.dy;
    const cross = prev.dx * curr.dy - prev.dy * curr.dx;
    const angleDeg = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
    if (angleDeg > DIR_CHANGE_MIN_ANGLE_DEG && curr.t - lastEventT >= 300) {
      events.push({ t: curr.t, angleDeg: Math.round(angleDeg), fromDx: prev.dx, fromDy: prev.dy, toDx: curr.dx, toDy: curr.dy });
      lastEventT = curr.t;
    }
  }
  return events;
}

// ── Cross-modal matching ──

/**
 * Match IMU jerk events to camera direction changes within MATCH_WINDOW_MS.
 * One-to-one matching (greedy, nearest-neighbor).
 * Returns matched pairs plus unmatched events from each stream.
 */
export function matchEvents(imuEvents: JerkEvent[], camEvents: DirChangeEvent[]) {
  const usedCam = new Set<number>();
  const matches: MatchedEvent[] = [];
  for (const imu of imuEvents) {
    let bestIdx = -1, bestDt = Infinity;
    for (let j = 0; j < camEvents.length; j++) {
      if (usedCam.has(j)) continue;
      const dt = Math.abs(imu.t - camEvents[j].t);
      if (dt < MATCH_WINDOW_MS && dt < bestDt) { bestDt = dt; bestIdx = j; }
    }
    if (bestIdx >= 0) {
      usedCam.add(bestIdx);
      const cam = camEvents[bestIdx];
      const imuDir = Math.atan2(imu.ay, imu.ax);
      const camDir = Math.atan2(cam.toDy, cam.toDx);
      const dirDiff = Math.abs(imuDir - camDir);
      const directionAligned = Math.min(dirDiff, 2 * Math.PI - dirDiff) < (DIRECTION_TOLERANCE_DEG * Math.PI / 180);
      matches.push({ imu, cam, dtMs: Math.round(bestDt), directionAligned });
    }
  }
  // Match unmatchedIMU: all imuEvents not in matches
  const unmatchedIMU: JerkEvent[] = [];
  for (let i = 0; i < imuEvents.length; i++) {
    if (!matches.some((m) => m.imu === imuEvents[i])) {
      unmatchedIMU.push(imuEvents[i]);
    }
  }
  // unmatchedCam: all camEvents whose index is not in usedCam
  const unmatchedCam: DirChangeEvent[] = [];
  for (let j = 0; j < camEvents.length; j++) {
    if (!usedCam.has(j)) {
      unmatchedCam.push(camEvents[j]);
    }
  }
  return { matches, unmatchedIMU, unmatchedCam };
}

// ── Evidence Builder (outputs standard EngineEvidence) ──

/** Experimental prototype aggregation v0.1. Linear weights are provisional. */
export function buildEvidence(
  imuEvents: JerkEvent[],
  camEvents: DirChangeEvent[],
  matches: MatchedEvent[],
  unmatchedIMU: JerkEvent[],
  unmatchedCam: DirChangeEvent[],
  totalDuration: number,
): EngineEvidence {
  const components: ComponentEvidence[] = [];
  const diagnostics: string[] = [];

  // ── Event Density ──
  const imuDensity = totalDuration > 0 ? imuEvents.length / (totalDuration / 1000) : 0;
  const camDensity = totalDuration > 0 ? camEvents.length / (totalDuration / 1000) : 0;
  const minDensity = Math.min(imuDensity, camDensity);
  const densityValue = Math.min(1, minDensity / 1.5);

  if (imuEvents.length === 0 && camEvents.length === 0) {
    diagnostics.push("✗ no events detected in either channel — insufficient motion or sensor failure");
  } else if (imuEvents.length === 0) {
    diagnostics.push("✗ no IMU jerk peaks detected — sensor may be inactive or motion too subtle");
  } else if (camEvents.length === 0) {
    diagnostics.push("✗ no camera direction changes detected — insufficient landmark data");
  }

  components.push({
    engine: "EE-002", metric: "EventDensity", value: densityValue, threshold: EVENT_DENSITY_THRESHOLD,
    status: computeStatus(densityValue, EVENT_DENSITY_THRESHOLD),
    explanation: `IMU:${imuDensity.toFixed(1)}/s Cam:${camDensity.toFixed(1)}/s (need ≥${EVENT_DENSITY_THRESHOLD}/s)`,
    hint: computeHint("EventDensity", computeStatus(densityValue, EVENT_DENSITY_THRESHOLD)),
  });
  if (minDensity >= EVENT_DENSITY_THRESHOLD) diagnostics.push("✓ event density sufficient");
  else if (imuEvents.length > 0 || camEvents.length > 0) diagnostics.push(`✗ insufficient event density (IMU:${imuDensity.toFixed(1)}/s Cam:${camDensity.toFixed(1)}/s)`);

  // ── Temporal Alignment ──
  const matchRate = Math.max(imuEvents.length, camEvents.length) > 0
    ? matches.length / Math.max(imuEvents.length, camEvents.length) : 0;

  components.push({
    engine: "EE-002", metric: "TemporalAlignment", value: matchRate, threshold: TEMPORAL_ALIGNMENT_THRESHOLD,
    status: computeStatus(matchRate, TEMPORAL_ALIGNMENT_THRESHOLD),
    explanation: `${matches.length}/${Math.max(imuEvents.length, camEvents.length)} events matched within ±${MATCH_WINDOW_MS}ms`,
    hint: computeHint("TemporalAlignment", computeStatus(matchRate, TEMPORAL_ALIGNMENT_THRESHOLD)),
  });
  if (matchRate >= TEMPORAL_ALIGNMENT_THRESHOLD) diagnostics.push("✓ temporal alignment — events coupled across modalities");
  else if (matches.length === 0) diagnostics.push("✗ no matching event pairs — streams may describe different physical events");
  else diagnostics.push(`✗ weak temporal alignment (${matches.length}/${Math.max(imuEvents.length, camEvents.length)} matched)`);

  // Temporal precision check
  if (matches.length > 0) {
    const avgDt = matches.reduce((s, m) => s + Math.abs(m.dtMs), 0) / matches.length;
    if (avgDt > 150) diagnostics.push(`⚠ high temporal jitter (avg Δ${avgDt.toFixed(0)}ms) — timing is loose`);
  }

  // ── Direction Agreement ──
  const directionRate = matches.length > 0 ? matches.filter((m) => m.directionAligned).length / matches.length : 0;
  const dirStatus = matches.length === 0 ? "INSUFFICIENT" as const : computeStatus(directionRate, DIRECTION_AGREEMENT_THRESHOLD);

  components.push({
    engine: "EE-002", metric: "DirectionAgreement", value: directionRate, threshold: DIRECTION_AGREEMENT_THRESHOLD,
    status: dirStatus,
    explanation: matches.length === 0 ? "no matched pairs" : `${matches.filter((m) => m.directionAligned).length}/${matches.length} aligned within ${DIRECTION_TOLERANCE_DEG}°`,
    hint: computeHint("DirectionAgreement", dirStatus),
  });
  if (matches.length === 0) diagnostics.push("— direction agreement: no matched pairs to evaluate");
  else if (dirStatus === "PASS") diagnostics.push("✓ direction agreement — force and motion aligned");
  else diagnostics.push("✗ direction disagreement — streams may point to different motions");

  // ── Causal Evidence (experimental aggregation) ──
  const causalValue = matchRate * 0.45 + directionRate * 0.30 + densityValue * 0.25;
  components.push({
    engine: "EE-002", metric: "CausalEvidence", value: causalValue, threshold: CAUSAL_EVIDENCE_THRESHOLD,
    status: computeStatus(causalValue, CAUSAL_EVIDENCE_THRESHOLD),
    explanation: "experimental prototype aggregation v0.1: matchRate×0.45 + directionAgreement×0.30 + eventDensity×0.25",
    hint: computeHint("CausalEvidence", computeStatus(causalValue, CAUSAL_EVIDENCE_THRESHOLD)),
  });

  // ── CFC-005 check ──
  for (const m of matches) {
    if (m.cam.t < m.imu.t - CFC_005_INVERSION_THRESHOLD_MS) {
      diagnostics.push(`⚠ CFC-005 · Causal Inversion: camera direction change @${m.cam.t}ms precedes IMU jerk @${m.imu.t}ms by ${m.imu.t - m.cam.t}ms`);
      break;
    }
  }

  // Aggregate confidence from causal evidence component
  const causalComp = components.find((c) => c.metric === "CausalEvidence");
  const confidence = causalComp?.value ?? 0;

  return { engineId: "EE-002", timestamp: new Date().toISOString(), components, diagnostics, confidence };
}

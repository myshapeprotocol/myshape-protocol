// ═══════════════════════════════════════════════════════════════════
// EE-003-EVIDENCE-001 · DeviceMotionEvent → sample field mapping (pure)
//
// Single source of truth for the field copy that previously lived inline
// in TryClient's handleIMU:
//     rotationRate.alpha → rx
//     rotationRate.beta  → ry
//     rotationRate.gamma → rz
//     acceleration.x|y|z ?? accelerationIncludingGravity.x|y|z → ax|ay|az
// Values are copied verbatim — no transform, no sign change, no unit
// conversion — then rounded to 3 decimals (identical to the previous
// inline roundVal()). Extracted ONLY so the mapping is unit-testable;
// EE-003 verdict logic (analyzeRound / expectedSign / thresholds /
// 3-of-3 gate) is untouched.
// ═══════════════════════════════════════════════════════════════════

import { type GyroSample } from "./gyro-challenge";
import { type RawSensorSample } from "../try-instrumentation";

/** Structural subset of DeviceMotionEvent — keeps this module DOM-free and
 * unit-testable in a plain node environment. */
export interface DeviceMotionLike {
  acceleration?: { x?: number | null; y?: number | null; z?: number | null } | null;
  accelerationIncludingGravity?: { x?: number | null; y?: number | null; z?: number | null } | null;
  rotationRate?: { alpha?: number | null; beta?: number | null; gamma?: number | null } | null;
}

/** Identical to the previous inline TryClient roundVal(): nullish → 0, else 3-decimal rounding. */
function roundVal(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 1000) / 1000;
}

/** GyroSample consumed by analyzeRound() — exact replacement for the inline
 * handleIMU push. Mapping under test: alpha→rx, beta→ry, gamma→rz. */
export function gyroSampleFromDeviceMotion(e: DeviceMotionLike, t: number): GyroSample {
  return {
    t,
    ax: roundVal(e.acceleration?.x ?? e.accelerationIncludingGravity?.x),
    ay: roundVal(e.acceleration?.y ?? e.accelerationIncludingGravity?.y),
    az: roundVal(e.acceleration?.z ?? e.accelerationIncludingGravity?.z),
    rx: roundVal(e.rotationRate?.alpha),
    ry: roundVal(e.rotationRate?.beta),
    rz: roundVal(e.rotationRate?.gamma),
  };
}

/** Observation-only evidence record: keeps the RAW rotationRate fields under
 * their own names (alpha/beta/gamma) alongside the mapped sample, so future
 * real-phone runs can audit the rx/ry/rz mapping against the raw event. */
export function rawMotionSampleFromDeviceMotion(
  e: DeviceMotionLike,
  t: number,
  orientation: number | "unknown",
): RawSensorSample {
  return {
    t,
    alpha: roundVal(e.rotationRate?.alpha),
    beta: roundVal(e.rotationRate?.beta),
    gamma: roundVal(e.rotationRate?.gamma),
    ax: roundVal(e.acceleration?.x ?? e.accelerationIncludingGravity?.x),
    ay: roundVal(e.acceleration?.y ?? e.accelerationIncludingGravity?.y),
    az: roundVal(e.acceleration?.z ?? e.accelerationIncludingGravity?.z),
    orientation,
  };
}

/** Screen orientation angle if safely available; "unknown" otherwise (SSR,
 * or browsers without Screen Orientation API — e.g. older iOS Safari). */
export function currentScreenOrientation(): number | "unknown" {
  if (typeof screen === "undefined" || !screen.orientation) return "unknown";
  return screen.orientation.angle;
}
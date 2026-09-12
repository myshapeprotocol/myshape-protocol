// EE-003-EVIDENCE-001 — sensor mapping unit tests.
// Pins the DeviceMotionEvent → GyroSample field mapping that the forensic
// audit (EE-003-DIRECTION-MAPPING-AUDIT-001 §G17) identified as the only
// untested link in the EE-003 chain. Before this file, a regression in
// handleIMU (e.g. ry wired to gamma, or a sign flip on beta) would pass the
// entire suite. These tests fail on any axis swap or sign inversion.
import { describe, it, expect } from "vitest";
import {
  gyroSampleFromDeviceMotion,
  rawMotionSampleFromDeviceMotion,
  currentScreenOrientation,
  type DeviceMotionLike,
} from "./device-motion";

type RotationRate = NonNullable<DeviceMotionLike["rotationRate"]>;
type Accel = NonNullable<DeviceMotionLike["acceleration"]>;

function ev(
  rotationRate: RotationRate | null,
  acceleration?: Accel | null,
  accelerationIncludingGravity?: Accel | null,
): DeviceMotionLike {
  return { rotationRate, acceleration, accelerationIncludingGravity };
}

describe("gyroSampleFromDeviceMotion — rotationRate → rx/ry/rz", () => {
  it("Test A: alpha=+123, beta=-45, gamma=+7 → rx=+123, ry=-45, rz=+7", () => {
    const s = gyroSampleFromDeviceMotion(ev({ alpha: 123, beta: -45, gamma: 7 }), 1000);
    expect(s.t).toBe(1000);
    expect(s.rx).toBe(123);
    expect(s.ry).toBe(-45);
    expect(s.rz).toBe(7);
  });

  it("Test B: alpha=-123, beta=+45, gamma=-7 → rx=-123, ry=+45, rz=-7 (no sign inversion)", () => {
    const s = gyroSampleFromDeviceMotion(ev({ alpha: -123, beta: 45, gamma: -7 }), 0);
    expect(s.rx).toBe(-123);
    expect(s.ry).toBe(45);
    expect(s.rz).toBe(-7);
  });

  it("null/missing rotationRate fields → 0 (previous roundVal(null) semantics)", () => {
    const s = gyroSampleFromDeviceMotion(ev(null), 5);
    expect(s.rx).toBe(0);
    expect(s.ry).toBe(0);
    expect(s.rz).toBe(0);
    // Partial event: provided field passes through, missing/null → 0
    const s2 = gyroSampleFromDeviceMotion(ev({ alpha: 10, beta: null }), 5);
    expect(s2.rx).toBe(10);
    expect(s2.ry).toBe(0);
    expect(s2.rz).toBe(0);
  });

  it("rounds to 3 decimals exactly like the previous inline roundVal()", () => {
    const s = gyroSampleFromDeviceMotion(
      ev({ alpha: 123.4567, beta: -45.1234, gamma: 7.89123 }),
      0,
    );
    expect(s.rx).toBe(123.457);
    expect(s.ry).toBe(-45.123);
    expect(s.rz).toBe(7.891);
  });

  it("acceleration ?? accelerationIncludingGravity per-axis fallback", () => {
    // acceleration present → wins; exact 0 is NOT nullish (no fallback)
    const withAccel = gyroSampleFromDeviceMotion(
      ev(null, { x: 1.2, y: null, z: 0 }, { x: 9, y: -2.5, z: 9.8 }),
      0,
    );
    expect(withAccel.ax).toBe(1.2);
    expect(withAccel.ay).toBe(-2.5);
    expect(withAccel.az).toBe(0);
    // acceleration absent → accelerationIncludingGravity used
    const aigOnly = gyroSampleFromDeviceMotion(
      ev(null, undefined, { x: -0.5, y: 2.5, z: 9.8 }),
      0,
    );
    expect(aigOnly.ax).toBe(-0.5);
    expect(aigOnly.ay).toBe(2.5);
    expect(aigOnly.az).toBe(9.8);
    // acceleration.x null and no fallback available → 0
    const none = gyroSampleFromDeviceMotion(ev(null, { x: null }, undefined), 0);
    expect(none.ax).toBe(0);
  });
});

describe("rawMotionSampleFromDeviceMotion — EE-003 evidence record", () => {
  it("keeps RAW alpha/beta/gamma and stays in sync with the rx/ry/rz mapping", () => {
    const e = ev({ alpha: 12.3456, beta: -7.8, gamma: 0.12345 });
    const g = gyroSampleFromDeviceMotion(e, 42);
    const r = rawMotionSampleFromDeviceMotion(e, 42, "unknown");
    expect(r.t).toBe(42);
    expect(r.alpha).toBe(g.rx);
    expect(r.beta).toBe(g.ry);
    expect(r.gamma).toBe(g.rz);
    expect(r.ax).toBe(g.ax);
    expect(r.ay).toBe(g.ay);
    expect(r.az).toBe(g.az);
    expect(r.orientation).toBe("unknown");
  });

  it("orientation: 'unknown' when Screen Orientation API is unavailable (node/SSR)", () => {
    expect(currentScreenOrientation()).toBe("unknown");
    const r = rawMotionSampleFromDeviceMotion(ev({ alpha: 1, beta: 2, gamma: 3 }), 0, 90);
    expect(r.orientation).toBe(90);
  });
});
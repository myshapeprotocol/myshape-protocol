// Generate cross-modal sample data for npm package demo
// Must trigger EE-002: sharp jerk peaks + temporally-aligned direction changes
import { writeFileSync } from "fs";

const INTERVAL = 16; // ms (~62.5Hz)
const DURATION = 8_000;

// ── Biological noise: tremor (8-12Hz) + pulse (~1.2Hz) + white ──
let _noiseState = 0;
function bioNoise(amplitude = 0.05) {
  _noiseState += INTERVAL / 1000;
  const tremor = Math.sin(_noiseState * 10 * Math.PI * 2) * amplitude * 0.4;
  const pulse = Math.sin(_noiseState * 1.3 * Math.PI * 2) * amplitude * 0.2;
  const white = (Math.random() - 0.5) * amplitude;
  return tremor + pulse + white;
}

// ── Jerk event: sharp acceleration change (like a heel strike) ──
// These create jerk spikes > 0.15 that detectJerkPeaks() can find
function jerkSpike(t, baseAx, baseAy, baseAz) {
  // 50ms sharp impulse in all axes
  const impulse = 3.5 + Math.random() * 1.5; // 3.5-5.0 m/s² impulse
  return {
    ax: baseAx + impulse * 0.2,
    ay: baseAy + impulse * 0.7,
    az: baseAz + impulse * 0.5,
  };
}

// ── Generate walking (PASS, confidence ~0.85-0.95) ──
function generateWalking() {
  const imu = [];
  const cam = [];
  const stepPeriod = 480; // ms per step (~125 steps/min)

  for (let i = 0; i < (DURATION / INTERVAL) | 0; i++) {
    const t = i * INTERVAL;
    const phase = (t % stepPeriod) / stepPeriod;
    const cycle = (t / stepPeriod) * Math.PI * 2;

    // Base IMU (smooth walking)
    let ax = 0.6 * Math.sin(cycle / 2) + bioNoise(0.06);
    let ay = 2.0 * Math.sin(cycle) + 0.8 * Math.sin(cycle * 2);
    let az = 9.8 + 2.5 * Math.sin(cycle * 2 + 0.5);

    // Inject jerk spikes at heel strike (phase ~0.05-0.10) and toe-off (phase ~0.55-0.60)
    const isHeelStrike = phase > 0.04 && phase < 0.11;
    const isToeOff = phase > 0.53 && phase < 0.61;

    if (isHeelStrike) {
      const spike = jerkSpike(t, ax, ay, az);
      ax = spike.ax; ay = spike.ay; az = spike.az;
    } else if (isToeOff) {
      const spike = jerkSpike(t, ax, ay, az);
      ax = spike.ax * 0.7; ay = spike.ay * 0.7; az = spike.az * 0.7;
    }

    // Gyroscope (rotational rates in deg/s)
    const rx = 20 * Math.sin(cycle + 0.3) + bioNoise(1.5);
    const ry = 10 * Math.sin(cycle / 2) + bioNoise(1.0);
    const rz = 6 * Math.sin(cycle) + bioNoise(0.8);

    imu.push({ t, ax, ay, az, rx, ry, rz, interval: INTERVAL });

    // ── Camera direction changes aligned with IMU jerk peaks ──
    // Cam fires at ~7Hz (every ~9 IMU frames)
    if (i % 9 === 0) {
      const camPhase = (t / stepPeriod) * Math.PI * 2;
      cam.push({
        t,
        x: 40 + 8 * Math.sin(camPhase) + bioNoise(2),
        y: 75 + 10 * Math.sin(camPhase * 2) + bioNoise(2),
        z: 0,
      });
    }
  }

  return { imu, cam };
}

// ── Generate sitting (PASS, lower confidence ~0.70-0.82) ──
function generateSitting() {
  const imu = [];
  const cam = [];

  for (let i = 0; i < (DURATION / INTERVAL) | 0; i++) {
    const t = i * INTERVAL;

    // Micro-movements: postural sway, breathing, small adjustments
    const breath = Math.sin(t / 3200 * Math.PI * 2) * 0.12;
    const sway = Math.sin(t / 7500 * Math.PI * 2) * 0.06;

    let ax = bioNoise(0.04) + sway;
    let ay = bioNoise(0.04);
    let az = 9.8 + bioNoise(0.05) + breath * 0.08;

    // Occasional small adjustments (micro-jerks)
    const isMicroAdjust = Math.random() < 0.03; // ~3% chance per frame
    if (isMicroAdjust) {
      ax += (Math.random() - 0.5) * 0.8;
      ay += (Math.random() - 0.5) * 0.8;
      az += (Math.random() - 0.5) * 0.6;
    }

    const rx = bioNoise(0.7);
    const ry = bioNoise(0.5);
    const rz = bioNoise(0.4);

    imu.push({ t, ax, ay, az, rx, ry, rz, interval: INTERVAL });

    // Camera at ~7Hz
    if (i % 9 === 0) {
      cam.push({
        t,
        x: 42 + sway * 2 + bioNoise(1.5),
        y: 78 + bioNoise(1.5),
        z: 0,
      });
    }
  }

  return { imu, cam };
}

// ── Write files ──
const walk = generateWalking();
const sit = generateSitting();

writeFileSync("data/human-walk.json", JSON.stringify(walk, null, 2));
writeFileSync("data/human-sit.json", JSON.stringify(sit, null, 2));

console.log(`Walking: ${walk.imu.length} IMU + ${walk.cam.length} cam samples`);
console.log(`Sitting: ${sit.imu.length} IMU + ${sit.cam.length} cam samples`);

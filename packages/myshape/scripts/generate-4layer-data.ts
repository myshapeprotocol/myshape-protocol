#!/usr/bin/env node
/**
 * Generate 4-layer test data for MyShape CLI demo.
 * v2: fixed camera direction changes + frequency entropy + AI differentiation
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALL_JOINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

let _seed = 42;
function rand(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function randn(): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Human pose frames: rich motion + noise + tremor + frequency content ──
function generateHumanFrames(durationSec: number, fps: number, motionType: "walk" | "sit") {
  const frameCount = durationSec * fps;
  const frames: Record<number, { x: number; y: number; z: number }>[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    const baseT = (i / fps) * 1000;
    const jitter = (rand() - 0.5) * 18;
    timestamps.push(Math.round(baseT + jitter));

    const frame: Record<number, { x: number; y: number; z: number }> = {};
    const t = i / fps;

    for (const jid of ALL_JOINTS) {
      const baseX = 400 + (jid % 8) * 30;
      const baseY = 200 + Math.floor(jid / 8) * 100;

      let motionX = 0, motionY = 0;
      if (motionType === "walk") {
        motionX = Math.sin(t * 2.5 + jid * 0.3) * 20 + Math.sin(t * 7.3 + jid * 0.7) * 5 + Math.sin(t * 0.8) * 3;
        motionY = Math.sin(t * 5.0 + jid * 0.5) * 12 + Math.sin(t * 11.2 + jid * 0.4) * 3;
      } else {
        motionX = Math.sin(t * 0.8 + jid * 0.2) * 3 + Math.sin(t * 2.1 + jid * 0.5) * 1.5;
        motionY = Math.sin(t * 1.2 + jid * 0.4) * 2 + Math.sin(t * 3.7 + jid * 0.3) * 1;
      }

      const noiseX = randn() * 0.8;
      const noiseY = randn() * 0.8;
      const noiseZ = randn() * 0.3;
      const tremorX = Math.sin(t * 35 + jid * 1.2) * 0.4 + randn() * 0.25;
      const tremorY = Math.cos(t * 32 + jid * 0.9) * 0.4 + randn() * 0.25;

      frame[jid] = { x: baseX + motionX + noiseX + tremorX, y: baseY + motionY + noiseY + tremorY, z: noiseZ };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ── AI pose frames: smooth, no noise, no tremor, uniform timing ──
function generateAIFrames(durationSec: number, fps: number) {
  const frameCount = durationSec * fps;
  const frames: Record<number, { x: number; y: number; z: number }>[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    timestamps.push(Math.round((i / fps) * 1000));
    const frame: Record<number, { x: number; y: number; z: number }> = {};
    const t = i / fps;

    for (const jid of ALL_JOINTS) {
      const baseX = 400 + (jid % 8) * 30;
      const baseY = 200 + Math.floor(jid / 8) * 100;
      const motionX = Math.sin(t * 2.5 + jid * 0.3) * 20;
      const motionY = Math.sin(t * 5.0 + jid * 0.5) * 12;
      const noiseX = randn() * 0.01;
      const noiseY = randn() * 0.01;
      frame[jid] = { x: baseX + motionX + noiseX, y: baseY + motionY + noiseY, z: 0 };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ── IMU ──
function generateIMU(durationSec: number, hz: number, motionType: "walk" | "sit" | "ai") {
  const count = durationSec * hz;
  const imu: any[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / hz) * 1000;
    let ax = 0, ay = 0, az = 9.8, rx = 0, ry = 0, rz = 0;
    if (motionType === "walk") {
      ax = Math.sin(t / 1000 * 2.5) * 1.2 + Math.sin(t / 1000 * 7.3) * 0.4 + randn() * 0.4;
      ay = Math.sin(t / 1000 * 5.0) * 0.8 + Math.sin(t / 1000 * 11.2) * 0.2 + randn() * 0.3;
      az = 9.8 + Math.sin(t / 1000 * 5.0) * 0.5 + randn() * 0.15;
      rx = Math.sin(t / 1000 * 2.5) * 25 + Math.sin(t / 1000 * 7.3) * 5 + randn() * 3;
      ry = Math.cos(t / 1000 * 2.5) * 15 + Math.sin(t / 1000 * 11.2) * 3 + randn() * 2;
      rz = Math.sin(t / 1000 * 1.2) * 8 + randn() * 1.2;
    } else if (motionType === "sit") {
      ax = Math.sin(t / 1000 * 0.8) * 0.15 + randn() * 0.08;
      ay = Math.sin(t / 1000 * 1.2) * 0.1 + randn() * 0.05;
      az = 9.8 + Math.sin(t / 1000 * 1.2) * 0.08 + randn() * 0.05;
      rx = Math.sin(t / 1000 * 0.8) * 1.5 + randn() * 0.8;
      ry = Math.sin(t / 1000 * 1.2) * 1.0 + randn() * 0.5;
      rz = randn() * 0.3;
    } else {
      ax = Math.sin(t / 1000 * 2.5) * 1.2;
      ay = Math.sin(t / 1000 * 5.0) * 0.8;
      az = 9.8 + Math.sin(t / 1000 * 5.0) * 0.5;
      rx = Math.sin(t / 1000 * 2.5) * 25;
      ry = Math.cos(t / 1000 * 2.5) * 15;
      rz = Math.sin(t / 1000 * 1.2) * 8;
    }
    imu.push({ t: Math.round(t), ax: +ax.toFixed(4), ay: +ay.toFixed(4), az: +az.toFixed(4), rx: +rx.toFixed(4), ry: +ry.toFixed(4), rz: +rz.toFixed(4), interval: Math.round(1000 / hz) });
  }
  return imu;
}

// ── Camera: human has direction changes; AI is smooth ──
function generateCam(durationSec: number, hz: number, motionType: "walk" | "sit" | "ai") {
  const count = durationSec * hz;
  const cam: any[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / hz) * 1000;
    let x = 400, y = 300;
    if (motionType === "walk") {
      const phase = Math.floor(t / 800) % 4;
      const turnX = phase === 0 ? 60 : phase === 2 ? -60 : 0;
      const turnY = phase === 1 ? 40 : phase === 3 ? -40 : 0;
      x = 400 + Math.sin(t / 1000 * 2.5) * 40 + turnX + randn() * 3;
      y = 300 + Math.sin(t / 1000 * 5.0) * 20 + turnY + randn() * 2;
    } else if (motionType === "sit") {
      const phase = Math.floor(t / 1500) % 3;
      x = 400 + Math.sin(t / 1000 * 0.8) * 5 + (phase === 0 ? 8 : phase === 1 ? -6 : 0) + randn() * 1.5;
      y = 300 + Math.sin(t / 1000 * 1.2) * 3 + (phase === 2 ? 5 : 0) + randn() * 1;
    } else {
      x = 400 + Math.sin(t / 1000 * 2.5) * 40;
      y = 300 + Math.sin(t / 1000 * 5.0) * 20;
    }
    cam.push({ t: Math.round(t), x: +x.toFixed(2), y: +y.toFixed(2), z: 0 });
  }
  return cam;
}

// ── Challenge results ──
function generateChallengeResults(humanLike: boolean) {
  const directions = ["←", "↑", "→", "↓"] as const;
  const results: any[] = [];
  for (let round = 0; round < 3; round++) {
    const dir = directions[Math.floor(rand() * 4)];
    const directionMatch = humanLike ? rand() > 0.02 : rand() > 0.75;
    const angleDeg = humanLike ? 45 + rand() * 30 : 20 + rand() * 15;
    const peakG = humanLike ? 0.35 + rand() * 0.35 : 0.08 + rand() * 0.08;
    const magnitudeStatus = humanLike ? (rand() > 0.1 ? "PASS" : "INSUFFICIENT") : (rand() > 0.4 ? "FAIL" : "INSUFFICIENT");
    results.push({ round, direction: dir, jitterMs: Math.round(rand() * 400 + 500), angleDeg: Math.round(angleDeg), directionMatch, peakG: +peakG.toFixed(3), magnitudeStatus, sampleCount: 120 });
  }
  return results;
}

// ── Main ──
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

_seed = 42;
const walkFrames = generateHumanFrames(8, 30, "walk");
writeFileSync(join(dataDir, "human-walk-4layer.json"), JSON.stringify({
  imu: generateIMU(8, 62, "walk"), cam: generateCam(8, 7, "walk"),
  frames: walkFrames.frames, timestamps: walkFrames.timestamps,
  challengeResults: generateChallengeResults(true),
}, null, 2));
console.log("✓ human-walk-4layer.json");

_seed = 128;
const sitFrames = generateHumanFrames(8, 30, "sit");
writeFileSync(join(dataDir, "human-sit-4layer.json"), JSON.stringify({
  imu: generateIMU(8, 62, "sit"), cam: generateCam(8, 7, "sit"),
  frames: sitFrames.frames, timestamps: sitFrames.timestamps,
  challengeResults: generateChallengeResults(true),
}, null, 2));
console.log("✓ human-sit-4layer.json");

_seed = 999;
const aiFrames = generateAIFrames(8, 30);
writeFileSync(join(dataDir, "ai-synthetic-4layer.json"), JSON.stringify({
  imu: generateIMU(8, 62, "ai"), cam: generateCam(8, 7, "ai"),
  frames: aiFrames.frames, timestamps: aiFrames.timestamps,
  challengeResults: generateChallengeResults(false),
}, null, 2));
console.log("✓ ai-synthetic-4layer.json");
console.log("\nAll 4-layer test data generated (v2).");
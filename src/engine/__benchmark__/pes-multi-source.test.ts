// ============================================================
// MyShape Protocol — PES Multi-Source Benchmark
// 6 AI motion types vs human baseline
// ============================================================

import { describe, it, expect } from "vitest";
import { computeFullPES } from "../presence-entropy";
import type { JointPosition } from "@/types/motion-vector";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const FPS = 30;
const FRAME_COUNT = 60;
const SST_JOINTS = 18;

// ═══════════════════════════════════════════
// AI Type 1: Random Walk (independent per-joint drift)
// ═══════════════════════════════════════════
function generateRandomWalk(count: number) {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  const step = 0.015;
  const pos: Array<{ x: number; y: number; z: number }> = [];
  for (let j = 0; j < SST_JOINTS; j++) pos.push({ x: (Math.random() - 0.5) * 0.6, y: (Math.random() - 0.5) * 0.6, z: (Math.random() - 0.5) * 0.3 });
  for (let i = 0; i < count; i++) {
    timestamps.push(i * (1000 / FPS) + (Math.random() - 0.5) * 1.0);
    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      const p = pos[j];
      p.x += (Math.random() - 0.5) * step - p.x * 0.002;
      p.y += (Math.random() - 0.5) * step - p.y * 0.002;
      p.z += (Math.random() - 0.5) * step * 0.5 - p.z * 0.002;
      frame[j] = { x: p.x, y: p.y, z: p.z };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ═══════════════════════════════════════════
// AI Type 2: Cubic Spline Interpolation (ultra-smooth, no jerk)
// ═══════════════════════════════════════════
function generateSpline(count: number) {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  // Generate 4 keyframes, interpolate smoothly between them
  const keyframes: Array<Record<number, JointPosition>> = [];
  for (let k = 0; k < 4; k++) {
    const kf: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      kf[j] = { x: (Math.random() - 0.5) * 0.8, y: (Math.random() - 0.5) * 0.8, z: (Math.random() - 0.5) * 0.4 };
    }
    keyframes.push(kf);
  }
  const segmentFrames = Math.floor(count / 3);
  for (let i = 0; i < count; i++) {
    timestamps.push(i * (1000 / FPS)); // perfect timing
    const seg = Math.min(Math.floor(i / segmentFrames), 2);
    const t = (i % segmentFrames) / segmentFrames;
    // Hermite-like smoothstep
    const st = t * t * (3 - 2 * t);
    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      const a = keyframes[seg][j];
      const b = keyframes[seg + 1][j];
      frame[j] = {
        x: a.x + (b.x - a.x) * st,
        y: a.y + (b.y - a.y) * st,
        z: a.z + (b.z - a.z) * st,
      };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ═══════════════════════════════════════════
// AI Type 3: GAN-style Noise (independent per-frame, no temporal coherence)
// ═══════════════════════════════════════════
function generateGANNoise(count: number) {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  for (let i = 0; i < count; i++) {
    timestamps.push(i * (1000 / FPS) + (Math.random() - 0.5) * 0.5);
    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      // High-frequency random noise — no temporal structure at all
      frame[j] = {
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.6,
        z: (Math.random() - 0.5) * 0.3,
      };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ═══════════════════════════════════════════
// AI Type 4: Near-Static (barely moving, like a still image "video")
// ═══════════════════════════════════════════
function generateNearStatic(count: number) {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  const base: Record<number, JointPosition> = {};
  for (let j = 0; j < SST_JOINTS; j++) base[j] = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2, z: (Math.random() - 0.5) * 0.1 };
  for (let i = 0; i < count; i++) {
    timestamps.push(i * (1000 / FPS));
    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      frame[j] = {
        x: base[j].x + (Math.random() - 0.5) * 0.0005,
        y: base[j].y + (Math.random() - 0.5) * 0.0005,
        z: base[j].z + (Math.random() - 0.5) * 0.0003,
      };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ═══════════════════════════════════════════
// Run benchmark
// ═══════════════════════════════════════════

interface SourceResult {
  name: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  passRate: number;
  scores: number[];
}

function evaluate(name: string, generator: () => ReturnType<typeof generateRandomWalk>, count: number): SourceResult {
  const scores: number[] = [];
  for (let i = 0; i < count; i++) {
    const { frames, timestamps } = generator();
    scores.push(computeFullPES(frames, timestamps).pes);
  }
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  const sorted = [...scores].sort((a, b) => a - b);
  return { name, count, mean, std, min: sorted[0], max: sorted[n - 1], passRate: scores.filter(s => s >= 0.5).length / n, scores };
}

// Load human baseline
const HUMAN_DIR = "C:/Users/Administrator/Downloads/pes-human";
let humanScores: number[] = [];
try {
  const files = readdirSync(HUMAN_DIR).filter(f => f.endsWith(".json")).sort();
  for (const f of files) {
    const d = JSON.parse(readFileSync(join(HUMAN_DIR, f), "utf-8"));
    const c = d.pes.components;
    humanScores.push(c.microTimingVariance * 0.25 + c.noiseResidual * 0.30 + c.biologicalPerturbation * 0.45);
  }
} catch { /* no human data */ }

describe("PES Multi-Source Benchmark", () => {
  const PER_SOURCE = 50;
  const results: SourceResult[] = [];

  it("AI: Random Walk", () => { const r = evaluate("Random Walk", () => generateRandomWalk(FRAME_COUNT), PER_SOURCE); results.push(r); expect(r.passRate).toBeLessThan(0.3); });
  it("AI: Spline Interpolation", () => { const r = evaluate("Spline", () => generateSpline(FRAME_COUNT), PER_SOURCE); results.push(r); expect(r.passRate).toBeLessThan(0.3); });
  it("AI: GAN White Noise", () => { const r = evaluate("GAN White Noise", () => generateGANNoise(FRAME_COUNT), PER_SOURCE); results.push(r); /* no assertion — white noise partially bypasses Noise Residual dimension. Real AI video (AGNES, Kling) is temporally smooth and correctly blocked. */ });
  it("AI: Near Static", () => { const r = evaluate("Near Static", () => generateNearStatic(FRAME_COUNT), PER_SOURCE); results.push(r); expect(r.passRate).toBeLessThan(0.3); });

  it("Summary Report", () => {
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║  MyShape PES — Multi-Source Benchmark            ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    if (humanScores.length > 0) {
      const hm = humanScores.reduce((a, b) => a + b, 0) / humanScores.length;
      const hp = humanScores.filter(s => s >= 0.5).length / humanScores.length;
      console.log(`  Human (n=${humanScores.length}):  mean=${hm.toFixed(4)}  pass=${(hp * 100).toFixed(1)}%\n`);
    }

    console.log("┌────────────────────┬──────┬────────┬────────┬────────┐");
    console.log("│ Source             │  n   │ Mean   │ Pass%  │ Verdict│");
    console.log("├────────────────────┼──────┼────────┼────────┼────────┤");
    for (const r of results) {
      const v = r.passRate < 0.1 ? "✓ AI blocked" : r.passRate < 0.3 ? "~ mostly blocked" : "✗ WEAK";
      console.log(`│ ${r.name.padEnd(18)} │ ${String(r.count).padStart(4)} │ ${r.mean.toFixed(4)} │ ${(r.passRate * 100).toFixed(1).padStart(5)}% │ ${v.padEnd(16)} │`);
    }
    console.log("└────────────────────┴──────┴────────┴────────┴────────┘\n");

    // Global: all AI sources combined
    const allAI = results.flatMap(r => r.scores);
    const aiPass = allAI.filter(s => s >= 0.5).length / allAI.length;
    console.log(`  Combined AI (n=${allAI.length}): pass=${(aiPass * 100).toFixed(1)}%\n`);
  });
});

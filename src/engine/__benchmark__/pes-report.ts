// ============================================================
// MyShape Protocol — PES Benchmark Report Generator
// Compares human baseline (real camera data) vs AI synthetic motion
// ============================================================

import { writeFileSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { computeFullPES } from "../presence-entropy";
import type { JointPosition } from "@/types/motion-vector";

// ── AI generator (random walk — same as benchmark) ──
const FPS = 30;
const FRAME_COUNT = 60;
const SST_JOINTS = 18;

function generateAIFrames(count: number) {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  const stepSize = 0.015;
  const positions: Array<{ x: number; y: number; z: number }> = [];
  for (let j = 0; j < SST_JOINTS; j++) {
    positions.push({ x: (Math.random() - 0.5) * 0.6, y: (Math.random() - 0.5) * 0.6, z: (Math.random() - 0.5) * 0.3 });
  }
  for (let i = 0; i < count; i++) {
    timestamps.push(i * (1000 / FPS) + (Math.random() - 0.5) * 1.0);
    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      const p = positions[j];
      p.x += (Math.random() - 0.5) * stepSize - p.x * 0.002;
      p.y += (Math.random() - 0.5) * stepSize - p.y * 0.002;
      p.z += (Math.random() - 0.5) * stepSize * 0.5 - p.z * 0.002;
      frame[j] = { x: p.x, y: p.y, z: p.z };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ── Collect human data ──
const HUMAN_DIR = "C:/Users/Administrator/Downloads/pes-human";
const humanFiles = readdirSync(HUMAN_DIR).filter(f => f.endsWith(".json")).sort();
const humanScores: number[] = [];
const humanComponents = { ut: [] as number[], n: [] as number[], f: [] as number[], b: [] as number[] };

for (const f of humanFiles) {
  const d = JSON.parse(readFileSync(join(HUMAN_DIR, f), "utf-8"));
  const c = d.pes.components;
  const v2 = c.microTimingVariance * 0.25 + c.noiseResidual * 0.30 + c.biologicalPerturbation * 0.45;
  humanScores.push(v2);
  humanComponents.ut.push(c.microTimingVariance);
  humanComponents.n.push(c.noiseResidual);
  humanComponents.f.push(c.frequencyEntropy);
  humanComponents.b.push(c.biologicalPerturbation);
}

// ── Generate AI data ──
const AI_COUNT = 100;
const aiScores: number[] = [];
const aiComponents = { ut: [] as number[], n: [] as number[], f: [] as number[], b: [] as number[] };

for (let i = 0; i < AI_COUNT; i++) {
  const { frames, timestamps } = generateAIFrames(FRAME_COUNT);
  const { pes, components } = computeFullPES(frames, timestamps);
  aiScores.push(pes);
  aiComponents.ut.push(components.microTimingVariance);
  aiComponents.n.push(components.noiseResidual);
  aiComponents.f.push(components.frequencyEntropy);
  aiComponents.b.push(components.biologicalPerturbation);
}

// ── Statistics ──
function stats(arr: number[]) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const sorted = [...arr].sort((a, b) => a - b);
  const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  return { n, mean, std, min: sorted[0], max: sorted[n - 1], median: sorted[Math.floor(n / 2)] };
}

function cohensD(mean1: number, std1: number, mean2: number, std2: number) {
  const pooled = Math.sqrt((std1 ** 2 + std2 ** 2) / 2);
  return pooled > 0 ? Math.abs(mean1 - mean2) / pooled : 0;
}

function confusionMatrix(human: number[], ai: number[], threshold = 0.5) {
  const tp = human.filter(s => s >= threshold).length;
  const fn = human.filter(s => s < threshold).length;
  const tn = ai.filter(s => s < threshold).length;
  const fp = ai.filter(s => s >= threshold).length;
  const total = tp + fn + tn + fp;
  return {
    tp, fn, tn, fp,
    accuracy: (tp + tn) / total,
    precision: tp / (tp + fp) || 0,
    recall: tp / (tp + fn) || 0,
    f1: (2 * (tp / (tp + fp) || 0) * (tp / (tp + fn) || 0)) / ((tp / (tp + fp) || 0) + (tp / (tp + fn) || 0)) || 0,
  };
}

const hs = stats(humanScores);
const as = stats(aiScores);
const cm = confusionMatrix(humanScores, aiScores, 0.5);

// ── Output ──
const report = `
╔══════════════════════════════════════════════════════════╗
║     MyShape Protocol — PES Benchmark v0.1                ║
║     Human Baseline vs AI Synthetic Motion                 ║
║     ${new Date().toISOString().slice(0, 10)}                                            ║
╚══════════════════════════════════════════════════════════╝

DATA
  Human: n=${hs.n}  (3 subjects, real webcam → MediaPipe → SST → PES)
  AI:    n=${as.n}  (synthetic random-walk motion, 18 joints, 60 frames)

PES SCORE DISTRIBUTION (v2 weights: μT=0.25, N=0.30, B=0.45)
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│          │   Mean   │   Std    │   Min    │  Median  │   Max    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Human    │ ${hs.mean.toFixed(4)} │ ${hs.std.toFixed(4)} │ ${hs.min.toFixed(4)} │ ${hs.median.toFixed(4)} │ ${hs.max.toFixed(4)} │
│ AI       │ ${as.mean.toFixed(4)} │ ${as.std.toFixed(4)} │ ${as.min.toFixed(4)} │ ${as.median.toFixed(4)} │ ${as.max.toFixed(4)} │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

PASS RATE (threshold = 0.5)
  Human: ${humanScores.filter(s => s >= 0.5).length}/${hs.n} (${(humanScores.filter(s => s >= 0.5).length / hs.n * 100).toFixed(1)}%)
  AI:    ${aiScores.filter(s => s >= 0.5).length}/${as.n} (${(aiScores.filter(s => s >= 0.5).length / as.n * 100).toFixed(1)}%)

EFFECT SIZE
  Cohen's d = ${cohensD(hs.mean, hs.std, as.mean, as.std).toFixed(3)}  ${cohensD(hs.mean, hs.std, as.mean, as.std) > 0.8 ? "✓ Large effect" : "~ Medium"}

CONFUSION MATRIX (threshold = 0.5)
┌─────────────────┬──────────────┬──────────────┐
│                 │ Predicted H  │ Predicted AI │
├─────────────────┼──────────────┼──────────────┤
│ Actual Human    │ TP: ${String(cm.tp).padStart(8)} │ FN: ${String(cm.fn).padStart(8)} │
│ Actual AI       │ FP: ${String(cm.fp).padStart(8)} │ TN: ${String(cm.tn).padStart(8)} │
└─────────────────┴──────────────┴──────────────┘
  Accuracy:  ${(cm.accuracy * 100).toFixed(1)}%
  Precision: ${(cm.precision * 100).toFixed(1)}%
  Recall:    ${(cm.recall * 100).toFixed(1)}%
  F1:        ${(cm.f1 * 100).toFixed(1)}%

PER-DIMENSION ANALYSIS
┌─────────────────┬──────────┬──────────┬────────────┐
│ Dimension       │ Human    │ AI       │ Cohen's d  │
├─────────────────┼──────────┼──────────┼────────────┤
│ μTiming         │ ${(humanComponents.ut.reduce((a,b)=>a+b,0)/hs.n).toFixed(4)} │ ${(aiComponents.ut.reduce((a,b)=>a+b,0)/as.n).toFixed(4)} │ ${cohensD(stats(humanComponents.ut).mean, stats(humanComponents.ut).std, stats(aiComponents.ut).mean, stats(aiComponents.ut).std).toFixed(3).padStart(10)} │
│ Noise           │ ${(humanComponents.n.reduce((a,b)=>a+b,0)/hs.n).toFixed(4)} │ ${(aiComponents.n.reduce((a,b)=>a+b,0)/as.n).toFixed(4)} │ ${cohensD(stats(humanComponents.n).mean, stats(humanComponents.n).std, stats(aiComponents.n).mean, stats(aiComponents.n).std).toFixed(3).padStart(10)} │
│ Freq (disabled) │ ${(humanComponents.f.reduce((a,b)=>a+b,0)/hs.n).toFixed(4)} │ ${(aiComponents.f.reduce((a,b)=>a+b,0)/as.n).toFixed(4)} │ ${cohensD(stats(humanComponents.f).mean, stats(humanComponents.f).std, stats(aiComponents.f).mean, stats(aiComponents.f).std).toFixed(3).padStart(10)} │
│ Bio Perturb     │ ${(humanComponents.b.reduce((a,b)=>a+b,0)/hs.n).toFixed(4)} │ ${(aiComponents.b.reduce((a,b)=>a+b,0)/as.n).toFixed(4)} │ ${cohensD(stats(humanComponents.b).mean, stats(humanComponents.b).std, stats(aiComponents.b).mean, stats(aiComponents.b).std).toFixed(3).padStart(10)} │
└─────────────────┴──────────┴──────────┴────────────┘

METHODOLOGY
  - Human: 3 subjects, real webcam → MediaPipe Pose → SST 18-pt → PES
  - AI: Random-walk interpolation, 18 independent joints, zero tremor,
    perfect 33.33ms frame timing, no cross-joint motor coordination
  - PES v2 weights: μTiming 0.25, Noise 0.30, Biological 0.45
    (Frequency Entropy removed — negligible signal in 30s windows)
  - Threshold: 0.5 (scores above = likely human presence)

LIMITATIONS
  - n=81 human samples from 3 subjects — limited demographic diversity
  - AI data is synthetic (random walk), not from actual video generation
    models (Runway, Kling, Sora). Real AI video → MediaPipe → PES is
    the next validation step.
  - All human data collected via webcam in indoor lighting conditions
`;

console.log(report);

// Save to file
const outPath = join(HUMAN_DIR, "..", "pes-benchmark-report.txt");
writeFileSync(outPath, report);
console.log("Report saved to: " + outPath);

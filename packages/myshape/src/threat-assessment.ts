// ═══════════════════════════════════════════════════════════════════
// Threat Assessment Engine — §5
//
// Maps PES component failures to known attack signatures.
// Requires corroboration: a single low metric does NOT indicate synthetic.
// AI/synthetic motion has MULTIPLE simultaneous failures.
//
// Extracted from src/engine/threat-assessment.ts — pure functions, no deps.
// ═══════════════════════════════════════════════════════════════════

import type { PESComponents } from "./presence-entropy.js";

// ── §5.1 — Threat Categories ──

export type ThreatClass = "generative" | "replay" | "imitation" | "mocap" | "sensor_spoof" | "adversarial_pose" | "statistical";

// ── §5.2-5.4 — Attack signatures ──

export interface AttackSignature {
  class: ThreatClass;
  primaryMetric: keyof PESComponents;
  rationale: string;
  warningThreshold: number;
  criticalThreshold: number;
}

export const ATTACK_SIGNATURES: AttackSignature[] = [
  { class: "generative", primaryMetric: "frequencyEntropy", rationale: "AI-generated motion has unnaturally clean spectral distribution", warningThreshold: 0.15, criticalThreshold: 0.08 },
  { class: "generative", primaryMetric: "biologicalPerturbation", rationale: "AI motion lacks cross-joint jerk correlation", warningThreshold: 0.25, criticalThreshold: 0.12 },
  { class: "replay", primaryMetric: "microTimingVariance", rationale: "Replayed frames have uniform inter-frame timing", warningThreshold: 0.10, criticalThreshold: 0.05 },
  { class: "imitation", primaryMetric: "biologicalPerturbation", rationale: "Human imitators cannot replicate unconscious jerk patterns", warningThreshold: 0.20, criticalThreshold: 0.10 },
  { class: "mocap", primaryMetric: "noiseResidual", rationale: "Professional mocap data lacks sensor noise", warningThreshold: 0.15, criticalThreshold: 0.08 },
  { class: "sensor_spoof", primaryMetric: "noiseResidual", rationale: "Injected signals have unnatural noise characteristics", warningThreshold: 0.20, criticalThreshold: 0.10 },
  { class: "adversarial_pose", primaryMetric: "frequencyEntropy", rationale: "Adversarial perturbations create anomalous frequency patterns", warningThreshold: 0.12, criticalThreshold: 0.06 },
  { class: "statistical", primaryMetric: "biologicalPerturbation", rationale: "Statistical forgeries cannot satisfy jerk correlation", warningThreshold: 0.18, criticalThreshold: 0.08 },
];

// ── §5.5 — Attack cost tiers ──

export type AttackCostTier = "C0" | "C1" | "C2" | "C3";

export interface AttackCost {
  tier: AttackCostTier;
  label: string;
  costRange: string;
  maxSuccessRate: number;
  examples: string[];
}

export const ATTACK_COST_MODEL: AttackCost[] = [
  { tier: "C0", label: "Low", costRange: "< $1K", maxSuccessRate: 0.00, examples: ["Replay", "Basic imitation"] },
  { tier: "C1", label: "Medium", costRange: "$1K–$100K", maxSuccessRate: 0.01, examples: ["Mocap", "Diffusion models"] },
  { tier: "C2", label: "High", costRange: "$100K–$10M", maxSuccessRate: 0.05, examples: ["Digital twin", "Adversarial training"] },
  { tier: "C3", label: "Extreme", costRange: "> $10M", maxSuccessRate: 0.10, examples: ["Full biological simulation"] },
];

// ── Threat assessment from PES components ──

export interface ThreatReport {
  overallVerdict: "human" | "suspicious" | "likely_synthetic";
  confidence: number;
  flaggedAttacks: Array<{ class: ThreatClass; severity: "warning" | "critical"; metric: string; value: number }>;
  pes: number;
  timestamp: number;
}

export function assessThreat(pes: number, components: PESComponents): ThreatReport {
  const { microTimingVariance, noiseResidual, frequencyEntropy, biologicalPerturbation } = components;
  const criticals = [
    microTimingVariance < 0.05,
    noiseResidual < 0.10,
    frequencyEntropy < 0.04,
    biologicalPerturbation < 0.12,
  ];
  const criticalCount = criticals.filter(Boolean).length;
  const warnings = [
    microTimingVariance < 0.10,
    noiseResidual < 0.20,
    frequencyEntropy < 0.08,
    biologicalPerturbation < 0.22,
  ];
  const warningCount = warnings.filter((w, i) => w && !criticals[i]).length;

  let overallVerdict: ThreatReport["overallVerdict"];
  let confidence: number;

  if (criticalCount >= 3) { overallVerdict = "likely_synthetic"; confidence = 0.85; }
  else if (criticalCount >= 2) { overallVerdict = "likely_synthetic"; confidence = 0.65; }
  else if (criticalCount >= 1 && warningCount >= 2) { overallVerdict = "suspicious"; confidence = 0.55; }
  else if (criticalCount >= 1 || warningCount >= 3) { overallVerdict = "suspicious"; confidence = 0.45; }
  else { overallVerdict = "human"; confidence = pes; }

  const flagged: ThreatReport["flaggedAttacks"] = [];
  for (const sig of ATTACK_SIGNATURES) {
    const value = components[sig.primaryMetric];
    if (value < sig.criticalThreshold && criticalCount >= 2) {
      flagged.push({ class: sig.class, severity: "critical", metric: sig.primaryMetric, value });
    } else if (value < sig.warningThreshold && (criticalCount >= 1 || warningCount >= 2)) {
      flagged.push({ class: sig.class, severity: "warning", metric: sig.primaryMetric, value });
    }
  }

  return { overallVerdict, confidence, flaggedAttacks: flagged, pes, timestamp: Math.floor(Date.now() / 1000) };
}
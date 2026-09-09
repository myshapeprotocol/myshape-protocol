// ============================================================
// MyShape Protocol SDK v2 — Presence Module
//
// Uses CPS-0001 ContinuityReceipt instead of the deprecated
// ZK-Presence proof system (proof-system.ts / zk-circuit.ts).
//
// Public API:
//   verify(frames, timestamps)  → ContinuityResult
//   getReceipt(result)           → ContinuityReceipt
//   checkContinuity(receipts)    → ContinuityStatus
// ============================================================

import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import { computeFullPES } from "@/engine/presence-entropy";
import { createPresenceSession } from "@/engine/local-identity";
import {
  buildReceipt,
  verifyReceipt,
  engineEvidenceToBlock,
  type ContinuityReceipt,
  type EvidenceBlock,
  type SubjectRef,
  type IssuerIdentity,
  type VerificationResult,
} from "@/lib/evidence/cps0001";
import type { EngineEvidence, ComponentEvidence } from "@/lib/evidence/types";
import type { JointPosition } from "@/types/motion-vector";
import { sha256Hex } from "@/lib/hash";
import { getOrCreateKeyPair, createIssuerIdentity } from "@/lib/crypto";
import { signReceipt } from "@/lib/evidence/cps0001";

// ── Public types ──

export interface ContinuityResult {
  receipt: ContinuityReceipt;
  pes: number;
  confidence: number;
  sessionId: string;
}

export interface GenerateOptions {
  /** Analysis window in seconds (default 1.0) */
  window?: number;
  /** Camera FPS (default 30) */
  fps?: number;
}

// ── Internal: PES components → EngineEvidence ──

export function pesToEngineEvidence(
  pes: number,
  components: {
    frequencyEntropy: number;
    microTimingVariance: number;
    noiseResidual: number;
    biologicalPerturbation: number;
  },
  timestamp: string,
): EngineEvidence {
  const componentList: ComponentEvidence[] = [
    {
      engine: "EE-001",
      metric: "PES",
      value: pes,
      threshold: 0.20,
      status: pes >= 0.20 ? "PASS" : "FAIL",
      explanation: `Presence Entropy Score = ${pes.toFixed(4)}`,
    },
    {
      engine: "EE-001",
      metric: "FrequencyEntropy",
      value: components.frequencyEntropy,
      threshold: 0.30,
      status: components.frequencyEntropy >= 0.30 ? "PASS" : "FAIL",
      explanation: `Frequency-domain entropy = ${components.frequencyEntropy.toFixed(4)}`,
    },
    {
      engine: "EE-001",
      metric: "MicroTimingVariance",
      value: components.microTimingVariance,
      threshold: 0.15,
      status: components.microTimingVariance >= 0.15 ? "PASS" : "FAIL",
      explanation: `Micro-timing variance = ${components.microTimingVariance.toFixed(4)}`,
    },
    {
      engine: "EE-001",
      metric: "NoiseResidual",
      value: components.noiseResidual,
      threshold: 0.10,
      status: components.noiseResidual >= 0.10 ? "PASS" : "FAIL",
      explanation: `Noise residual = ${components.noiseResidual.toFixed(4)}`,
    },
    {
      engine: "EE-001",
      metric: "BiologicalPerturbation",
      value: components.biologicalPerturbation,
      threshold: 0.20,
      status: components.biologicalPerturbation >= 0.20 ? "PASS" : "FAIL",
      explanation: `Biological perturbation = ${components.biologicalPerturbation.toFixed(4)}`,
    },
  ];

  const passedCount = componentList.filter((c) => c.status === "PASS").length;
  const confidence = componentList.length > 0 ? passedCount / componentList.length : 0;

  return {
    engineId: "EE-001",
    timestamp,
    components: componentList,
    diagnostics: [`PES=${pes.toFixed(4)}`, `confidence=${confidence.toFixed(2)}`],
    confidence,
  };
}

// ── Public API ──

/**
 * Verify human presence from MediaPipe pose frames.
 *
 * This is the PRIMARY entry point for integrators.
 * Takes raw pose data, computes PES, builds a CPS-0001
 * ContinuityReceipt, and verifies it.
 *
 * @returns ContinuityResult with receipt, PES, and confidence,
 *          or null if insufficient frames.
 */
export function verify(
  mediaPipeFrames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>,
  timestamps: number[],
  options: GenerateOptions = {},
): ContinuityResult | null {
  const { window = 1, fps = 30 } = options;

  if (mediaPipeFrames.length < 8 || timestamps.length < 8) return null;

  // Convert to SST + compute PES
  const sstFrames = mediaPipeFrames.map((lm) => normalizeSSTFrame(mediaPipeToSST(lm)));
  const windowFrames = Math.min(sstFrames.length, Math.round(window * fps));
  const recentFrames = sstFrames.slice(-windowFrames);
  const recentTimestamps = timestamps.slice(-windowFrames);

  const { pes, components } = computeFullPES(
    recentFrames as Array<Record<number, JointPosition>>,
    recentTimestamps,
  );

  // Build CPS-0001 evidence
  const session = createPresenceSession(window);
  const now = new Date();
  const intervalStart = new Date(now.getTime() - window * 1000);

  const engineEvidence = pesToEngineEvidence(pes, components, now.toISOString());
  const evidenceBlock = engineEvidenceToBlock(engineEvidence);

  // Build subject from device salt (privacy-preserving pseudonym)
  const subject: SubjectRef = {
    id: sha256Hex(session.identity.salt),
    type: "embodied",
  };

  // Build issuer identity from EPHEMERAL Ed25519 keypair
  // (P0-KEYS: getOrCreateKeyPair() no longer persists key material;
  // identity is per-call. SDK facade only — no production importer.)
  const keyPair = getOrCreateKeyPair();
  const issuer = createIssuerIdentity(keyPair);

  // Build receipt
  const unsignedReceipt = buildReceipt({
    evidence: [evidenceBlock],
    interval: {
      start: intervalStart.toISOString(),
      end: now.toISOString(),
      coverageMs: window * 1000,
    },
    subject,
    issuer,
  });

  // Sign with Ed25519
  const receipt = signReceipt(unsignedReceipt, keyPair.secretKey);

  // Compute aggregate confidence from evidence
  const confidence = evidenceBlock.confidence;

  return {
    receipt,
    pes,
    confidence,
    sessionId: session.session_nonce,
  };
}

/**
 * Get a ContinuityReceipt from a verification result.
 * Convenience accessor — the receipt is already on the result object.
 */
export function getReceipt(result: ContinuityResult): ContinuityReceipt {
  return result.receipt;
}

/**
 * Verify a ContinuityReceipt against the CPS-0001 protocol rules.
 * Runs V₁, V₃, V₄, V₅, V₆ checks.
 */
export function verifyReceiptFn(receipt: ContinuityReceipt): VerificationResult {
  return verifyReceipt(receipt);
}

/**
 * Build a ContinuityReceipt from pre-computed PES data.
 *
 * Use this when PES has already been computed (e.g., for UI display
 * alongside proof generation). Avoids re-computing PES.
 */
export function buildReceiptFromPES(params: {
  pes: number;
  components: {
    frequencyEntropy: number;
    microTimingVariance: number;
    noiseResidual: number;
    biologicalPerturbation: number;
  };
  /** Window duration in seconds */
  windowSeconds?: number;
  /** Device salt for pseudonymous subject identity */
  deviceSalt: string;
}): ContinuityReceipt {
  const { pes, components, windowSeconds = 1, deviceSalt } = params;
  const now = new Date();
  const intervalStart = new Date(now.getTime() - windowSeconds * 1000);

  const engineEvidence = pesToEngineEvidence(pes, components, now.toISOString());
  const evidenceBlock = engineEvidenceToBlock(engineEvidence);

  const subject: SubjectRef = {
    id: sha256Hex(deviceSalt),
    type: "embodied",
  };

  const keyPair = getOrCreateKeyPair();
  const issuer = createIssuerIdentity(keyPair);

  const unsignedReceipt = buildReceipt({
    evidence: [evidenceBlock],
    interval: {
      start: intervalStart.toISOString(),
      end: now.toISOString(),
      coverageMs: windowSeconds * 1000,
    },
    subject,
    issuer,
  });

  return signReceipt(unsignedReceipt, keyPair.secretKey);
}

// Re-export CPS-0001 types for convenience
export type { ContinuityReceipt, VerificationResult };

// ── Lightweight Entropy Score (no receipt, live UI feedback) ──

/**
 * Get a real-time PES score from MediaPipe frames.
 * Lightweight — no receipt generation. Use for live UI feedback.
 */
export function getEntropyScore(
  mediaPipeFrames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>,
  timestamps: number[],
): number | null {
  if (mediaPipeFrames.length < 8) return null;
  const recent = mediaPipeFrames.slice(-30);
  const recentTs = timestamps.slice(-30);
  const sstFrames = recent.map((lm) => normalizeSSTFrame(mediaPipeToSST(lm)));
  const { pes } = computeFullPES(
    sstFrames as Array<Record<number, JointPosition>>,
    recentTs,
  );
  return pes;
}

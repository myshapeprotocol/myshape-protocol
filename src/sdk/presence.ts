/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol SDK — Presence Module (§8.2)
// ============================================================

import { mediaPipeToSST, normalizeSSTFrame } from "@/engine/skeleton-topology";
import { computeFullPES } from "@/engine/presence-entropy";
import { generateFullProof } from "@/engine/proof-system";
import { createPresenceSession } from "@/engine/local-identity";
import type { JointPosition } from "@/types/motion-vector";

// ── §8.2.3 — Presence Receipt ──

export interface PresenceReceipt {
  zkp_hash: string;
  pes: number;
  timestamp: number;
  window_seconds: number;
  session_id: string;
  verification_url?: string;
}

// ── §8.2.1 — Generate Presence Proof ──

export interface GeneratePresenceOptions {
  window?: number;    // seconds, default 1.0
  fps?: number;       // default 30
}

export interface PresenceProofResult {
  pop_hash: string;
  mp_hash: string;
  ep_hash: string;
  zkp_hash: string;
  pes: number;
  timestamp: number;
}

export function generatePresenceProof(
  mediaPipeFrames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>,
  timestamps: number[],
  options: GeneratePresenceOptions = {},
): PresenceProofResult | null {
  const { window = 1, fps = 30 } = options;

  if (mediaPipeFrames.length < 8 || timestamps.length < 8) return null;

  // Convert all frames to SST
  const sstFrames = mediaPipeFrames.map(lm =>
    normalizeSSTFrame(mediaPipeToSST(lm)),
  );

  // Use last N frames (matching window)
  const windowFrames = Math.min(sstFrames.length, Math.round(window * fps));
  const recentFrames = sstFrames.slice(-windowFrames);
  const recentTimestamps = timestamps.slice(-windowFrames);

  // Compute PES
  const { pes, components } = computeFullPES(
    recentFrames as Array<Record<number, JointPosition>>,
    recentTimestamps,
  );

  // Simple hash helpers
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    // h = h & h clamps to 32-bit integer range (consistent with Java hashCode behavior)
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };

  // Generate full ZK-Presence proof
  const session = createPresenceSession(window);
  const zkp = generateFullProof({
    fps,
    windowSeconds: window,
    nodes: 18,
    mvHash: quickHash(JSON.stringify(recentFrames)),
    featureHash: quickHash(JSON.stringify(components)),
    pes,
    pesComponents: components,
    deviceSalt: session.identity.salt,
  });

  return {
    pop_hash: zkp.pop.pop_hash,
    mp_hash: zkp.mp.mp_hash,
    ep_hash: zkp.ep.ep_hash,
    zkp_hash: zkp.zkp_hash,
    pes,
    timestamp: zkp.generated_at,
  };
}

// ── §8.2.2 — Get Entropy Score ──
// Real-time PES for live UI feedback

export function getEntropyScore(
  mediaPipeFrames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>,
  timestamps: number[],
): number | null {
  if (mediaPipeFrames.length < 8) return null;
  const recent = mediaPipeFrames.slice(-30);
  const recentTs = timestamps.slice(-30);
  const sstFrames = recent.map(lm => normalizeSSTFrame(mediaPipeToSST(lm)));
  const { pes } = computeFullPES(
    sstFrames as Array<Record<number, JointPosition>>,
    recentTs,
  );
  return pes;
}

// ── §8.2.3 — Request Presence (full flow) ──

export function requestPresence(
  mediaPipeFrames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>,
  timestamps: number[],
): PresenceReceipt | null {
  const proof = generatePresenceProof(mediaPipeFrames, timestamps);
  if (!proof) return null;

  return {
    zkp_hash: proof.zkp_hash,
    pes: proof.pes,
    timestamp: proof.timestamp,
    window_seconds: 1,
    session_id: createPresenceSession(1).session_nonce,
  };
}

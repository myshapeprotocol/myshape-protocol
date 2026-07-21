/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol SDK — Proof Module (§8.3)
// ============================================================

import { verifyZKPresenceProof } from "@/engine/proof-system";
import type { ZKPresenceProof, VerificationResult } from "@/engine/proof-system";
import { rotateDeviceSalt } from "@/engine/local-identity";

// ── §8.3.1 — Local Proof Verification ──

export function verifyLocalProof(
  proof: ZKPresenceProof,
  options: { pes_min?: number; max_age_seconds?: number } = {},
): VerificationResult {
  return verifyZKPresenceProof(proof, options);
}

// ── §8.3.2 — Proof Aggregation (stub) ──

export interface AggregatedProof {
  version: 1;
  proofs_count: number;
  root_hash: string;
  window_start: number;
  window_end: number;
  aggregated_pes: number; // average PES across all proofs
}

export function aggregateProofs(proofs: ZKPresenceProof[]): AggregatedProof | null {
  if (proofs.length === 0) return null;

  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };

  const combinedHash = proofs.map(p => p.zkp_hash).join(":");
  const avgPes = proofs.reduce((s, p) => s + p.ep.pes, 0) / proofs.length;
  const timestamps = proofs.map(p => p.generated_at);

  return {
    version: 1,
    proofs_count: proofs.length,
    root_hash: quickHash(combinedHash),
    window_start: Math.min(...timestamps),
    window_end: Math.max(...timestamps),
    aggregated_pes: avgPes,
  };
}

// ── §8.3.3 — Device Revocation ──

export interface RevocationReceipt {
  device_salt: string;
  revoked_at: number;
  reason: string;
}

export function revokeDevice(reason = "user_requested"): RevocationReceipt {
  const newSalt = rotateDeviceSalt();
  return {
    device_salt: newSalt,
    revoked_at: Math.floor(Date.now() / 1000),
    reason,
  };
}

/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol — Protocol Validator (§9.4)
// Implements all six verification rules for Presence Transactions.
// ============================================================

import type { ZKPresenceProof } from "./proof-system";
import type { PresenceTransaction, VerificationRules } from "@/types/protocol";

// ── In-memory replay registry (production: distributed registry) ──

const replayRegistry = new Set<string>();
const deviceRevocationList = new Set<string>();

// ── Rule 1: ZKP Validity ──

function rule1_zkpValidity(tx: PresenceTransaction): boolean {
  // Recompute root hash from sub-proofs
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };
  const recomputed = quickHash(
    `${tx.zkp.pop.pop_hash}:${tx.zkp.mp.mp_hash}:${tx.zkp.ep.ep_hash}`,
  );
  return recomputed === tx.zkp.zkp_hash;
}

// ── Rule 2: Entropy Threshold ──

function rule2_entropyThreshold(tx: PresenceTransaction, pesMin = 0.65): boolean {
  return tx.entropy_score >= pesMin;
}

// ── Rule 3: Timestamp Validity ──

function rule3_timestampValidity(tx: PresenceTransaction, maxAgeSeconds = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  // Not in the future
  if (tx.timestamp > now + 10) return false; // 10s clock skew tolerance
  // Not expired
  if (now - tx.timestamp > maxAgeSeconds) return false;
  // Within proof expiration window
  if (now > tx.zkp.expires_at) return false;
  return true;
}

// ── Rule 4: Replay Protection ──

function rule4_replayProtection(tx: PresenceTransaction): boolean {
  const popKey = `pop:${tx.zkp.pop.pop_hash}`;
  const tsKey = `ts:${tx.timestamp}`;
  const deviceKey = `dev:${tx.device_salt_hash}`;

  if (replayRegistry.has(popKey)) return false;
  if (replayRegistry.has(tsKey)) return false;
  if (replayRegistry.has(deviceKey)) return false;

  // Register for future checks
  replayRegistry.add(popKey);
  replayRegistry.add(tsKey);
  replayRegistry.add(deviceKey);

  // Clean old entries periodically (keep last 1000)
  if (replayRegistry.size > 3000) {
    const entries = Array.from(replayRegistry);
    entries.slice(0, 1000).forEach(k => replayRegistry.delete(k));
  }

  return true;
}

// ── Rule 5: Device Revocation ──

export function revokeProtocolDevice(deviceSaltHash: string): void {
  deviceRevocationList.add(deviceSaltHash);
}

function rule5_deviceRevocation(tx: PresenceTransaction): boolean {
  return !deviceRevocationList.has(tx.device_salt_hash);
}

// ── Rule 6: Proof Integrity ──

function rule6_proofIntegrity(tx: PresenceTransaction): boolean {
  // Version consistency
  if (tx.zkp.version !== 1) return false;
  if (tx.zkp.pop.version !== 1) return false;
  if (tx.zkp.mp.version !== 1) return false;
  if (tx.zkp.ep.version !== 1) return false;
  if (tx.version !== 1) return false;

  // Timestamp consistency
  if (tx.zkp.pop.timestamp !== tx.zkp.mp.timestamp) return false;
  if (tx.zkp.pop.timestamp !== tx.zkp.ep.timestamp) return false;

  // PES consistency
  if (Math.abs(tx.entropy_score - tx.zkp.ep.pes) > 0.001) return false;

  return true;
}

// ── Full Verification (§9.4) ──

export interface VerificationReport {
  passed: boolean;
  rules: VerificationRules;
  failed_rules: string[];
  verified_at: number;
}

export function verifyPresenceTransaction(
  tx: PresenceTransaction,
  options: { pes_min?: number; max_age_seconds?: number } = {},
): VerificationReport {
  const rules: VerificationRules = {
    zkp_valid: rule1_zkpValidity(tx),
    entropy_threshold: rule2_entropyThreshold(tx, options.pes_min),
    timestamp_valid: rule3_timestampValidity(tx, options.max_age_seconds),
    replay_protection: rule4_replayProtection(tx),
    device_not_revoked: rule5_deviceRevocation(tx),
    proof_integrity: rule6_proofIntegrity(tx),
  };

  const failed = Object.entries(rules)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    passed: failed.length === 0,
    rules,
    failed_rules: failed,
    verified_at: Math.floor(Date.now() / 1000),
  };
}

// ── Create a Presence Transaction from a ZKP ──

export function createPresenceTransaction(
  zkp: ZKPresenceProof,
  pes: number,
  deviceSalt: string,
): PresenceTransaction {
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };

  // Sign the transaction (stub — production uses EdDSA or similar)
  const signData = `${zkp.zkp_hash}:${pes}:${zkp.generated_at}:${quickHash(deviceSalt)}`;
  const signature = quickHash(signData);

  return {
    version: 1,
    zkp,
    entropy_score: pes,
    timestamp: zkp.generated_at,
    device_salt_hash: quickHash(deviceSalt),
    signature,
  };
}

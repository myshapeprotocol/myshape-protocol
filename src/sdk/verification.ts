// ============================================================
// MyShape Protocol SDK — Verification Module (§8.4)
// ============================================================

import { verifyZKPresenceProof } from "@/engine/proof-system";
import type { ZKPresenceProof, VerificationResult } from "@/engine/proof-system";
import type { PresenceReceipt } from "./presence";

// ── §8.4.1 — Verify Presence Proof ──

export function verifyPresenceProof(
  zkp: ZKPresenceProof,
  options: {
    pes_min?: number;
    max_age_seconds?: number;
    expected_device_salt?: string;
  } = {},
): VerificationResult {
  const result = verifyZKPresenceProof(zkp, {
    pes_min: options.pes_min,
    max_age_seconds: options.max_age_seconds,
  });

  // Additional device salt check
  if (options.expected_device_salt && zkp.device_salt) {
    result.checks.device_integrity = zkp.device_salt === options.expected_device_salt;
    if (!result.checks.device_integrity) result.valid = false;
  }

  return result;
}

// ── §8.4.2 — Verify Presence Receipt ──
// Lightweight verification for application layer

export function verifyPresenceReceipt(
  receipt: PresenceReceipt,
  options: { max_age_seconds?: number } = {},
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = options.max_age_seconds ?? 300; // default 5 min

  // Timestamp validation
  if (now - receipt.timestamp > maxAge) return false;

  // PES threshold
  if (receipt.pes < 0.20) return false;

  return true;
}

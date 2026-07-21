/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol — Wire Format Types v1.0
// Derived from: Technical Specification v1.0 §9
// ============================================================

import type { ZKPresenceProof } from "@/engine/proof-system";

// ── §9.2 — Presence Transaction (on-chain / network wire format) ──

export interface PresenceTransaction {
  version: 1;
  zkp: ZKPresenceProof;
  entropy_score: number;        // PES
  timestamp: number;            // unix time
  device_salt_hash: string;     // H(device_salt) — never reveals raw salt
  signature: string;            // client signature over the above fields
}

// ── §9.5 — Presence Receipt (application-facing) ──

export interface PresenceReceipt {
  version: 1;
  presence: true;               // always true if receipt exists
  entropy_score: number;
  timestamp: number;
  verification_signature: string; // signed by verification node
}

// ── §9.4 — Verification Rules ──

export interface VerificationRules {
  zkp_valid: boolean;           // Rule 1: ZKP cryptographic validity
  entropy_threshold: boolean;   // Rule 2: PES ≥ PES_min (default 0.65)
  timestamp_valid: boolean;     // Rule 3: within window, not future, not expired
  replay_protection: boolean;   // Rule 4: PoP/timestamp/salt not previously seen
  device_not_revoked: boolean;  // Rule 5: device not in revocation list
  proof_integrity: boolean;     // Rule 6: PoP/MP/EP hashes consistent, version matches
}

// ── §9.7 — Protocol Version ──

export const PROTOCOL_VERSION = "1.0.0" as const;

export interface ProtocolVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseProtocolVersion(v: string): ProtocolVersion {
  const [major, minor, patch] = v.split(".").map(Number);
  return { major, minor, patch };
}

export function isCompatible(a: ProtocolVersion, b: ProtocolVersion): boolean {
  // Compatible if same major version
  return a.major === b.major;
}

// ── §9.8 — Capability negotiation ──

export interface ProtocolCapabilities {
  version: string;
  proof_types: string[];        // e.g. ["ZK-MG", "ZK-MIP"]
  hash_algorithms: string[];    // e.g. ["poseidon", "blake3"]
  max_window_seconds: number;
  min_fps: number;
  supports_aggregation: boolean;
  supports_recursive_proofs: boolean;
}

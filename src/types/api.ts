// ============================================================
// MyShape Protocol — Unified API Response Contracts
// ============================================================
// ⚠️  SINGLE SOURCE OF TRUTH — all client-facing API shapes live here.
//
// Rules:
//   1. Every public API route MUST return a type from this file.
//   2. Client components MUST import response types from here (never inline).
//   3. All fields are readonly — the response is a snapshot, not a state bag.
//   4. When a route's shape changes, update this file FIRST, then the route.
//   5. Bump CURRENT_API_VERSION on every breaking shape change.
//
// See memory/algorithm-changelog.md for the engine approximation versions
// that feed into the DTOs referenced here.
// ============================================================

import type { ProtocolProgress } from "./protocol-progress";

// ── Protocol API version ──
// Bump the minor on schema additions, major on field removals/renames.
// All responses carry this version so clients can detect drift.

export const CURRENT_API_VERSION = "1.0";

// ── Base response envelope that every API response extends ──

export interface ApiResponseEnvelope {
  readonly apiVersion: string;
}

// ── Generic error envelope (all routes fall back to this) ──

export interface ApiError extends ApiResponseEnvelope {
  readonly error: string;
}

// ═════════════════════════════════════════════════════════════
// GET  /api/node/privileges?email=... | ?wallet=...
// ═════════════════════════════════════════════════════════════

export interface PrivilegesResponse extends ApiResponseEnvelope {
  readonly email: string;
  readonly status: string;
  readonly is_genesis: boolean;
  readonly is_active: boolean;
  readonly scan_count: number;
  readonly data_contribution: number;
  readonly tier: string;
  readonly early_access: boolean;
  readonly entropy_score: number;
  readonly particle_level: number;
  readonly streak_days: number;
  readonly streak_multiplier: number;
  readonly best_pes: number;
  readonly registered_at: string;
  readonly protocol_progress: ProtocolProgress;
}

// ═════════════════════════════════════════════════════════════
// POST /api/nodes/handshake
// ═════════════════════════════════════════════════════════════

export interface HandshakeResponse extends ApiResponseEnvelope {
  readonly node_token?: string;
  readonly initialized_at?: string;
  readonly stage?: string;
  readonly message?: string;
  readonly error?: string;
  readonly retry_after_s?: number;
}

// ═════════════════════════════════════════════════════════════
// GET  /api/nodes/status  (public protocol health)
// ═════════════════════════════════════════════════════════════

export interface NodesStatusResponse extends ApiResponseEnvelope {
  readonly total_nodes: number;
  readonly genesis_nodes: number;
  readonly genesis_remaining: number;
  readonly active_humans: number;
  readonly agents: number;
  readonly total_scans: number;
  readonly last_scan: string | null;
  readonly cohort_sealed: boolean;
  readonly status: string;
  readonly timestamp: string;
  readonly error?: string;
}

// ═════════════════════════════════════════════════════════════
// GET  /api/nodes/genesis  (anonymous cohort list)
// ═════════════════════════════════════════════════════════════

export interface GenesisNodeEntry {
  readonly index: number;
  readonly id: string;
  readonly joined: string;
}

export interface GenesisNodesResponse extends ApiResponseEnvelope {
  readonly total: number;
  readonly remaining: number;
  readonly nodes: readonly GenesisNodeEntry[];
  readonly error?: string;
}

// ═════════════════════════════════════════════════════════════
// POST /api/send-otp
// ═════════════════════════════════════════════════════════════

export interface SendOtpResponse extends ApiResponseEnvelope {
  readonly success?: boolean;
  readonly skip_otp?: boolean;
  readonly message?: string;
  readonly status?: string;
  readonly error?: string;
}

// ═════════════════════════════════════════════════════════════
// POST /api/verify-otp
// ═════════════════════════════════════════════════════════════

export interface VerifyOtpResponse extends ApiResponseEnvelope {
  readonly success?: boolean;
  readonly status?: string;
  readonly node_handle?: string | null;
  readonly error?: string;
}

// ═════════════════════════════════════════════════════════════
// POST /api/uplink
// ═════════════════════════════════════════════════════════════

export interface UplinkResponse extends ApiResponseEnvelope {
  readonly success?: boolean;
  readonly alreadyExists?: boolean;
  readonly message?: string;
  readonly error?: string;
}

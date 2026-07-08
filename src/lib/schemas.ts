// ============================================================
// MyShape Protocol — Runtime API Schemas (Zod)
// ============================================================
// ⚠️  RUNTIME ENFORCEMENT of compile-time contracts in api.ts.
//
// Rules:
//   1. One Zod schema per type in src/types/api.ts.
//   2. Schemas live here, NOT in route handlers — routes import from here.
//   3. Use .strict() to catch unexpected fields (schema drift).
//   4. When api.ts changes, update the corresponding schema here.
// ============================================================

import { z } from "zod";
import { CURRENT_API_VERSION } from "@/types/api";

// ── Version field validator ──

const apiVersion = z.literal(CURRENT_API_VERSION);

// ── Generic error envelope ──

export const ApiErrorSchema = z.object({
  apiVersion,
  error: z.string(),
}).strict();

// ── ProtocolProgress (critical fields only — rest passed through) ──

const ProtocolProgressSchema = z.object({
  stage: z.enum(["GENESIS", "FORMATION", "SOVEREIGN"]),
  particle: z.object({
    level: z.number().int().min(1).max(8),
    label: z.string(),
    entropyScore: z.number(),
  }).strict(),
  reputation: z.object({
    tier: z.enum(["untrusted", "new", "regular", "established", "genesis"]),
    score: z.number(),
    totalProofs: z.number(),
  }).strict(),
  isEligibleFor: z.object({
    genesisKey: z.boolean(),
    zkOps: z.boolean(),
    governance: z.boolean(),
    protocolCouncil: z.boolean(),
  }).strict(),
  narrative: z.object({
    summary: z.string(),
    nextUnlock: z.object({
      label: z.string(),
      requirement: z.string(),
      progress: z.number(),
    }).nullable(),
  }).strict(),
}).passthrough(); // allow economy/identity/streak to evolve without schema breakage

// ═════════════════════════════════════════════════════════════
// GET /api/node/privileges
// ═════════════════════════════════════════════════════════════

export const PrivilegesResponseSchema = z.object({
  apiVersion,
  email: z.string(),
  status: z.string(),
  is_genesis: z.boolean(),
  is_active: z.boolean(),
  scan_count: z.number().int().min(0),
  data_contribution: z.number().int().min(0),
  tier: z.string(),
  early_access: z.boolean(),
  entropy_score: z.number(),
  particle_level: z.number().int().min(1),
  streak_days: z.number().int().min(0),
  streak_multiplier: z.number(),
  best_pes: z.number(),
  registered_at: z.string(),
  protocol_progress: ProtocolProgressSchema,
}).strict();

// ═════════════════════════════════════════════════════════════
// POST /api/nodes/handshake
// ═════════════════════════════════════════════════════════════

export const HandshakeResponseSchema = z.object({
  apiVersion,
  node_token: z.string().optional(),
  initialized_at: z.string().optional(),
  stage: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  retry_after_s: z.number().optional(),
}).strict();

// ═════════════════════════════════════════════════════════════
// GET /api/nodes/status
// ═════════════════════════════════════════════════════════════

export const NodesStatusResponseSchema = z.object({
  apiVersion,
  total_nodes: z.number().int().min(0),
  genesis_nodes: z.number().int().min(0),
  genesis_remaining: z.number().int().min(0),
  active_humans: z.number().int().min(0),
  agents: z.number().int().min(0),
  total_scans: z.number().int().min(0),
  last_scan: z.string().nullable(),
  cohort_sealed: z.boolean(),
  status: z.string(),
  timestamp: z.string(),
}).strict();

// ═════════════════════════════════════════════════════════════
// GET /api/nodes/genesis
// ═════════════════════════════════════════════════════════════

export const GenesisNodeEntrySchema = z.object({
  index: z.number().int().min(1),
  id: z.string(),
  joined: z.string(),
}).strict();

export const GenesisNodesResponseSchema = z.object({
  apiVersion,
  total: z.number().int().min(0),
  remaining: z.number().int().min(0),
  nodes: z.array(GenesisNodeEntrySchema),
}).strict();

// ═════════════════════════════════════════════════════════════
// POST /api/send-otp
// ═════════════════════════════════════════════════════════════

export const SendOtpResponseSchema = z.object({
  apiVersion,
  success: z.boolean().optional(),
  skip_otp: z.boolean().optional(),
  message: z.string().optional(),
  status: z.string().optional(),
  error: z.string().optional(),
}).strict();

// ═════════════════════════════════════════════════════════════
// POST /api/verify-otp
// ═════════════════════════════════════════════════════════════

export const VerifyOtpResponseSchema = z.object({
  apiVersion,
  success: z.boolean().optional(),
  status: z.string().optional(),
  node_handle: z.string().nullable().optional(),
  error: z.string().optional(),
}).strict();

// ═════════════════════════════════════════════════════════════
// POST /api/uplink
// ═════════════════════════════════════════════════════════════

export const UplinkResponseSchema = z.object({
  apiVersion,
  success: z.boolean().optional(),
  alreadyExists: z.boolean().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
}).strict();

// ── Schema registry (map path → schema, used by contract tests) ──

export const API_SCHEMA_REGISTRY = {
  "GET /api/node/privileges": PrivilegesResponseSchema,
  "POST /api/nodes/handshake": HandshakeResponseSchema,
  "GET /api/nodes/status": NodesStatusResponseSchema,
  "GET /api/nodes/genesis": GenesisNodesResponseSchema,
  "POST /api/send-otp": SendOtpResponseSchema,
  "POST /api/verify-otp": VerifyOtpResponseSchema,
  "POST /api/uplink": UplinkResponseSchema,
} as const;

export type ApiPath = keyof typeof API_SCHEMA_REGISTRY;

// ============================================================
// MyShape Protocol — Algorithm Constants
// ============================================================
// ⚠️  SINGLE SOURCE OF TRUTH for all approximation thresholds.
//
// Rules:
//   1. Every magic number in protocol-progress.ts maps to an entry here.
//   2. Changing any value requires:
//      a. Update this file
//      b. Update algorithm-changelog.md with a new version entry
//      c. Update snapshot tests in approximation-snapshot.test.ts
//   3. CI enforces: snapshot diff without changelog entry = BLOCKED.
//
// See memory/algorithm-changelog.md for the full version history.
// ============================================================

// ── v0.1-pre-genesis · 2026-07-08 ──

/** Tier order for reputation progression (ascending) */
export const REPUTATION_TIER_ORDER = [
  "untrusted",
  "new",
  "regular",
  "established",
  "genesis",
] as const;

/**
 * Reputation tier requirements for the real engine.
 * Used by computeNextReputation() — NOT by the approximation.
 */
export const ENGINE_REPUTATION_REQUIREMENTS: Record<
  string,
  { minScore: number; minProofs: number }
> = {
  untrusted:   { minScore: 0,   minProofs: 0 },
  new:         { minScore: 0,   minProofs: 1 },
  regular:     { minScore: 0.4, minProofs: 10 },
  established: { minScore: 0.6, minProofs: 30 },
  genesis:     { minScore: 0.8, minProofs: 100 },
};

/**
 * Thresholds for computeApproximateReputationTier().
 * Proxies: bestPes → PRS score, scanCount → totalProofs.
 *
 * Deviation: ±1 tier. 1 great scan + 9 bad → overestimated.
 */
export const APPROX_REPUTATION_THRESHOLDS: Array<{
  tier: string;
  minBestPes: number;
  minScanCount: number;
}> = [
  { tier: "genesis",     minBestPes: 0.80, minScanCount: 100 },
  { tier: "established", minBestPes: 0.60, minScanCount: 30 },
  { tier: "regular",     minBestPes: 0.40, minScanCount: 10 },
  { tier: "new",         minBestPes: 0,    minScanCount: 1 },
  // fallback: "untrusted" when scanCount === 0
];

/**
 * Thresholds for deriveTokenTier().
 * Proxies: bestPes → presenceValue (pv).
 *
 * Deviation: ±2 tiers for unstable users.
 * Real engine uses PSS stability + continuity penalties; bestPes misses both.
 */
export const APPROX_TOKEN_TIER_THRESHOLDS: Array<{
  tier: string;
  requiresSovereign: boolean;
  requiresReputation: string | null;   // reputation tier, or null
  minBestPes: number;
}> = [
  { tier: "genesis",   requiresSovereign: true,  requiresReputation: "genesis",     minBestPes: 0.75 },
  { tier: "validator", requiresSovereign: false, requiresReputation: "established", minBestPes: 0.50 },
  { tier: "presence",  requiresSovereign: false, requiresReputation: null,          minBestPes: 0.30 },
  // fallback: "basic"
];

/**
 * Thresholds for deriveIdentityStage().
 * Deterministic state machine — no statistical approximation.
 * Deviation ≈ 0.
 */
export const IDENTITY_STAGE_THRESHOLDS = {
  maturityMinParticleLevel: 7,
  accumulationMinParticleLevel: 3,
} as const;

/**
 * Right grant rules for deriveRights().
 * Intentionally diverges from grantCitizenship():
 * ALL Genesis nodes get participation + economic regardless of reputation tier.
 * This is by design, not a bug.
 */
export const RIGHT_GRANT_RULES = {
  /** Base rights granted to every node */
  baseRights: ["existence", "mobility"] as readonly string[],
  /** Genesis nodes ALWAYS get these extra rights (protocol founding privilege) */
  genesisOverrideRights: ["participation", "economic"] as readonly string[],
  /** Governance right requires GENESIS_NODE + genesis reputation tier */
  governanceRequiresGenesisRep: true,
} as const;

/**
 * Voting power multiplier cap.
 * votingPower = min(1, bestPes × streakMultiplier), capped at VOTING_POWER_CAP.
 */
export const VOTING_POWER_CAP = 1.0;

// ============================================================
// MyShape Protocol — Progress Mapper
// ============================================================
// Maps 5 independent engine outputs → unified ProtocolProgress DTO.
//
// This is the single aggregation point. All Dashboard/UI components
// consume the ProtocolProgress shape; none call engines directly.
// When engine output schemas change, only this file needs updating.
// ============================================================

import {
  getVisualTier,
  getLevelProgress,
  VISUAL_TIERS,
} from "@/engine/entropy-growth";
import type { ReputationTier } from "@/engine/presence-reputation";
import type { IdentityStage, CitizenshipRight } from "@/engine/presence-identity";
import type { TokenTier } from "@/engine/presence-economy";
import type {
  ProtocolProgress,
  ProtocolProgressInput,
  ProtocolStage,
} from "@/types/protocol-progress";
import {
  STAGE_BOUNDARIES,
  UNLOCK_GATES,
} from "@/types/protocol-progress";
import {
  REPUTATION_TIER_ORDER,
  ENGINE_REPUTATION_REQUIREMENTS,
  APPROX_REPUTATION_THRESHOLDS,
  APPROX_TOKEN_TIER_THRESHOLDS,
  IDENTITY_STAGE_THRESHOLDS,
  RIGHT_GRANT_RULES,
  VOTING_POWER_CAP,
} from "@/protocol/constants";

// ── Reputation tier ordering (ascending) ──

const REPUTATION_ORDER: readonly ReputationTier[] = REPUTATION_TIER_ORDER;

const REPUTATION_REQUIREMENTS = ENGINE_REPUTATION_REQUIREMENTS as Record<
  ReputationTier,
  { minScore: number; minProofs: number }
>;

// ── 1. Stage determination ──

export function computeStage(
  reputationTier: ReputationTier,
  particleLevel: number,
): ProtocolStage {
  const repIndex = REPUTATION_ORDER.indexOf(reputationTier);

  // Read thresholds from STAGE_BOUNDARIES — single source of truth.
  // Walk stages from highest to lowest, return first match.
  const stageOrder: ProtocolStage[] = ["SOVEREIGN", "FORMATION", "GENESIS"];
  for (const stage of stageOrder) {
    const bounds = STAGE_BOUNDARIES[stage];
    if (
      repIndex >= REPUTATION_ORDER.indexOf(bounds.minTier) &&
      particleLevel >= bounds.minParticleLevel
    ) {
      return stage;
    }
  }

  return "GENESIS";
}

// ── 2. Next reputation tier requirement ──

export function computeNextReputation(
  currentTier: ReputationTier,
): ProtocolProgress["reputation"]["requiredForNext"] {
  const idx = REPUTATION_ORDER.indexOf(currentTier);
  if (idx >= REPUTATION_ORDER.length - 1) return null; // already at genesis

  const next = REPUTATION_ORDER[idx + 1];
  const req = REPUTATION_REQUIREMENTS[next];
  return { tier: next, minScore: req.minScore, minProofs: req.minProofs };
}

// ── 3. Streak next milestone ──

export function computeStreakMilestone(
  streakDays: number,
): { nextMilestone: 7 | 30 | null; daysToNextMilestone: number | null } {
  if (streakDays >= 30) {
    return { nextMilestone: null, daysToNextMilestone: null };
  }
  if (streakDays >= 7) {
    return { nextMilestone: 30, daysToNextMilestone: 30 - streakDays };
  }
  return { nextMilestone: 7, daysToNextMilestone: 7 - streakDays };
}

// ── 4. Eligibility flags ──

export function computeEligibility(
  reputationTier: ReputationTier,
  particleLevel: number,
  totalProofs: number,
): ProtocolProgress["isEligibleFor"] {
  const repIdx = REPUTATION_ORDER.indexOf(reputationTier);

  return {
    genesisKey:     totalProofs >= 1,
    zkOps:          repIdx >= REPUTATION_ORDER.indexOf("regular") && particleLevel >= 3 && totalProofs >= 10,
    governance:     repIdx >= REPUTATION_ORDER.indexOf("established") && particleLevel >= 5 && totalProofs >= 30,
    protocolCouncil: repIdx >= REPUTATION_ORDER.indexOf("genesis") && particleLevel >= 7 && totalProofs >= 100,
  };
}

// ── 5. Narrative summary ──

export function buildNarrative(
  input: ProtocolProgressInput,
  stage: ProtocolStage,
): ProtocolProgress["narrative"] {
  const progress = getLevelProgress(input.entropyScore);
  const nextTier = computeNextReputation(input.reputationTier);

  // ── Summary string ──
  let summary: string;
  if (stage === "GENESIS") {
    if (input.totalProofs === 0) {
      summary = "Complete your first motion scan to begin the Genesis ritual";
    } else {
      summary = `Building your presence — ${progress.remaining} more entropy to ${VISUAL_TIERS[Math.min(8, input.particleLevel + 1) as keyof typeof VISUAL_TIERS]?.label ?? "next level"}`;
    }
  } else if (stage === "FORMATION") {
    summary = `Pattern crystallizing — ${input.totalProofs} proofs submitted, ${nextTier ? `${nextTier.minProofs - input.totalProofs} to ${nextTier.tier}` : "reputation established"}`;
  } else {
    summary = `Sovereign presence active — governance weight ${(input.votingPower * 100).toFixed(0)}%`;
  }

  // ── Next unlock ──
  let nextUnlock: ProtocolProgress["narrative"]["nextUnlock"] = null;

  // Walk UNLOCK_GATES in order, find first not yet unlocked
  for (const gate of UNLOCK_GATES) {
    const repIdx = REPUTATION_ORDER.indexOf(input.reputationTier);
    const gateRepIdx = REPUTATION_ORDER.indexOf(gate.minTier);
    const isUnlocked =
      repIdx >= gateRepIdx &&
      input.particleLevel >= gate.minParticleLevel &&
      input.totalProofs >= gate.minProofs;

    if (!isUnlocked) {
      // Compute how close
      const repProgress = gateRepIdx > 0
        ? Math.min(1, repIdx / gateRepIdx)
        : (input.totalProofs > 0 ? 1 : 0);
      const particleProgress = Math.min(1, input.particleLevel / gate.minParticleLevel);
      const proofProgress = Math.min(1, input.totalProofs / gate.minProofs);
      const avgProgress = (repProgress + particleProgress + proofProgress) / 3;

      const parts: string[] = [];
      if (repIdx < gateRepIdx) parts.push(`Reputation: ${input.reputationTier} → ${gate.minTier}`);
      if (input.particleLevel < gate.minParticleLevel) parts.push(`Particle Level: ${input.particleLevel}/${gate.minParticleLevel}`);
      if (input.totalProofs < gate.minProofs) parts.push(`${input.totalProofs}/${gate.minProofs} proofs`);

      nextUnlock = {
        label: `${gate.icon} ${gate.feature}`,
        requirement: parts.join(" · "),
        progress: avgProgress,
      };
      break;
    }
  }

  return { summary, nextUnlock };
}

// ── 6. Approximate reputation from minimal DB data ──
// Used when the full reputation engine hasn't run yet (e.g. API queries
// that only have protocol_nodes columns).

export interface DbNodeRow {
  status: string;                   // GENESIS_NODE | ACTIVE | ...
  scanCount: number;
  entropyScore: number;
  particleLevel: number;
  streakDays: number;
  streakMultiplier: number;
  bestPes: number;
}

export function computeApproximateReputationTier(
  bestPes: number,
  scanCount: number,
): ReputationTier {
  // Simplified tier logic — bestPes proxies for PRS, scanCount for totalProofs.
  // Thresholds from APPROX_REPUTATION_THRESHOLDS (single source of truth).
  for (const entry of APPROX_REPUTATION_THRESHOLDS) {
    if (bestPes >= entry.minBestPes && scanCount >= entry.minScanCount) {
      return entry.tier as ReputationTier;
    }
  }
  return "untrusted";
}

export function deriveIdentityStage(status: string, particleLevel: number): IdentityStage {
  // Thresholds from IDENTITY_STAGE_THRESHOLDS (single source of truth).
  if (status === "GENESIS_NODE" && particleLevel >= IDENTITY_STAGE_THRESHOLDS.maturityMinParticleLevel) return "maturity";
  if (status === "GENESIS_NODE") return "formation";
  if (status === "ACTIVE" && particleLevel >= IDENTITY_STAGE_THRESHOLDS.accumulationMinParticleLevel) return "accumulation";
  return "genesis";
}

/**
 * Approximate citizenship rights from DB status + reputation tier.
 *
 * NOTE: intentionally diverges from grantCitizenship() in presence-identity.ts.
 * The real engine grants participation/economic based purely on reputation tier
 * (established+). This approximation also grants them to ALL GENESIS_NODE members
 * regardless of reputation — Genesis founding is permanent and the dashboard
 * should reflect that privilege. Governance still requires genesis reputation tier.
 */
export function deriveRights(
  status: string,
  reputationTier: ReputationTier,
): CitizenshipRight[] {
  // Right grant rules from RIGHT_GRANT_RULES (single source of truth).
  const rights: CitizenshipRight[] = [...RIGHT_GRANT_RULES.baseRights] as CitizenshipRight[];
  const genesisRep = reputationTier === "genesis" || reputationTier === "established";
  // Genesis override: ALL Genesis nodes get participation + economic (by design)
  if (status === "GENESIS_NODE" || (status === "ACTIVE" && genesisRep)) {
    rights.push(...RIGHT_GRANT_RULES.genesisOverrideRights as CitizenshipRight[]);
  }
  if (
    RIGHT_GRANT_RULES.governanceRequiresGenesisRep &&
    status === "GENESIS_NODE" &&
    reputationTier === "genesis"
  ) {
    rights.push("governance");
  }
  return rights;
}

/**
 * Approximate token tier from DB data.
 *
 * NOTE: the real engine (mintPresenceToken) compares against presenceValue (pv),
 * which incorporates stability (PSS) and continuity penalties. This approximation
 * uses bestPes as a proxy — the dashboard tier may appear inflated for users
 * with high PES but poor stability. The real engine is the authority at mint time.
 */
export function deriveTokenTier(
  status: string,
  reputationTier: ReputationTier,
  bestPes: number,
): TokenTier {
  // Thresholds from APPROX_TOKEN_TIER_THRESHOLDS (single source of truth).
  for (const entry of APPROX_TOKEN_TIER_THRESHOLDS) {
    if (entry.requiresGenesisNode && status !== "GENESIS_NODE") continue;
    if (
      entry.requiresReputation !== null &&
      reputationTier !== entry.requiresReputation
    ) continue;
    if (bestPes >= entry.minBestPes) return entry.tier as TokenTier;
  }
  return "basic";
}

/**
 * Entry point for API routes — converts a DB row + derived reputation
 * into the full ProtocolProgress DTO.
 */
export function computeProtocolProgressFromDb(row: DbNodeRow): ProtocolProgress {
  const reputationTier = computeApproximateReputationTier(row.bestPes, row.scanCount);
  const identityStage = deriveIdentityStage(row.status, row.particleLevel);
  const rights = deriveRights(row.status, reputationTier);
  const tokenTier = deriveTokenTier(row.status, reputationTier, row.bestPes);

  // Voting power: approximate from bestPes × streak, capped at VOTING_POWER_CAP
  const votingPower = Math.min(VOTING_POWER_CAP, row.bestPes * row.streakMultiplier);

  const input: ProtocolProgressInput = {
    entropyScore: row.entropyScore,
    particleLevel: row.particleLevel,
    streakDays: row.streakDays,
    streakMultiplier: row.streakMultiplier,
    prs: row.bestPes,                        // bestPes proxies for PRS
    reputationTier,
    totalProofs: row.scanCount,               // scanCount proxies for totalProofs
    avgPes: row.bestPes,
    identityStage,
    rights,
    votingPower,
    tokenTier,
    presenceValue: row.bestPes,               // bestPes proxies for presenceValue
  };

  return computeProtocolProgress(input);
}

// ── 7. Main mapper (full engine inputs) ──

export function computeProtocolProgress(input: ProtocolProgressInput): ProtocolProgress {
  const visual = getVisualTier(input.particleLevel);
  const levelProgress = getLevelProgress(input.entropyScore);
  const stage = computeStage(input.reputationTier, input.particleLevel);
  const streakMilestone = computeStreakMilestone(input.streakDays);
  const nextRep = computeNextReputation(input.reputationTier);
  const eligibility = computeEligibility(input.reputationTier, input.particleLevel, input.totalProofs);
  const narrative = buildNarrative(input, stage);

  const nextLevel = input.particleLevel >= 1 && input.particleLevel < 8
    ? VISUAL_TIERS[(input.particleLevel + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8]?.label ?? null
    : null;

  return {
    stage,

    particle: {
      level: input.particleLevel,
      label: visual.label,
      glow: visual.glow,
      particleCount: visual.particles,
      entropyScore: input.entropyScore,
      levelProgress: levelProgress.progress,
      remainingToNext: levelProgress.remaining,
      nextLabel: nextLevel,
    },

    reputation: {
      score: input.prs,
      tier: input.reputationTier,
      totalProofs: input.totalProofs,
      avgPes: input.avgPes,
      requiredForNext: nextRep,
    },

    identity: {
      stage: input.identityStage,
      rights: input.rights,
      votingPower: input.votingPower,
      canGovern: input.rights.includes("governance"),
      canParticipate: input.rights.includes("participation"),
    },

    isEligibleFor: eligibility,

    economy: {
      tokenTier: input.tokenTier,
      presenceValue: input.presenceValue,
    },

    streak: {
      days: input.streakDays,
      multiplier: input.streakMultiplier,
      nextMilestone: streakMilestone.nextMilestone,
      daysToNextMilestone: streakMilestone.daysToNextMilestone,
    },

    narrative,
  };
}

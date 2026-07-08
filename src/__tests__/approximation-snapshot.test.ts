// ============================================================
// MyShape Protocol — Approximation Snapshot Tests
// ============================================================
// ⚠️  CANARY TESTS — any diff = ALGORITHM DRIFT.
//
// These snapshots lock the output of every approximation function.
// If a test fails:
//   1. You changed a threshold in src/protocol/constants.ts.
//   2. Update this snapshot AND algorithm-changelog.md.
//   3. Commit both together — CI enforces this pairing.
//
// Without the changelog entry, the PR MUST be blocked.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  computeApproximateReputationTier,
  deriveTokenTier,
  deriveIdentityStage,
  deriveRights,
  computeStage,
  computeEligibility,
  buildNarrative,
  computeNextReputation,
  computeStreakMilestone,
} from "@/lib/protocol-progress";
import type { ReputationTier } from "@/engine/presence-reputation";
import type { ProtocolProgressInput } from "@/types/protocol-progress";

// ═══════════════════════════════════════════════════════════
// 1. computeApproximateReputationTier
// ═══════════════════════════════════════════════════════════

describe("Snapshot — computeApproximateReputationTier", () => {
  // Test all boundary conditions: at threshold, just below, zero, max
  const cases: Array<{ bestPes: number; scanCount: number }> = [
    { bestPes: 0.95, scanCount: 150 },  // clearly genesis
    { bestPes: 0.80, scanCount: 100 },  // exact genesis boundary
    { bestPes: 0.79, scanCount: 100 },  // just below genesis pes
    { bestPes: 0.80, scanCount: 99 },   // just below genesis count
    { bestPes: 0.65, scanCount: 50 },   // clearly established
    { bestPes: 0.60, scanCount: 30 },   // exact established boundary
    { bestPes: 0.59, scanCount: 30 },   // just below established
    { bestPes: 0.45, scanCount: 20 },   // clearly regular
    { bestPes: 0.40, scanCount: 10 },   // exact regular boundary
    { bestPes: 0.39, scanCount: 15 },   // below regular pes → new
    { bestPes: 0.50, scanCount: 9 },    // below regular count → new
    { bestPes: 0.10, scanCount: 3 },    // new
    { bestPes: 0.00, scanCount: 1 },    // new (zero pes, has scans)
    { bestPes: 0.90, scanCount: 0 },    // untrusted (no scans)
    { bestPes: 0.00, scanCount: 0 },    // untrusted
  ];

  it("produces deterministic tier for all boundary cases", () => {
    const results = cases.map((c) => ({
      input: c,
      tier: computeApproximateReputationTier(c.bestPes, c.scanCount),
    }));
    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 2. deriveTokenTier
// ═══════════════════════════════════════════════════════════

describe("Snapshot — deriveTokenTier", () => {
  const tiers: ReputationTier[] = ["untrusted", "new", "regular", "established", "genesis"];

  it("produces deterministic tier across all status × rep × pes combinations", () => {
    const results: Array<{ input: { status: string; rep: string; pes: number }; tier: string }> = [];

    for (const status of ["GENESIS_NODE", "ACTIVE", "PENDING_VERIFICATION"]) {
      for (const rep of tiers) {
        for (const pes of [0.00, 0.29, 0.30, 0.49, 0.50, 0.74, 0.75, 0.95]) {
          results.push({
            input: { status, rep, pes },
            tier: deriveTokenTier(status, rep, pes),
          });
        }
      }
    }

    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 3. deriveIdentityStage
// ═══════════════════════════════════════════════════════════

describe("Snapshot — deriveIdentityStage", () => {
  it("produces deterministic stage for all status × level combos", () => {
    const results: Array<{ input: { status: string; level: number }; stage: string }> = [];

    for (const status of ["GENESIS_NODE", "ACTIVE", "PENDING_VERIFICATION", "AGENT_ACTIVE"]) {
      for (const level of [1, 2, 3, 6, 7, 8]) {
        results.push({
          input: { status, level },
          stage: deriveIdentityStage(status, level),
        });
      }
    }

    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 4. deriveRights
// ═══════════════════════════════════════════════════════════

describe("Snapshot — deriveRights", () => {
  const tiers: ReputationTier[] = ["untrusted", "new", "regular", "established", "genesis"];

  it("produces deterministic rights for all status × rep combos", () => {
    const results: Array<{ input: { status: string; rep: string }; rights: string[] }> = [];

    for (const status of ["GENESIS_NODE", "ACTIVE", "PENDING_VERIFICATION"]) {
      for (const rep of tiers) {
        results.push({
          input: { status, rep },
          rights: deriveRights(status, rep),
        });
      }
    }

    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. computeEligibility — snapshot key gate unlocking thresholds
// ═══════════════════════════════════════════════════════════

describe("Snapshot — computeEligibility", () => {
  const tiers: ReputationTier[] = ["untrusted", "new", "regular", "established", "genesis"];

  it("produces deterministic eligibility across boundary conditions", () => {
    const results: Array<{
      input: { rep: string; level: number; proofs: number };
      eligible: Record<string, boolean>;
    }> = [];

    for (const rep of tiers) {
      for (const level of [1, 3, 5, 7]) {
        for (const proofs of [0, 1, 10, 30, 100]) {
          results.push({
            input: { rep, level, proofs },
            eligible: computeEligibility(rep, level, proofs),
          });
        }
      }
    }

    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 6. computeStage — snapshot stage transition boundaries
// ═══════════════════════════════════════════════════════════

describe("Snapshot — computeStage", () => {
  it("produces deterministic stage at all tier × level crossings", () => {
    const results: Array<{ input: { rep: string; level: number }; stage: string }> = [];
    const tiers: ReputationTier[] = ["untrusted", "new", "regular", "established", "genesis"];

    for (const rep of tiers) {
      for (const level of [1, 2, 3, 4, 5, 7, 8]) {
        results.push({
          input: { rep, level },
          stage: computeStage(rep, level),
        });
      }
    }

    expect(results).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════
// 7. Full pipeline: computeProtocolProgress snapshot
// ═══════════════════════════════════════════════════════════

describe("Snapshot — computeProtocolProgress (canonical inputs)", () => {
  it("produces deterministic full DTO for reference inputs", async () => {
    const { computeProtocolProgress } = await import("@/lib/protocol-progress");

    // 5 canonical personas spanning the full tier spectrum
    const personas: Array<{ name: string; input: ProtocolProgressInput }> = [
      {
        name: "new_genesis_seed",
        input: {
          entropyScore: 50, particleLevel: 1, streakDays: 1, streakMultiplier: 1.0,
          prs: 0.1, reputationTier: "new" as ReputationTier, totalProofs: 1, avgPes: 0.35,
          identityStage: "genesis", rights: ["existence", "mobility"], votingPower: 0.1,
          tokenTier: "basic", presenceValue: 0.35,
        },
      },
      {
        name: "formation_pulse",
        input: {
          entropyScore: 1200, particleLevel: 3, streakDays: 7, streakMultiplier: 1.5,
          prs: 0.5, reputationTier: "regular" as ReputationTier, totalProofs: 15, avgPes: 0.55,
          identityStage: "accumulation", rights: ["existence", "mobility", "participation"], votingPower: 0.5,
          tokenTier: "presence", presenceValue: 0.55,
        },
      },
      {
        name: "formation_established",
        input: {
          entropyScore: 5000, particleLevel: 5, streakDays: 14, streakMultiplier: 2.0,
          prs: 0.7, reputationTier: "established" as ReputationTier, totalProofs: 40, avgPes: 0.68,
          identityStage: "formation", rights: ["existence", "mobility", "participation", "economic"], votingPower: 0.7,
          tokenTier: "validator", presenceValue: 0.68,
        },
      },
      {
        name: "sovereign_genesis",
        input: {
          entropyScore: 15000, particleLevel: 7, streakDays: 30, streakMultiplier: 3.0,
          prs: 0.85, reputationTier: "genesis" as ReputationTier, totalProofs: 120, avgPes: 0.82,
          identityStage: "maturity", rights: ["existence", "mobility", "participation", "economic", "governance"], votingPower: 0.95,
          tokenTier: "genesis", presenceValue: 0.85,
        },
      },
      {
        name: "zero_state_untrusted",
        input: {
          entropyScore: 0, particleLevel: 1, streakDays: 0, streakMultiplier: 1.0,
          prs: 0, reputationTier: "untrusted" as ReputationTier, totalProofs: 0, avgPes: 0,
          identityStage: "genesis", rights: ["existence", "mobility"], votingPower: 0,
          tokenTier: "basic", presenceValue: 0,
        },
      },
    ];

    const results = personas.map((p) => ({
      name: p.name,
      output: computeProtocolProgress(p.input),
    }));

    expect(results).toMatchSnapshot();
  });
});

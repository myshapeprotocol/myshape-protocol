// ============================================================
// MyShape Protocol — Governance Weight Engine
// ============================================================
// Dynamic voting weight based on PES quality, scan frequency,
// and data consistency. High-quality active providers naturally
// gain more governance influence without "补位" mechanics.
// ============================================================

import type { WeightProfile } from "@/types/identity-tiers";

/**
 * Compute governance weight from a node's PES history.
 *
 * w = PES_mean × log₂(1 + scanCount) × streakMultiplier × consistencyBonus
 *
 * - PES_mean: average quality of motion data (0–1)
 * - log₂(1 + n): diminishing returns on scan count — rewards consistency, not spam
 * - streakMultiplier: 1.0 base → 1.5 (7d) → 2.0 (30d)
 * - consistencyBonus: penalizes erratic scanning (high variance in PES)
 */
export function computeGovernanceWeight(profile: WeightProfile): number {
  const { pesMean, scanCount, streakMultiplier } = profile;

  // Diminishing returns on volume — log₂(1 + n)
  const volumeFactor = Math.log2(1 + scanCount);

  // Consistency bonus: high-variance PES suggests unreliable data
  // Range: 0.5 (erratic) to 1.0 (stable)
  const consistencyBonus = 1.0; // Will be refined when we have per-scan PES variance data

  const raw = pesMean * volumeFactor * streakMultiplier * consistencyBonus;

  // Normalize to [0, 1] range — max theoretical is ~1.0 × 6.7 × 2.0 × 1.0 ≈ 13.4
  // Practical cap at 1.0
  return Math.min(raw / 10, 1);
}

/**
 * Convenience: build a WeightProfile from database row data.
 */
export function buildWeightProfile(params: {
  pesScore: number;
  pesMean?: number;
  scanCount: number;
  streakDays: number;
  streakMultiplier: number;
}): WeightProfile {
  return {
    pesScore: params.pesScore,
    pesMean: params.pesMean ?? params.pesScore,
    scanCount: params.scanCount,
    streakDays: params.streakDays,
    streakMultiplier: params.streakMultiplier,
    weight: 0, // computed below
  };
}

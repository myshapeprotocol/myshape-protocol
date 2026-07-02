import { describe, it, expect } from "vitest";
import {
  computeParticleLevel,
  getVisualTier,
  computeDecay,
  detectEntropySpike,
  computeEntropyGain,
  getLevelProgress,
  PARTICLE_THRESHOLDS,
  BASE_ENTROPY,
  PES_BONUS_GOOD,
  PES_BONUS_GREAT,
  STREAK_7_DAYS,
  STREAK_30_DAYS,
  SPIKE_MULTIPLIER,
  DECAY_THRESHOLD_DAYS,
  type EntropyState,
  type PESComponents,
} from "./entropy-growth";

// ── Particle Level ──

describe("computeParticleLevel", () => {
  it("returns level 1 for score 0", () => {
    expect(computeParticleLevel(0)).toBe(1);
  });

  it("maps thresholds correctly", () => {
    expect(computeParticleLevel(0)).toBe(1);    // SEED
    expect(computeParticleLevel(100)).toBe(2);   // SPROUT
    expect(computeParticleLevel(300)).toBe(3);   // PULSE
    expect(computeParticleLevel(800)).toBe(4);   // CORE_FORMING
    expect(computeParticleLevel(2000)).toBe(5);  // FIELD_ACTIVE
    expect(computeParticleLevel(5000)).toBe(6);  // SOVEREIGN
    expect(computeParticleLevel(12000)).toBe(7); // ARCHITECT
    expect(computeParticleLevel(30000)).toBe(8); // PROTOCOL_ELDER
  });

  it("returns level 8 for scores beyond max threshold", () => {
    expect(computeParticleLevel(100000)).toBe(8);
  });

  it("returns level 1 for negative scores", () => {
    expect(computeParticleLevel(-100)).toBe(1);
  });

  it("boundary: 99 is level 1, 100 is level 2", () => {
    expect(computeParticleLevel(99)).toBe(1);
    expect(computeParticleLevel(100)).toBe(2);
  });
});

// ── Visual Tiers ──

describe("getVisualTier", () => {
  it("maps level 1 to SEED", () => {
    const tier = getVisualTier(1);
    expect(tier.label).toBe("SEED");
    expect(tier.glow).toBe(0.08);
    expect(tier.particles).toBe(0);
  });

  it("maps level 8 to PROTOCOL_ELDER", () => {
    const tier = getVisualTier(8);
    expect(tier.label).toBe("PROTOCOL_ELDER");
    expect(tier.glow).toBe(1.0);
    expect(tier.particles).toBe(8);
  });

  it("clamps out-of-range levels", () => {
    expect(getVisualTier(0).label).toBe("SEED");
    expect(getVisualTier(99).label).toBe("PROTOCOL_ELDER");
  });
});

// ── Decay ──

describe("computeDecay", () => {
  it("returns no decay if no lastEntropyDate", () => {
    const result = computeDecay(1000, undefined, "2026-07-02");
    expect(result.decayAmount).toBe(0);
    expect(result.decayedScore).toBe(1000);
  });

  it("returns no decay within threshold (≤30 days)", () => {
    const result = computeDecay(1000, "2026-06-15", "2026-07-02"); // 17 days
    expect(result.decayAmount).toBe(0);
    expect(result.decayedScore).toBe(1000);
  });

  it("returns no decay at exactly threshold (30 days)", () => {
    const result = computeDecay(1000, "2026-06-02", "2026-07-02"); // 30 days
    expect(result.decayAmount).toBe(0);
  });

  it("applies decay after 31+ days idle", () => {
    const result = computeDecay(1000, "2026-05-31", "2026-07-02"); // 32 days → 2 decay days
    expect(result.decayAmount).toBeGreaterThan(0);
    expect(result.decayedScore).toBeLessThan(1000);
  });

  it("decay is proportional to idle time beyond threshold", () => {
    const r1 = computeDecay(10000, "2026-05-01", "2026-07-02"); // ~62 days → 32 decay days
    const r2 = computeDecay(10000, "2026-06-01", "2026-07-02"); // ~31 days → 1 decay day
    expect(r1.decayAmount).toBeGreaterThan(r2.decayAmount);
  });

  it("decay floor is 0 (never goes negative)", () => {
    const result = computeDecay(5, "2020-01-01", "2026-07-02"); // years of decay
    expect(result.decayedScore).toBeGreaterThanOrEqual(0);
  });
});

// ── Spike Detection ──

describe("detectEntropySpike", () => {
  it("detects spike when all three components exceed thresholds", () => {
    const comps: PESComponents = {
      timing: 0.5,  // not checked
      noise: 0.80, // ≥ 0.75
      frequency: 0.70, // ≥ 0.65
      biological: 0.60, // ≥ 0.55
    };
    expect(detectEntropySpike(comps)).toBe(true);
  });

  it("rejects when noise is below threshold", () => {
    const comps: PESComponents = {
      timing: 0.5,
      noise: 0.70, // < 0.75
      frequency: 0.80,
      biological: 0.70,
    };
    expect(detectEntropySpike(comps)).toBe(false);
  });

  it("rejects when frequency is below threshold", () => {
    const comps: PESComponents = {
      timing: 0.5,
      noise: 0.80,
      frequency: 0.60, // < 0.65
      biological: 0.70,
    };
    expect(detectEntropySpike(comps)).toBe(false);
  });

  it("rejects when biological is below threshold", () => {
    const comps: PESComponents = {
      timing: 0.5,
      noise: 0.80,
      frequency: 0.80,
      biological: 0.50, // < 0.55
    };
    expect(detectEntropySpike(comps)).toBe(false);
  });
});

// ── Main Entropy Gain ──

describe("computeEntropyGain", () => {
  const baseState: EntropyState = {
    entropyScore: 0,
    particleLevel: 1,
    streakDays: 1,
    streakMultiplier: 1.0,
    bestPes: 0,
    lastEntropyDate: "",
  };

  const midComponents: PESComponents = {
    timing: 0.4,
    noise: 0.5,
    frequency: 0.4,
    biological: 0.3,
  };

  it("grants at least 1 entropy per scan", () => {
    const result = computeEntropyGain(0.1, midComponents, baseState);
    expect(result.entropyGain).toBeGreaterThanOrEqual(1);
  });

  it("applies PES bonus for good score (≥0.70)", () => {
    const noBonus = computeEntropyGain(0.60, midComponents, baseState);
    const withBonus = computeEntropyGain(0.75, midComponents, baseState);
    expect(withBonus.entropyGain).toBeGreaterThan(noBonus.entropyGain);
    expect(withBonus.entropyGain).toBeGreaterThanOrEqual(BASE_ENTROPY + PES_BONUS_GOOD);
  });

  it("applies PES bonus for great score (≥0.85)", () => {
    const good = computeEntropyGain(0.75, midComponents, baseState);
    const great = computeEntropyGain(0.90, midComponents, baseState);
    expect(great.entropyGain).toBeGreaterThan(good.entropyGain);
    expect(great.entropyGain).toBeGreaterThanOrEqual(BASE_ENTROPY + PES_BONUS_GREAT);
  });

  it("applies streak multiplier at 7 days", () => {
    const streakState: EntropyState = {
      ...baseState,
      entropyScore: 100,
      streakDays: 7,
      streakMultiplier: STREAK_7_DAYS,
      lastEntropyDate: "2026-07-01",
    };
    const result = computeEntropyGain(0.60, midComponents, streakState);
    const normalGain = BASE_ENTROPY; // no PES bonus at 0.60, no spike
    expect(result.entropyGain).toBeGreaterThanOrEqual(Math.floor(normalGain * STREAK_7_DAYS));
  });

  it("applies streak multiplier at 30 days", () => {
    const streakState: EntropyState = {
      ...baseState,
      entropyScore: 100,
      streakDays: 30,
      streakMultiplier: STREAK_30_DAYS,
      lastEntropyDate: "2026-07-01",
    };
    const result = computeEntropyGain(0.60, midComponents, streakState);
    const normalGain = BASE_ENTROPY;
    expect(result.entropyGain).toBeGreaterThanOrEqual(Math.floor(normalGain * STREAK_30_DAYS));
  });

  it("triggers spike multiplier for high-entropy motion", () => {
    const spikeComps: PESComponents = {
      timing: 0.5,
      noise: 0.85,
      frequency: 0.80,
      biological: 0.70,
    };
    const normal = computeEntropyGain(0.60, midComponents, baseState);
    const spiked = computeEntropyGain(0.85, spikeComps, baseState);
    expect(spiked.spikeTriggered).toBe(true);
    // Spike should give significantly more gain (PES great bonus + spike ×2)
    expect(spiked.entropyGain).toBeGreaterThan(normal.entropyGain * 1.5);
  });

  it("detects level-up when crossing threshold", () => {
    // Level 4 → 5 threshold is 2000. Start just below it.
    const nearThreshold: EntropyState = {
      ...baseState,
      entropyScore: 1990,
      particleLevel: 4,
      streakDays: 10,
      streakMultiplier: STREAK_7_DAYS,
      lastEntropyDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    };
    const result = computeEntropyGain(0.90, {
      timing: 0.8, noise: 0.8, frequency: 0.8, biological: 0.7,
    }, nearThreshold);

    // Base(1) + Great bonus(6) = 7 × 1.5 streak = 10.5 → floor 10 gain
    // 1990 + 10 = 2000 → level 5
    expect(result.newState.entropyScore).toBeGreaterThanOrEqual(2000);
    expect(result.newState.particleLevel).toBe(5);
    expect(result.leveledUp).toBe(true);
  });

  it("preserves streak on same-day scans", () => {
    const state: EntropyState = {
      ...baseState,
      streakDays: 5,
      lastEntropyDate: new Date().toISOString().slice(0, 10),
    };
    const result = computeEntropyGain(0.60, midComponents, state);
    expect(result.newState.streakDays).toBe(5); // same day, no change
  });

  it("increments streak on consecutive days", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const state: EntropyState = {
      ...baseState,
      streakDays: 5,
      lastEntropyDate: yesterday,
    };
    const result = computeEntropyGain(0.60, midComponents, state);
    expect(result.newState.streakDays).toBe(6);
  });

  it("resets streak after 4+ day gap", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    const state: EntropyState = {
      ...baseState,
      streakDays: 10,
      lastEntropyDate: fiveDaysAgo,
    };
    const result = computeEntropyGain(0.60, midComponents, state);
    expect(result.newState.streakDays).toBe(1);
  });

  it("tracks best PES score", () => {
    const result1 = computeEntropyGain(0.70, midComponents, baseState);
    expect(result1.newState.bestPes).toBe(0.70);

    const state2 = { ...result1.newState, lastEntropyDate: result1.newState.lastEntropyDate };
    const result2 = computeEntropyGain(0.50, midComponents, state2);
    expect(result2.newState.bestPes).toBe(0.70); // lower score doesn't reduce best
  });

  it("applies decay before gain", () => {
    const oldState: EntropyState = {
      entropyScore: 2000,
      particleLevel: 5,
      streakDays: 1,
      streakMultiplier: 1.0,
      bestPes: 0.8,
      lastEntropyDate: "2026-05-01", // ~62 days ago
    };
    const result = computeEntropyGain(0.60, midComponents, oldState);
    // Decay should have reduced entropy before adding today's gain
    expect(result.decayApplied).toBeGreaterThan(0);
  });
});

// ── Level Progress ──

describe("getLevelProgress", () => {
  it("returns 0 progress at level threshold", () => {
    const progress = getLevelProgress(100); // exactly level 2 start
    expect(progress.current).toBe(100);
    expect(progress.next).toBe(300);
    expect(progress.progress).toBe(0);
    expect(progress.remaining).toBe(200);
  });

  it("returns 0.5 progress at midpoint", () => {
    const progress = getLevelProgress(200); // halfway between 100-300
    expect(progress.progress).toBeCloseTo(0.5, 1);
    expect(progress.remaining).toBe(100);
  });

  it("returns 1.0 at max level (PROTOCOL_ELDER)", () => {
    const progress = getLevelProgress(50000);
    expect(progress.progress).toBe(1);
    expect(progress.remaining).toBe(0);
  });

  it("returns 1.0 exactly at final threshold", () => {
    const progress = getLevelProgress(30000);
    expect(progress.progress).toBe(1);
    expect(progress.remaining).toBe(0);
  });
});

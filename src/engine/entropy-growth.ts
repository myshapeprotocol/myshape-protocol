/**
 * Entropy Growth Engine v2 — non-linear particle level progression
 *
 * Three pillars:
 * 1. Quality-weighted accumulation (PES bonuses + streak multipliers)
 * 2. Entropy Decay — 30+ days idle → 0.1% daily decay (anti-zombie)
 * 3. Entropy Spike — complex motion triggers 2× burst ("暴击")
 *
 * Philosophy: entropy is not earned, it is *maintained*.
 * Protocol Elders must keep proving they are alive.
 */

// ── Particle level thresholds ──
export const PARTICLE_THRESHOLDS = [0, 100, 300, 800, 2000, 5000, 12000, 30000];

// ── Entropy gain rules ──
export const BASE_ENTROPY = 1;
export const PES_THRESHOLD_GOOD = 0.70;
export const PES_THRESHOLD_GREAT = 0.85;
export const PES_BONUS_GOOD = 3;
export const PES_BONUS_GREAT = 6;

// ── Streak multipliers ──
export const STREAK_7_DAYS = 1.5;
export const STREAK_30_DAYS = 2.0;
export const STREAK_RESET_GAP = 3;

// ── Reward events ──
export const INVITE_REWARD = 50;
export const RESEARCH_REWARD = 10;

// ── ① Entropy Decay — 冷启动 / 不进则退 ──
export const DECAY_THRESHOLD_DAYS = 30;  // days idle before decay starts
export const DECAY_RATE = 0.001;         // 0.1% per day

// ── ② Entropy Spike — 高熵截获 / 暴击 ──
export const SPIKE_NOISE_THRESHOLD = 0.75;   // noiseResidual must exceed
export const SPIKE_FREQ_THRESHOLD = 0.65;    // frequencyEntropy must exceed
export const SPIKE_BIO_THRESHOLD = 0.55;     // biologicalPerturbation must exceed
export const SPIKE_MULTIPLIER = 2;           // double the scan's entropy

// ── ③ Visual Morphing — 粒子拟态化等级 ──
export const VISUAL_TIERS = {
  1: { glow: 0.08, particles: 0, label: "SEED" },
  2: { glow: 0.15, particles: 1, label: "SPROUT" },
  3: { glow: 0.22, particles: 2, label: "PULSE" },
  4: { glow: 0.30, particles: 3, label: "CORE_FORMING" },
  5: { glow: 0.40, particles: 4, label: "FIELD_ACTIVE" },
  6: { glow: 0.55, particles: 5, label: "SOVEREIGN" },
  7: { glow: 0.70, particles: 6, label: "ARCHITECT" },
  8: { glow: 1.00, particles: 8, label: "PROTOCOL_ELDER" },
} as const;

export type VisualTier = typeof VISUAL_TIERS[keyof typeof VISUAL_TIERS];

export function getVisualTier(particleLevel: number): VisualTier {
  const clamped = Math.min(8, Math.max(1, particleLevel));
  return VISUAL_TIERS[clamped as keyof typeof VISUAL_TIERS];
}

// ── Particle level ──

export function computeParticleLevel(entropyScore: number): number {
  for (let i = PARTICLE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (entropyScore >= PARTICLE_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export interface EntropyState {
  entropyScore: number;
  particleLevel: number;
  streakDays: number;
  streakMultiplier: number;
  bestPes: number;
  lastEntropyDate: string;
}

export interface PESComponents {
  timing: number;
  noise: number;
  frequency: number;
  biological: number;
}

export interface EntropyResult {
  entropyGain: number;
  newState: EntropyState;
  leveledUp: boolean;
  /** ① Decay applied this cycle */
  decayApplied: number;
  /** ② Spike triggered on this scan */
  spikeTriggered: boolean;
}

/**
 * ① Compute decay since last activity.
 * Only applies if idle > DECAY_THRESHOLD_DAYS.
 */
export function computeDecay(
  entropyScore: number,
  lastEntropyDate: string | undefined,
  today: string,
): { decayedScore: number; decayAmount: number } {
  if (!lastEntropyDate) return { decayedScore: entropyScore, decayAmount: 0 };

  const last = new Date(lastEntropyDate);
  const now = new Date(today);
  const idleDays = Math.floor((now.getTime() - last.getTime()) / 86400000);

  if (idleDays <= DECAY_THRESHOLD_DAYS) {
    return { decayedScore: entropyScore, decayAmount: 0 };
  }

  // Decay applies for every day beyond the threshold
  const decayDays = idleDays - DECAY_THRESHOLD_DAYS;
  const decayFactor = Math.pow(1 - DECAY_RATE, decayDays);
  const decayed = Math.max(0, Math.floor(entropyScore * decayFactor));
  const decayAmount = entropyScore - decayed;

  return { decayedScore: decayed, decayAmount };
}

/**
 * ② Detect an entropy spike — the motion is unusually complex.
 * Requires noise, frequency, AND biological all above threshold.
 */
export function detectEntropySpike(components: PESComponents): boolean {
  return (
    components.noise >= SPIKE_NOISE_THRESHOLD &&
    components.frequency >= SPIKE_FREQ_THRESHOLD &&
    components.biological >= SPIKE_BIO_THRESHOLD
  );
}

/**
 * Main calculation — called after every successful scan.
 * Order: Decay → Streak → PES bonus → Spike → Cap
 */
export function computeEntropyGain(
  pesScore: number,
  pesComponents: PESComponents,
  currentState: EntropyState,
): EntropyResult {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = currentState.lastEntropyDate || today;

  // ── ① DECAY: apply before gains ──
  const { decayedScore, decayAmount } = computeDecay(
    currentState.entropyScore,
    currentState.lastEntropyDate || undefined,
    today,
  );

  // ── Streak calculation ──
  let { streakDays, streakMultiplier } = currentState;
  if (lastDate !== today) {
    const last = new Date(lastDate);
    const now = new Date(today);
    const gap = Math.floor((now.getTime() - last.getTime()) / 86400000);
    if (gap === 1) {
      streakDays += 1;
    } else if (gap > STREAK_RESET_GAP) {
      streakDays = 1;
    }
    // gap 2-3: preserve streak but don't increment
  }

  // ── Multiplier based on streak ──
  if (streakDays >= 30) streakMultiplier = STREAK_30_DAYS;
  else if (streakDays >= 7) streakMultiplier = STREAK_7_DAYS;
  else streakMultiplier = 1.0;

  // ── PES bonus ──
  let pesBonus = 0;
  if (pesScore >= PES_THRESHOLD_GREAT) pesBonus = PES_BONUS_GREAT;
  else if (pesScore >= PES_THRESHOLD_GOOD) pesBonus = PES_BONUS_GOOD;

  // ── ② SPIKE: double the scan gain if motion is highly entropic ──
  const spikeTriggered = detectEntropySpike(pesComponents);
  const spikeMultiplier = spikeTriggered ? SPIKE_MULTIPLIER : 1;

  // ── Total gain ──
  const rawGain = (BASE_ENTROPY + pesBonus) * streakMultiplier * spikeMultiplier;
  const entropyGain = Math.max(1, Math.floor(rawGain)); // minimum 1
  const newEntropy = decayedScore + entropyGain;
  const newLevel = computeParticleLevel(newEntropy);
  const oldLevel = computeParticleLevel(currentState.entropyScore);
  const leveledUp = newLevel > oldLevel;

  const bestPes = Math.max(currentState.bestPes, pesScore);

  return {
    entropyGain,
    newState: {
      entropyScore: newEntropy,
      particleLevel: newLevel,
      streakDays,
      streakMultiplier,
      bestPes,
      lastEntropyDate: today,
    },
    leveledUp,
    decayApplied: decayAmount,
    spikeTriggered,
  };
}

export function getLevelProgress(entropyScore: number): {
  current: number;
  next: number;
  progress: number;
  remaining: number;
} {
  const level = computeParticleLevel(entropyScore);
  const idx = level - 1;
  const currentThreshold = PARTICLE_THRESHOLDS[idx] || 0;
  const nextThreshold = PARTICLE_THRESHOLDS[idx + 1] || currentThreshold;
  const progress = nextThreshold > currentThreshold
    ? (entropyScore - currentThreshold) / (nextThreshold - currentThreshold)
    : 1;

  return {
    current: currentThreshold,
    next: nextThreshold,
    progress: Math.min(1, Math.max(0, progress)),
    remaining: Math.max(0, nextThreshold - entropyScore),
  };
}

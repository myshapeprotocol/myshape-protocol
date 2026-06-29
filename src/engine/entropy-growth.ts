/**
 * Entropy Growth Engine — non-linear particle level progression
 * Replaces the legacy "3 scans/day × 100 days" with quality-weighted entropy accumulation.
 */

// ── Particle level thresholds ──
export const PARTICLE_THRESHOLDS = [0, 100, 300, 800, 2000, 5000, 12000, 30000];

// ── Entropy gain rules ──
export const BASE_ENTROPY = 1;           // per scan
export const PES_THRESHOLD_GOOD = 0.70;  // +3 bonus
export const PES_THRESHOLD_GREAT = 0.85; // +6 bonus
export const PES_BONUS_GOOD = 3;
export const PES_BONUS_GREAT = 6;
export const STREAK_7_DAYS = 1.5;        // multiplier
export const STREAK_30_DAYS = 2.0;       // multiplier
export const STREAK_RESET_GAP = 3;       // days w/o scan → reset
export const INVITE_REWARD = 50;         // per invited node that verifies
export const RESEARCH_REWARD = 10;       // per research upload

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

export function computeEntropyGain(
  pesScore: number,
  currentState: EntropyState
): { entropyGain: number; newState: EntropyState; leveledUp: boolean } {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lastDate = currentState.lastEntropyDate || today;

  // ── Streak calculation ──
  let { streakDays, streakMultiplier } = currentState;
  if (lastDate === today) {
    // Already scanned today — no streak change
  } else {
    const last = new Date(lastDate);
    const now = new Date(today);
    const gap = Math.floor((now.getTime() - last.getTime()) / 86400000);
    if (gap === 1) {
      streakDays += 1;
    } else if (gap > STREAK_RESET_GAP) {
      streakDays = 1;
    } else {
      // gap 2-3: keep streak but don't increment
    }
  }

  // ── Multiplier based on streak ──
  if (streakDays >= 30) streakMultiplier = STREAK_30_DAYS;
  else if (streakDays >= 7) streakMultiplier = STREAK_7_DAYS;
  else streakMultiplier = 1.0;

  // ── PES bonus ──
  let pesBonus = 0;
  if (pesScore >= PES_THRESHOLD_GREAT) pesBonus = PES_BONUS_GREAT;
  else if (pesScore >= PES_THRESHOLD_GOOD) pesBonus = PES_BONUS_GOOD;

  // ── Total gain (floor to integer) ──
  const rawGain = (BASE_ENTROPY + pesBonus) * streakMultiplier;
  const entropyGain = Math.floor(rawGain);
  const newEntropy = currentState.entropyScore + entropyGain;
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

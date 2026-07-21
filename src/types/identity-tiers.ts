// ============================================================
// MyShape Protocol — Identity Tier System
// ============================================================
// Genesis Cohort: First 100 PES-verified humans
// Active Citizen: PES-verified after Genesis cap
// Wallet Linked: Connected wallet, awaiting PES verification
// ============================================================

/** Identity verification state */
export type VerificationStatus = "pending" | "active" | "verified";

/** Genesis tier — determined by PES scan order */
export type SovereignTier = "GENESIS_NODE" | "ACTIVE" | "WALLET_LINKED";

/** Dynamic weight profile for protocol governance */
export interface WeightProfile {
  /** Base PES score (latest scan) */
  pesScore: number;
  /** Rolling mean PES across all scans */
  pesMean: number;
  /** Total scan count */
  scanCount: number;
  /** Consecutive days with at least one scan */
  streakDays: number;
  /** Current entropy multiplier (1.0 base, 1.5 after 7d, 2.0 after 30d) */
  streakMultiplier: number;
  /** Computed governance weight */
  weight: number;
}

/** Genesis badge minting result */
export interface BadgeResult {
  /** The tier that was minted (or null if already minted) */
  tier: SovereignTier | null;
  /** Whether this was the first verification */
  isFirstVerification: boolean;
  /** Total verified nodes at time of minting */
  verifiedCount: number;
}

/** Genesis Cohort constants */
export const GENESIS_CAP = 100;
export const PES_THRESHOLD = 0.5;

/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol — Presence Economy (§17-19)
//
// §17 Presence Economy — presence as native scarce resource
// §18 Presence Token — value carrier for verified presence
// §19 Presence Incentives — reward mechanisms
// ============================================================

import type { ReputationProfile } from "./presence-reputation";

// ── §17 — Presence Value ──

export interface PresenceValue {
  pv: number;                    // aggregate presence value [0,1]
  scarcity: number;              // based on PES × PSS (higher = rarer)
  authenticity: number;          // based on PRS
  continuity: number;            // based on PSS trend
  timestamp: number;
}

// §17.3 PV = f(PES, PSS, PRS, PC)
export function computePresenceValue(params: {
  pes: number;
  pss: number;
  prs: number;
  isContinuous: boolean;
}): PresenceValue {
  const { pes, pss, prs, isContinuous } = params;

  // Scarcity: high-quality presence is rare
  const scarcity = pes * pss;

  // Authenticity: reputation-weighted
  const authenticity = prs;

  // Continuity bonus
  const continuity = isContinuous ? 0.30 : 0;

  // Aggregate value
  const pv = Math.min(
    0.35 * scarcity + 0.35 * authenticity + 0.15 * (pss) + 0.15 * continuity,
    1,
  );

  return {
    pv,
    scarcity,
    authenticity,
    continuity,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

// ── §18 — Presence Token ──

export type TokenTier = "genesis" | "validator" | "presence" | "basic";

export interface PresenceToken {
  token_id: string;              // unique identifier
  tier: TokenTier;
  minted_at: number;
  value: PresenceValue;
  proof_hash: string;            // linked ZKP hash
  owner_hash: string;            // H(device_salt) — privacy-preserving ownership
  is_soulbound: boolean;        // §18.2 — non-transferable by default
}

// §18.1 PT = mint(ZKP_agg, PV)
export function mintPresenceToken(params: {
  zkpHash: string;
  deviceSalt: string;
  value: PresenceValue;
  reputation: ReputationProfile;
}): PresenceToken {
  const { zkpHash, deviceSalt, value, reputation } = params;

  // Tier determination
  let tier: TokenTier;
  if (reputation.tier === "genesis" && value.pv >= 0.75) tier = "genesis";
  else if (reputation.tier === "established" && value.pv >= 0.50) tier = "validator";
  else if (value.pv >= 0.30) tier = "presence";
  else tier = "basic";

  // Owner hash — privacy-preserving (reveals nothing about device)
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };

  return {
    token_id: `PT_${Date.now().toString(36).toUpperCase()}_${quickHash(zkpHash + deviceSalt)}`,
    tier,
    minted_at: Math.floor(Date.now() / 1000),
    value,
    proof_hash: zkpHash,
    owner_hash: quickHash(deviceSalt),
    is_soulbound: true, // §18.2 — non-transferable
  };
}

// ── §19 — Presence Incentives ──

export type IncentiveType = "presence_mining" | "presence_boost" | "multi_device" | "co_presence" | "reputation";

export interface PresenceIncentive {
  type: IncentiveType;
  multiplier: number;            // value multiplier
  description: string;
  condition: (value: PresenceValue, reputation: ReputationProfile) => boolean;
}

// §19 — Five incentive mechanisms
export const PRESENCE_INCENTIVES: PresenceIncentive[] = [
  {
    type: "presence_mining",
    multiplier: 1.0,
    description: "Base reward for generating valid presence proofs",
    condition: (v) => v.pv >= 0.20,
  },
  {
    type: "presence_boost",
    multiplier: 1.5,
    description: "Bonus for consistently high-quality presence (PES ≥ 0.80)",
    condition: (v) => v.scarcity >= 0.70,
  },
  {
    type: "multi_device",
    multiplier: 2.0,
    description: "Bonus for multi-device presence verification",
    condition: (v, r) => r.device_diversity >= 2,
  },
  {
    type: "co_presence",
    multiplier: 1.3,
    description: "Bonus for verified co-presence with other humans",
    condition: (v) => v.continuity > 0,
  },
  {
    type: "reputation",
    multiplier: 2.5,
    description: "Maximum bonus for genesis-tier reputation",
    condition: (v, r) => r.tier === "genesis" || r.tier === "established",
  },
];

export function computeIncentives(
  value: PresenceValue,
  reputation: ReputationProfile,
): { active: PresenceIncentive[]; total_multiplier: number } {
  const active = PRESENCE_INCENTIVES.filter(inc => inc.condition(value, reputation));
  const totalMultiplier = active.reduce((s, inc) => s * inc.multiplier, 1.0);
  return { active, total_multiplier: Math.min(totalMultiplier, 10) }; // cap at 10x
}

// ── Presence Marketplace (§20) — stub ──

export interface PresenceListing {
  listing_id: string;
  seller_hash: string;
  token: PresenceToken;
  asking_price: number;       // in some future $PULSE units
  listed_at: number;
  status: "active" | "sold" | "cancelled";
}

export function createPresenceListing(
  token: PresenceToken,
  price: number,
): PresenceListing {
  return {
    listing_id: `LIST_${Date.now().toString(36).toUpperCase()}`,
    seller_hash: token.owner_hash,
    token,
    asking_price: price,
    listed_at: Math.floor(Date.now() / 1000),
    status: "active",
  };
}

// ============================================================
// MyShape Protocol — Presence Identity (§23-25)
//
// §23 Presence Identity — lifecycle from genesis to maturity
// §24 Presence Passport — cross-platform identity credential
// §25 Presence Citizenship — rights in the presence-based polity
// ============================================================

import type { ReputationProfile } from "./presence-reputation";
import type { PresenceToken } from "./presence-economy";

// ── §23 — Presence Identity Lifecycle ──

export type IdentityStage =
  | "genesis"        // initial activation
  | "accumulation"   // building presence history
  | "formation"      // reputation crystallizing
  | "maturity"       // stable, high-trust identity
  | "upgrade"        // tier advancement
  | "revocation";    // voluntary or forced deactivation

export interface PresenceIdentity {
  identity_id: string;
  stage: IdentityStage;
  created_at: number;
  last_active: number;
  total_presence_seconds: number;   // lifetime presence duration
  reputation: ReputationProfile;
  tokens: PresenceToken[];
  upgrade_history: Array<{ from: IdentityStage; to: IdentityStage; at: number }>;
}

export function createPresenceIdentity(
  deviceSalt: string,
  reputation: ReputationProfile,
): PresenceIdentity {
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };

  return {
    identity_id: `ID_${quickHash(deviceSalt)}`,
    stage: "genesis",
    created_at: Math.floor(Date.now() / 1000),
    last_active: Math.floor(Date.now() / 1000),
    total_presence_seconds: 0,
    reputation,
    tokens: [],
    upgrade_history: [],
  };
}

export function advanceIdentityStage(
  identity: PresenceIdentity,
): PresenceIdentity {
  const stageOrder: IdentityStage[] = [
    "genesis", "accumulation", "formation", "maturity",
  ];

  const currentIdx = stageOrder.indexOf(identity.stage);
  if (currentIdx < stageOrder.length - 1) {
    const next = stageOrder[currentIdx + 1];
    identity.upgrade_history.push({
      from: identity.stage,
      to: next,
      at: Math.floor(Date.now() / 1000),
    });
    identity.stage = next;
  }

  return identity;
}

// ── §24 — Presence Passport ──

export interface PresencePassport {
  passport_id: string;
  identity: PresenceIdentity;
  issued_at: number;
  expires_at: number;
  verification_count: number;
  trusted_by: string[];         // list of verifying applications
  is_valid: boolean;
}

export function issuePresencePassport(
  identity: PresenceIdentity,
  validityDays = 365,
): PresencePassport {
  const now = Math.floor(Date.now() / 1000);
  return {
    passport_id: `PSP_${identity.identity_id}_${now.toString(36).toUpperCase()}`,
    identity,
    issued_at: now,
    expires_at: now + validityDays * 86400,
    verification_count: 0,
    trusted_by: [],
    is_valid: true,
  };
}

export function verifyPassport(passport: PresencePassport): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (!passport.is_valid) return false;
  if (now > passport.expires_at) {
    passport.is_valid = false;
    return false;
  }
  passport.verification_count++;
  return true;
}

// ── §25 — Presence Citizenship (rights in presence-based polity) ──

export type CitizenshipRight =
  | "existence"       // right to be recognized as present
  | "participation"   // right to participate in governance
  | "governance"      // right to vote on protocol decisions
  | "economic"        // right to participate in presence economy
  | "mobility";       // right to port identity across platforms

export interface PresenceCitizen {
  passport: PresencePassport;
  rights: CitizenshipRight[];
  acquired_at: number;
  voting_power: number;       // proportional to reputation × presence value
  delegated_to?: string;      // optional delegation
}

export function grantCitizenship(
  passport: PresencePassport,
): PresenceCitizen {
  const rights: CitizenshipRight[] = ["existence", "mobility"];

  // Progressive rights based on reputation
  if (passport.identity.reputation.tier === "established" ||
      passport.identity.reputation.tier === "genesis") {
    rights.push("participation", "economic");
  }
  if (passport.identity.reputation.tier === "genesis") {
    rights.push("governance");
  }

  return {
    passport,
    rights,
    acquired_at: Math.floor(Date.now() / 1000),
    voting_power: passport.identity.reputation.prs,
  };
}

// ── Presence Rights (extracted constants) ──

export const PRESENCE_RIGHTS_DECLARATION = {
  existence:  "The right to be recognized as a real, present human — not a simulation",
  privacy:    "The right to prove presence without exposing identity, presence-verification, or personal data",
  participation: "The right to participate in governance proportional to verified presence",
  governance: "The right to vote on protocol evolution, parameter changes, and upgrades",
  economic:   "The right to participate in the presence economy — earn, trade, stake",
} as const;

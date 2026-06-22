// ============================================================
// MyShape Protocol — Presence Governance (§26-28)
//
// §26 Presence State — sovereign polity based on presence
// §27 Presence Constitution — fundamental rights encoded in protocol
// §28 Presence Governance — voting, delegation, council, veto
// ============================================================

import type { PresenceCitizen, CitizenshipRight } from "./presence-identity";

// ── §26 — Presence State ──

export interface PresenceState {
  state_id: string;
  founded_at: number;
  citizens: Map<string, PresenceCitizen>;
  total_voting_power: number;
  active_proposals: PresenceProposal[];
  constitution: PresenceConstitution;
  treasury: number;           // in $SHAPE
}

// ── §27 — Presence Constitution ──

export interface PresenceConstitution {
  version: string;
  ratified_at: number;
  articles: ConstitutionArticle[];
  amendments: ConstitutionAmendment[];
}

export interface ConstitutionArticle {
  number: number;
  title: string;
  text: string;
  rights: CitizenshipRight[];
}

export interface ConstitutionAmendment {
  id: string;
  article_number: number;
  new_text: string;
  proposed_at: number;
  ratified_at?: number;
  yes_votes: number;
  no_votes: number;
  status: "proposed" | "voting" | "ratified" | "rejected";
}

export function createConstitution(): PresenceConstitution {
  return {
    version: "1.0.0",
    ratified_at: Math.floor(Date.now() / 1000),
    articles: [
      {
        number: 1,
        title: "Existence Rights",
        text: "Every human has the inalienable right to prove their presence without revealing their identity. Presence is the foundation of sovereignty.",
        rights: ["existence"],
      },
      {
        number: 2,
        title: "Privacy Rights",
        text: "No protocol, application, or entity may require the disclosure of raw motion data, biometrics, or identity information as a condition of participation.",
        rights: ["existence", "privacy" as CitizenshipRight],
      },
      {
        number: 3,
        title: "Participation Rights",
        text: "Every citizen with established reputation has the right to participate in protocol governance proportional to their verified presence.",
        rights: ["participation"],
      },
      {
        number: 4,
        title: "Governance Rights",
        text: "Genesis-tier citizens have the right to vote on protocol evolution, propose amendments, and serve on the Presence Council.",
        rights: ["governance"],
      },
      {
        number: 5,
        title: "Economic Rights",
        text: "Every citizen has the right to participate in the presence economy — to earn, trade, stake, and benefit from their verified presence.",
        rights: ["economic"],
      },
    ],
    amendments: [],
  };
}

// ── §28 — Presence Governance ──

export type ProposalType = "parameter_change" | "protocol_upgrade" | "treasury_allocation" | "constitutional_amendment";

export type VoteOption = "yes" | "no" | "abstain";

export interface PresenceProposal {
  proposal_id: string;
  type: ProposalType;
  title: string;
  description: string;
  proposed_by: string;       // citizen ID
  proposed_at: number;
  voting_ends_at: number;
  status: "active" | "passed" | "rejected" | "expired";
  votes: Map<string, VoteOption>;
  yes_power: number;         // voting-power-weighted
  no_power: number;
  threshold: number;         // required yes ratio (0-1)
}

export function createProposal(
  type: ProposalType,
  title: string,
  description: string,
  proposerId: string,
  votingPeriodDays = 7,
): PresenceProposal {
  const now = Math.floor(Date.now() / 1000);
  // Threshold varies by type
  const threshold =
    type === "constitutional_amendment" ? 0.75 :
    type === "protocol_upgrade" ? 0.67 :
    type === "treasury_allocation" ? 0.60 :
    0.50; // parameter_change

  return {
    proposal_id: `PROP_${now.toString(36).toUpperCase()}`,
    type,
    title,
    description,
    proposed_by: proposerId,
    proposed_at: now,
    voting_ends_at: now + votingPeriodDays * 86400,
    status: "active",
    votes: new Map(),
    yes_power: 0,
    no_power: 0,
    threshold,
  };
}

export function castVote(
  proposal: PresenceProposal,
  citizen: PresenceCitizen,
  option: VoteOption,
): void {
  if (proposal.status !== "active") return;
  const now = Math.floor(Date.now() / 1000);
  if (now > proposal.voting_ends_at) {
    proposal.status = "expired";
    return;
  }

  // Remove previous vote if any
  proposal.votes.delete(citizen.passport.passport_id);

  // Record new vote
  proposal.votes.set(citizen.passport.passport_id, option);
  if (option === "yes") proposal.yes_power += citizen.voting_power;
  else if (option === "no") proposal.no_power += citizen.voting_power;
}

export function tallyProposal(proposal: PresenceProposal): "passed" | "rejected" | "expired" | "active" {
  const now = Math.floor(Date.now() / 1000);
  if (now < proposal.voting_ends_at) return "active";

  const totalVoted = proposal.yes_power + proposal.no_power;
  if (totalVoted === 0) {
    proposal.status = "expired";
    return "expired";
  }

  const yesRatio = proposal.yes_power / totalVoted;
  proposal.status = yesRatio >= proposal.threshold ? "passed" : "rejected";
  return proposal.status;
}

// ── Presence Council (§28) ──

export interface PresenceCouncil {
  members: Array<{ citizen_id: string; role: "councilor" | "speaker"; elected_at: number; term_ends: number }>;
  max_members: number;
  term_days: number;
  veto_threshold: number;    // fraction of council needed to veto
}

export function createPresenceCouncil(maxMembers = 9, termDays = 180): PresenceCouncil {
  return {
    members: [],
    max_members: maxMembers,
    term_days: termDays,
    veto_threshold: 0.67,
  };
}

export function councilVeto(
  council: PresenceCouncil,
  proposal: PresenceProposal,
  vetoVotes: number,          // number of councilors voting to veto
): boolean {
  return vetoVotes / council.max_members >= council.veto_threshold;
}

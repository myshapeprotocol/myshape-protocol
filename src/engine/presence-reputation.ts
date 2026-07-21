/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol — Presence Reputation Engine (§14-16)
//
// §14 Presence Reputation — persistent score across sessions
// §15 Presence Graph — co-presence relationship network
// §16 Presence Consensus — network agreement on presence
// ============================================================

import type { ZKPresenceProof } from "./proof-system";

// ── §14 — Presence Reputation ──

export interface ReputationProfile {
  prs: number;                // Presence Reputation Score [0,1]
  total_proofs: number;       // lifetime count
  avg_pes: number;            // average PES across all proofs
  avg_pss: number;            // average stability score
  drop_rate: number;          // fraction of expected proofs missing
  device_diversity: number;   // unique devices used
  first_seen: number;         // unix timestamp
  last_seen: number;
  tier: ReputationTier;
}

export type ReputationTier = "genesis" | "established" | "regular" | "new" | "untrusted";

// §14.4 — Decay constant (per second)
const REPUTATION_DECAY = 0.01 / 86400; // ~1% per day

export function computeReputationScore(params: {
  avgPes: number;              // average PES
  avgPss: number;              // average stability
  totalProofs: number;         // lifetime count
  dropRate: number;            // missed proofs ratio
  deviceDiversity: number;     // unique devices
  lastSeen: number;            // unix timestamp
}): { prs: number; tier: ReputationTier } {
  const now = Math.floor(Date.now() / 1000);

  // Base score from entropy and stability
  const entropyFactor = params.avgPes;
  const stabilityFactor = params.avgPss;
  const baseScore = 0.4 * entropyFactor + 0.4 * stabilityFactor;

  // Proof count bonus (logarithmic — diminishing returns)
  const proofBonus = Math.min(0.15, Math.log10(Math.max(params.totalProofs, 1)) * 0.05);

  // Drop rate penalty
  const dropPenalty = Math.min(0.2, params.dropRate * 0.5);

  // Device diversity bonus
  const deviceBonus = Math.min(0.05, (params.deviceDiversity - 1) * 0.02);

  // Decay since last seen
  const age = now - params.lastSeen;
  const decayFactor = Math.exp(-REPUTATION_DECAY * age);

  const rawScore = (baseScore + proofBonus + deviceBonus - dropPenalty) * decayFactor;
  const prs = Math.min(Math.max(rawScore, 0), 1);

  // Tier classification
  let tier: ReputationTier;
  if (prs >= 0.80 && params.totalProofs >= 100) tier = "genesis";
  else if (prs >= 0.60 && params.totalProofs >= 30) tier = "established";
  else if (prs >= 0.40 && params.totalProofs >= 10) tier = "regular";
  else if (params.totalProofs > 0) tier = "new";
  else tier = "untrusted";

  return { prs, tier };
}

// ── §15 — Presence Graph ──

export interface PresenceNode {
  node_id: string;
  last_zkp_hash: string;
  last_pes: number;
  last_seen: number;
  reputation: ReputationProfile;
}

export interface CoPresenceEdge {
  source: string;
  target: string;
  weight: number;            // co-presence intensity
  first_co_presence: number;
  last_co_presence: number;
  co_presence_count: number;
}

export interface PresenceGraph {
  nodes: Map<string, PresenceNode>;
  edges: CoPresenceEdge[];
}

export function createPresenceGraph(): PresenceGraph {
  return { nodes: new Map(), edges: [] };
}

export function addPresenceNode(
  graph: PresenceGraph,
  nodeId: string,
  proof: ZKPresenceProof,
  reputation: ReputationProfile,
): void {
  graph.nodes.set(nodeId, {
    node_id: nodeId,
    last_zkp_hash: proof.zkp_hash,
    last_pes: proof.ep.pes,
    last_seen: proof.generated_at,
    reputation,
  });
}

// §15.4 — Edge weight: co-presence frequency × duration × device overlap
export function addOrUpdateCoPresenceEdge(
  graph: PresenceGraph,
  source: string,
  target: string,
  timestamp: number,
): void {
  const existing = graph.edges.find(
    e => (e.source === source && e.target === target) ||
         (e.source === target && e.target === source),
  );

  if (existing) {
    existing.co_presence_count++;
    existing.last_co_presence = timestamp;
    // Weight: frequency bonus + recency
    existing.weight = Math.min(1, existing.co_presence_count * 0.1 + 0.3);
  } else {
    graph.edges.push({
      source,
      target,
      weight: 0.3,
      first_co_presence: timestamp,
      last_co_presence: timestamp,
      co_presence_count: 1,
    });
  }
}

// ── §16 — Presence Consensus ──

export interface ConsensusResult {
  reached: boolean;
  threshold: number;
  agreement_ratio: number;
  participating_nodes: number;
  dissenting_nodes: number;
  final_pes: number;
}

export function runPresenceConsensus(
  proofs: Array<{ node_id: string; zkp: ZKPresenceProof }>,
  options: { threshold?: number; min_nodes?: number } = {},
): ConsensusResult {
  const { threshold = 0.67, min_nodes = 1 } = options;

  if (proofs.length < min_nodes) {
    return {
      reached: false,
      threshold,
      agreement_ratio: 0,
      participating_nodes: proofs.length,
      dissenting_nodes: proofs.length,
      final_pes: 0,
    };
  }

  // Consensus = fraction of nodes whose PES agrees within tolerance
  const pesValues = proofs.map(p => p.zkp.ep.pes);
  const medianPes = pesValues.sort((a, b) => a - b)[Math.floor(pesValues.length / 2)];
  const tolerance = 0.10;
  const agreeing = proofs.filter(p => Math.abs(p.zkp.ep.pes - medianPes) <= tolerance);
  const agreementRatio = agreeing.length / proofs.length;

  return {
    reached: agreementRatio >= threshold,
    threshold,
    agreement_ratio: agreementRatio,
    participating_nodes: proofs.length,
    dissenting_nodes: proofs.length - agreeing.length,
    final_pes: agreeing.reduce((s, p) => s + p.zkp.ep.pes, 0) / agreeing.length,
  };
}

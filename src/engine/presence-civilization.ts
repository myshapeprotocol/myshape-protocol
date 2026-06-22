// ============================================================
// MyShape Protocol — Presence Civilization (§29-34)
//
// §29 Presence Civilization — identity as civilizational substrate
// §30 Presence Time — temporal dimensions of presence
// §31 Presence Continuum — identity across worlds/platforms
// §32 Presence Multiverse — multi-world presence
// §33 Presence Memory — persistent identity memory
// §34 Presence Lineage — identity inheritance and descent
// ============================================================

import type { PresenceIdentity } from "./presence-identity";

// ── §29 — Presence Civilization ──

export type CivilizationLayer =
  | "physical"     // base reality
  | "economic"     // value exchange
  | "social"       // human relationships
  | "civilizational" // governance and coordination
  | "cosmic";      // multi-world, multi-species

export interface CivilizationState {
  layer: CivilizationLayer;
  active_identities: number;
  total_presence_seconds: number;
  average_pes: number;
  active_proposals: number;
  treasury_value: number;
}

// §29 — Identity becomes the operating system of civilization
export function assessCivilizationHealth(
  identities: PresenceIdentity[],
): CivilizationState {
  if (identities.length === 0) {
    return {
      layer: "physical",
      active_identities: 0,
      total_presence_seconds: 0,
      average_pes: 0,
      active_proposals: 0,
      treasury_value: 0,
    };
  }

  return {
    layer: "civilizational",
    active_identities: identities.length,
    total_presence_seconds: identities.reduce((s, id) => s + id.total_presence_seconds, 0),
    average_pes: identities.reduce((s, id) => s + id.reputation.avg_pes, 0) / identities.length,
    active_proposals: 0,
    treasury_value: 0,
  };
}

// ── §30 — Presence Time ──
// Presence is fundamentally temporal — it exists only in the present moment.

export interface PresenceTimepoint {
  timestamp: number;
  pes: number;
  pss: number;
  identity_id: string;
  world_id: string;           // which world/platform this presence occurred in
}

export interface PresenceTimeline {
  identity_id: string;
  timepoints: PresenceTimepoint[];
  first_presence: number;
  last_presence: number;
  total_duration_seconds: number;
  gaps: Array<{ start: number; end: number; duration: number }>; // absence periods
}

export function buildPresenceTimeline(
  identityId: string,
  timepoints: PresenceTimepoint[],
): PresenceTimeline {
  const sorted = [...timepoints].sort((a, b) => a.timestamp - b.timestamp);
  const gaps: PresenceTimeline["gaps"] = [];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
    if (gap > 60) { // more than 1 minute gap = absence
      gaps.push({
        start: sorted[i - 1].timestamp,
        end: sorted[i].timestamp,
        duration: gap,
      });
    }
  }

  return {
    identity_id: identityId,
    timepoints: sorted,
    first_presence: sorted.length > 0 ? sorted[0].timestamp : 0,
    last_presence: sorted.length > 0 ? sorted[sorted.length - 1].timestamp : 0,
    total_duration_seconds: sorted.length > 1
      ? sorted[sorted.length - 1].timestamp - sorted[0].timestamp
      : 0,
    gaps,
  };
}

// ── §31 — Presence Continuum ──
// Identity persists across worlds, platforms, and contexts.

export type WorldType = "physical" | "virtual" | "augmented" | "simulation" | "ai_realm";

export interface WorldContext {
  world_id: string;
  world_type: WorldType;
  platform: string;           // e.g., "iOS", "Web", "Unreal", "Unity"
  joined_at: number;
  presence_count: number;
}

export interface CrossWorldIdentity {
  identity_id: string;
  worlds: WorldContext[];
  primary_world: string;      // most frequently used world
  total_worlds: number;
}

// ── §32 — Presence Multiverse ──
// Six dimensions of presence across all possible worlds.

export type MultiverseDimension =
  | "time"         // temporal span
  | "device"       // hardware diversity
  | "scene"        // context diversity
  | "identity"     // self-consistency
  | "social"       // co-presence breadth
  | "civilization"; // governance participation

export interface MultiversePresence {
  identity_id: string;
  dimensions: Record<MultiverseDimension, number>; // 0-1 score per dimension
  total_score: number;      // aggregate multiverse presence
  world_count: number;
}

export function computeMultiversePresence(
  identityId: string,
  timeline: PresenceTimeline,
  crossWorld: CrossWorldIdentity,
): MultiversePresence {
  return {
    identity_id: identityId,
    dimensions: {
      time: Math.min(timeline.total_duration_seconds / (365 * 86400), 1),     // fraction of a year
      device: Math.min(crossWorld.total_worlds / 5, 1),                        // up to 5 devices
      scene: 0.5,                                                              // default
      identity: timeline.gaps.length === 0 ? 0.9 : 0.5,                       // continuity
      social: 0.3,                                                             // default
      civilization: 0.1,                                                       // default
    },
    total_score: 0,
    world_count: crossWorld.total_worlds,
  };
}

// ── §33 — Presence Memory ──
// Persistent, privacy-preserving memory of presence across time.

export interface PresenceMemory {
  memory_id: string;
  identity_id: string;
  snapshots: PresenceTimepoint[];
  memorable_moments: Array<{
    timestamp: number;
    description: string;      // e.g., "first genesis", "tier upgrade"
    significance: number;     // 0-1
  }>;
  last_accessed: number;
}

export function createPresenceMemory(identityId: string): PresenceMemory {
  return {
    memory_id: `MEM_${identityId}_${Date.now().toString(36).toUpperCase()}`,
    identity_id: identityId,
    snapshots: [],
    memorable_moments: [],
    last_accessed: Math.floor(Date.now() / 1000),
  };
}

// ── §34 — Presence Lineage ──
// Identity inheritance: individual → collective → civilizational.

export type LineageScope = "individual" | "collective" | "civilizational";

export interface PresenceLineage {
  lineage_id: string;
  scope: LineageScope;
  ancestor_id?: string;       // parent identity (for collective/civilizational)
  descendants: string[];      // child identities
  founded_at: number;
  generation: number;         // 0 = genesis, 1 = first derivative, etc.
  total_members: number;
}

export function createLineage(
  scope: LineageScope,
  founderId: string,
  ancestorId?: string,
): PresenceLineage {
  return {
    lineage_id: `LIN_${founderId}_${Date.now().toString(36).toUpperCase()}`,
    scope,
    ancestor_id: ancestorId,
    descendants: [],
    founded_at: Math.floor(Date.now() / 1000),
    generation: 0,
    total_members: 1,
  };
}

export function addToLineage(
  lineage: PresenceLineage,
  descendantId: string,
): void {
  lineage.descendants.push(descendantId);
  lineage.total_members++;
  lineage.generation = Math.floor(Math.log2(lineage.total_members));
}

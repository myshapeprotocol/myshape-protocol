/** @experimental ZK subsystem — under active research. Not production-grade. */
// ============================================================
// MyShape Protocol — Presence Stream Engine (§11-13)
//
// §11 ZK-Presence Aggregation — recursive proofs over time
// §12 Multi-Device Presence — fused proofs across devices
// §13 Continuous Presence — real-time presence stream + PSS
// ============================================================

import type { ZKPresenceProof } from "./proof-system";
import type { PESComponents } from "./presence-entropy";

// ── §11 — Aggregated Proof ──

export interface AggregatedProof {
  version: "1.1";
  window_count: number;
  proofs: ZKPresenceProof[];
  entropy_score: number;      // PES_agg
  timestamp_start: number;
  timestamp_end: number;
  root_hash: string;
}

export function aggregateProofs(
  proofs: ZKPresenceProof[],
  options: { max_gap_seconds?: number; min_entropy?: number } = {},
): AggregatedProof | null {
  const { max_gap_seconds = 3, min_entropy = 0.65 } = options;
  if (proofs.length === 0) return null;

  // Rule 1: Temporal continuity — gap between consecutive proofs ≤ max_gap
  const sorted = [...proofs].sort((a, b) => a.generated_at - b.generated_at);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].generated_at - sorted[i - 1].generated_at > max_gap_seconds) {
      return null; // gap too large — not a continuous stream
    }
  }

  // Rule 2: Entropy preservation — aggregate PES must meet threshold
  const pesValues = sorted.map(p => p.ep.pes);
  const minPes = Math.min(...pesValues);
  const avgPes = pesValues.reduce((a, b) => a + b, 0) / pesValues.length;
  // Conservative: use minimum PES as aggregate (security-first)
  const pesAgg = minPes;
  if (pesAgg < min_entropy) return null;

  // Rule 3: Proof integrity — all same version, compatible
  if (sorted.some(p => p.version !== 1)) return null;

  // Compute root hash
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };
  const hashInput = sorted.map(p => p.zkp_hash).join(":") + `:avg=${avgPes.toFixed(4)}`;

  return {
    version: "1.1",
    window_count: sorted.length,
    proofs: sorted,
    entropy_score: pesAgg,
    timestamp_start: sorted[0].generated_at,
    timestamp_end: sorted[sorted.length - 1].generated_at,
    root_hash: quickHash(hashInput),
  };
}

// ── §12 — Multi-Device Presence ──

export type DeviceType = "headset" | "phone" | "watch" | "laptop" | "external_camera";

export interface DeviceProof {
  device_id: string;
  device_type: DeviceType;
  zkp: ZKPresenceProof;
  timestamp: number;
}

// §12.6 — Device weights
const DEVICE_WEIGHTS: Record<DeviceType, number> = {
  headset: 1.0,          // VR — full skeleton, highest trust
  phone: 0.6,            // single camera, limited FOV
  watch: 0.3,            // IMU only, no camera
  laptop: 0.5,           // built-in webcam
  external_camera: 0.7,   // dedicated camera
};

export interface MultiDevicePresence {
  devices: DeviceProof[];
  fused_pes: number;        // weighted fusion
  fused_timestamp: number;
  device_count: number;
}

export function fuseMultiDevicePresence(
  deviceProofs: DeviceProof[],
  options: { sync_tolerance_ms?: number } = {},
): MultiDevicePresence | null {
  const { sync_tolerance_ms = 50 } = options;
  if (deviceProofs.length === 0) return null;

  // Device synchronization: all timestamps within tolerance
  const timestamps = deviceProofs.map(d => d.timestamp);
  const maxTs = Math.max(...timestamps);
  const minTs = Math.min(...timestamps);
  if (maxTs - minTs > sync_tolerance_ms / 1000) return null;

  // Weighted entropy fusion
  let totalWeight = 0;
  let weightedPes = 0;
  for (const dp of deviceProofs) {
    const w = DEVICE_WEIGHTS[dp.device_type] ?? 0.5;
    weightedPes += dp.zkp.ep.pes * w;
    totalWeight += w;
  }

  return {
    devices: deviceProofs,
    fused_pes: totalWeight > 0 ? weightedPes / totalWeight : 0,
    fused_timestamp: Math.floor((minTs + maxTs) / 2 * 1000) / 1000,
    device_count: deviceProofs.length,
  };
}

// ── §13 — Continuous Presence Stream ──

export interface PresenceSnapshot {
  zkp: ZKPresenceProof;
  pes: number;
  components: PESComponents;
  timestamp: number;
}

export interface PresenceStream {
  snapshots: PresenceSnapshot[];
  start_time: number;
  duration_seconds: number;
  sample_count: number;
  pss: number;              // Presence Stability Score (§13)
  pss_trend: "rising" | "stable" | "declining";
}

// §13 — Presence Stability Score
// Measures how consistently real presence is maintained over time.
// High PSS = stable, genuine presence. Low PSS = intermittent or degrading.

export function computePresenceStabilityScore(
  snapshots: PresenceSnapshot[],
): { pss: number; trend: PresenceStream["pss_trend"] } {
  if (snapshots.length < 3) {
    return { pss: snapshots.length > 0 ? snapshots[0].pes : 0, trend: "stable" };
  }

  const pesValues = snapshots.map(s => s.pes);
  const mean = pesValues.reduce((a, b) => a + b, 0) / pesValues.length;

  // Stability = 1 − coefficient of variation
  const variance = pesValues.reduce((s, v) => s + (v - mean) ** 2, 0) / pesValues.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const stability = Math.max(0, 1 - cv);

  // PSS = mean PES × stability factor
  const pss = mean * (0.5 + 0.5 * stability);

  // Trend: compare first half vs second half
  const mid = Math.floor(pesValues.length / 2);
  const firstHalf = pesValues.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf = pesValues.slice(mid).reduce((a, b) => a + b, 0) / (pesValues.length - mid);
  const delta = secondHalf - firstHalf;
  const trend: PresenceStream["pss_trend"] =
    delta > 0.03 ? "rising" : delta < -0.03 ? "declining" : "stable";

  return { pss, trend };
}

export function createPresenceStream(snapshots: PresenceSnapshot[]): PresenceStream | null {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
  const { pss, trend } = computePresenceStabilityScore(sorted);

  return {
    snapshots: sorted,
    start_time: sorted[0].timestamp,
    duration_seconds: sorted[sorted.length - 1].timestamp - sorted[0].timestamp,
    sample_count: sorted.length,
    pss,
    pss_trend: trend,
  };
}

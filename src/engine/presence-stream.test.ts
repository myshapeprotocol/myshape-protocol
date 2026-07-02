import { describe, it, expect } from "vitest";
import {
  aggregateProofs,
  fuseMultiDevicePresence,
  computePresenceStabilityScore,
  createPresenceStream,
} from "./presence-stream";
import type { ZKPresenceProof, PresenceProof, MotionProof, EntropyProof } from "./proof-system";
import type { PresenceSnapshot, DeviceProof } from "./presence-stream";

// ── Helpers ──

function makeProof(pes: number, generatedAt: number, zkpHash = "abcd"): ZKPresenceProof {
  return {
    version: 1,
    proof_type: "ZK-Presence",
    zkp_hash: zkpHash,
    pop: { version: 1, proof_type: "PoP", pop_hash: "pop", mv_hash: "mv", timestamp: generatedAt, window_seconds: 5 } as PresenceProof,
    mp: { version: 1, proof_type: "MP", mp_hash: "mp", fps: 30, window_seconds: 5, nodes: 18, timestamp: generatedAt } as MotionProof,
    ep: { version: 1, proof_type: "EP", ep_hash: `ep_${pes}`, pes, frequency_entropy: 0.7, micro_timing_variance: 0.3, noise_residual: 0.5, biological_perturbation: 0.4, timestamp: generatedAt } as EntropyProof,
    generated_at: generatedAt,
    expires_at: generatedAt + 300,
  };
}

function makeSnapshot(pes: number, timestamp: number): PresenceSnapshot {
  return {
    zkp: makeProof(pes, timestamp),
    pes,
    components: { microTimingVariance: 0.3, noiseResidual: 0.5, frequencyEntropy: 0.7, biologicalPerturbation: 0.4 },
    timestamp,
  };
}

// ── aggregateProofs (§11) ──

describe("aggregateProofs", () => {
  it("returns null for empty array", () => {
    expect(aggregateProofs([])).toBeNull();
  });

  it("aggregates continuous proofs with sufficient entropy", () => {
    const proofs = [
      makeProof(0.70, 1000, "a"),
      makeProof(0.72, 1001, "b"),
      makeProof(0.75, 1002, "c"),
    ];
    const result = aggregateProofs(proofs);
    expect(result).not.toBeNull();
    expect(result!.window_count).toBe(3);
    expect(result!.entropy_score).toBe(0.70); // min PES (security-first)
    expect(result!.timestamp_start).toBe(1000);
    expect(result!.timestamp_end).toBe(1002);
    expect(result!.version).toBe("1.1");
  });

  it("rejects proofs with temporal gap > max_gap", () => {
    const proofs = [
      makeProof(0.70, 1000),
      makeProof(0.72, 1010), // 10s gap > 3s default
    ];
    expect(aggregateProofs(proofs)).toBeNull();
  });

  it("rejects proofs with PES below min_entropy", () => {
    const proofs = [
      makeProof(0.70, 1000),
      makeProof(0.60, 1001), // below 0.65 default
    ];
    const result = aggregateProofs(proofs);
    expect(result).toBeNull();
  });

  it("rejects proofs with wrong version", () => {
    const proofs: ZKPresenceProof[] = [
      makeProof(0.70, 1000),
      { ...makeProof(0.72, 1001), version: 2 } as unknown as ZKPresenceProof,
    ];
    expect(aggregateProofs(proofs)).toBeNull();
  });

  it("sorts proofs by timestamp before processing", () => {
    const proofs = [
      makeProof(0.75, 1002, "c"),
      makeProof(0.70, 1000, "a"),
      makeProof(0.72, 1001, "b"),
    ];
    const result = aggregateProofs(proofs);
    expect(result).not.toBeNull();
    expect(result!.timestamp_start).toBe(1000);
    expect(result!.timestamp_end).toBe(1002);
  });

  it("custom max_gap_seconds option works", () => {
    const proofs = [
      makeProof(0.70, 1000),
      makeProof(0.72, 1006), // 6s gap, but we allow 10s
    ];
    const result = aggregateProofs(proofs, { max_gap_seconds: 10 });
    expect(result).not.toBeNull();
  });

  it("generates unique root hash", () => {
    const p1 = aggregateProofs([makeProof(0.70, 1000, "xxx"), makeProof(0.71, 1001, "yyy")]);
    const p2 = aggregateProofs([makeProof(0.70, 1000, "aaa"), makeProof(0.71, 1001, "bbb")]);
    expect(p1!.root_hash).not.toBe(p2!.root_hash);
  });
});

// ── fuseMultiDevicePresence (§12) ──

describe("fuseMultiDevicePresence", () => {
  function makeDevice(deviceType: string, pes: number, timestamp: number): DeviceProof {
    const base = makeProof(pes, Math.floor(timestamp));
    return {
      device_id: `dev-${deviceType}`,
      device_type: deviceType as DeviceProof["device_type"],
      zkp: base,
      timestamp: timestamp / 1000, // seconds with sub-second precision
    };
  }

  it("returns null for empty devices", () => {
    expect(fuseMultiDevicePresence([])).toBeNull();
  });

  it("fuses single device with its full weight", () => {
    const result = fuseMultiDevicePresence([makeDevice("headset", 0.80, 1000)]);
    expect(result).not.toBeNull();
    expect(result!.fused_pes).toBeCloseTo(0.80, 2);
    expect(result!.device_count).toBe(1);
  });

  it("computes weighted PES across device types", () => {
    const devices = [
      makeDevice("headset", 0.90, 1000),   // weight 1.0
      makeDevice("phone", 0.60, 1000),      // weight 0.6
    ];
    const result = fuseMultiDevicePresence(devices);
    expect(result).not.toBeNull();
    // Weighted: (0.90*1.0 + 0.60*0.6) / 1.6 = 1.26/1.6 = 0.7875
    expect(result!.fused_pes).toBeCloseTo(0.7875, 2);
  });

  it("rejects unsynchronized devices (timestamps differ > tolerance)", () => {
    // makeDevice divides timestamp by 1000, so 100000 and 100100 = 100.0 vs 100.1 = 100ms gap > 50ms
    const devices = [
      makeDevice("headset", 0.80, 100000),
      makeDevice("phone", 0.70, 100100),
    ];
    expect(fuseMultiDevicePresence(devices)).toBeNull();
  });

  it("custom sync_tolerance_ms works", () => {
    const devices = [
      makeDevice("headset", 0.80, 1000),
      makeDevice("phone", 0.70, 1000.5), // 0.5s = 500ms
    ];
    const result = fuseMultiDevicePresence(devices, { sync_tolerance_ms: 1000 });
    expect(result).not.toBeNull();
  });
});

// ── computePresenceStabilityScore (§13) ──

describe("computePresenceStabilityScore", () => {
  it("returns PES for single snapshot", () => {
    const result = computePresenceStabilityScore([makeSnapshot(0.75, 1000)]);
    expect(result.pss).toBeCloseTo(0.75, 2);
    expect(result.trend).toBe("stable");
  });

  it("high stability for consistent PES values", () => {
    const snapshots = [
      makeSnapshot(0.75, 1000),
      makeSnapshot(0.76, 1001),
      makeSnapshot(0.74, 1002),
      makeSnapshot(0.75, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.pss).toBeGreaterThan(0.6);  // mean ~0.75 × high stability
    expect(result.trend).toBe("stable");
  });

  it("low stability for volatile PES values", () => {
    const snapshots = [
      makeSnapshot(0.90, 1000),
      makeSnapshot(0.20, 1001),
      makeSnapshot(0.85, 1002),
      makeSnapshot(0.15, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.pss).toBeLessThan(0.5); // mean ~0.525 × low stability
  });

  it("detects rising trend", () => {
    const snapshots = [
      makeSnapshot(0.50, 1000),
      makeSnapshot(0.55, 1001),
      makeSnapshot(0.60, 1002),
      makeSnapshot(0.65, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.trend).toBe("rising");
  });

  it("detects declining trend", () => {
    const snapshots = [
      makeSnapshot(0.70, 1000),
      makeSnapshot(0.65, 1001),
      makeSnapshot(0.60, 1002),
      makeSnapshot(0.55, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.trend).toBe("declining");
  });
});

// ── createPresenceStream (§13) ──

describe("createPresenceStream", () => {
  it("returns null for empty snapshots", () => {
    expect(createPresenceStream([])).toBeNull();
  });

  it("creates stream from snapshots sorted by timestamp", () => {
    const snapshots = [
      makeSnapshot(0.75, 1002),
      makeSnapshot(0.70, 1000),
      makeSnapshot(0.72, 1001),
    ];
    const stream = createPresenceStream(snapshots);
    expect(stream).not.toBeNull();
    expect(stream!.start_time).toBe(1000);
    expect(stream!.sample_count).toBe(3);
    expect(stream!.duration_seconds).toBe(2);
    expect(stream!.pss).toBeGreaterThan(0);
    expect(["rising", "stable", "declining"]).toContain(stream!.pss_trend);
  });
});

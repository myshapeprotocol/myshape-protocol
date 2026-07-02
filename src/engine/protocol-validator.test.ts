import { describe, it, expect, beforeEach } from "vitest";
import {
  verifyPresenceTransaction,
  revokeProtocolDevice,
  createPresenceTransaction,
} from "./protocol-validator";
import type { PresenceTransaction } from "@/types/protocol";
import type { ZKPresenceProof, PresenceProof, MotionProof, EntropyProof } from "./proof-system";

// ── Helpers ──

function makeZKP(overrides: Partial<ZKPresenceProof> = {}): ZKPresenceProof {
  const ts = overrides.generated_at ?? Math.floor(Date.now() / 1000);
  return {
    version: 1,
    proof_type: "ZK-Presence",
    zkp_hash: `zkp_${ts}`,
    pop: {
      version: 1, proof_type: "PoP",
      pop_hash: `pop_${ts}`, mv_hash: "mv", timestamp: ts, window_seconds: 5,
    } as PresenceProof,
    mp: {
      version: 1, proof_type: "MP",
      mp_hash: `mp_${ts}`, fps: 30, window_seconds: 5, nodes: 18, timestamp: ts,
    } as MotionProof,
    ep: {
      version: 1, proof_type: "EP",
      ep_hash: `ep_${ts}`, pes: 0.75, frequency_entropy: 0.7,
      micro_timing_variance: 0.3, noise_residual: 0.5, biological_perturbation: 0.4, timestamp: ts,
    } as EntropyProof,
    generated_at: ts,
    expires_at: ts + 300,
    ...overrides,
  };
}

function makeTx(overrides: Partial<PresenceTransaction> = {}): PresenceTransaction {
  const zkp = makeZKP(overrides.zkp as Partial<ZKPresenceProof> | undefined);
  // Recompute zkp_hash to match sub-proofs
  const quickHash = (s: string) => {
    let h = 0x6d797368;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return Math.abs(h).toString(16).padStart(8, "0");
  };
  zkp.zkp_hash = quickHash(`${zkp.pop.pop_hash}:${zkp.mp.mp_hash}:${zkp.ep.ep_hash}`);

  const baseTx = createPresenceTransaction(zkp, zkp.ep.pes, "test-device-salt");
  return { ...baseTx, ...overrides };
}

// ── verifyPresenceTransaction ──

describe("verifyPresenceTransaction", () => {
  it("passes a valid transaction", () => {
    const tx = makeTx();
    const report = verifyPresenceTransaction(tx);
    expect(report.passed).toBe(true);
    expect(report.failed_rules).toHaveLength(0);
    expect(report.verified_at).toBeGreaterThan(0);
  });

  it("fails on low entropy score", () => {
    const tx = makeTx({ entropy_score: 0.3 });
    const report = verifyPresenceTransaction(tx, { pes_min: 0.65 });
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("entropy_threshold");
  });

  it("fails on expired timestamp", () => {
    const oldTs = Math.floor(Date.now() / 1000) - 600; // 10 min ago
    const tx = makeTx({
      zkp: makeZKP({ generated_at: oldTs, expires_at: oldTs + 300 }),
      timestamp: oldTs,
      entropy_score: 0.75,
    } as Partial<PresenceTransaction>);
    tx.zkp.zkp_hash = "hash"; // force mismatch since we changed timestamps
    // Actually just use an expired timestamp in a different way
    const tx2 = makeTx({
      timestamp: Math.floor(Date.now() / 1000) - 400, // 400s ago > 300s max_age
    } as Partial<PresenceTransaction>);
    const report = verifyPresenceTransaction(tx2, { max_age_seconds: 300 });
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("timestamp_valid");
  });

  it("fails on future timestamp (clock skew protection)", () => {
    const futureTs = Math.floor(Date.now() / 1000) + 60;
    const tx = makeTx({
      timestamp: futureTs,
    } as Partial<PresenceTransaction>);
    const report = verifyPresenceTransaction(tx);
    // Future timestamp > 10s skew tolerance
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("timestamp_valid");
  });

  it("fails on version mismatch", () => {
    const tx = makeTx({ version: 2 } as unknown as Partial<PresenceTransaction>);
    const report = verifyPresenceTransaction(tx);
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("proof_integrity");
  });

  it("fails on PES inconsistency between tx and zkp", () => {
    const zkp = makeZKP();
    const tx = createPresenceTransaction(zkp, 0.99, "salt"); // force different PES
    const report = verifyPresenceTransaction(tx);
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("proof_integrity");
  });

  it("fails on revoked device", () => {
    revokeProtocolDevice("revoked-hash");
    const tx = makeTx({ device_salt_hash: "revoked-hash" } as Partial<PresenceTransaction>);
    const report = verifyPresenceTransaction(tx);
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("device_not_revoked");
  });

  it("respects custom PES minimum", () => {
    const tx = makeTx({ entropy_score: 0.70 });
    const report = verifyPresenceTransaction(tx, { pes_min: 0.85 });
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("entropy_threshold");
  });

  it("returns all rule results in the report", () => {
    const tx = makeTx();
    const report = verifyPresenceTransaction(tx);
    expect(report.rules.zkp_valid).toBeDefined();
    expect(report.rules.entropy_threshold).toBeDefined();
    expect(report.rules.timestamp_valid).toBeDefined();
    expect(report.rules.replay_protection).toBeDefined();
    expect(report.rules.device_not_revoked).toBeDefined();
    expect(report.rules.proof_integrity).toBeDefined();
  });
});

// ── createPresenceTransaction ──

describe("createPresenceTransaction", () => {
  it("creates a transaction from ZKP + PES + salt", () => {
    const zkp = makeZKP();
    const tx = createPresenceTransaction(zkp, 0.75, "my-salt");
    expect(tx.version).toBe(1);
    expect(tx.entropy_score).toBe(0.75);
    expect(tx.zkp).toBe(zkp);
    expect(tx.timestamp).toBe(zkp.generated_at);
    expect(tx.device_salt_hash).toBeTruthy();
    expect(tx.signature).toBeTruthy();
  });
});

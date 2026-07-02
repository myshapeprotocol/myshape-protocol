/**
 * Engine smoke tests — verify all engine modules import cleanly
 * and export their documented public API.
 */
import { describe, it, expect } from "vitest";

describe("Engine module integrity", () => {
  it("presence-entropy exports compute functions", async () => {
    const m = await import("./presence-entropy");
    expect(typeof m.computeMicroTimingVariance).toBe("function");
    expect(typeof m.computeNoiseResidual).toBe("function");
    expect(typeof m.computeFrequencyEntropy).toBe("function");
    expect(typeof m.computeBiologicalPerturbation).toBe("function");
    expect(typeof m.computePES).toBe("function");
    expect(typeof m.computeFullPES).toBe("function");
  });

  it("proof-system exports generate + verify functions", async () => {
    const m = await import("./proof-system");
    expect(typeof m.generatePresenceProof).toBe("function");
    expect(typeof m.generateMotionProof).toBe("function");
    expect(typeof m.generateEntropyProof).toBe("function");
    expect(typeof m.generateZKPresenceProof).toBe("function");
    expect(typeof m.verifyZKPresenceProof).toBe("function");
    expect(typeof m.generateFullProof).toBe("function");
  });

  it("entropy-growth exports game mechanics", async () => {
    const m = await import("./entropy-growth");
    expect(typeof m.computeParticleLevel).toBe("function");
    expect(typeof m.computeDecay).toBe("function");
    expect(typeof m.detectEntropySpike).toBe("function");
    expect(typeof m.computeEntropyGain).toBe("function");
    expect(typeof m.getLevelProgress).toBe("function");
    expect(typeof m.getVisualTier).toBe("function");
    expect(m.PARTICLE_THRESHOLDS).toHaveLength(8);
  });

  it("threat-assessment exports assessor + attack data", async () => {
    const m = await import("./threat-assessment");
    expect(typeof m.assessThreat).toBe("function");
    expect(m.ATTACK_SIGNATURES).toHaveLength(8);
    expect(m.ATTACK_COST_MODEL).toHaveLength(4);
  });

  it("skeleton-topology exports mapping functions", async () => {
    const m = await import("./skeleton-topology");
    expect(typeof m.mediaPipeToSST).toBe("function");
    expect(typeof m.sstToMediaPipe).toBe("function");
    expect(typeof m.normalizeSSTFrame).toBe("function");
    expect(m.MEDIAPIPE_TO_SST).toBeDefined();
    expect(m.SST_BONES.length).toBeGreaterThan(0);
  });

  it("unforgeability exports verification + projections", async () => {
    const m = await import("./unforgeability");
    expect(typeof m.computeEntropyGaps).toBe("function");
    expect(typeof m.verifyUnforgeability).toBe("function");
    expect(typeof m.projectSecurityHorizon).toBe("function");
    expect(m.HUMAN_ENTROPY_LOWER_BOUND).toBeDefined();
    expect(m.AI_ENTROPY_UPPER_BOUND).toBeDefined();
  });

  it("zk-circuit exports Pedersen + Schnorr functions", async () => {
    const m = await import("./zk-circuit");
    expect(typeof m.pedersenCommit).toBe("function");
    expect(typeof m.pedersenVerify).toBe("function");
    expect(typeof m.schnorrProve).toBe("function");
    expect(typeof m.schnorrVerify).toBe("function");
    expect(typeof m.generateZKPresenceProof).toBe("function");
    expect(typeof m.verifyExternalZKPresence).toBe("function");
  });
});

import { describe, it, expect } from "vitest";
import {
  generatePresenceProof,
  generateMotionProof,
  generateEntropyProof,
  generateZKPresenceProof,
  verifyZKPresenceProof,
  generateFullProof,
} from "./proof-system";
import type { MotionVectorFinal } from "@/types/motion-vector";
import type { PESComponents } from "./presence-entropy";

// ── Presence Proof (PoP) ──

describe("generatePresenceProof", () => {
  it("produces valid PoP with SHA-256 hash", () => {
    const mv: MotionVectorFinal = {
      version: 1,
      fps: 30,
      window: 5,
      nodes: 18,
      mv_hash: "test-mv-hash",
      entropy_score: 0.65,
      timestamp: 1700000000,
    };
    const proof = generatePresenceProof(mv, "fx:abc123");
    expect(proof.version).toBe(1);
    expect(proof.proof_type).toBe("PoP");
    expect(proof.pop_hash).toHaveLength(64); // SHA-256 = 32 bytes → 64 hex chars
    expect(proof.pop_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(proof.mv_hash).toBe("test-mv-hash");
  });

  it("produces different hashes for different inputs", () => {
    const mv1: MotionVectorFinal = {
      version: 1, fps: 30, window: 5, nodes: 18,
      mv_hash: "hash-1", entropy_score: 0.5, timestamp: 1000,
    };
    const mv2: MotionVectorFinal = {
      version: 1, fps: 30, window: 5, nodes: 18,
      mv_hash: "hash-2", entropy_score: 0.5, timestamp: 1000,
    };
    const p1 = generatePresenceProof(mv1, "fx:1");
    const p2 = generatePresenceProof(mv2, "fx:2");
    expect(p1.pop_hash).not.toBe(p2.pop_hash);
  });
});

// ── Entropy Proof (EP) ──

describe("generateEntropyProof", () => {
  it("includes all PES components in hash", () => {
    const components: PESComponents = {
      microTimingVariance: 0.4,
      noiseResidual: 0.6,
      frequencyEntropy: 0.8,
      biologicalPerturbation: 0.3,
    };
    const ep = generateEntropyProof(0.65, components, 1700000000);
    expect(ep.proof_type).toBe("EP");
    expect(ep.ep_hash).toHaveLength(64);
    expect(ep.pes).toBeCloseTo(0.65, 4);
    expect(ep.frequency_entropy).toBe(0.8);
    expect(ep.micro_timing_variance).toBe(0.4);
    expect(ep.noise_residual).toBe(0.6);
    expect(ep.biological_perturbation).toBe(0.3);
  });
});

// ── ZK-Presence Proof ──

describe("generateZKPresenceProof", () => {
  const mv: MotionVectorFinal = {
    version: 1, fps: 30, window: 5, nodes: 18,
    mv_hash: "mv-test", entropy_score: 0.65, timestamp: 1700000000,
  };
  const components: PESComponents = {
    microTimingVariance: 0.4,
    noiseResidual: 0.6,
    frequencyEntropy: 0.8,
    biologicalPerturbation: 0.3,
  };

  it("produces composite ZK proof with valid structure", () => {
    const pop = generatePresenceProof(mv, "fx:test");
    const mp = generateMotionProof(30, 5, 18, 1700000000);
    const ep = generateEntropyProof(0.65, components, 1700000000);
    const zkp = generateZKPresenceProof(pop, mp, ep);

    expect(zkp.proof_type).toBe("ZK-Presence");
    expect(zkp.zkp_hash).toHaveLength(64);
    expect(zkp.zkp_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(zkp.pop).toBe(pop);
    expect(zkp.mp).toBe(mp);
    expect(zkp.ep).toBe(ep);
    expect(zkp.expires_at).toBeGreaterThan(zkp.generated_at);
  });

  it("includes ZK commitment from circuit", () => {
    const pop = generatePresenceProof(mv, "fx:zk");
    const mp = generateMotionProof(30, 5, 18, 1700000000);
    const ep = generateEntropyProof(0.65, components, 1700000000);
    const zkp = generateZKPresenceProof(pop, mp, ep);

    expect(zkp.zk_commitment).toBeDefined();
    expect(zkp.zk_commitment).toHaveLength(64); // 256-bit Pedersen commitment
    expect(zkp.zk_commitment).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── Verification ──

describe("verifyZKPresenceProof", () => {
  const mv: MotionVectorFinal = {
    version: 1, fps: 30, window: 5, nodes: 18,
    mv_hash: "mv-verify", entropy_score: 0.65, timestamp: 1700000000,
  };
  const components: PESComponents = {
    microTimingVariance: 0.4,
    noiseResidual: 0.6,
    frequencyEntropy: 0.8,
    biologicalPerturbation: 0.3,
  };

  it("verifies a valid proof", () => {
    const pop = generatePresenceProof(mv, "fx:verify");
    const mp = generateMotionProof(30, 5, 18, 1700000000);
    const ep = generateEntropyProof(0.65, components, 1700000000);
    const zkp = generateZKPresenceProof(pop, mp, ep);

    const result = verifyZKPresenceProof(zkp);
    expect(result.valid).toBe(true);
    expect(result.checks.zkp_valid).toBe(true);
  });

  it("rejects tampered proof", () => {
    const pop = generatePresenceProof(mv, "fx:tamper");
    const mp = generateMotionProof(30, 5, 18, 1700000000);
    const ep = generateEntropyProof(0.65, components, 1700000000);
    const zkp = generateZKPresenceProof(pop, mp, ep);

    // Tamper with the PES score
    zkp.ep.pes = 0.1;

    const result = verifyZKPresenceProof(zkp);
    expect(result.valid).toBe(false);
  });

  it("rejects proof below entropy threshold", () => {
    const lowComponents: PESComponents = {
      microTimingVariance: 0.01,
      noiseResidual: 0.01,
      frequencyEntropy: 0.01,
      biologicalPerturbation: 0.01,
    };
    const ep = generateEntropyProof(0.05, lowComponents, 1700000000);
    const pop = generatePresenceProof(mv, "fx:low");
    const mp = generateMotionProof(30, 5, 18, 1700000000);
    const zkp = generateZKPresenceProof(pop, mp, ep);

    const result = verifyZKPresenceProof(zkp, { pes_min: 0.20 });
    expect(result.valid).toBe(false);
    expect(result.checks.entropy_threshold).toBe(false);
  });
});

// ── Full Pipeline ──

describe("generateFullProof", () => {
  it("produces valid ZK-Presence proof from raw inputs", () => {
    const components: PESComponents = {
      microTimingVariance: 0.4,
      noiseResidual: 0.6,
      frequencyEntropy: 0.8,
      biologicalPerturbation: 0.3,
    };
    const proof = generateFullProof({
      fps: 30,
      windowSeconds: 5,
      nodes: 18,
      mvHash: "pipeline-mv",
      featureHash: "pipeline-fx",
      pes: 0.65,
      pesComponents: components,
    });

    expect(proof.proof_type).toBe("ZK-Presence");
    expect(proof.pop.pop_hash).toHaveLength(64);
    expect(proof.mp.mp_hash).toHaveLength(64);
    expect(proof.ep.ep_hash).toHaveLength(64);
    expect(proof.zk_commitment).toBeDefined();

    const verifyResult = verifyZKPresenceProof(proof);
    expect(verifyResult.valid).toBe(true);
  });

  it("same input produces deterministic proof", () => {
    const components: PESComponents = {
      microTimingVariance: 0.4,
      noiseResidual: 0.6,
      frequencyEntropy: 0.8,
      biologicalPerturbation: 0.3,
    };
    const input = {
      fps: 30, windowSeconds: 5, nodes: 18,
      mvHash: "deterministic", featureHash: "fx-det",
      pes: 0.65, pesComponents: components,
    };
    const p1 = generateFullProof(input);
    const p2 = generateFullProof(input);

    // Proof hashes should be deterministic
    expect(p1.pop.pop_hash).toBe(p2.pop.pop_hash);
    expect(p1.mp.mp_hash).toBe(p2.mp.mp_hash);
    expect(p1.ep.ep_hash).toBe(p2.ep.ep_hash);
    // But ZK commitment includes randomness (blinding factor)
    expect(p1.zk_commitment).not.toBe(p2.zk_commitment);
  });
});

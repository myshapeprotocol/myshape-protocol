import { describe, it, expect } from "vitest";
import {
  verify,
  getReceipt,
  getEntropyScore,
  buildReceiptFromPES,
  verifyReceiptFn,
  type ContinuityResult,
} from "./presence-adapter";
import { verifyReceipt as verifyCpsReceipt } from "@/lib/evidence/cps0001";
import type { ContinuityReceipt } from "@/lib/evidence/cps0001";

// ── Mock Data Helpers ──

/** Generate a single MediaPipe landmark (33 points). */
function makeLandmark(x: number, y: number, z: number) {
  return { x, y, z, visibility: 0.9 };
}

/**
 * Generate human-like motion frames with biological noise.
 *
 * Simulates a person moving their hand in a circular pattern
 * with micro-jitter, frequency variation, and slight perturbations —
 * exactly the kind of signal PES is designed to detect as "human."
 */
function generateHumanMotion(frameCount: number): {
  frames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>;
  timestamps: number[];
} {
  const frames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> = [];
  const timestamps: number[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const t = i * 33.33; // ~30fps
    const angle = (i / frameCount) * Math.PI * 4; // 2 full circles
    const jitter = (Math.sin(i * 0.7) * 0.005) + (Math.cos(i * 1.3) * 0.003); // biological micro-jitter

    // Hand moving in a circle with biological noise
    const handX = 0.5 + Math.cos(angle) * 0.15 + jitter;
    const handY = 0.5 + Math.sin(angle) * 0.15 + jitter * 0.7;

    const landmarks: Array<{ x: number; y: number; z: number; visibility?: number }> = [];

    // All 33 MediaPipe landmarks — most static, hand/wrist moving
    for (let j = 0; j < 33; j++) {
      // Wrist (15), index (19), pinky (17) — moving
      if (j === 15 || j === 19 || j === 17) {
        landmarks.push(makeLandmark(handX + j * 0.001, handY + j * 0.001, 0));
      } else {
        // Static body landmarks with micro-vibration
        const vibrate = (Math.random() - 0.5) * 0.002;
        landmarks.push(makeLandmark(0.5 + vibrate, 0.5 + vibrate, vibrate));
      }
    }

    frames.push(landmarks);
    timestamps.push(baseTime + t + (Math.random() - 0.5) * 2); // human jitter in timestamps
  }

  return { frames, timestamps };
}

/** Generate minimal valid frames (bare minimum for PES computation). */
function generateMinimalFrames(frameCount = 30): {
  frames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>;
  timestamps: number[];
} {
  const frames: Array<Array<{ x: number; y: number; z: number; visibility?: number }>> = [];
  const timestamps: number[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < frameCount; i++) {
    const t = i * 33.33;
    const landmarks: Array<{ x: number; y: number; z: number; visibility?: number }> = [];
    for (let j = 0; j < 33; j++) {
      const noise = Math.sin(i * 0.3 + j * 0.5) * 0.02 + (Math.random() - 0.5) * 0.005;
      landmarks.push(makeLandmark(0.5 + noise, 0.5 + noise * 0.7, noise * 0.3));
    }
    frames.push(landmarks);
    timestamps.push(baseTime + t);
  }

  return { frames, timestamps };
}

// ── Tests: verify() ──

describe("verify (SDK v2 primary entry point)", () => {
  it("returns a ContinuityResult with valid human motion", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps);
    expect(result).not.toBeNull();
    expect(result!.pes).toBeGreaterThan(0);
    expect(result!.pes).toBeLessThanOrEqual(1);
    expect(result!.confidence).toBeGreaterThan(0);
    expect(result!.receipt).toBeDefined();
    expect(result!.receipt.protocolVersion).toBe("1.0");
    expect(result!.receipt.evidence).toHaveLength(1);
    expect(result!.receipt.signature.algorithm).toBe("Ed25519");
    expect(result!.sessionId).toBeTruthy();
  });

  it("returns null for insufficient frames (< 8)", () => {
    const { frames, timestamps } = generateMinimalFrames(5);
    expect(verify(frames, timestamps)).toBeNull();
  });

  it("produces a receipt that passes CPS-0001 verification", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps)!;
    const cpsResult = verifyCpsReceipt(result.receipt);
    expect(cpsResult.status).toBe("VALID");
  });

  it("uses Ed25519 signature (not placeholder)", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps)!;
    expect(result.receipt.signature.algorithm).toBe("Ed25519");
    expect(result.receipt.signature.value).toMatch(/^[0-9a-f]{128}$/); // 64 bytes
  });
});

// ── Tests: getReceipt() ──

describe("getReceipt", () => {
  it("returns the receipt from a ContinuityResult", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps)!;
    const receipt = getReceipt(result);
    expect(receipt).toBe(result.receipt);
  });
});

// ── Tests: verifyReceiptFn() ──

describe("verifyReceiptFn", () => {
  it("verifies a valid receipt successfully", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps)!;
    const vr = verifyReceiptFn(result.receipt);
    expect(vr.status).toBe("VALID");
  });

  it("rejects an invalid receipt", () => {
    const { frames, timestamps } = generateHumanMotion(120);
    const result = verify(frames, timestamps)!;
    // Tamper with the receipt
    const tampered = {
      ...result.receipt,
      protocolVersion: "0.5",
    } as ContinuityReceipt;
    const vr = verifyReceiptFn(tampered);
    expect(vr.status).toBe("INVALID");
  });
});

// ── Tests: getEntropyScore() ──

describe("getEntropyScore", () => {
  it("returns a PES value for valid frames", () => {
    const { frames, timestamps } = generateHumanMotion(60);
    const pes = getEntropyScore(frames, timestamps);
    expect(pes).not.toBeNull();
    expect(pes!).toBeGreaterThanOrEqual(0);
    expect(pes!).toBeLessThanOrEqual(1);
  });

  it("returns null for insufficient frames (< 8)", () => {
    const { frames, timestamps } = generateMinimalFrames(5);
    expect(getEntropyScore(frames, timestamps)).toBeNull();
  });
});

// ── Tests: buildReceiptFromPES() ──

describe("buildReceiptFromPES", () => {
  it("builds a signed receipt from pre-computed PES data", () => {
    const receipt = buildReceiptFromPES({
      pes: 0.75,
      components: {
        frequencyEntropy: 0.70,
        microTimingVariance: 0.30,
        noiseResidual: 0.50,
        biologicalPerturbation: 0.40,
      },
      windowSeconds: 1,
      deviceSalt: "test-salt",
    });

    expect(receipt.protocolVersion).toBe("1.0");
    expect(receipt.evidence).toHaveLength(1);
    expect(receipt.evidence[0].confidence).toBeGreaterThan(0);
    expect(receipt.signature.algorithm).toBe("Ed25519");
    expect(receipt.subject.id).toBeTruthy();
    expect(receipt.issuer.id).toBeTruthy();
  });

  it("passes CPS-0001 verification", () => {
    const receipt = buildReceiptFromPES({
      pes: 0.82,
      components: {
        frequencyEntropy: 0.75,
        microTimingVariance: 0.35,
        noiseResidual: 0.55,
        biologicalPerturbation: 0.45,
      },
      deviceSalt: "test-salt-2",
    });

    const vr = verifyCpsReceipt(receipt);
    expect(vr.status).toBe("VALID");
  });

  it("pairs with verifyReceiptFn seamlessly", () => {
    const receipt = buildReceiptFromPES({
      pes: 0.60,
      components: {
        frequencyEntropy: 0.55,
        microTimingVariance: 0.25,
        noiseResidual: 0.40,
        biologicalPerturbation: 0.35,
      },
      deviceSalt: "test-salt-3",
    });

    const vr = verifyReceiptFn(receipt);
    expect(vr.status).toBe("VALID");
  });
});

// ── Integration: full pipeline ──

describe("SDK v2 full pipeline", () => {
  it("verify → getReceipt → verifyReceipt is consistent", () => {
    const { frames, timestamps } = generateHumanMotion(120);

    // Step 1: Verify presence
    const result = verify(frames, timestamps)!;

    // Step 2: Get receipt
    const receipt = getReceipt(result);
    expect(receipt.receiptId).toBe(result.receipt.receiptId);

    // Step 3: Verify receipt
    const vr = verifyReceiptFn(receipt);
    expect(vr.status).toBe("VALID");
  });
});

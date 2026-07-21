// ═══════════════════════════════════════════════════════════════════
// Dummy Engine — A CPS-0001 Receipt Producer
//
// This is a SECOND receipt producer. It does not use:
//   - IMU sensors
//   - Cameras
//   - MediaPipe
//   - PES (Presence Entropy Score)
//   - Any MyShape algorithm or library
//
// It produces valid ContinuityReceipts that PASS the conformance
// suite. It exists to prove one thing:
//
//   CPS-0001 is ENGINE-INDEPENDENT.
//
// If this file can produce a valid receipt, any team with any
// sensor can do the same. The protocol is the object, not the
// engine that produced it.
//
// v1.0-RC · Apache 2.0 · The Continuity Lab
// ═══════════════════════════════════════════════════════════════════

import {
  createReceiptId,
  buildReceipt,
  computePayloadDigest,
  verifyReceipt,
  type ContinuityReceipt,
  type EvidenceBlock,
  type ContinuityInterval,
} from "../reference-verifier/verifier";

// ── Dummy Engine ──────────────────────────────────────────────────
//
// A trivial evidence engine. It takes a confidence score (0–1) and
// wraps it in a CPS-0001 EvidenceBlock. No sensors. No algorithms.
// No MyShape. Just data → receipt.
//
// In a real implementation, this is where your sensor logic lives.

export interface DummyEngineConfig {
  /** Confidence score [0, 1] */
  confidence: number;
  /** Engine identifier */
  engineId?: string;
  /** Engine version */
  engineVersion?: string;
}

export async function dummyEngine(config: DummyEngineConfig): Promise<EvidenceBlock> {
  const payload = {
    source: "dummy-engine",
    confidence: config.confidence,
    method: "direct-assignment",
    note: "This evidence was produced without IMU, camera, or any MyShape algorithm. Any team can do this.",
    timestamp: new Date().toISOString(),
  };

  return {
    engineId: config.engineId ?? "com.example.dummy",
    engineVersion: config.engineVersion ?? "1.0.0",
    confidence: config.confidence,
    payload,
    payloadDigest: await computePayloadDigest(payload),
  };
}

// ── Receipt Producer ──────────────────────────────────────────────

export interface ProducerConfig {
  /** Confidence score [0, 1] */
  confidence: number;
  /** Duration of the observation in milliseconds */
  durationMs?: number;
  /** Subject identifier (opaque pseudonym) */
  subjectId?: string;
  /** Previous receipt hash (for chaining) */
  previousReceiptHash?: string | null;
}

/**
 * Produce a complete ContinuityReceipt using the dummy engine.
 *
 * This function demonstrates the complete producer workflow:
 *   1. Collect evidence from an engine
 *   2. Build a receipt with proper interval, subject, and assertions
 *   3. The receipt passes V₁–V₆ verification
 *
 * No MyShape dependency. No sensor hardware. Pure protocol.
 */
export async function produceReceipt(config: ProducerConfig): Promise<ContinuityReceipt> {
  const durationMs = config.durationMs ?? 8000;
  const now = new Date();
  const start = new Date(now.getTime() - durationMs);

  const interval: ContinuityInterval = {
    start: start.toISOString(),
    end: now.toISOString(),
    coverageMs: durationMs,
  };

  const evidence = await dummyEngine({ confidence: config.confidence });

  const unsigned = buildReceipt({
    evidence: [evidence],
    interval,
    subject: {
      id: config.subjectId ?? `dummy:${createReceiptId()}`,
      type: "embodied",
    },
    issuer: {
      id: "dummy-issuer-001",
      publicKey: "MCowBQYDK2VwAyEA000000000000000000000000000000000000000000000000",
    },
    previousReceiptHash: config.previousReceiptHash ?? null,
    verdict: config.confidence >= 0.5 ? "PASS" : "FAIL",
  });

  // Self-issue: sign with a placeholder (real implementations use Ed25519)
  return {
    ...unsigned,
    signature: {
      algorithm: "none",
      value: "self-signed-dummy-engine",
      signedAt: now.toISOString(),
    },
  };
}

// ── Self-Test: Prove This Works ───────────────────────────────────
//
// Run: npx vitest run continuity-protocol/second-producer/
//
// Expected: ALL PASS — the dummy engine produces receipts that
// pass the same V₁–V₆ checks as MyShape's EE-001 receipts.

export async function selfTest(): Promise<boolean> {
  const receipt = await produceReceipt({ confidence: 0.85 });
  const result = await verifyReceipt(receipt);
  return result.status === "VALID";
}

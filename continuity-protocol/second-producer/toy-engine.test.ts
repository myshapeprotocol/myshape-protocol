/**
 * EE-999 Toy Engine — Cross-Implementation Verification Test
 *
 * Proves: a meaningless Engine produces valid CPS-0001 Receipts
 * that pass verification by BOTH reference implementations.
 */

import { describe, it, expect } from "vitest";
import { run } from "./toy-engine";
import {
  buildReceipt as nobleBuild,
  signReceipt as nobleSign,
  verifyReceipt as nobleVerify,
} from "./noble-verifier";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

function makeReceipt(block: ReturnType<typeof run>) {
  const kp = generateKeyPair();
  const issuer = createIssuerIdentity(kp);
  // Deterministic interval: derives start + end from a SINGLE Date.now()
  // reading so coverageMs === end - start even after clock tick.
  // (Batch-2C rejects future intervals: end must be ≤ now at verify-time,
  //  and two independent Date.now() calls can straddle a tick boundary on
  //  Windows ~15ms timer granularity.)
  const endT = Date.now();
  const unsigned = nobleBuild({
    evidence: [block],
    interval: {
      start: new Date(endT - 1000).toISOString(),
      end: new Date(endT).toISOString(),
      coverageMs: 1000,
    },
    subject: { id: "toy-subject", type: "device" },
    issuer,
  });
  return nobleSign(unsigned, kp.secretKey);
}

describe("EE-999 Toy Engine", () => {
  it("produces a valid EvidenceBlock", () => {
    const block = run("hello world 0xdeadbeef");
    expect(block.engineId).toBe("EE-999");
    expect(block.confidence).toBeGreaterThan(0);
    expect(block.confidence).toBeLessThanOrEqual(1);
    expect(block.payload.challenge).toBe("hello world 0xdeadbeef");
    expect(block.payloadDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("different challenges produce different confidences", () => {
    const a = run("hello");
    const b = run("0xdeadbeefcafebabe0123456789abcdef"); // mostly hex → higher score
    expect(b.confidence).toBeGreaterThan(a.confidence);
  });

  it("deterministic: same input → same confidence", () => {
    const a = run("test");
    const b = run("test");
    expect(a.engineId).toBe(b.engineId);
    expect(a.confidence).toBe(b.confidence);
    // Note: payloadDigest differs because timestamp is included
    expect(a.payload.challenge).toBe(b.payload.challenge);
  });

  it("produces a Receipt that passes Noble Verifier", () => {
    const block = run("cps-0001 toy engine test");
    const receipt = makeReceipt(block);
    const result = nobleVerify(receipt);
    expect(result.status).toBe("VALID");
  });

  it("produces a Receipt that passes MyShape CPS-0001 Verifier", async () => {
    const { verifyReceipt: myshapeVerify } = await import("@/lib/evidence/cps0001");
    const block = run("cross-impl verification proof");
    const receipt = makeReceipt(block);
    const result = myshapeVerify(receipt);
    expect(result.status).toBe("VALID");
  });

  it("empty challenge works", () => {
    const block = run("");
    expect(block.confidence).toBe(0); // no hex chars → score 0
    // But it's still a VALID EvidenceBlock! Protocol doesn't care about score.
    const receipt = makeReceipt(block);
    const result = nobleVerify(receipt);
    expect(result.status).toBe("VALID");
  });
});

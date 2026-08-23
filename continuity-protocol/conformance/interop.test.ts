// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Cross-Implementation Interoperability
//
// Proves that Main, Reference, and Second Producer all agree on the
// canonical receipt hash definition:
//
//     receiptHash = SHA-256( RFC 8785 JCS( ContinuityReceipt ) )
//
// and on V₇ predecessor-chain semantics. These tests would FAIL if any
// implementation still used SHA-256(JSON.stringify(receipt)).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { generateKeyPair } from "@/lib/crypto";

import {
  computeReceiptHash as mainHash,
  verifyPredecessor as mainVerify,
  verifyReceipt as mainVerifyReceipt,
  buildReceipt as mainBuild,
  signReceipt as mainSign,
  computePayloadDigest as mainDigest,
  type ContinuityReceipt as MainReceipt,
} from "@/lib/evidence/cps0001";

import {
  computeReceiptHash as refHash,
  verifyPredecessor as refVerify,
  buildReceipt as refBuild,
  computePayloadDigest as refDigest,
  type ContinuityReceipt as RefReceipt,
} from "../reference-verifier/verifier";

import {
  computeReceiptHash as spHash,
  verifyPredecessor as spVerify,
  buildReceipt as spBuild,
  computePayloadDigest as spDigest,
  type ContinuityReceipt as SPReceipt,
} from "../second-producer/noble-verifier";

type Unsigned<T> = Omit<T, "signature">;

const kp = generateKeyPair();
const SUBJECT = { id: "sha256:subject-A", type: "embodied" } as const;
const ISSUER = { id: "issuer-1", publicKey: kp.publicKey } as const;

function build(
  buildFn: (p: {
    evidence: { engineId: string; engineVersion: string; confidence: number; payload: Record<string, unknown>; payloadDigest: string }[];
    interval: { start: string; end: string; coverageMs: number };
    subject: { id: string; type?: string };
    issuer: { id: string; publicKey: string };
    previousReceiptHash?: string | null;
  }) => unknown,
  digestFn: (p: Record<string, unknown>) => string,
  startOffsetMs: number,
  prevHash: string | null = null,
): Record<string, unknown> {
  const base = Date.now() + startOffsetMs;
  const start = new Date(base).toISOString();
  const end = new Date(base + 8000).toISOString();
  const payload = { score: 0.85 };
  const evidence = [
    {
      engineId: "com.example.simulation",
      engineVersion: "1.0.0",
      confidence: 0.85,
      payload,
      payloadDigest: digestFn(payload),
    },
  ];
  return buildFn({
    evidence,
    interval: { start, end, coverageMs: 8000 },
    subject: SUBJECT as { id: string; type?: string },
    issuer: ISSUER as { id: string; publicKey: string },
    previousReceiptHash: prevHash,
  }) as Record<string, unknown>;
}

function sign(unsigned: Record<string, unknown>, signFn: (u: Unsigned<MainReceipt>, sk: string) => MainReceipt): MainReceipt {
  return signFn(unsigned as unknown as Unsigned<MainReceipt>, kp.secretKey);
}

/** Return a semantically-identical object with keys in reverse order at every level. */
function reorderDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(reorderDeep);
  if (v !== null && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort().reverse()) {
      out[k] = reorderDeep((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

describe("CPS-0001 V₇ — receipt hash is identical across implementations", () => {
  it("Test 1: Main hash === Reference hash (JCS)", async () => {
    const r = build(mainBuild, mainDigest, 0) as unknown as MainReceipt;
    expect(await refHash(r as unknown as RefReceipt)).toBe(mainHash(r));
  });

  it("Test 2: Main hash === Second Producer hash (JCS)", () => {
    const r = build(mainBuild, mainDigest, 0) as unknown as MainReceipt;
    expect(spHash(r as unknown as SPReceipt)).toBe(mainHash(r));
  });

  it("Test 3: nested key-order invariance — same semantic receipt, different insertion order", async () => {
    const a = build(mainBuild, mainDigest, 0) as unknown as MainReceipt;
    const b = reorderDeep(a) as unknown as MainReceipt;
    expect(mainHash(a)).toBe(mainHash(b));
    // And the reversed-order form must agree with the other implementations,
    // which is what catches a JSON.stringify-based implementation.
    expect(await refHash(b as unknown as RefReceipt)).toBe(mainHash(b));
    expect(spHash(b as unknown as SPReceipt)).toBe(mainHash(b));
  });

  it("JCS discriminator: an unsorted-key receipt hashes identically only under JCS", async () => {
    const sorted = build(mainBuild, mainDigest, 0) as unknown as MainReceipt;
    const unsorted = reorderDeep(sorted) as unknown as MainReceipt;
    // All three must agree on the unsorted form — this fails under JSON.stringify.
    const h = mainHash(unsorted);
    expect(await refHash(unsorted as unknown as RefReceipt)).toBe(h);
    expect(spHash(unsorted as unknown as SPReceipt)).toBe(h);
  });
});

describe("CPS-0001 V₇ — cross-implementation predecessor verification", () => {
  it("Test 4: Main verifies a Reference-produced predecessor", async () => {
    const a = build(refBuild, refDigest, -20000) as unknown as RefReceipt;
    const h = await refHash(a);
    const b = sign(build(mainBuild, mainDigest, -11000, h), mainSign) as unknown as MainReceipt;
    expect(mainVerify(b, a as unknown as MainReceipt)).toBeNull();
  });

  it("Test 5: Main verifies a Second Producer-produced predecessor", () => {
    const a = build(spBuild, spDigest, -20000) as unknown as SPReceipt;
    const h = spHash(a);
    const b = sign(build(mainBuild, mainDigest, -11000, h), mainSign) as unknown as MainReceipt;
    expect(mainVerify(b, a as unknown as MainReceipt)).toBeNull();
  });

  it("Test 6: Reference verifies a Main-produced predecessor", async () => {
    const a = build(mainBuild, mainDigest, -20000) as unknown as MainReceipt;
    const h = mainHash(a);
    const b = build(refBuild, refDigest, -11000, h) as unknown as RefReceipt;
    expect(await refVerify(b, a as unknown as RefReceipt)).toBeNull();
  });

  it("Test 7: tampered previousReceiptHash → CHAIN_BROKEN", () => {
    const a = build(mainBuild, mainDigest, -20000) as unknown as MainReceipt;
    const b = sign(build(mainBuild, mainDigest, -11000, "deadbeef"), mainSign) as unknown as MainReceipt;
    expect(mainVerify(b, a)).toBe("CHAIN_BROKEN");
  });

  it("Test 8: semantic mutation of the CURRENT receipt is detected (subject / issuer / temporal)", () => {
    const a = build(mainBuild, mainDigest, -20000) as unknown as MainReceipt;
    const h = mainHash(a);
    const b = build(mainBuild, mainDigest, -11000, h) as unknown as MainReceipt;

    // Predecessor (a) is genuine and its hash matches b.previousReceiptHash,
    // so the hash check passes and the binding checks run.
    const bSubjectMut = { ...b, subject: { id: "sha256:other", type: "embodied" } } as MainReceipt;
    expect(mainVerify(bSubjectMut, a)).toBe("SUBJECT_MISMATCH");

    const bIssuerMut = { ...b, issuer: { id: "issuer-2", publicKey: kp.publicKey } } as MainReceipt;
    expect(mainVerify(bIssuerMut, a)).toBe("ISSUER_MISMATCH");

    // Overlapping interval: b starts before a ends.
    const bOverlap = build(mainBuild, mainDigest, -13000, h) as unknown as MainReceipt;
    expect(mainVerify(bOverlap, a)).toBe("TEMPORAL_VIOLATION");
  });
});

describe("CPS-0001 V₇ — Conformance exercises Main V₇", () => {
  it("genesis (previousReceiptHash === null) → V₇ skipped, receipt valid", () => {
    const a = sign(build(mainBuild, mainDigest, -20000), mainSign);
    expect(a.previousReceiptHash).toBeNull();
    expect(mainVerifyReceipt(a).status).toBe("VALID");
  });

  it("chained receipt without a trusted store → fails closed (CHAIN_BROKEN)", () => {
    const a = build(mainBuild, mainDigest, -20000) as unknown as MainReceipt;
    const b = sign(build(mainBuild, mainDigest, -11000, mainHash(a)), mainSign);
    const res = mainVerifyReceipt(b);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("CHAIN_BROKEN");
  });
});

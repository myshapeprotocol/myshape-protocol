// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Store-Backed Chain Verification (v1.0)
//
// Covers: genesis exemption, valid chain, hash mismatch, missing
// predecessor, tampered predecessor, subject/issuer/temporal binding,
// multi-link chain, signature interaction, hash stability, and
// cross-implementation (Second Producer → Main) verification.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildReceipt,
  signReceipt,
  verifyReceipt,
  verifyPredecessor,
  computeReceiptHash,
  canonicalSerialize,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { MemoryChainStore, type ChainStore } from "@/lib/evidence/chain-store";
import { generateKeyPair, getPublicKey } from "@/lib/crypto";
import {
  buildReceipt as spBuild,
  signReceipt as spSign,
} from "../../../continuity-protocol/second-producer/noble-verifier";

const sk = generateKeyPair();
const pk = getPublicKey(sk.secretKey);

interface MakeOpts {
  subjectId?: string;
  issuerId?: string;
  startMs?: number;
  endMs?: number;
  previousReceiptHash?: string | null;
  secretKey?: ReturnType<typeof generateKeyPair>;
}

function makeReceipt(opts: MakeOpts = {}): ContinuityReceipt {
  const start = opts.startMs ?? Date.now() - 8000;
  const end = opts.endMs ?? Date.now();
  const key = opts.secretKey ?? sk;
  const unsigned = buildReceipt({
    evidence: [],
    interval: {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      coverageMs: end - start,
    },
    subject: { id: opts.subjectId ?? "sha256:subject-A", type: "embodied" },
    issuer: { id: opts.issuerId ?? "issuer-1", publicKey: getPublicKey(key.secretKey) },
    previousReceiptHash: opts.previousReceiptHash ?? null,
  });
  return signReceipt(unsigned, key.secretKey);
}

/** Sequential, non-overlapping 8s intervals. `rank` 0 = oldest link, increasing toward now. */
function linkInterval(rank: number, total: number, base = Date.now()): { startMs: number; endMs: number } {
  const end = base - (total - 1 - rank) * 8000;
  return { startMs: end - 8000, endMs: end };
}

describe("V₇ — Genesis exemption", () => {
  it("genesis (previousReceiptHash === null) passes V1–V6 and skips V7", () => {
    const A = makeReceipt();
    const res = verifyReceipt(A);
    expect(res.status).toBe("VALID");
  });

  it("genesis still VALID without any ChainStore supplied", () => {
    const A = makeReceipt();
    expect(verifyReceipt(A).status).toBe("VALID");
  });
});

describe("V₇ — Valid predecessor (A → B)", () => {
  it("B references A via computeReceiptHash(A) and store resolves A → PASS", () => {
    const A = makeReceipt(linkInterval(0, 2));
    const B = makeReceipt({ ...linkInterval(1, 2), previousReceiptHash: computeReceiptHash(A) });
    const store = new MemoryChainStore();
    store.store(A);
    expect(verifyReceipt(B, store).status).toBe("VALID");
  });
});

describe("V₇ — Wrong hash", () => {
  it("store returns a predecessor whose hash != pointer → CHAIN_BROKEN", () => {
    const A = makeReceipt(linkInterval(0, 2));
    const B = makeReceipt({ ...linkInterval(1, 2), previousReceiptHash: "deadbeef" });
    const store: ChainStore = { resolve: (h) => (h === "deadbeef" ? A : null) };
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("CHAIN_BROKEN");
  });
});

describe("V₇ — Missing predecessor", () => {
  it("store.resolve(hash) === null → PREDECESSOR_MISSING", () => {
    const A = makeReceipt(linkInterval(0, 2));
    const B = makeReceipt({ ...linkInterval(1, 2), previousReceiptHash: computeReceiptHash(A) });
    const store = new MemoryChainStore(); // empty
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("PREDECESSOR_MISSING");
  });
});

describe("V₇ — Tampered predecessor", () => {
  it("stored predecessor hash != claimed → CHAIN_BROKEN", () => {
    const A = makeReceipt({ subjectId: "sha256:subject-A" });
    const tampered: ContinuityReceipt = {
      ...A,
      subject: { id: "sha256:subject-A-tampered", type: "embodied" },
    };
    const B = makeReceipt({ ...linkInterval(1, 2), previousReceiptHash: computeReceiptHash(A) });
    const store: ChainStore = {
      resolve: (h) => (h === computeReceiptHash(A) ? tampered : null),
    };
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("CHAIN_BROKEN");
  });
});

describe("V₇ — Subject mismatch", () => {
  it("A.subject !== B.subject → SUBJECT_MISMATCH", () => {
    const A = makeReceipt({ ...linkInterval(0, 2), subjectId: "sha256:subject-A" });
    const B = makeReceipt({
      ...linkInterval(1, 2),
      subjectId: "sha256:subject-B",
      previousReceiptHash: computeReceiptHash(A),
    });
    const store = new MemoryChainStore();
    store.store(A);
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("SUBJECT_MISMATCH");
  });
});

describe("V₇ — Issuer mismatch", () => {
  it("A.issuer !== B.issuer → ISSUER_MISMATCH", () => {
    const skA = generateKeyPair();
    const skB = generateKeyPair();
    const A = makeReceipt({ ...linkInterval(0, 2), issuerId: "issuer-A", secretKey: skA });
    const B = makeReceipt({
      ...linkInterval(1, 2),
      issuerId: "issuer-B",
      secretKey: skB,
      previousReceiptHash: computeReceiptHash(A),
    });
    const store = new MemoryChainStore();
    store.store(A);
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("ISSUER_MISMATCH");
  });
});

describe("V₇ — Temporal violation", () => {
  it("A.interval.end > B.interval.start → TEMPORAL_VIOLATION", () => {
    const base = Date.now();
    const A = makeReceipt({ startMs: base - 16000, endMs: base - 7000 });
    const B = makeReceipt({
      startMs: base - 8000,
      endMs: base,
      previousReceiptHash: computeReceiptHash(A),
    });
    const store = new MemoryChainStore();
    store.store(A);
    const res = verifyReceipt(B, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("TEMPORAL_VIOLATION");
  });
});

describe("V₇ — Valid multi-link chain (A → B → C)", () => {
  it("B→A and C→B both PASS", () => {
    const base = Date.now();
    const A = makeReceipt({ startMs: base - 24000, endMs: base - 16000 });
    const B = makeReceipt({
      startMs: base - 16000,
      endMs: base - 8000,
      previousReceiptHash: computeReceiptHash(A),
    });
    const C = makeReceipt({
      startMs: base - 8000,
      endMs: base,
      previousReceiptHash: computeReceiptHash(B),
    });
    const store = new MemoryChainStore();
    store.store(A);
    store.store(B);
    expect(verifyReceipt(B, store).status).toBe("VALID");
    expect(verifyReceipt(C, store).status).toBe("VALID");
  });
});

describe("V₇ — Signature interaction", () => {
  it("invalid signature fails at V2, never reaching V7 (no false rescue)", () => {
    const A = makeReceipt();
    const B = makeReceipt({ previousReceiptHash: computeReceiptHash(A) });
    const broken: ContinuityReceipt = {
      ...B,
      signature: { ...B.signature, value: "00".repeat(64) },
    };
    const store = new MemoryChainStore();
    store.store(A);
    const res = verifyReceipt(broken, store);
    expect(res.status).toBe("INVALID");
    if (res.status === "INVALID") expect(res.reason).toBe("INVALID_SIGNATURE");
  });
});

describe("V₇ — Hash stability & canonicalization", () => {
  it("computeReceiptHash is deterministic across calls", () => {
    const A = makeReceipt();
    expect(computeReceiptHash(A)).toBe(computeReceiptHash(A));
  });

  it("JCS ignores object key order", () => {
    const a = { b: 1, a: [{ d: 2, c: 3 }] };
    const b = { a: [{ c: 3, d: 2 }], b: 1 };
    expect(canonicalSerialize(a)).toBe(canonicalSerialize(b));
  });

  it("canonical serialization emits no insignificant whitespace", () => {
    expect(canonicalSerialize({ a: 1, b: [1, 2, 3] })).not.toMatch(/\s/);
  });

  it("canonical serialization preserves null and array order", () => {
    const s = canonicalSerialize({ x: null, y: [3, 1, 2] });
    expect(s).toBe('{"x":null,"y":[3,1,2]}');
  });
});

describe("V₇ — Cross-implementation (Second Producer → Main)", () => {
  it("a Second Producer receipt chain verifies under Main's verifyReceipt", () => {
    const base = Date.now();
    const subject = { id: "sha256:subject-A", type: "embodied" as const };
    const issuer = { id: "issuer-1", publicKey: pk };
    const spA = spSign(
      spBuild({
        evidence: [],
        interval: {
          start: new Date(base - 16000).toISOString(),
          end: new Date(base - 8000).toISOString(),
          coverageMs: 8000,
        },
        subject,
        issuer,
      }),
      sk.secretKey,
    );
    const spB = spSign(
      spBuild({
        evidence: [],
        interval: {
          start: new Date(base - 8000).toISOString(),
          end: new Date(base).toISOString(),
          coverageMs: 8000,
        },
        subject,
        issuer,
        previousReceiptHash: computeReceiptHash(spA as unknown as ContinuityReceipt),
      }),
      sk.secretKey,
    );
    const store = new MemoryChainStore();
    store.store(spA as unknown as ContinuityReceipt);
    const res = verifyReceipt(spB as unknown as ContinuityReceipt, store);
    expect(res.status).toBe("VALID");
  });
});

describe("V₇ — Low-level verifyPredecessor helper", () => {
  it("returns null for a correctly bound predecessor", () => {
    const A = makeReceipt(linkInterval(0, 2));
    const B = makeReceipt({ ...linkInterval(1, 2), previousReceiptHash: computeReceiptHash(A) });
    expect(verifyPredecessor(B, A)).toBeNull();
  });
});

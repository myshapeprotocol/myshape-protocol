// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — async→sync bridge + trusted predecessor resolution tests.
// Deterministic: uses an injected fake PredecessorLookup (no Supabase/network).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildReceipt,
  signReceipt,
  computeReceiptHash,
  verifyPredecessor,
  type ContinuityReceipt,
  type VerificationResult,
} from "@/lib/evidence/cps0001";
import {
  verifyReceiptWithStore,
  resolvePredecessor,
  type PredecessorLookup,
} from "@/lib/evidence/chain-store-supabase";
import { generateKeyPair, getPublicKey } from "@/lib/crypto";

const sk = generateKeyPair();
const base = Date.now();

interface MakeOpts {
  subjectId?: string;
  issuerId?: string;
  startMs?: number;
  endMs?: number;
  previousReceiptHash?: string | null;
}

function makeReceipt(opts: MakeOpts = {}): ContinuityReceipt {
  const start = opts.startMs ?? base - 16000;
  const end = opts.endMs ?? base - 8000;
  const unsigned = buildReceipt({
    evidence: [],
    interval: { start: new Date(start).toISOString(), end: new Date(end).toISOString(), coverageMs: end - start },
    subject: { id: opts.subjectId ?? "sha256:subject-A", type: "embodied" },
    issuer: { id: opts.issuerId ?? "issuer-1", publicKey: getPublicKey(sk.secretKey) },
    previousReceiptHash: opts.previousReceiptHash ?? null,
  });
  return signReceipt(unsigned, sk.secretKey);
}

function fakeLookup(map: Map<string, ContinuityReceipt>): PredecessorLookup {
  return { getReceiptByHash: async (h) => map.get(h) ?? null };
}
const throwingLookup: PredecessorLookup = {
  getReceiptByHash: async () => {
    throw new Error("db down");
  },
};

/** Narrow a VerificationResult to its INVALID variant for type-safe access. */
function invalid(r: VerificationResult) {
  if (r.status !== "INVALID") throw new Error(`expected INVALID, got ${r.status}`);
  return r;
}

// Predecessor P and a valid chained child B referencing it.
const P = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 16000, endMs: base - 8000 });
const hashP = computeReceiptHash(P);
const B = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 8000, endMs: base });
B.previousReceiptHash = hashP; // signature unaffected (pointer is not signed)

describe("V₇ bridge — resolvePredecessor", () => {
  it("returns stored receipt when hash matches (L. integrity)", async () => {
    const r = await resolvePredecessor(fakeLookup(new Map([[hashP, P]])), hashP);
    expect(r).not.toBeNull();
    expect(computeReceiptHash(r!)).toBe(hashP);
  });
  it("returns null when absent", async () => {
    expect(await resolvePredecessor(fakeLookup(new Map()), "nope")).toBeNull();
  });
  it("store-poisoning: tampered stored row (hash mismatch) treated as absent", async () => {
    const tampered = makeReceipt({ subjectId: "OTHER" });
    expect(await resolvePredecessor(fakeLookup(new Map([[hashP, tampered]])), hashP)).toBeNull();
  });
});

describe("V₇ bridge — verifyReceiptWithStore", () => {
  it("A. genesis → VALID, V₇ skipped", async () => {
    const A = makeReceipt();
    expect((await verifyReceiptWithStore(A, fakeLookup(new Map()))).status).toBe("VALID");
  });
  it("B. valid genesis → chained → VALID", async () => {
    expect((await verifyReceiptWithStore(B, fakeLookup(new Map([[hashP, P]])))).status).toBe("VALID");
  });
  it("C. missing predecessor → PREDECESSOR_MISSING (fail closed)", async () => {
    const r = invalid(await verifyReceiptWithStore(B, fakeLookup(new Map())));
    expect(r.reason).toBe("PREDECESSOR_MISSING");
  });
  it("D/E. wrong/tampered stored predecessor (hash mismatch) → PREDECESSOR_MISSING (poisoning-safe, fail closed)", async () => {
    const other = makeReceipt({ subjectId: "X" });
    const r = invalid(await verifyReceiptWithStore(B, fakeLookup(new Map([[hashP, other]]))));
    expect(r.reason).toBe("PREDECESSOR_MISSING");
  });
  it("F. subject mismatch → SUBJECT_MISMATCH", async () => {
    const Bf = makeReceipt({ subjectId: "S2", issuerId: "I", startMs: base - 8000, endMs: base });
    Bf.previousReceiptHash = hashP;
    const r = invalid(await verifyReceiptWithStore(Bf, fakeLookup(new Map([[hashP, P]]))));
    expect(r.reason).toBe("SUBJECT_MISMATCH");
  });
  it("G. issuer mismatch → ISSUER_MISMATCH", async () => {
    const Bf = makeReceipt({ subjectId: "S", issuerId: "I2", startMs: base - 8000, endMs: base });
    Bf.previousReceiptHash = hashP;
    const r = invalid(await verifyReceiptWithStore(Bf, fakeLookup(new Map([[hashP, P]]))));
    expect(r.reason).toBe("ISSUER_MISMATCH");
  });
  it("H. temporal overlap → TEMPORAL_VIOLATION", async () => {
    const Bf = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 9000, endMs: base - 1000 });
    Bf.previousReceiptHash = hashP;
    const r = invalid(await verifyReceiptWithStore(Bf, fakeLookup(new Map([[hashP, P]]))));
    expect(r.reason).toBe("TEMPORAL_VIOLATION");
  });
  it("I. invalid current signature → INVALID_SIGNATURE", async () => {
    const A = makeReceipt();
    A.signature.value = "deadbeef";
    const r = invalid(await verifyReceiptWithStore(A, fakeLookup(new Map())));
    expect(r.reason).toBe("INVALID_SIGNATURE");
  });
  it("J. store unavailable → CHAIN_BROKEN, MUST NOT be VALID", async () => {
    const r = invalid(await verifyReceiptWithStore(B, throwingLookup));
    expect(r.reason).toBe("CHAIN_BROKEN");
  });
  it("primitive verifyPredecessor: wrong predecessor hash → CHAIN_BROKEN", () => {
    const A = makeReceipt({ subjectId: "S", issuerId: "I" });
    const P2 = makeReceipt({ subjectId: "S", issuerId: "I" });
    const C = makeReceipt({ subjectId: "S", issuerId: "I" });
    C.previousReceiptHash = computeReceiptHash(A); // references A's hash but binds to P2
    expect(verifyPredecessor(C, P2)).toBe("CHAIN_BROKEN");
  });
});

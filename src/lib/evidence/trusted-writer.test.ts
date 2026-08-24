// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Trmsted writer (verify -> insert) tests.
// Deterministic: uses injected fake PredecessorLookup / ReceiptWriter.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildReceipt,
  signReceipt,
  computeReceiptHash,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { ingestReceipt, type IngestResult } from "@/lib/evidence/trusted-writer";
import { generateKeyPair, getPublicKey } from "@/lib/crypto";
import type {
  PredecessorLookup,
  ContinuityReceiptRow,
  ReceiptWriter,
} from "@/lib/evidence/chain-store-supabase";

const sk = generateKeyPair();
const base = Date.now();

function makeReceipt(opts: {
  subjectId?: string;
  issuerId?: string;
  startMs?: number;
  endMs?: number;
  previousReceiptHash?: string | null;
} = {}): ContinuityReceipt {
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

function memLookup(initial: Map<string, ContinuityReceipt> = new Map()): PredecessorLookup {
  return { getReceiptByHash: async (h) => initial.get(h) ?? null };
}
function memWriter(inserts: ContinuityReceiptRow[]): ReceiptWriter {
  return { insert: async (row) => { inserts.push(row); } };
}

function rejected(r: IngestResult) {
  if (r.status !== "REJECTED") throw new Error(`expected REJECTED, got ${r.status}`);
  return r;
}
function ingested(r: IngestResult) {
  if (r.status !== "INGESTED") throw new Error(`expected INGESTED, got ${r.status}`);
  return r;
}

const P = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 16000, endMs: base - 8000 });
const hashP = computeReceiptHash(P);
const B = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 8000, endMs: base });
B.previousReceiptHash = hashP;

describe("trusted writer — verify -> insert", () => {
  it("genesis valid → INGESTED and inserted exactly once", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const r = ingested(await ingestReceipt(makeReceipt(), { lookup: memLookup(), writer: memWriter(inserts) }));
    expect(r.alreadyExisted).toBe(false);
    expect(inserts).toHaveLength(1);
  });

  it("chained valid → INGESTED", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const r = await ingestReceipt(B, { lookup: memLookup(new Map([[hashP, P]])), writer: memWriterX(inserts) });
    expect(r.status).toBe("INGESTED");
    expect(inserts).toHaveLength(1);
  });

  it("invalid signature → REJECTED, never inserted", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const A = makeReceipt();
    A.signature.value = "bad";
    const r = rejected(await ingestReceipt(A, { lookup: memLookup(), writer: memWriter(inserts) }));
    expect(r.reason).toBe("INVALID_SIGNATURE");
    expect(inserts).toHaveLength(0);
  });

  it("chained missing predecessor → REJECTED PREDECESSOR_MISSING", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const r = rejected(await ingestReceipt(B, { lookup: memLookup(), writer: memWriter(inserts) }));
    expect(r.reason).toBe("PREDECESSOR_MISSING");
    expect(inserts).toHaveLength(0);
  });

  it("subject-mismatch predecessor → REJECTED SUBJECT_MISMATCH", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const Bbad = makeReceipt({ subjectId: "S2", issuerId: "I", startMs: base - 8000, endMs: base });
    Bbad.previousReceiptHash = hashP;
    const r = rejected(await ingestReceipt(Bbad, { lookup: memLookup(new Map([[hashP, P]])), writer: memWriter(inserts) }));
    expect(r.reason).toBe("SUBJECT_MISMATCH");
    expect(inserts).toHaveLength(0);
  });

  it("K. store-poisoning attempt MUST NOT be indexed", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const Bbad = makeReceipt({ subjectId: "S2", issuerId: "I", startMs: base - 8000, endMs: base });
    Bbad.previousReceiptHash = hashP;
    const r = rejected(await ingestReceipt(Bbad, { lookup: memLookup(new Map([[hashP, P]])), writer: memWriter(inserts) }));
    expect(inserts).toHaveLength(0);
  });

  it("N. self-referencing receipt → REJECTED fail-closed (PREDECESSOR_MISSING)", async () => {
    // A receipt whose previousReceiptHash points at its own (pre-assignment) hash
    // cannot form a real cycle, but it MUST be rejected fail-closed rather than
    // indexed. The predecessor is absent → PREDECESSOR_MISSING.
    const inserts: ContinuityReceiptRow[] = [];
    const self = makeReceipt();
    self.previousReceiptHash = computeReceiptHash(self);
    const r = rejected(await ingestReceipt(self, { lookup: memLookup(), writer: memWriter(inserts) }));
    expect(r.reason).toBe("PREDECESSOR_MISSING");
    expect(inserts).toHaveLength(0);
  });

  it("store unavailable during verify → REJECTED CHAIN_BROKEN (fail closed)", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const throwing: PredecessorLookup = { getReceiptByHash: async () => { throw new Error("db down"); } };
    const r = rejected(await ingestReceipt(B, { lookup: throwing, writer: memWriter(inserts) }));
    expect(r.reason).toBe("CHAIN_BROKEN");
    expect(inserts).toHaveLength(0);
  });

  it("M. replay/duplicate → idempotent, alreadyExisted, no second insert", async () => {
    const store = new Map<string, ContinuityReceipt>();
    const inserts: ContinuityReceiptRow[] = [];
    const A = makeReceipt();
    const r1 = ingested(await ingestReceipt(A, { lookup: memLookup(store), writer: memWriter(inserts) }));
    expect(r1.alreadyExisted).toBe(false);
    expect(inserts).toHaveLength(1);
    store.set(computeReceiptHash(A), A);
    const r2 = ingested(await ingestReceipt(A, { lookup: memLookup(store), writer: memWriter(inserts) }));
    expect(r2.alreadyExisted).toBe(true);
    expect(inserts).toHaveLength(1); // no second insert
  });

  it("verify -> insert order: rejected receipts never reach the writer", async () => {
    const inserts: ContinuityReceiptRow[] = [];
    const A = makeReceipt();
    A.signature.value = "x";
    const r = rejected(await ingestReceipt(A, { lookup: memLookup(), writer: memWriter(inserts) }));
    expect(r.reason).toBe("INVALID_SIGNATURE");
    expect(inserts).toHaveLength(0);
  });
});

function memWriterX(inserts: ContinuityReceiptRow[]): ReceiptWriter {
  return memWriter(inserts);
}

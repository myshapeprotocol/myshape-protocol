// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Production API integration (deterministic).
//
// Mocks only the Supabase factory in chain-store-supabase; the real
// verifyReceiptWithStore / verifyReceipt primitives remain exercised.
// Confirms the API distinguishes genesis (v7: skipped) from chained
// (v7: enforced) and that the trusted writer rejects poisoned receipts.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildReceipt,
  signReceipt,
  computeReceiptHash,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { generateKeyPair, getPublicKey } from "@/lib/crypto";
import { nodeCreationLimiter, apiLookupLimiter } from "@/lib/rate-limiter";
import type { PredecessorLookup } from "@/lib/evidence/chain-store-supabase";

// Mutable holder for the fake lookup injected into the mocked factory.
const state: { lookup: PredecessorLookup } = {
  lookup: { getReceiptByHash: async () => null },
};

vi.mock("@/lib/evidence/chain-store-supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/evidence/chain-store-supabase")>();
  return {
    ...actual,
    createSupabasePredecessorLookup: async () => state.lookup,
    createSupabaseReceiptWriter: async () => ({ insert: async () => {} }),
  };
});

const { POST: verifyPOST } = await import("@/app/api/verify-receipt/route");
const { POST: ingestPOST } = await import("@/app/api/continuity/receipt/route");

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

function post(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  nodeCreationLimiter.reset();
  apiLookupLimiter.reset();
});

describe("API — verify-receipt distinguishes genesis vs chained", () => {
  it("genesis → VALID with v7: SKIPPED", async () => {
    const res = await verifyPOST(post(makeReceipt()));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.status).toBe("VALID");
    expect(j.v7).toBe("SKIPPED");
  });

  it("chained valid → VALID with v7: ENFORCED", async () => {
    const P = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 16000, endMs: base - 8000 });
    const hashP = computeReceiptHash(P);
    const B = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 8000, endMs: base });
    B.previousReceiptHash = hashP;
    state.lookup = { getReceiptByHash: async (h) => (h === hashP ? P : null) };
    const res = await verifyPOST(post(B));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.status).toBe("VALID");
    expect(j.v7).toBe("ENFORCED");
  });

  it("chained missing predecessor → INVALID (fail closed)", async () => {
    const B = makeReceipt({ subjectId: "S", issuerId: "I", startMs: base - 8000, endMs: base });
    B.previousReceiptHash = "missinghash";
    state.lookup = { getReceiptByHash: async () => null };
    const res = await verifyPOST(post(B));
    const j = await res.json();
    expect(j.status).toBe("INVALID");
    expect(j.reason).toBe("PREDECESSOR_MISSING");
  });
});

describe("API — trusted writer rejects poisoned receipts", () => {
  it("valid genesis → INGESTED", async () => {
    state.lookup = { getReceiptByHash: async () => null };
    const res = await ingestPOST(post(makeReceipt()));
    const j = await res.json();
    expect(res.status).toBe(200);
    expect(j.status).toBe("INGESTED");
  });

  it("invalid signature → REJECTED (not indexed)", async () => {
    const A = makeReceipt();
    A.signature.value = "bad";
    state.lookup = { getReceiptByHash: async () => null };
    const res = await ingestPOST(post(A));
    const j = await res.json();
    expect(res.status).toBe(400);
    expect(j.status).toBe("REJECTED");
  });
});

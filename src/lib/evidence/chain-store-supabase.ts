// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Production trusted predecessor resolution (Model 3).
//
// The core verifier (verifyReceipt) stays SYNCHRONOUS. Supabase is async, so
// this module provides the async -> sync bridge: an async lookup fetches the
// trusted predecessor, we re-verify its canonical hash (store-poisoning
// defense), then wrap it in a synchronous ChainStore handed to verifyReceipt.
//
// Contract preserved: verifyReceipt(receipt, store?) is never made async.
// ═══════════════════════════════════════════════════════════════════

import {
  verifyReceipt,
  computeReceiptHash,
  type ContinuityReceipt,
  type VerificationResult,
} from "./cps0001";
import type { ChainStore } from "./chain-store";

/** Minimal predecessor lookup boundary (dependency-injectable, testable). */
export interface PredecessorLookup {
  /** Return the canonical stored receipt for `hash`, or null if absent. */
  getReceiptByHash(hash: string): Promise<ContinuityReceipt | null>;
}

/** Stored receipt row shape (mirrors supabase/migrations/013_continuity_receipts.sql). */
export interface ContinuityReceiptRow {
  receipt_hash: string;
  receipt: ContinuityReceipt;
  subject_id: string;
  issuer_id: string;
  interval_start: string;
  interval_end: string;
  ingested_at: string;
  ingester: string;
}

/** Authoritative persistence writer (dependency-injectable, testable). */
export interface ReceiptWriter {
  insert(row: ContinuityReceiptRow): Promise<void>;
}

/**
 * Synchronous ChainStore adapter wrapping a single pre-resolved predecessor.
 * Feeds the async-fetched, hash-verified predecessor into the synchronous
 * verifyReceipt without making verifyReceipt async.
 */
export class ResolvedChainStore implements ChainStore {
  constructor(
    private readonly requestedHash: string,
    private readonly predecessor: ContinuityReceipt | null,
  ) {}

  resolve(hash: string): ContinuityReceipt | null {
    if (hash !== this.requestedHash) return null;
    return this.predecessor;
  }
}

/**
 * Resolve a predecessor from a trusted lookup.
 * Store-poisoning defense: the stored receipt must canonicalize back to the
 * requested hash; a mismatch (tampered/forged row) is treated as absent.
 */
export async function resolvePredecessor(
  lookup: PredecessorLookup,
  hash: string,
): Promise<ContinuityReceipt | null> {
  const stored = await lookup.getReceiptByHash(hash);
  if (!stored) return null;
  if (computeReceiptHash(stored) !== hash) return null;
  return stored;
}

/**
 * Verify a receipt with trusted-store-backed V₇ enforcement.
 *
 *  - Genesis (previousReceiptHash === null): V₇ skipped, synchronous verifyReceipt.
 *  - Chained: predecessor resolved via the async lookup, wrapped in a
 *    synchronous ChainStore, verified by the unchanged synchronous verifier.
 *
 * Fail-closed: any lookup error or missing/tampered predecessor yields INVALID
 * (never VALID).
 */
export async function verifyReceiptWithStore(
  receipt: ContinuityReceipt,
  lookup: PredecessorLookup,
): Promise<VerificationResult> {
  if (receipt.previousReceiptHash === null) {
    return verifyReceipt(receipt);
  }

  let predecessor: ContinuityReceipt | null;
  try {
    predecessor = await resolvePredecessor(lookup, receipt.previousReceiptHash);
  } catch {
    return {
      status: "INVALID",
      reason: "CHAIN_BROKEN",
      detail: "Trusted predecessor store unavailable.",
    };
  }

  if (!predecessor) {
    return {
      status: "INVALID",
      reason: "PREDECESSOR_MISSING",
      detail: "Predecessor receipt not found in trusted chain store.",
    };
  }

  return verifyReceipt(receipt, new ResolvedChainStore(receipt.previousReceiptHash, predecessor));
}

// ── Supabase-backed implementations (production only) ──

function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return { url, key };
}

/** Supabase-backed PredecessorLookup reading from continuity_receipts. */
export async function createSupabasePredecessorLookup(): Promise<PredecessorLookup> {
  const { url, key } = getSupabaseEnv();
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key);
  return {
    async getReceiptByHash(hash: string): Promise<ContinuityReceipt | null> {
      const { data, error } = await client
        .from("continuity_receipts")
        .select("receipt")
        .eq("receipt_hash", hash)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as { receipt: ContinuityReceipt };
      return row.receipt ?? null;
    },
  };
}

/** Supabase-backed ReceiptWriter inserting into continuity_receipts (idempotent via PK). */
export async function createSupabaseReceiptWriter(): Promise<ReceiptWriter> {
  const { url, key } = getSupabaseEnv();
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key);
  return {
    async insert(row: ContinuityReceiptRow): Promise<void> {
      const { error } = await client.from("continuity_receipts").insert(row);
      if (error) throw error;
    },
  };
}

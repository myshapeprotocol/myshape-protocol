// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Trusted server-side receipt ingestion (verify -> insert).
//
// The trusted writer is the ONLY component permitted to place a receipt into
// continuity_receipts. It verifies before storing and NEVER stores an
// unverified receipt (store-poisoning defense). Rows are immutable: no
// application UPDATE/DELETE path exists.
// ═══════════════════════════════════════════════════════════════════

import {
  verifyReceipt,
  computeReceiptHash,
  type ContinuityReceipt,
  type FailureCode,
} from "./cps0001";
import {
  verifyReceiptWithStore,
  type PredecessorLookup,
  type ReceiptWriter,
  type ContinuityReceiptRow,
} from "./chain-store-supabase";

export type IngestResult =
  | { status: "INGESTED"; receiptHash: string; alreadyExisted: boolean }
  | { status: "REJECTED"; reason: FailureCode; detail: string };

export interface IngestDeps {
  lookup: PredecessorLookup;
  writer: ReceiptWriter;
  ingester?: string;
}

function rejected(reason: FailureCode, detail: string): IngestResult {
  return { status: "REJECTED", reason, detail };
}

function bindingDetail(code: FailureCode): string {
  switch (code) {
    case "CHAIN_BROKEN":
      return "Predecessor hash mismatch — receipt does not follow the referenced predecessor.";
    case "SUBJECT_MISMATCH":
      return "Chain subject mismatch — predecessor subject differs from current.";
    case "ISSUER_MISMATCH":
      return "Chain issuer mismatch — predecessor issuer differs from current.";
    case "TEMPORAL_VIOLATION":
      return "Chain temporal violation — predecessor interval does not end before current interval starts.";
    default:
      return "Predecessor binding violation.";
  }
}

function isUniqueViolation(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { code?: string; message?: string };
  return err.code === "23505" || (err.message?.includes("duplicate") ?? false);
}

async function safeGet(lookup: PredecessorLookup, hash: string): Promise<ContinuityReceipt | null> {
  try {
    return await lookup.getReceiptByHash(hash);
  } catch {
    return null;
  }
}

export async function ingestReceipt(receipt: ContinuityReceipt, deps: IngestDeps): Promise<IngestResult> {
  // Self-reference / trivial cycle guard.
  if (receipt.previousReceiptHash !== null && receipt.previousReceiptHash === computeReceiptHash(receipt)) {
    return rejected("CHAIN_BROKEN", "Self-reference detected — receipt references itself as predecessor.");
  }

  // Verify BEFORE insert. Reuses the canonical verifier so V₁–V₆ AND V₇ are
  // enforced uniformly; chained receipts require trusted predecessor resolution.
  const verification =
    receipt.previousReceiptHash === null
      ? verifyReceipt(receipt)
      : await verifyReceiptWithStore(receipt, deps.lookup);

  if (verification.status === "INVALID") {
    return rejected(verification.reason, verification.detail);
  }

  // Verify -> insert (idempotent; PK on receipt_hash makes replays safe).
  const receiptHash = computeReceiptHash(receipt);
  const existing = await safeGet(deps.lookup, receiptHash);
  if (existing) {
    return { status: "INGESTED", receiptHash, alreadyExisted: true };
  }

  const row: ContinuityReceiptRow = {
    receipt_hash: receiptHash,
    receipt,
    subject_id: receipt.subject.id,
    issuer_id: receipt.issuer.id,
    interval_start: receipt.interval.start,
    interval_end: receipt.interval.end,
    ingested_at: new Date().toISOString(),
    ingester: deps.ingester ?? "server",
  };

  try {
    await deps.writer.insert(row);
  } catch (e) {
    // Concurrent insert raced us — idempotent success.
    if (isUniqueViolation(e)) {
      return { status: "INGESTED", receiptHash, alreadyExisted: true };
    }
    return rejected("CHAIN_BROKEN", "Store write failed.");
  }

  return { status: "INGESTED", receiptHash, alreadyExisted: false };
}

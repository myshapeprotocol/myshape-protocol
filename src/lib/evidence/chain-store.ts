// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Trusted Chain Store (Model 3: authoritative resolution)
//
// v1.0 authoritative verification resolves the predecessor receipt from a
// TRUSTED store via its hash, rather than accepting an attacker-supplied
// predecessor object. This is the only way V₇ is secure while the
// previousReceiptHash pointer remains UNSIGNED (signed pointer = v1.1).
//
// The interface is intentionally SYNCHRONOUS to avoid forcing the entire
// verification path async (per CPS-0001 v1.0 architecture).
// ═══════════════════════════════════════════════════════════════════

import type { ContinuityReceipt } from "./cps0001";
import { computeReceiptHash } from "./cps0001";

/** Authoritative predecessor resolution for V₇ chain verification. */
export interface ChainStore {
  /** Resolve a predecessor receipt by its CPS-0001 receipt hash. */
  resolve(hash: string): ContinuityReceipt | null;
}

/**
 * Minimal in-memory ChainStore.
 *
 * Suitable for SDK / browser / offline verification and tests. Production
 * deployments SHOULD back this with the Supabase replay/chain registry via
 * an async adapter; the interface stays synchronous so verifiers that resolve
 * predecessors up-front (pre-fetched) remain non-async.
 */
export class MemoryChainStore implements ChainStore {
  private readonly receipts = new Map<string, ContinuityReceipt>();

  /** Index a receipt under its canonical CPS-0001 hash. */
  store(receipt: ContinuityReceipt): void {
    this.receipts.set(computeReceiptHash(receipt), receipt);
  }

  resolve(hash: string): ContinuityReceipt | null {
    return this.receipts.get(hash) ?? null;
  }
}

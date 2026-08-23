// ═══════════════════════════════════════════════════════════════════
// CPS-0001 V₇ — Shared RFC 8785 (JCS) canonical serialization.
//
// SINGLE SOURCE OF TRUTH for the canonical receipt hash across the
// Reference and Second Producer verifiers, so neither can drift from
// Main's definition:
//
//     receiptHash = SHA-256( JCS( ContinuityReceipt ) )
//
// This is intentionally a byte-for-byte equivalent of the canonicalizer
// in src/lib/evidence/cps0001.ts (Main). The cross-implementation
// interop test enforces that all three produce identical hashes.
// ═══════════════════════════════════════════════════════════════════

/** RFC 8785 (JCS)-compatible canonical serialization. */
export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(sortForCanonicalization(value));
}

function sortForCanonicalization(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonicalization);
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      const v = obj[key];
      if (v === undefined) continue; // undefined omitted at canonical boundary
      sorted[key] = sortForCanonicalization(v);
    }
    return sorted;
  }
  return value;
}

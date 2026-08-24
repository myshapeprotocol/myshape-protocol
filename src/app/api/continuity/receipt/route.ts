import { NextResponse } from "next/server";
import { ingestReceipt } from "@/lib/evidence/trusted-writer";
import {
  createSupabasePredecessorLookup,
  createSupabaseReceiptWriter,
} from "@/lib/evidence/chain-store-supabase";
import { nodeCreationLimiter, getClientIP } from "@/lib/rate-limiter";
import type { ContinuityReceipt } from "@/lib/evidence/cps0001";

/**
 * POST /api/continuity/receipt
 *
 * Trusted server-side CPS-0001 receipt ingestion (verify -> insert).
 *
 * This is the ONLY write path into continuity_receipts. It verifies the
 * receipt (V₁–V₆ and, for chained receipts, V₇ predecessor binding) BEFORE
 * persisting. Unverified / poisoned receipts are rejected and never stored.
 *
 * Server-side only. No public INSERT/UPDATE/DELETE on the table (RLS denies
 * anon/authenticated). Rate limited: 3 requests/IP/hour.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const ip = getClientIP(req);
  const limit = nodeCreationLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let receipt: ContinuityReceipt;
  try {
    receipt = (await req.json()) as ContinuityReceipt;
  } catch {
    return NextResponse.json({ error: "Invalid CPS-0001 JSON" }, { status: 400 });
  }

  let lookup;
  let writer;
  try {
    lookup = await createSupabasePredecessorLookup();
    writer = await createSupabaseReceiptWriter();
  } catch {
    return NextResponse.json({ error: "Store unavailable" }, { status: 503 });
  }

  const result = await ingestReceipt(receipt, { lookup, writer });
  if (result.status === "REJECTED") {
    return NextResponse.json(
      { status: "REJECTED", reason: result.reason, detail: result.detail },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { status: "INGESTED", receiptHash: result.receiptHash, alreadyExisted: result.alreadyExisted },
    { status: 200 },
  );
}

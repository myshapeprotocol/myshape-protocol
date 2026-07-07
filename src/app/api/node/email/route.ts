import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

/**
 * PATCH /api/node/email — bind a real email to a wallet-only node
 *
 * Only works for pseudo-email nodes (wallet:* prefix) to prevent
 * accidental overwrites of real email addresses.
 *
 * Body: { currentEmail: string, newEmail: string, walletAddress?: string }
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
  }
  return createClient(url, key);
}

export async function PATCH(request: Request) {
  const ip = getClientIP(request);
  const { allowed, remaining } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  }

  try {
    const { currentEmail, newEmail, walletAddress } = await request.json();

    if (!currentEmail || !newEmail) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const cleanNew = newEmail.trim().toLowerCase();
    if (!cleanNew.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // ── Guard: only allow updating pseudo-emails ──
    const isPseudo = currentEmail.startsWith("wallet:");
    if (!isPseudo) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_SET: This node already has a real email" },
        { status: 409 }
      );
    }

    const supabase = getSupabase();

    // ── Verify node exists ──
    const { data: node, error: readErr } = await supabase
      .from("protocol_nodes")
      .select("email, wallet_address")
      .eq("email", currentEmail.trim())
      .single();

    if (readErr) {
      if (readErr.code === "PGRST116") {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
    }

    // ── Verify wallet ownership (if wallet provided) ──
    if (walletAddress && node?.wallet_address) {
      if (walletAddress.toLowerCase() !== node.wallet_address.toLowerCase()) {
        return NextResponse.json({ error: "WALLET_MISMATCH" }, { status: 403 });
      }
    }

    // ── Check new email isn't already taken ──
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", cleanNew)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "EMAIL_ALREADY_EXISTS" }, { status: 409 });
    }

    // ── Perform the swap: insert new row + delete old row ──
    // Supabase doesn't support PK updates directly, so we copy + delete.
    const { data: oldNode, error: fullReadErr } = await supabase
      .from("protocol_nodes")
      .select("*")
      .eq("email", currentEmail.trim())
      .single();

    if (fullReadErr || !oldNode) {
      return NextResponse.json({ error: "NODE_READ_FAILED" }, { status: 500 });
    }

    // Insert with new email
    const { error: insertErr } = await supabase
      .from("protocol_nodes")
      .insert({ ...oldNode, email: cleanNew });

    if (insertErr) {
      console.error("[email swap] Insert failed:", insertErr.message);
      return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
    }

    // Delete old row
    const { error: deleteErr } = await supabase
      .from("protocol_nodes")
      .delete()
      .eq("email", currentEmail.trim());

    if (deleteErr) {
      console.error("[email swap] Delete old row failed:", deleteErr.message);
      // Not fatal — new row exists. Log and continue.
    }

    return NextResponse.json({
      success: true,
      email: cleanNew,
      message: "Email bound to protocol node",
    });
  } catch (err: unknown) {
    console.error("[email swap]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

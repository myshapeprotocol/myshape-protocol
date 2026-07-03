import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { nodeCreationLimiter, getClientIP } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randomHex(len: number): string {
  return randomBytes(len).toString("hex");
}

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { allowed } = nodeCreationLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  // Use the same env-var pattern as all other routes
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[handshake] Missing environment variables:", {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    return NextResponse.json({ error: "SERVER_CONFIG_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, origin_domain } = body;

    if (!email?.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing node (case-insensitive)
    const { data: existing, error: queryError } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (queryError) throw queryError;
    if (existing) {
      return NextResponse.json({ error: "NODE_ALREADY_ACTIVE" }, { status: 409 });
    }

    // Generate identifiers
    const nodeHandle = `SIG_${randomHex(4).toUpperCase()}`;
    const nodeToken = `ms_${randomHex(16)}`;

    // Insert — only columns that exist in the schema
    const { error: insertError } = await supabase.from("protocol_nodes").insert({
      email: email.trim().toLowerCase(),
      node_handle: nodeHandle,
      status: "GENESIS_CONNECTED",
    });

    if (insertError) throw insertError;

    return NextResponse.json({
      node_token: nodeToken,
      node_handle: nodeHandle,
      stage: "GENESIS_NODE_INITIALIZED",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[handshake] Crash:", message);
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT" },
      { status: 500 },
    );
  }
}

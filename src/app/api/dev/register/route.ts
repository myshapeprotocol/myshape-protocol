import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { getClientIP } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randomHex(len: number): string {
  return randomBytes(len).toString("hex");
}

const cooldowns = new Map<string, number>();

export async function POST(request: Request) {
  const ip = getClientIP(request);

  // Light cooldown: one per 30s per IP (dev-friendly, abuse-resistant)
  const last = cooldowns.get(ip);
  const now = Date.now();
  if (last && now - last < 30_000) {
    return NextResponse.json(
      { error: "COOLDOWN", retryAfterSec: Math.ceil((last + 30_000 - now) / 1000) },
      { status: 429 },
    );
  }
  cooldowns.set(ip, now);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "SERVER_CONFIG_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const handle = (body.handle || "").trim().slice(0, 20) || `DEV_${randomHex(3).toUpperCase()}`;
    const email = body.email?.trim().toLowerCase() || `${handle.toLowerCase()}@sandbox.myshape.dev`;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing node — prevent PK collision on email
    const { data: existing, error: queryError } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (queryError) throw queryError;
    if (existing) {
      return NextResponse.json(
        { error: "HANDLE_TAKEN", hint: "That handle is already deployed. Try a different one." },
        { status: 409 },
      );
    }

    const nodeHandle = `DEV_${randomHex(4).toUpperCase()}`;
    const nodeToken = `ms_${randomHex(16)}`;

    const { error: insertError } = await supabase.from("protocol_nodes").insert({
      email,
      node_handle: nodeHandle,
      status: "ACTIVE",
    });

    if (insertError) throw insertError;

    // Single-line curl: cross-shell compatible (bash/zsh/Git Bash/PowerShell via curl.exe)
    const curlExample = `curl -X POST https://www.myshape.com/api/dev/activate -H "Content-Type: application/json" -d '{"node_handle":"${nodeHandle}","node_token":"${nodeToken}"}'`;

    return NextResponse.json({
      node_token: nodeToken,
      node_handle: nodeHandle,
      email,
      stage: "DEV_SANDBOX_READY",
      curl_example: curlExample,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[dev/register] Crash:", message);
    return NextResponse.json({ error: "REGISTRATION_FAILED" }, { status: 500 });
  }
}

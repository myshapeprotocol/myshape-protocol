/**
 * POST /api/nodes/handshake — Genesis Node Initialization
 *
 * Protocol-level developer/institution onboarding.
 * Not a boring API key request — this is a node joining the identity mesh.
 *
 * Flow:
 *   1. Developer submits email
 *   2. System provisions access token (myshape_XXXX)
 *   3. Node record created in developer_keys table
 *   4. Optional: welcome email via Resend
 *   5. Returns IDENTITY_VECTOR_AUTH credentials
 *
 * Rate limiting: 3 handshakes per email per hour
 * Telemetry: SDK version, origin domain tracked for network health
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateNodeToken(): string {
  return "myshape_" + randomBytes(18).toString("hex");
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const sdkVersion = (body.sdk_version || "unknown").slice(0, 32);
    const originDomain = (body.origin || request.headers.get("origin") || "direct").slice(0, 128);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "VALID_IDENTITY_VECTOR_REQUIRED", stage: "REJECTED" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "PROTOCOL_CORE_UNREACHABLE", stage: "DEGRADED" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("developer_keys")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "HANDSHAKE_RATE_EXCEEDED", stage: "THROTTLED", retry_after_s: 3600 },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Return existing node token if already initialized
    const { data: existing } = await supabase
      .from("developer_keys")
      .select("api_key, created_at, request_count")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing?.length) {
      // Update last_used
      await supabase
        .from("developer_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("api_key", existing[0].api_key);

      return NextResponse.json({
        node_token: existing[0].api_key,
        initialized_at: existing[0].created_at,
        request_count: existing[0].request_count,
        stage: "NODE_ALREADY_ACTIVE",
        message: "Node previously initialized. Token re-issued.",
      });
    }

    // Generate new node token
    const nodeToken = generateNodeToken();
    const timestamp = new Date().toISOString();

    const { error } = await supabase.from("developer_keys").insert({
      email,
      api_key: nodeToken,
      status: "ACTIVE",
      request_count: 0,
      sdk_version: sdkVersion,
      origin_domain: originDomain,
      created_at: timestamp,
      last_used_at: timestamp,
    });

    if (error) {
      console.error("[handshake] Insert failed:", error.message);
      return NextResponse.json(
        { error: "NODE_INITIALIZATION_FAILED", stage: "ERROR" },
        { status: 500 }
      );
    }

    // Send welcome email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "MyShape Protocol <protocol@myshape.me>",
          to: email,
          subject: "GENESIS_NODE_INITIALIZED — Your Protocol Access Credentials",
          text: `NODE_TOKEN: ${nodeToken}\n\nUse in Authorization: Bearer header.\nDocs: https://myshape.me/developers\n\n— MyShape Protocol Core`,
        });
      } catch (e) {
        console.warn("[handshake] Welcome email failed (non-critical):", (e as Error).message);
      }
    }

    return NextResponse.json({
      node_token: nodeToken,
      initialized_at: timestamp,
      stage: "GENESIS_NODE_INITIALIZED",
      message: "Node joined the identity mesh. Use node_token in Authorization: Bearer header.",
      latency_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[handshake]", err);
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT", stage: "CRITICAL" },
      { status: 500 }
    );
  }
}

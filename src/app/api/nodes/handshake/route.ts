/**
 * POST /api/nodes/handshake — Genesis Node Initialization
 *
 * Inserts into protocol_nodes. The trg_update_protocol_stats trigger
 * auto-updates node_statistics — no application-level counting needed.
 *
 * Request:  { email, node_handle?, origin_domain?, sdk_version?, visual_config? }
 * Response: { node_token, stage, initialized_at, latency_ms }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateNodeToken(): string {
  return "ms_" + randomBytes(16).toString("hex");
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const nodeHandle = (body.node_handle || "").trim() || undefined;
    const originDomain = (body.origin_domain || request.headers.get("origin") || "direct").slice(0, 128);
    const sdkVersion = (body.sdk_version || "unknown").slice(0, 32);
    const visualConfig = body.visual_config || null;

    // ── Validate ──
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_IDENTITY_VECTOR", stage: "REJECTED" },
        { status: 400 }
      );
    }

    // ── Connect ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "PROTOCOL_CORE_UNREACHABLE", stage: "DEGRADED" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Rate limit: 3 per email per hour ──
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("protocol_nodes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "HANDSHAKE_RATE_EXCEEDED", stage: "THROTTLED", retry_after_s: 3600 },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // ── Check existing ──
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email, node_handle, status, created_at")
      .eq("email", email)
      .maybeSingle();

    // Build insert payload
    const nodeToken = generateNodeToken();
    const timestamp = new Date().toISOString();
    const insertPayload: Record<string, unknown> = {
      email,
      status: "ACTIVE",
      created_at: timestamp,
    };
    if (nodeHandle) insertPayload.node_handle = nodeHandle;
    if (originDomain) (insertPayload as any).origin_domain = originDomain;
    if (sdkVersion) (insertPayload as any).sdk_version = sdkVersion;
    if (visualConfig) (insertPayload as any).visual_config = visualConfig;

    if (existing) {
      // Update existing node — return the same token for idempotency
      await supabase
        .from("protocol_nodes")
        .update({ ...insertPayload, email: undefined, created_at: undefined })
        .eq("email", email);

      return NextResponse.json({
        node_token: nodeToken,
        stage: "NODE_ALREADY_ACTIVE",
        initialized_at: existing.created_at,
        message: "This identity vector is already registered. Token re-issued.",
        latency_ms: Date.now() - startTime,
      });
    }

    // ── Insert ──
    const { error } = await supabase.from("protocol_nodes").insert(insertPayload);

    if (error) {
      console.error("[handshake] Insert failed:", error.message, error.code);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "IDENTITY_VECTOR_CONFLICT", stage: "RETRY" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "NODE_INITIALIZATION_FAILED", stage: "ERROR" },
        { status: 500 }
      );
    }

    // ── Optional: welcome email ──
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "MyShape Protocol <protocol@myshape.me>",
          to: email,
          subject: "GENESIS_NODE_INITIALIZED — Protocol Access Credentials",
          text: `NODE_TOKEN: ${nodeToken}\n\nUse in Authorization: Bearer header.\nDocs: https://myshape.me/developers`,
        });
      } catch (e) {
        console.warn("[handshake] Email failed (non-critical):", (e as Error).message);
      }
    }

    return NextResponse.json({
      node_token: nodeToken,
      stage: "GENESIS_NODE_INITIALIZED",
      initialized_at: timestamp,
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

/**
 * POST /api/nodes/handshake — Genesis Node Initialization
 *
 * Writes into public.protocol_nodes using service_role.
 * Fields: email, node_handle, status, visual_config, created_at.
 *
 * Request:  { email, origin_domain?, node_handle?, visual_config? }
 * Response: { node_token, stage, initialized_at }
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

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_IDENTITY_VECTOR" },
        { status: 400 }
      );
    }

    // ── Connect with service_role ──
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "PROTOCOL_CORE_UNREACHABLE" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Check existing ──
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "NODE_ALREADY_ACTIVE" },
        { status: 409 }
      );
    }

    // ── Build payload ──
    const nodeToken = generateNodeToken();
    const timestamp = new Date().toISOString();
    const nodeHandle = body.node_handle || `SIG_${randomBytes(4).toString("hex").toUpperCase()}`;
    const originDomain = body.origin_domain || "direct";

    const insertPayload = {
      email,
      node_handle: nodeHandle,
      status: "GENESIS_CONNECTED",
      visual_config: body.visual_config || {
        origin_domain: originDomain,
        sdk_version: body.sdk_version || "unknown",
        node_token: nodeToken,
      },
      created_at: timestamp,
    };

    // ── Insert ──
    const { error } = await supabase.from("protocol_nodes").insert(insertPayload);

    if (error) {
      console.error("[handshake]", error);
      return NextResponse.json(
        { error: "NODE_INITIALIZATION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      node_token: nodeToken,
      node_handle: nodeHandle,
      stage: "GENESIS_NODE_INITIALIZED",
      initialized_at: timestamp,
      latency_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[handshake]", err);
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT" },
      { status: 500 }
    );
  }
}

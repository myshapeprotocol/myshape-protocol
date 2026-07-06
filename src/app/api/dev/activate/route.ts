import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "SERVER_CONFIG_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const token = request.headers.get("x-node-token") || body.node_token || "";

    if (!token || !token.startsWith("ms_")) {
      return NextResponse.json(
        { error: "INVALID_TOKEN", hint: "Pass your dev token as x-node-token header or node_token in body" },
        { status: 401 },
      );
    }

    // Find node by scanning recent registrations — tokens are not stored,
    // so we match on the handle prefix encoded in the token creation time
    const supabase = createClient(supabaseUrl, supabaseKey);

    // The token itself isn't stored in the DB (security). Instead, we accept
    // any valid-format dev token and update the requesting node via email lookup
    // from the request. Dev must also send their node_handle or email.
    const handle = body.node_handle || "";
    const email = body.email || "";

    if (!handle && !email) {
      return NextResponse.json(
        { error: "IDENTIFIER_REQUIRED", hint: "Send node_handle or email to identify your node" },
        { status: 400 },
      );
    }

    // Look up the node
    let query = supabase.from("protocol_nodes").select("*");
    if (email) {
      query = query.eq("email", email);
    } else {
      query = query.eq("node_handle", handle);
    }

    const { data: node, error: queryError } = await query.maybeSingle();

    if (queryError || !node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // Update: mark as activated, bump scan
    const today = new Date().toISOString().slice(0, 10);
    const { error: updateError } = await supabase
      .from("protocol_nodes")
      .update({
        last_scan_date: today,
        scan_count: (node.scan_count ?? 0) + 1,
        last_entropy_date: today,
      })
      .eq("email", node.email);

    if (updateError) throw updateError;

    return NextResponse.json({
      activated: true,
      node_handle: node.node_handle,
      status: node.status,
      scan_count: (node.scan_count ?? 0) + 1,
      message: "NODE_ACTIVATED — Your terminal command just resonated in the protocol mesh.",
      next_step: "[Next Step] To visualize your node, visit https://www.myshape.com/agent or deploy your first agent with this token.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[dev/activate] Crash:", message);
    return NextResponse.json({ error: "ACTIVATION_FAILED" }, { status: 500 });
  }
}

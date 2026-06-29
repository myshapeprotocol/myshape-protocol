import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: total } = await supabase
      .from("protocol_nodes")
      .select("*", { count: "exact", head: true });

    const { count: humans } = await supabase
      .from("protocol_nodes")
      .select("*", { count: "exact", head: true })
      .in("status", ["ACTIVE", "GENESIS_NODE", "SUBSCRIBED"]);

    const { count: agents } = await supabase
      .from("protocol_nodes")
      .select("*", { count: "exact", head: true })
      .eq("status", "AGENT_ACTIVE");

    const { count: genesisNodes } = await supabase
      .from("protocol_nodes")
      .select("*", { count: "exact", head: true })
      .eq("status", "GENESIS_NODE");

    return NextResponse.json({
      total: total ?? 0,
      humans: humans ?? 0,
      agents: agents ?? 0,
      genesis_nodes: genesisNodes ?? 0,
    });
  } catch (err) {
    console.error("[/api/nodes/count]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

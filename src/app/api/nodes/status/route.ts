import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * GET /api/nodes/status — Public protocol health dashboard
 * Returns live node counts, genesis status, and protocol uptime indicators.
 */

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { count: total } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true });
  const { count: genesisNodes } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).eq("status", "GENESIS_NODE");
  const { count: activeHumans } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).in("status", ["ACTIVE", "GENESIS_NODE"]);
  const { count: agents } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).eq("status", "AGENT_ACTIVE");
  const { data: recentScan } = await supabase.from("protocol_nodes").select("last_scan_date").order("last_scan_date", { ascending: false, nullsLast: true }).limit(1);

  return NextResponse.json({
    total_nodes: total ?? 0,
    genesis_nodes: genesisNodes ?? 0,
    genesis_remaining: Math.max(0, 100 - (genesisNodes ?? 0)),
    active_humans: activeHumans ?? 0,
    agents: agents ?? 0,
    last_scan: recentScan?.[0]?.last_scan_date || null,
    cohort_sealed: (genesisNodes ?? 0) >= 100,
    status: "OPERATIONAL",
    timestamp: new Date().toISOString(),
  });
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NodesStatusResponse } from "@/types/api";
import { CURRENT_API_VERSION } from "@/types/api";

/**
 * GET /api/nodes/status — Public protocol health dashboard
 * Returns live node counts, genesis status, and protocol uptime indicators.
 */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" } satisfies { error: string }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: total } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true });
    const { count: sovereignNodes } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).eq("status", "GENESIS_NODE");
    const { count: activeHumans } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).in("status", ["ACTIVE", "GENESIS_NODE"]);
    const { count: agents } = await supabase.from("protocol_nodes").select("*", { count: "exact", head: true }).eq("status", "AGENT_ACTIVE");
    const { data: recentScan } = await supabase.from("protocol_nodes").select("last_scan_date").not("last_scan_date", "is", null).order("last_scan_date", { ascending: false }).limit(1);

    // Sum all scan_count for total protocol activity metric
    const { data: scanRows } = await supabase.from("protocol_nodes").select("scan_count");
    const totalScans = (scanRows ?? []).reduce((sum, r) => sum + (r.scan_count ?? 0), 0);

    const response: NodesStatusResponse = {
      apiVersion: CURRENT_API_VERSION,
      total_nodes: total ?? 0,
      genesis_nodes: sovereignNodes ?? 0,
      genesis_remaining: Math.max(0, 100 - (sovereignNodes ?? 0)),
      active_humans: activeHumans ?? 0,
      agents: agents ?? 0,
      total_scans: totalScans,
      last_scan: recentScan?.[0]?.last_scan_date || null,
      cohort_sealed: (sovereignNodes ?? 0) >= 100,
      status: "OPERATIONAL",
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/nodes/status]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", status: "DEGRADED" }, { status: 500 });
  }
}

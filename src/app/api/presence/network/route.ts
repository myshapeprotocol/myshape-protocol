import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Active human nodes (GENESIS_NODE + ACTIVE)
    const { data: nodes, error } = await supabase
      .from("protocol_nodes")
      .select("node_handle, email, status, particle_level, entropy_score, last_entropy_date, last_scan_date, scan_count, created_at")
      .in("status", ["ACTIVE", "GENESIS_NODE", "AGENT_ACTIVE"])
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    const humans = (nodes || []).filter((n) => n.status !== "AGENT_ACTIVE");
    const agents = (nodes || []).filter((n) => n.status === "AGENT_ACTIVE");
    const sovereignNodes = humans.filter((n) => n.status === "GENESIS_NODE");

    // Most recent scan
    const lastInbound = humans
      .filter((n) => n.last_scan_date)
      .sort((a, b) => b.last_scan_date!.localeCompare(a.last_scan_date!))[0];

    // Compute network health
    const activeToday = humans.filter((n) => {
      if (!n.last_entropy_date) return false;
      const d = new Date(n.last_entropy_date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;

    const sanitized = humans.map((n) => ({
      handle: n.node_handle || "UNNAMED",
      mask: n.email ? n.email.slice(0, 2) + "***" + n.email.slice(-4) : "***",
      status: n.status,
      particleLevel: n.particle_level ?? 1,
      entropy: n.entropy_score ?? 0,
      lastSeen: n.last_entropy_date || n.last_scan_date || n.created_at,
      scans: n.scan_count ?? 0,
      isGenesis: n.status === "GENESIS_NODE",
    }));

    return NextResponse.json({
      totalNodes: humans.length + agents.length,
      activeHumans: humans.length,
      sovereignNodes: sovereignNodes.length,
      agents: agents.length,
      activeToday,
      totalScans: humans.reduce((sum, n) => sum + (n.scan_count ?? 0), 0),
      lastInbound: lastInbound
        ? {
            handle: lastInbound.node_handle || "UNNAMED",
            mask: lastInbound.email ? lastInbound.email.slice(0, 2) + "***" + lastInbound.email.slice(-4) : "***",
            timestamp: lastInbound.last_scan_date || lastInbound.last_entropy_date,
          }
        : null,
      nodes: sanitized,
      // Protocol engine metrics (source: src/engine/)
      engines: 3,
      // Attack signatures indexed (source: unforgeability.ts §threat matrix)
      attackSigs: 8,
      // Core test suite (source: vitest — 14 suites)
      coreTests: "172/172",
    });
  } catch (err) {
    console.error("Presence network error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

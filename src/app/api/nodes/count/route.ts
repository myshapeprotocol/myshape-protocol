import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all emails for accurate case-insensitive dedup.
    // The table is small (< 1000 rows) so this is fine.
    const { data: rows, error } = await supabase
      .from("protocol_nodes")
      .select("email, status");

    if (error) throw error;

    // Case-insensitive dedup: LOWER(email)
    const seen = new Set<string>();
    const uniqueRows: typeof rows = [];
    for (const r of rows ?? []) {
      const key = (r.email ?? "").trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueRows.push(r);
    }

    // Exclude smoke-test entries
    const real = uniqueRows.filter(
      (r) => !r.email?.toLowerCase().includes("smoke-test")
    );

    const total = real.length;
    const humans = real.filter((r) =>
      ["ACTIVE", "GENESIS_NODE", "SUBSCRIBED", "GENESIS_CONNECTED"].includes(r.status ?? "")
    ).length;
    const agents = real.filter((r) => r.status === "AGENT_ACTIVE").length;
    const genesisNodes = real.filter((r) => r.status === "GENESIS_NODE").length;

    return NextResponse.json({
      total,
      humans,
      agents,
      genesis_nodes: genesisNodes,
    });
  } catch (err) {
    console.error("[/api/nodes/count]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

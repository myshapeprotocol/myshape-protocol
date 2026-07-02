import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

/**
 * GET /api/nodes/genesis — 返回 Genesis Cohort 匿名列表
 * 隐私保护：不暴露邮箱，仅返回 node_handle 或匿名 ID
 */

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "UNKNOWN";
  return `${name.slice(0, 2)}****@${domain}`;
}

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

    const { data, error, count } = await supabase
      .from("protocol_nodes")
      .select("node_handle, email, created_at", { count: "exact" })
      .eq("status", "GENESIS_NODE")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    const nodes = (data || []).map((n, i) => ({
      index: i + 1,
      id: n.node_handle || `GNS_${i + 1}`,
      joined: n.created_at,
    }));

    return NextResponse.json({
      total: count ?? 0,
      remaining: Math.max(0, 100 - (count ?? 0)),
      nodes,
    });
  } catch (err) {
    console.error("[/api/nodes/genesis]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

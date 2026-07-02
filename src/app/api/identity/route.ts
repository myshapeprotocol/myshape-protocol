import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

export async function GET(req: Request) {
  try {
    const ip = getClientIP(req);
    const { allowed, remaining } = apiLookupLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "RATE_LIMIT" },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": String(remaining) },
        },
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("protocol_nodes")
      .select("email, node_handle, status, created_at")
      .eq("email", email.trim())
      .single();

    // PGRST116 = no rows — legitimate "not found"
    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ found: false, email: email.trim() });
      }
      // Any other DB error is a genuine failure
      console.error("[/api/identity] Supabase error:", error.code, error.message);
      return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ found: false, email: email.trim() });
    }

    return NextResponse.json({
      found: true,
      email: data.email,
      node_handle: data.node_handle,
      status: data.status,
      registered_at: data.created_at,
    });
  } catch (err) {
    console.error("[/api/identity]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

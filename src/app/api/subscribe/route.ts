import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // 检查是否已存在
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email.trim())
      .single();

    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // 新订阅 — 节点状态设为 SUBSCRIBED
    const { error } = await supabase
      .from("protocol_nodes")
      .upsert(
        { email: email.trim(), status: "SUBSCRIBED" },
        { onConflict: "email" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

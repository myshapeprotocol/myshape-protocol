import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { nodeCreationLimiter, getClientIP } from "@/lib/rate-limiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randomHex(len: number): string {
  return randomBytes(len).toString("hex");
}

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { allowed } = nodeCreationLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  // 1. 获取并校验环境变量
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 调试日志：如果此处报错，说明进程没有读到 .env.local
  if (!supabaseUrl || !supabaseKey) {
    console.error("[handshake] Missing environment variables:", {
      SUPABASE_URL: !!supabaseUrl, 
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey 
    });
    return NextResponse.json({ error: "SERVER_CONFIG_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { email, origin_domain } = body;

    if (!email?.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // 2. 初始化 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. 查重：确保该 email 尚未注册
    const { data: existing, error: queryError } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (queryError) throw queryError;
    if (existing) {
      return NextResponse.json({ error: "NODE_ALREADY_ACTIVE" }, { status: 409 });
    }

    // 4. 生成唯一标识符
    const nodeHandle = `SIG_${randomHex(4).toUpperCase()}`;
    const nodeToken = `ms_${randomHex(16)}`;

    // 5. 执行插入
    const { error: insertError } = await supabase.from("protocol_nodes").insert({
      email: email.trim().toLowerCase(),
      node_handle: nodeHandle,
      node_token: nodeToken,
      status: "GENESIS_CONNECTED",
      visual_config: { origin_domain: origin_domain || "direct" },
      created_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    return NextResponse.json({
      node_token: nodeToken,
      node_handle: nodeHandle,
      stage: "GENESIS_NODE_INITIALIZED",
    });

  } catch (err: any) {
    console.error("[handshake] Crash:", err);
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT", details: err.message },
      { status: 500 }
    );
  }
}
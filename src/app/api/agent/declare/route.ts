import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Agent Declaration API — AI Agent 身份声明
 *
 * Agent 无需邮箱/OTP/摄像头。
 * 提交 { agent_handle, agent_type, origin, public_key } 即可注册为协议节点。
 * 签名的完整验证将在 Epoch II 实现。
 */
export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "SERVER_CONFIGURATION_INCOMPLETE" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { agent_handle, agent_type, origin, public_key } = body as {
      agent_handle: string;
      agent_type: string;
      origin: string;
      public_key: string;
    };

    if (!agent_handle || !agent_type || !origin || !public_key) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: agent_handle, agent_type, origin, and public_key are required" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const agentEmail = `agent:${agent_handle}@${origin}`;
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", agentEmail)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyDeclared: true,
        agent_id: agentEmail,
        message: "AGENT_ALREADY_DECLARED",
      });
    }

    const { error } = await supabase.from("protocol_nodes").upsert(
      {
        email: agentEmail,
        node_handle: agent_handle,
        status: "AGENT_ACTIVE",
      },
      { onConflict: "email" }
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      agent_id: agentEmail,
      message: "AGENT_DECLARATION_ACCEPTED",
    });
  } catch (err: unknown) {
    console.error("[/api/agent/declare]", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

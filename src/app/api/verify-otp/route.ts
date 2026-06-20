import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Verify OTP API — 校验 6 位验证码并激活节点
 *
 * 安全策略：
 * - Supabase 客户端在 handler 内延迟初始化
 * - 运行时校验环境变量
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials"
    );
  }

  return { supabaseUrl, supabaseKey };
}

export async function POST(req: Request) {
  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: email and otp are required" },
        { status: 400 }
      );
    }

    // 1. 从数据库查询该邮箱的 OTP
    const { data, error: dbError } = await supabase
      .from('protocol_nodes')
      .select('otp_code, status')
      .eq('email', email)
      .single();

    if (dbError || !data) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // 2. 匹配验证码
    if (data.otp_code !== otp) {
      return NextResponse.json({ error: "SIGNATURE_INVALID" }, { status: 401 });
    }

    // 3. 验证成功——前 100 名标记为 GENESIS_NODE
    const { count } = await supabase
      .from('protocol_nodes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ACTIVE', 'GENESIS_NODE', 'AGENT_ACTIVE']);

    const nodeStatus = (count ?? 0) < 100 ? 'GENESIS_NODE' : 'ACTIVE';

    const { error: updateError } = await supabase
      .from('protocol_nodes')
      .update({ status: nodeStatus })
      .eq('email', email);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status: nodeStatus });
  } catch (error: unknown) {
    console.error('VERIFY_OTP_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

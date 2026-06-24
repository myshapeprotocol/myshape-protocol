import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/motion/record — 记录一次成功的 motion-signature 验证
 * 自动递增该节点的 scan_count
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return { supabaseUrl, supabaseKey };
}

export async function POST(req: Request) {
  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // 查询当前节点
    const { data: node, error: lookupError } = await supabase
      .from('protocol_nodes')
      .select('email, scan_count, status')
      .eq('email', email.trim())
      .single();

    if (lookupError || !node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // 递增 scan_count
    const newCount = (node.scan_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('protocol_nodes')
      .update({ scan_count: newCount })
      .eq('email', email.trim());

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      email: email.trim(),
      scan_count: newCount,
      status: node.status,
    });
  } catch (error: unknown) {
    console.error('MOTION_RECORD_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

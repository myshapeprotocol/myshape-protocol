import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/motion/record — 记录一次成功的 motion-signature 验证
 * 每日限制：每个节点每天最多 3 次有效扫描
 */

const DAILY_LIMIT = 3;

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return { supabaseUrl, supabaseKey };
}

function today(): string {
  return new Date().toISOString().slice(0, 10); // "2026-06-25"
}

export async function POST(req: Request) {
  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email: rawEmail } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // 查询当前节点
    const { data: node, error: lookupError } = await supabase
      .from('protocol_nodes')
      .select('email, scan_count, status, last_scan_date, daily_scan_count')
      .eq('email', email)
      .single();

    if (lookupError || !node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    const currentDate = today();
    const isNewDay = node.last_scan_date !== currentDate;
    const dailyCount = isNewDay ? 0 : (node.daily_scan_count || 0);

    // 每日上限检查
    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json({
        success: false,
        error: "DAILY_LIMIT_REACHED",
        message: `Maximum ${DAILY_LIMIT} scans per day reached. Resets at midnight UTC.`,
        scan_count: node.scan_count || 0,
        daily_remaining: 0,
      }, { status: 429 });
    }

    // 递增
    const newCount = (node.scan_count || 0) + 1;
    const newDailyCount = dailyCount + 1;
    const { error: updateError } = await supabase
      .from('protocol_nodes')
      .update({
        scan_count: newCount,
        last_scan_date: currentDate,
        daily_scan_count: newDailyCount,
      })
      .eq('email', email);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      email,
      scan_count: newCount,
      daily_remaining: DAILY_LIMIT - newDailyCount,
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

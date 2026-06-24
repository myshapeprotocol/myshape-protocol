import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/node/privileges?email=... — 查询节点的权限标记
 *
 * 返回：
 * - is_genesis: 是否为 Genesis Founding Entity
 * - scan_count: 累计扫描次数
 * - tier: 当前层级
 * - early_access: 是否有新功能优先访问权
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return { supabaseUrl, supabaseKey };
}

export async function GET(req: Request) {
  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const { data: node, error } = await supabase
      .from('protocol_nodes')
      .select('email, status, scan_count, data_contribution, created_at')
      .eq('email', email.trim())
      .single();

    if (error || !node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    const isGenesis = node.status === 'GENESIS_NODE';
    const isActive = node.status === 'ACTIVE' || isGenesis;

    return NextResponse.json({
      email: node.email,
      status: node.status,
      is_genesis: isGenesis,
      is_active: isActive,
      scan_count: node.scan_count || 0,
      data_contribution: node.data_contribution || 0,
      tier: isGenesis ? 'FOUNDING_ENTITY' : isActive ? 'ACTIVE_NODE' : 'SUBSCRIBER',
      early_access: isGenesis, // Genesis 节点始终有优先访问权
      registered_at: node.created_at,
    });
  } catch (error: unknown) {
    console.error('NODE_PRIVILEGES_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

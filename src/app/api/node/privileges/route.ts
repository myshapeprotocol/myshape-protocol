import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";
import { computeProtocolProgressFromDb } from "@/lib/protocol-progress";

/**
 * GET /api/node/privileges?email=... — 查询节点的权限标记 + 协议进度
 *
 * 返回：
 * - is_genesis: 是否为 Genesis Founding Entity
 * - scan_count: 累计扫描次数
 * - tier: 当前层级
 * - early_access: 是否有新功能优先访问权
 * - protocol_progress: 统一的协议晋升路径 DTO (Genesis → Formation → Sovereign)
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

    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || "").trim().toLowerCase();
    const wallet = (searchParams.get('wallet') || "").trim().toLowerCase();

    if (!email && !wallet) {
      return NextResponse.json({ error: "MISSING_IDENTIFIER" }, { status: 400 });
    }

    let query = supabase
      .from('protocol_nodes')
      .select('email, status, scan_count, data_contribution, created_at, entropy_score, particle_level, streak_days, streak_multiplier, best_pes, node_handle, wallet_address');

    if (wallet) {
      query = query.eq('wallet_address', wallet);
    } else {
      // Accept wallet-derived keys (e.g. "wallet:a1b2c3d") and real emails
      query = query.eq('email', email);
    }

    const { data: node, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      console.error("[/api/node/privileges] Supabase error:", error.code, error.message);
      return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
    }
    if (!node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    const isGenesis = node.status === 'GENESIS_NODE';
    const isActive = node.status === 'ACTIVE' || isGenesis;

    const protocolProgress = computeProtocolProgressFromDb({
      status: node.status,
      scanCount: node.scan_count || 0,
      entropyScore: node.entropy_score ?? 0,
      particleLevel: node.particle_level ?? 1,
      streakDays: node.streak_days ?? 0,
      streakMultiplier: node.streak_multiplier ?? 1.0,
      bestPes: node.best_pes ?? 0,
    });

    return NextResponse.json({
      email: node.email,
      status: node.status,
      is_genesis: isGenesis,
      is_active: isActive,
      scan_count: node.scan_count || 0,
      data_contribution: node.data_contribution || 0,
      tier: isGenesis ? 'FOUNDING_ENTITY' : isActive ? 'ACTIVE_NODE' : 'SUBSCRIBER',
      early_access: isGenesis, // Genesis 节点始终有优先访问权
      entropy_score: node.entropy_score ?? 0,
      particle_level: node.particle_level ?? 1,
      streak_days: node.streak_days ?? 0,
      streak_multiplier: node.streak_multiplier ?? 1.0,
      best_pes: node.best_pes ?? 0,
      registered_at: node.created_at,
      protocol_progress: protocolProgress,
    });
  } catch (error: unknown) {
    console.error('NODE_PRIVILEGES_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

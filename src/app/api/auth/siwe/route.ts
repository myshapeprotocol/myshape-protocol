import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { apiLookupLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * POST /api/auth/siwe — EIP-4361 Sign-In with Ethereum
 *
 * Request payload: { message: string, signature: string, address: string }
 *
 * 安全不变式（P0-HOTFIX-1）：
 * 1. SIWE 签名只能证明「调用者控制 wallet_address」— 它不能证明调用者
 *    控制任意 email。禁止仅凭请求体中的 email 把钱包绑定到已有节点。
 *    （旧实现：attacker wallet + attacker signature + victim email ⇒
 *      wallet_address 被写入受害者节点 + skip_otp: true ⇒ 账户接管。已移除。）
 * 2. skip_otp: true 仅表示「已存在的、可信的 wallet-to-node 绑定」
 *    （本钱包此前已通过 OTP 流程完成绑定）。
 * 3. 未绑定的钱包请求带 email ⇒ 403 EMAIL_VERIFICATION_REQUIRED。
 *    响应不区分该 email 是否存在节点（不做 email 查询 → 无枚举信号）。
 *
 * 验证流程：
 * 1. 用 ethers 恢复签名地址
 * 2. 对账：recoveredAddress === address
 * 3. 仅按 wallet_address 查找已有绑定；绝不按 body.email 查询或写入
 * 4. 返回节点状态（genesis/active/new）
 *
 * Rate limit: 10 req/IP/min — prevents auth spam
 *
 * FOLLOW-UP REQUIRED（本批不实现，见 P0-HOTFIX-1 报告）：
 * - server-issued / server-consumed SIWE nonce（当前 nonce 仅由客户端
 *   Date.now() 生成，服务端不校验 → 重放面）
 * - domain / URI / issued-at / expirationTime 校验
 * - 经身份验证的 email→wallet 绑定通道（例如 OTP 会话内完成绑定）
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
  const ip = getClientIP(req);
  const { allowed } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, signature, address, email } = await req.json();

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: message, signature, and address are required" },
        { status: 400 }
      );
    }

    // 1. 验证签名 — 恢复签署地址（仅证明钱包控制权，不证明 email 所有权）
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: "SIGNATURE_MISMATCH: Recovered address does not match claimed address" },
        { status: 401 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // 2. 仅按 wallet_address 查找已有绑定。
    //    P0-HOTFIX-1：body.email 不参与任何数据库查询或写入。
    const { data: node } = await supabase
      .from('protocol_nodes')
      .select('email, status, wallet_address, node_handle')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (node) {
      // 已有可信 wallet-to-node 绑定 — 更新验证时间
      await supabase
        .from('protocol_nodes')
        .update({ wallet_verified_at: new Date().toISOString() })
        .eq('wallet_address', normalizedAddress);
    } else if (email) {
      // P0-HOTFIX-1：钱包签名 ≠ email 所有权证明。
      // 未绑定钱包 + email ⇒ 明确拒绝（不做 email 查询 → 均匀响应，无枚举信号）。
      return NextResponse.json(
        { error: "EMAIL_VERIFICATION_REQUIRED: Wallet signature does not prove email ownership. Verify your email via the OTP verification flow first." },
        { status: 403 }
      );
    }

    // 3. 返回结果 — skip_otp 只能由上方可信绑定路径产生
    const isGenesis = node?.status === 'GENESIS_NODE';
    const isActive = node?.status === 'ACTIVE' || isGenesis;

    return NextResponse.json({
      success: true,
      address: normalizedAddress,
      is_bound: !!node,
      is_genesis: isGenesis,
      is_active: isActive,
      status: node?.status || 'NEW',
      node_handle: node?.node_handle ?? null,
      email: node?.email ?? null,
      // 如果已绑定且激活，前端可跳过邮箱 OTP（仅限可信绑定）
      skip_otp: isActive,
    });
  } catch (error: unknown) {
    console.error('SIWE_ERROR:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

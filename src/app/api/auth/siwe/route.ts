import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * POST /api/auth/siwe — EIP-4361 Sign-In with Ethereum
 *
 * Request payload: { message: string, signature: string, address: string, email?: string }
 *
 * 验证流程：
 * 1. 用 ethers 恢复签名地址
 * 2. 对账：recoveredAddress === address
 * 3. 写入/更新 protocol_nodes 的 wallet_address
 * 4. 返回节点状态（genesis/active/new）
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

    const { message, signature, address, email } = await req.json();

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: message, signature, and address are required" },
        { status: 400 }
      );
    }

    // 1. 验证签名 — 恢复签署地址
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: "SIGNATURE_MISMATCH: Recovered address does not match claimed address" },
        { status: 401 }
      );
    }

    // 2. 查找或更新节点
    const normalizedAddress = address.toLowerCase();
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    // 先按钱包地址查
    let { data: node } = await supabase
      .from('protocol_nodes')
      .select('email, status, wallet_address, node_handle')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (node) {
      // 已有钱包绑定 — 更新验证时间
      await supabase
        .from('protocol_nodes')
        .update({ wallet_verified_at: new Date().toISOString() })
        .eq('wallet_address', normalizedAddress);
    } else if (normalizedEmail) {
      // 按邮箱查找 — 绑定钱包到已有节点
      const { data: emailNode } = await supabase
        .from('protocol_nodes')
        .select('email, status, node_handle')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (emailNode) {
        await supabase
          .from('protocol_nodes')
          .update({
            wallet_address: normalizedAddress,
            wallet_verified_at: new Date().toISOString(),
          })
          .eq('email', normalizedEmail);
        node = { ...emailNode, wallet_address: normalizedAddress };
      }
    }

    // 3. 返回结果
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
      // 如果已绑定且激活，前端可跳过邮箱 OTP
      skip_otp: isActive,
    });
  } catch (error: unknown) {
    console.error('SIWE_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

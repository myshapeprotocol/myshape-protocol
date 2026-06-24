import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Send OTP API — 生成 6 位验证码并发送邮件
 *
 * 安全策略：
 * - 所有凭据从环境变量注入，运行时校验缺失则拒绝请求
 * - Supabase 和 Resend 客户端在 handler 内延迟初始化，避免构建时误用 placeholder
 */

function validateEnv(): { supabaseUrl: string; supabaseKey: string; resendKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!resendKey) missing.push("RESEND_API_KEY");

  if (missing.length > 0) {
    throw new Error(`SERVER_CONFIGURATION_INCOMPLETE: Missing ${missing.join(", ")}`);
  }

  return { supabaseUrl: supabaseUrl!, supabaseKey: supabaseKey!, resendKey: resendKey! };
}

export async function POST(req: Request) {
  try {
    const { supabaseUrl, supabaseKey, resendKey } = validateEnv();
    const resend = new Resend(resendKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, invite_code } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_EMAIL: A valid email address is required" },
        { status: 400 }
      );
    }

    // 1a. 智慧分流：检查是否为老用户
    const { data: existingNode } = await supabase
      .from('protocol_nodes')
      .select('status')
      .eq('email', email.trim())
      .maybeSingle();

    const isReturningUser = existingNode && ['ACTIVE', 'GENESIS_NODE', 'AGENT_ACTIVE'].includes(existingNode.status);

    if (!isReturningUser) {
      // 新用户：必须提供有效的邀请码
      if (!invite_code) {
        return NextResponse.json(
          { error: "INVITE_CODE_REQUIRED: New entity initialization requires a Genesis invite code" },
          { status: 403 }
        );
      }

      const normalized = String(invite_code).trim().toUpperCase();

      if (!/^MYSHAPE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
        return NextResponse.json(
          { error: "INVITE_CODE_FORMAT_INVALID: Expected MYSHAPE-XXXX-XXXX" },
          { status: 400 }
        );
      }

      const { data: inviteData, error: inviteLookupError } = await supabase
        .from('invite_codes')
        .select('code, status')
        .eq('code', normalized)
        .single();

      if (inviteLookupError || !inviteData) {
        return NextResponse.json(
          { error: "INVITE_CODE_INVALID: This invite code was not found" },
          { status: 403 }
        );
      }

      if (inviteData.status === 'USED') {
        return NextResponse.json(
          { error: "INVITE_CODE_ALREADY_USED: This invite code has already been claimed" },
          { status: 409 }
        );
      }

      if (inviteData.status === 'REVOKED') {
        return NextResponse.json(
          { error: "INVITE_CODE_REVOKED: This invite code is no longer active" },
          { status: 410 }
        );
      }

      // 消耗邀请码 — 绑定到此邮箱
      const { error: consumeError } = await supabase
        .from('invite_codes')
        .update({ status: 'USED', used_by: email.trim(), used_at: new Date().toISOString() })
        .eq('code', normalized);

      if (consumeError) {
        console.error('INVITE_CODE_CONSUME_ERROR:', consumeError);
        return NextResponse.json(
          { error: "INVITE_CODE_CONSUME_FAILED" },
          { status: 500 }
        );
      }
    }
    // 老用户：跳过邀请码校验，直接进入 OTP 流程

    // 1b. 生成 6 位随机验证码
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 将邮箱和验证码存入 Supabase（upsert 按 email 去重）
    const { error: dbError } = await supabase
      .from('protocol_nodes')
      .upsert(
        { email, otp_code: otp, status: 'PENDING_VERIFICATION' },
        { onConflict: 'email' }
      );

    if (dbError) throw dbError;

    // 3. 发送验证邮件
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'MyShape Protocol <onboarding@resend.dev>',
      to: email,
      subject: 'ACTION_REQUIRED: IDENTITY_CHALLENGE',
      html: `
        <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333;">
          <h2 style="border-bottom:1px solid #333; padding-bottom:10px">GENESIS_UPLINK_CHALLENGE</h2>
          <p>Detecting new node connection attempt...</p>
          <p>Your unique verification signature is:</p>
          <div style="font-size:32px; font-weight:bold; letter-spacing:8px; margin:20px 0; padding:15px; border:1px dashed #90c8ff; text-align:center;">
            ${otp}
          </div>
          <p style="font-size:10px; color:#555;">TIMESTAMP: ${new Date().toISOString()}</p>
          <p style="font-size:10px; color:#555;">DO_NOT_SHARE_THIS_HASH</p>
        </div>
      `,
    });

    if (emailError) throw emailError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('SEND_OTP_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

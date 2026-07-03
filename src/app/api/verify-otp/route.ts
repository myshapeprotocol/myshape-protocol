import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { otpVerifyLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * Verify OTP API — 校验 6 位验证码并激活节点
 *
 * 验证成功后发送祝贺邮件（Genesis 确认函）
 *
 * 安全策略：
 * - Rate limit: 5 attempts/IP/5min (prevents brute force)
 * - Supabase / Resend 客户端在 handler 内延迟初始化
 * - 运行时校验环境变量
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials"
    );
  }

  return { supabaseUrl, supabaseKey, resendKey };
}

/**
 * 发送 Genesis 确认函 — 祝贺用户成功激活身份
 */
async function sendWelcomeEmail(
  resend: Resend,
  email: string,
  nodeStatus: string
) {
  const isGenesis = nodeStatus === 'GENESIS_NODE';
  const tierLabel = isGenesis
    ? 'GENESIS_COHORT — FOUNDING_ENTITY'
    : 'ACTIVE_NODE — IDENTITY_LAYER';

  const bodyHtml = isGenesis
    ? `<p style="font-size:14px; color:#90c8ff; line-height:1.8; margin-bottom:16px;">
         You have completed the Genesis Ritual. Your Motion Signature is now inscribed into the protocol's root entropy source.
       </p>
       <p style="font-size:13px; color:#90c8ff; line-height:1.8; margin-bottom:16px;">
         This is not an account. It is a <strong>position</strong>.
       </p>
       <p style="font-size:12px; color:#90c8ff; line-height:1.8;">
         As one of the first 100 Genesis Nodes, you are not a user of MyShape — you are part of the cryptographic foundation upon which all subsequent identity verifications derive their statistical significance. Your status (GENESIS_NODE) is permanent. It is not cosmetic. It is structural. Protocol-level metadata, not application-layer decoration.
       </p>`
    : `<p style="font-size:14px; color:#90c8ff; line-height:1.8;">Your node is now <strong>ACTIVE</strong> on the MyShape Protocol identity layer. You are part of the sovereign identity mesh — verified, sovereign, and fully functional.</p>`;

  const nextStepsHtml = `
    <div style="margin:24px 0; padding:16px; border:1px solid rgba(144,200,255,0.15);">
      <p style="font-size:11px; color:#fff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 12px 0;">▸ Protocol Access Points:</p>
      <ol style="padding:0 0 0 18px; margin:0; font-size:11px; color:#90c8ff; line-height:2.2;">
        <li><a href="https://github.com/myshapeprotocol" style="color:#90c8ff;">GitHub — Protocol Specs &amp; Roadmap</a></li>
        <li><a href="https://www.myshape.com/dashboard" style="color:#90c8ff;">Dashboard — Monitor your orbital evolution</a></li>
        <li><a href="https://www.myshape.com/motion-demo" style="color:#90c8ff;">Motion Demo — Contribute entropy to the mesh</a></li>
        ${isGenesis ? '<li><a href="https://discord.gg/zr8Tczard" style="color:#90c8ff;">Discord — Genesis Cohort coordination channel</a></li>' : ''}
      </ol>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyShape Protocol <onboarding@resend.dev>',
    to: email,
    subject: isGenesis
      ? 'GENESIS_CONFIRMED — You Are Now a Protocol Trust Anchor'
      : 'IDENTITY_ACTIVATED — Welcome to MyShape Protocol',
    html: `
      <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333; max-width:560px;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#90c8ff; box-shadow:0 0 12px rgba(144,200,255,0.8); margin-right:8px;"></div>
          <span style="color:#90c8ff; font-size:9px; letter-spacing:0.5em; text-transform:uppercase;">${tierLabel}</span>
        </div>

        <h2 style="border-bottom:1px solid #333; padding-bottom:12px; font-size:18px; font-weight:300; letter-spacing:0.15em; text-align:center; color:#fff;">
          ${isGenesis ? 'GENESIS_RITUAL_COMPLETE' : 'IDENTITY_LAYER_INITIALIZED'}
        </h2>

        ${bodyHtml}

        <div style="margin:24px 0; padding:16px; border:1px dashed rgba(144,200,255,0.3); background:rgba(144,200,255,0.03);">
          <p style="font-size:11px; color:#90c8ff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 8px 0;">▸ Your Protocol Primitives:</p>
          <ul style="list-style:none; padding:0; margin:0; font-size:11px; color:#90c8ff; line-height:2;">
            <li>◈ Sovereign Data-Body initialized — non-corporeal, platform-independent</li>
            <li>◈ Motion-Signature enrolled — zero-knowledge presence verification enabled</li>
            <li>◈ Presence-Engine (PES) calibrated — 128-dim vector, 4D entropy scoring</li>
            ${isGenesis ? '<li>◈ Genesis Cohort — permanent tier, structural protocol metadata</li>' : ''}
          </ul>
        </div>

        ${nextStepsHtml}

        <p style="font-size:8px; color:#333; margin-top:24px; text-align:center;">
          TIMESTAMP: ${new Date().toISOString()}<br/>
          MYSHAPE_PROTOCOL // SPEC_VERSION: V1.0_GENESIS<br/>
          SOVEREIGN_IDENTITY_LAYER — DO_NOT_FORWARD
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[WELCOME_EMAIL] FAILED:', error.message, error);
    // 不抛出 — 邮件发送失败不应阻断验证流程
  } else {
    console.log('[WELCOME_EMAIL] SENT successfully to:', email, '| tier:', nodeStatus);
  }
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = otpVerifyLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey, resendKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    const { email: rawEmail, otp } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: email and otp are required" },
        { status: 400 }
      );
    }

    // 1. 从数据库查询该邮箱的 OTP + node_handle
    const { data, error: dbError } = await supabase
      .from('protocol_nodes')
      .select('otp_code, status, node_handle')
      .eq('email', email)
      .single();

    if (dbError) {
      if (dbError.code === "PGRST116") {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      throw dbError;
    }
    if (!data) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // 2. 匹配验证码
    if (data.otp_code !== otp) {
      return NextResponse.json({ error: "SIGNATURE_INVALID" }, { status: 401 });
    }

    // 3. 验证成功——前 100 名标记为 GENESIS_NODE
    const previousStatus = data.status;
    const isFirstActivation = !['ACTIVE', 'GENESIS_NODE', 'AGENT_ACTIVE'].includes(previousStatus);

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

    // 4. 发送祝贺邮件（仅首次激活时）
    if (resend && isFirstActivation) {
      try {
        console.log('[WELCOME_EMAIL] Sending to:', email, '| tier:', nodeStatus);
        await sendWelcomeEmail(resend, email, nodeStatus);
        console.log('[WELCOME_EMAIL] ✅ Sent successfully');
      } catch (err) {
        console.error('[WELCOME_EMAIL] ❌ Failed:', err);
        // 邮件失败不阻断验证流程
      }
    } else {
      console.warn('[WELCOME_EMAIL] ⚠️ SKIPPED — RESEND_API_KEY not configured');
    }

    // Route C: Return node_handle for identity binding
    const nodeHandle = data.node_handle ?? null;

    return NextResponse.json({ success: true, status: nodeStatus, node_handle: nodeHandle });
  } catch (error: unknown) {
    console.error('VERIFY_OTP_ERROR:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

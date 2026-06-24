import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Verify OTP API — 校验 6 位验证码并激活节点
 *
 * 验证成功后发送祝贺邮件（Genesis 确认函）
 *
 * 安全策略：
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

  const tierBody = isGenesis
    ? `<p style="font-size:14px; color:#90c8ff; line-height:1.8;">You are now a <strong>Genesis Founding Entity</strong> — part of the first 100 nodes to initialize on the MyShape Protocol identity layer.</p>
       <p style="font-size:12px; color:#90c8ff; line-height:1.8;">Permanent tier. Never offered again. Your node carries the GENESIS_NODE designation in perpetuity.</p>`
    : `<p style="font-size:14px; color:#90c8ff; line-height:1.8;">Your node is now <strong>ACTIVE</strong> on the MyShape Protocol identity layer. You are part of the sovereign identity mesh.</p>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyShape Protocol <onboarding@resend.dev>',
    to: email,
    subject: isGenesis
      ? 'GENESIS_CONFIRMED — You are a Founding Entity'
      : 'IDENTITY_ACTIVATED — Welcome to MyShape Protocol',
    html: `
      <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333; max-width:560px;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22d3ee; box-shadow:0 0 12px rgba(34,211,238,0.8); margin-right:8px;"></div>
          <span style="color:#22d3ee; font-size:9px; letter-spacing:0.5em; text-transform:uppercase;">${tierLabel}</span>
        </div>

        <h2 style="border-bottom:1px solid #333; padding-bottom:12px; font-size:18px; font-weight:300; letter-spacing:0.15em; text-align:center; color:#fff;">
          ${isGenesis ? 'GENESIS_RITUAL_COMPLETE' : 'IDENTITY_LAYER_INITIALIZED'}
        </h2>

        ${tierBody}

        <div style="margin:24px 0; padding:16px; border:1px dashed rgba(34,211,238,0.3); background:rgba(34,211,238,0.03);">
          <p style="font-size:11px; color:#90c8ff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 8px 0;">▸ What this means:</p>
          <ul style="list-style:none; padding:0; margin:0; font-size:11px; color:#90c8ff; line-height:2;">
            <li>◈ Sovereign identity initialized on the MyShape Protocol mesh</li>
            <li>◈ Zero-knowledge presence verification enabled</li>
            <li>◈ Motion-signature authentication ready for enrollment</li>
            ${isGenesis ? '<li>◈ Genesis Cohort permanent founding tier — never expires</li>' : ''}
          </ul>
        </div>

        <div style="margin:24px 0; padding:16px; border:1px solid rgba(34,211,238,0.15);">
          <p style="font-size:11px; color:#fff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 12px 0;">▸ Next Steps:</p>
          <ol style="padding:0 0 0 18px; margin:0; font-size:11px; color:#90c8ff; line-height:2.2;">
            <li><a href="https://www.myshape.com/identity" style="color:#22d3ee;">Enter Identity Layer</a> — view your node on the mesh</li>
            <li><a href="https://www.myshape.com/motion-demo" style="color:#22d3ee;">Try Motion Demo</a> — see how motion-signature works</li>
            ${isGenesis ? '<li>Share your invite code with one trusted entity — help grow the Genesis Cohort</li>' : ''}
          </ol>
        </div>

        <p style="font-size:9px; color:#444; margin-top:24px; text-align:center;">
          TIMESTAMP: ${new Date().toISOString()}<br/>
          MYSHAPE_PROTOCOL // SOVEREIGN_IDENTITY_LAYER<br/>
          DO_NOT_FORWARD_THIS_CONFIRMATION
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
  try {
    const { supabaseUrl, supabaseKey, resendKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendKey ? new Resend(resendKey) : null;

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

    return NextResponse.json({ success: true, status: nodeStatus });
  } catch (error: unknown) {
    console.error('VERIFY_OTP_ERROR:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

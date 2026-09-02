import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { otpVerifyLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * Verify OTP API — 校验 6 位验证码并激活节点
 *
 * 安全策略：
 * - Rate limit: 5 attempts/IP/5min (prevents brute force)
 * - OTP single-use via atomic conditional UPDATE
 * - OTP TTL enforcement via otp_expires_at check
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }

  return { supabaseUrl, supabaseKey, resendKey };
}

/**
 * 发送 Genesis 确认函 — 祝贺用户成功激活身份
 */
async function sendWelcomeEmail(resend: Resend, email: string, nodeStatus: string) {
  const isGenesis = nodeStatus === 'GENESIS_NODE';
  const tierLabel = isGenesis
    ? 'GENESIS_COHORT — FOUNDING_ENTITY'
    : 'ACTIVE_NODE — IDENTITY_LAYER';

  const bodyHtml = isGenesis
    ? `<p style="font-size:14px; color:#90c8ff; line-height:1.8;">You have completed the Genesis Ritual.</p>
       <p style="font-size:12px; color:#90c8ff;">As one of the first 100 Genesis Nodes, you are part of the cryptographic foundation of MyShape Protocol.</p>`
    : `<p style="font-size:14px; color:#90c8ff; line-height:1.8;">Your node is now <strong>ACTIVE</strong> on the MyShape Protocol.</p>`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyShape Protocol <onboarding@resend.dev>',
    to: email,
    subject: isGenesis
      ? 'GENESIS_CONFIRMED — You Are Now a Protocol Trust Anchor'
      : 'IDENTITY_ACTIVATED — Welcome to MyShape Protocol',
    html: `
      <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333;">
        <h1 style="font-size:24px; margin:0 0 16px 0;">${isGenesis ? 'GENESIS' : 'IDENTITY'} CONFIRMED</h1>
        <div style="border:1px solid #333; padding:20px; margin:20px 0;">
          <p style="margin:0; font-size:13px; color:#90c8ff;">Status: ${tierLabel}</p>
        </div>
        ${bodyHtml}
        <p style="font-size:8px; color:#333; margin-top:24px; text-align:center;">
          TIMESTAMP: ${new Date().toISOString()}<br/>
          MYSHAPE_PROTOCOL // SOVEREIGN_IDENTITY_LAYER — DO_NOT_FORWARD
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('[WELCOME_EMAIL] FAILED:', error.message, error);
  } else {
    console.log('[WELCOME_EMAIL] SENT successfully to:', email);
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

    const { email: rawEmail, otp } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: email and otp are required" },
        { status: 400 }
      );
    }

    // P0-HOTFIX-2: Atomic OTP consumption via conditional UPDATE
    //
    // Replaces the previous SELECT-then-UPDATE pattern that was vulnerable to:
    // - OTP replay: OTP was never cleared on success
    // - Race conditions: concurrent verifications could both succeed
    // - Legacy OTPs accepted forever (no expiry enforcement)
    //
    // The conditional UPDATE guarantees:
    // - Only ONE concurrent request succeeds for the same OTP (single-use)
    // - OTP is consumed (cleared) on success
    // - TTL is enforced via otp_expires_at > now
    // - Legacy OTPs with NULL otp_expires_at are rejected
    const serverNow = new Date().toISOString();

    const { data: updateResult, error: consumeError } = await supabase
      .from('protocol_nodes')
      .update({
        otp_code: null,
        otp_created_at: null,
        otp_expires_at: null,
        otp_used_at: serverNow,
      })
      .eq('email', email)
      .eq('otp_code', otp)
      .is('otp_used_at', null)                    // Not already used
      .not('otp_expires_at', 'is', null)           // Must have expiry (rejects legacy)
      .gt('otp_expires_at', serverNow)             // Must not be expired
      .select('node_handle, status')
      .single();

    if (consumeError || !updateResult) {
      return NextResponse.json({ error: "SIGNATURE_INVALID" }, { status: 401 });
    }

    // OTP only verifies email ownership — does NOT assign Genesis tier
    const previousStatus = updateResult.status;
    const isFirstActivation = !['ACTIVE', 'GENESIS_NODE', 'AGENT_ACTIVE'].includes(previousStatus);
    const nodeStatus = isFirstActivation ? 'ACTIVE' : previousStatus;

    // Send welcome email (only for first activation)
    const resend = resendKey ? new Resend(resendKey) : null;
    if (resend && isFirstActivation) {
      try {
        console.log('[WELCOME_EMAIL] Sending to:', email);
        await sendWelcomeEmail(resend, email, nodeStatus);
      } catch (err) {
        console.error('[WELCOME_EMAIL] Failed:', err);
      }
    }

    const nodeHandle = updateResult.node_handle ?? null;
    return NextResponse.json({ success: true, status: nodeStatus, node_handle: nodeHandle });
  } catch (error: unknown) {
    console.error('VERIFY_OTP_ERROR:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
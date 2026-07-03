import { Resend } from 'resend';
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { formSubmitLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * Subscribe API — 将邮箱加入协议节点等待列表
 *
 * 新订阅者将收到一封确认邮件，告知他们已被列入 Genesis 邀请队列。
 * Rate limit: 3 req/IP/hour — prevents form spam.
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

async function sendSubscriptionConfirmation(
  resend: Resend,
  email: string
) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyShape Protocol <onboarding@resend.dev>',
    to: email,
    subject: 'UPLINK_ESTABLISHED — You are on the Genesis List',
    html: `
      <div style="background:#000; color:#90c8ff; padding:40px; font-family:monospace; border:1px solid #333; max-width:560px;">
        <div style="text-align:center; margin-bottom:24px;">
          <div style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#90c8ff; box-shadow:0 0 12px rgba(144,200,255,0.8); margin-right:8px;"></div>
          <span style="color:#90c8ff; font-size:9px; letter-spacing:0.5em; text-transform:uppercase;">SIGNAL_SUBSCRIPTION_ACTIVE</span>
        </div>

        <h2 style="border-bottom:1px solid #333; padding-bottom:12px; font-size:18px; font-weight:300; letter-spacing:0.15em; text-align:center; color:#fff;">
          UPLINK_ESTABLISHED
        </h2>

        <p style="font-size:14px; color:#90c8ff; line-height:1.8;">
          Your node has been registered on the <strong>MyShape Protocol Genesis List</strong>.
        </p>

        <p style="font-size:13px; color:#90c8ff; line-height:1.8;">
          Genesis Cohort invitations are rolling out in batches. When your slot opens, you will receive an invitation to complete the identity initialization ritual.
        </p>

        <div style="margin:24px 0; padding:16px; border:1px dashed rgba(144,200,255,0.3); background:rgba(144,200,255,0.03);">
          <p style="font-size:11px; color:#90c8ff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 8px 0;">▸ What to expect:</p>
          <ul style="list-style:none; padding:0; margin:0; font-size:11px; color:#90c8ff; line-height:2;">
            <li>◈ Genesis Cohort: First 100 nodes receive permanent founding tier</li>
            <li>◈ Invitations sent in order of subscription</li>
            <li>◈ Watch your inbox for your Genesis initialization link</li>
          </ul>
        </div>

        <div style="margin:24px 0; padding:16px; border:1px solid rgba(144,200,255,0.15);">
          <p style="font-size:11px; color:#fff; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 12px 0;">▸ While you wait:</p>
          <ol style="padding:0 0 0 18px; margin:0; font-size:11px; color:#90c8ff; line-height:2.2;">
            <li><a href="https://www.myshape.com/papers" style="color:#90c8ff;">Read the Papers</a> — understand the protocol</li>
            <li><a href="https://www.myshape.com/motion-demo" style="color:#90c8ff;">Try the Motion Demo</a> — see the tech in action</li>
            <li><a href="https://x.com/myshapeprotocol" style="color:#90c8ff;">Follow on X</a> — stay updated on Genesis rollouts</li>
          </ol>
        </div>

        <p style="font-size:9px; color:#444; margin-top:24px; text-align:center;">
          TIMESTAMP: ${new Date().toISOString()}<br/>
          MYSHAPE_PROTOCOL // YOUR_POSITION_IS_SECURED<br/>
          DO_NOT_REPLY_TO_THIS_TRANSMISSION
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('SUBSCRIPTION_CONFIRMATION_EMAIL_ERROR:', error);
    // 不抛出 — 邮件发送失败不应阻断订阅流程
  }
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = formSubmitLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey, resendKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    const { email: rawEmail } = await req.json();
    const email = (rawEmail || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    // 检查是否已存在 — PGRST116 = no rows (not an error)
    const { data: existing, error: lookupError } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email.trim())
      .single();

    if (lookupError && lookupError.code !== "PGRST116") {
      throw lookupError;
    }
    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // 新订阅 — 节点状态设为 SUBSCRIBED
    const { error } = await supabase
      .from("protocol_nodes")
      .upsert(
        { email: email.trim(), status: "SUBSCRIBED" },
        { onConflict: "email" }
      );

    if (error) throw error;

    // 发送订阅确认邮件（异步，不阻塞响应）
    if (resend) {
      sendSubscriptionConfirmation(resend, email.trim()).catch((err) =>
        console.error('SUBSCRIPTION_CONFIRMATION_ASYNC_ERROR:', err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[/api/subscribe]", err);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

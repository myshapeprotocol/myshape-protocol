import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 关键修正 1：增加防御性判断，防止 Build 时因为缺少 Key 而崩溃
const resendKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build';
const resend = new Resend(resendKey);

// 关键修正 2：确保 Supabase 变量在没有环境变量时也不会导致运行时 Crash
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    // 检查环境变量是否真实存在（生产环境下）
    if (!process.env.RESEND_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
    }

    const { email } = await req.json(); 
    
    // 1. 生成 6 位随机验证码
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 将邮箱和验证码存入 Supabase
    // 使用 upsert，如果 email 存在则更新，不存在则插入
    const { error: dbError } = await supabase
      .from('protocol_nodes')
      .upsert({ 
        email, 
        otp_code: otp, 
        status: 'PENDING_VERIFICATION' 
      }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // 3. 发送黑客风格的验证邮件
    // 注意：如果你的域名没在 Resend 验证通过，这里必须使用 onboarding@resend.dev
    const { error: emailError } = await resend.emails.send({
      from: 'MyShape Protocol <onboarding@resend.dev>', // 建议先用这个测试，验证通过后再改
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
  } catch (error: any) {
    console.error('API_ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'INTERNAL_SERVER_ERROR' }, 
      { status: 500 }
    );
  }
}
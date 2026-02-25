import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) { // 保持这里为 req
  try {
    // 关键修正：确保变量名与上面定义的 req 一致
    const { email } = await req.json(); 
    
    // 1. 生成 6 位随机验证码
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. 将邮箱和验证码存入 Supabase
    // 这里的 upsert 会自动处理：如果邮箱存在则更新 otp_code，不存在则插入新行
    const { error: dbError } = await supabase
      .from('protocol_nodes')
      .upsert({ 
        email, 
        otp_code: otp, 
        status: 'PENDING_VERIFICATION' 
      }, { onConflict: 'email' });

    if (dbError) throw dbError;

    // 3. 发送黑客风格的验证邮件
    await resend.emails.send({
      // 提示：在你的 DNS 记录变为 Verified 之前，这里可能需要先用 onboarding@resend.dev 测试
      from: 'MyShape Protocol <system@myshape.com>',
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
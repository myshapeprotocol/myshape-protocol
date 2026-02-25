import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    // 1. 从数据库查找该邮箱对应的验证码
    // 使用 .single() 确保只获取一行数据
    const { data, error: fetchError } = await supabase
      .from('protocol_nodes')
      .select('otp_code')
      .eq('email', email)
      .single();

    if (fetchError || !data) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    // 2. 比对验证码 (确保转为字符串比较，防止类型不匹配)
    if (String(data.otp_code) === String(otp)) {
      
      // 3. 验证通过，更新节点状态为正式连接
      const { error: updateError } = await supabase
        .from('protocol_nodes')
        .update({ 
          status: 'GENESIS_CONNECTED' 
          // 如果你之前在表中加了 is_verified 字段，可以保留下面这行
          // is_verified: true 
        })
        .eq('email', email);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true });
    } else {
      // 验证码不匹配
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
    }
  } catch (error: any) {
    console.error('VERIFICATION_CRITICAL_ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
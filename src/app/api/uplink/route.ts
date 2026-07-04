import { NextResponse } from 'next/server';

/**
 * Uplink API — 将 genesis 节点注册到 Supabase
 *
 * 安全策略：
 * - 所有密钥通过环境变量注入，源代码中不包含任何硬编码凭据
 * - 运行时严格校验，环境变量缺失则拒绝请求
 */

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials"
    );
  }

  // 从 URL 提取 project ref，例如 https://xxx.supabase.co → xxx
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";

  return {
    restUrl: `${supabaseUrl}/rest/v1/protocol_nodes`,
    key: supabaseKey,
    projectRef,
  };
}

export async function POST(request: Request) {
  try {
    const { restUrl, key, projectRef } = getSupabaseConfig();

    const { email, node_handle, wallet_address } = await request.json();

    if (!email || !node_handle) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: email and node_handle are required" },
        { status: 400 }
      );
    }

    const normalizedWallet = (wallet_address || "").trim().toLowerCase() || undefined;

    // 先检查是否已存在
    const checkUrl = `${restUrl}?email=eq.${encodeURIComponent(email.trim())}&select=email`;
    const checkRes = await fetch(checkUrl, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'x-supabase-project-ref': projectRef,
      },
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        // Node exists — update wallet_address if provided
        if (normalizedWallet) {
          await fetch(`${restUrl}?email=eq.${encodeURIComponent(email.trim())}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': key,
              'Authorization': `Bearer ${key}`,
              'x-supabase-project-ref': projectRef,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ wallet_address: normalizedWallet }),
          }).catch(() => {});
        }
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          message: "NODE_ALREADY_REGISTERED: This email is already anchored to the protocol mesh.",
        });
      }
    }

    const payload: Record<string, string> = {
      email: email.trim(),
      node_handle: node_handle,
    };
    if (normalizedWallet) {
      payload.wallet_address = normalizedWallet;
    }

    const res = await fetch(restUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'x-supabase-project-ref': projectRef,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error("[/api/uplink] Supabase error:", res.status, responseText);
      return NextResponse.json({ error: "UPSTREAM_ERROR" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[/api/uplink]", err);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

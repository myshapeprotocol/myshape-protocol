import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { apiLookupLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * GET /api/auth/siwe/nonce — Issue a server-generated SIWE nonce
 *
 * Security properties:
 *   - Nonce is generated server-side using crypto.randomUUID() (CSPRNG, 122-bit entropy)
 *   - Nonce is persisted to siwe_nonces table with a short TTL (5 minutes)
 *   - Nonce is single-use: atomic consumption via conditional UPDATE
 *   - Nonce is bound to the domain and chain ID it was issued for
 *
 * Rate limit: 10 req/IP/min — prevents nonce flooding
 */

const NONCE_TTL_MINUTES = 5;

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return { supabaseUrl, supabaseKey };
}

function getAllowedDomain(): string {
  // Production domain from env, fallback to request origin validation
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'myshape.com';
}

export async function GET(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const nonce = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + NONCE_TTL_MINUTES * 60 * 1000);

    const domain = getAllowedDomain();
    const chainId = 8453; // Base Mainnet

    const { error: insertError } = await supabase
      .from('siwe_nonces')
      .insert({
        nonce,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        used_at: null,
        address: null,
        domain,
        chain_id: chainId,
      });

    if (insertError) {
      console.error('SIWE_NONCE_INSERT_ERROR:', insertError);
      return NextResponse.json(
        { error: "INTERNAL_SERVER_ERROR" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      nonce,
      expires_at: expiresAt.toISOString(),
      domain,
      chain_id: chainId,
    });
  } catch (error: unknown) {
    console.error('SIWE_NONCE_ERROR:', error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
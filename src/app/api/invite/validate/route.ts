import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { otpVerifyLimiter, getClientIP } from '@/lib/rate-limiter';

/**
 * Validate invite code API — checks if a beta invite code is valid and unused.
 *
 * POST /api/invite/validate
 * Request: { code: string }
 * Response: { valid: boolean, code?: string, error?: string }
 *
 * Security:
 * - Rate limit: 5 attempts/IP/5min (prevents enumeration)
 * - Format validation before DB query
 * - PGRST116 distinguished from genuine DB errors
 */

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }

  return { supabaseUrl, supabaseKey };
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = otpVerifyLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ valid: false, error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: "INVITE_CODE_REQUIRED" },
        { status: 400 }
      );
    }

    // Normalize: uppercase, trim whitespace
    const normalized = code.trim().toUpperCase();

    // Validate format: MYSHAPE-XXXX-XXXX
    if (!/^MYSHAPE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized)) {
      return NextResponse.json(
        { valid: false, error: "INVITE_CODE_FORMAT_INVALID" },
        { status: 400 }
      );
    }

    // Check if code exists and is unused
    const { data, error: dbError } = await supabase
      .from('invite_codes')
      .select('code, status')
      .eq('code', normalized)
      .single();

    if (dbError) {
      if (dbError.code === "PGRST116") {
        return NextResponse.json({ valid: false, error: "INVITE_CODE_NOT_FOUND" }, { status: 404 });
      }
      console.error("[/api/invite/validate] Supabase error:", dbError.code, dbError.message);
      return NextResponse.json({ valid: false, error: "DATABASE_ERROR" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ valid: false, error: "INVITE_CODE_NOT_FOUND" }, { status: 404 });
    }

    if (data.status === 'USED') {
      return NextResponse.json(
        { valid: false, error: "INVITE_CODE_ALREADY_USED" },
        { status: 409 }
      );
    }

    if (data.status === 'REVOKED') {
      return NextResponse.json(
        { valid: false, error: "INVITE_CODE_REVOKED" },
        { status: 410 }
      );
    }

    return NextResponse.json({ valid: true, code: normalized });
  } catch (error: unknown) {
    console.error('INVITE_VALIDATE_ERROR:', error);
    return NextResponse.json(
      { valid: false, error: (error as Error).message || 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

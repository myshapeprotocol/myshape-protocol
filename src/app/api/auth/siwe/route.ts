import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { apiLookupLimiter, getClientIP } from '@/lib/rate-limiter';
import {
  parseSiweMessage,
  validateSiweTimestamps,
  validateSiweDomain,
  validateSiweUri,
  validateSiweChainId,
} from '@/lib/siwe-parser';

/**
 * POST /api/auth/siwe — EIP-4361 Sign-In with Ethereum (with replay protection)
 *
 * Request payload: { message: string, signature: string, address: string }
 *
 * Security invariants (P0-HOTFIX-1 + P0-AUTH):
 * 1. SIWE signature proves ONLY control of wallet_address — NOT email ownership.
 * 2. skip_otp: true only for pre-existing trusted wallet-to-node bindings.
 * 3. Unbound wallet + email → 403 EMAIL_VERIFICATION_REQUIRED.
 * 4. Nonce must be server-issued, unexpired, unused, and atomically consumed.
 * 5. Domain, URI, and chain ID must match allowed values.
 * 6. SIWE message timestamps must be valid (not expired, not future-dated).
 *
 * Verification order:
 *   parse message → validate structure → validate domain/URI/chain
 *   → validate timestamps → verify signature → atomic consume nonce
 *   → lookup binding → return result
 */

const ALLOWED_CHAIN_IDS = [8453]; // Base Mainnet

function getAllowedDomains(): string[] {
  const envDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '');
  if (envDomain) return [envDomain];
  return ['myshape.com', 'localhost'];
}

function validateEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return { supabaseUrl, supabaseKey };
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
  }

  try {
    const { supabaseUrl, supabaseKey } = validateEnv();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, signature, address, email } = await req.json();

    if (!message || !signature || !address) {
      return NextResponse.json(
        { error: "MISSING_FIELDS: message, signature, and address are required" },
        { status: 400 }
      );
    }

    // 1. Parse SIWE message
    const parseResult = parseSiweMessage(message);
    if (!parseResult.ok) {
      return NextResponse.json(
        { error: `SIWE_INVALID_MESSAGE: ${parseResult.error}` },
        { status: 400 }
      );
    }
    const siweMsg = parseResult.message;

    // 2. Validate domain
    const allowedDomains = getAllowedDomains();
    if (!validateSiweDomain(siweMsg, allowedDomains)) {
      return NextResponse.json(
        { error: "SIWE_INVALID_DOMAIN: Domain not allowed" },
        { status: 400 }
      );
    }

    // 3. Validate URI
    if (!validateSiweUri(siweMsg, allowedDomains)) {
      return NextResponse.json(
        { error: "SIWE_INVALID_URI: URI not allowed" },
        { status: 400 }
      );
    }

    // 4. Validate chain ID
    if (!validateSiweChainId(siweMsg, ALLOWED_CHAIN_IDS)) {
      return NextResponse.json(
        { error: "SIWE_INVALID_CHAIN: Chain ID not allowed" },
        { status: 400 }
      );
    }

    // 5. Validate timestamps
    const tsError = validateSiweTimestamps(siweMsg);
    if (tsError) {
      return NextResponse.json(
        { error: `SIWE_TIMESTAMP_ERROR: ${tsError}` },
        { status: 400 }
      );
    }

    // 6. Verify cryptographic signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      return NextResponse.json(
        { error: "SIGNATURE_INVALID: Could not verify signature" },
        { status: 401 }
      );
    }

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json(
        { error: "SIGNATURE_MISMATCH: Recovered address does not match claimed address" },
        { status: 401 }
      );
    }

    // Verify message address matches signature
    if (recoveredAddress.toLowerCase() !== siweMsg.address.toLowerCase()) {
      return NextResponse.json(
        { error: "SIGNATURE_MISMATCH: Message address does not match signature" },
        { status: 401 }
      );
    }

    // 7. Atomically consume the nonce (replay protection)
    const { data: consumedNonce, error: consumeError } = await supabase
      .rpc('consume_siwe_nonce', {
        p_nonce: siweMsg.nonce,
        p_address: address.toLowerCase(),
      });

    if (consumeError || !consumedNonce) {
      console.error('SIWE_NONCE_CONSUME_ERROR:', consumeError);
      return NextResponse.json(
        { error: "SIWE_NONCE_INVALID: Nonce is invalid, expired, or already used" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // 8. Look up existing wallet binding (by wallet_address only, never by email)
    const { data: node } = await supabase
      .from('protocol_nodes')
      .select('email, status, wallet_address, node_handle')
      .eq('wallet_address', normalizedAddress)
      .maybeSingle();

    if (node) {
      await supabase
        .from('protocol_nodes')
        .update({ wallet_verified_at: new Date().toISOString() })
        .eq('wallet_address', normalizedAddress);
    } else if (email) {
      return NextResponse.json(
        { error: "EMAIL_VERIFICATION_REQUIRED: Wallet signature does not prove email ownership. Verify your email via the OTP verification flow first." },
        { status: 403 }
      );
    }

    // 9. Return result
    const isGenesis = node?.status === 'GENESIS_NODE';
    const isActive = node?.status === 'ACTIVE' || isGenesis;

    return NextResponse.json({
      success: true,
      address: normalizedAddress,
      is_bound: !!node,
      is_genesis: isGenesis,
      is_active: isActive,
      status: node?.status || 'NEW',
      node_handle: node?.node_handle ?? null,
      email: node?.email ?? null,
      skip_otp: isActive,
    });
  } catch (error: unknown) {
    console.error('SIWE_ERROR:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR' },
      { status: 500 }
    );
  }
}

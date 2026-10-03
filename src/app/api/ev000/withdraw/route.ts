// ============================================================
// POST /api/ev000/withdraw — withdraw an EV-000 enrollment
//
// Implements canonical §9.
//
// THE PARTICIPANT REF IS A CAPABILITY, NOT AN IDENTITY CLAIM
//
// It arrives in the request PAYLOAD, never in the URL: a URL would land in
// access logs, proxy logs, and browser history. Canonical §3 and §9.
//
// Unknown fields are REJECTED rather than ignored. If a caller also sends
// `email`, `name`, or `wallet`, the request fails outright instead of
// quietly succeeding on the ref. That is the structural guarantee behind
// canonical §9: identity is never an alternative withdrawal capability,
// because identity cannot be submitted here at all.
//
// NO ENROLLMENT DATA IS RETURNED
//
// The response never includes enrollment_id, enrolled_at, retention_until,
// or consent_version, and it does not distinguish "no such ref" from
// "already withdrawn" — both are the same opaque response, so this route
// cannot be used to test whether a given ref belongs to someone.
//
// THE RAW REF IS NEVER LOGGED
//
// Failures log a reason string produced by the store, which is written so
// that it never contains the submitted value.
// ============================================================

import { NextResponse } from "next/server";
import { getClientIP, RateLimiter } from "@/lib/rate-limiter";
import {
  createEv000EnrollmentStoreFromEnv,
  EV000_WITHDRAWAL_CONTACT,
} from "@/lib/ev000/enrollment-store";

/**
 * Withdrawal rate limit. Higher than enrollment because a participant may
 * legitimately retry, but still bounded so a ref cannot be brute-forced:
 * a 256-bit ref is not guessable, and the limit exists to stop enumeration
 * of the endpoint's behaviour rather than the ref space.
 */
const withdrawLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
});

const MAX_BODY_BYTES = 1024;
const MAX_REF_LEN = 128;

/** The only key this endpoint accepts. */
const REF_KEY = "participantRef";

export const runtime = "nodejs";

/** One response for every unresolvable outcome. */
const OPAQUE_FAILURE = {
  ok: false as const,
  error: "We could not process that request.",
};

export async function POST(request: Request): Promise<Response> {
  const { allowed, resetAt } = withdrawLimiter.check(getClientIP(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(resetAt / 1000)) } },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(OPAQUE_FAILURE, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(OPAQUE_FAILURE, { status: 400 });
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json(OPAQUE_FAILURE, { status: 400 });
  }

  const payload = raw as Record<string, unknown>;

  // Reject anything that is not exactly the ref. This is what makes an
  // identity claim unusable as an alternative capability: it cannot be sent.
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== REF_KEY) {
    return NextResponse.json(OPAQUE_FAILURE, { status: 400 });
  }

  const participantRef = payload[REF_KEY];
  if (
    typeof participantRef !== "string" ||
    participantRef.length === 0 ||
    participantRef.length > MAX_REF_LEN
  ) {
    return NextResponse.json(OPAQUE_FAILURE, { status: 400 });
  }

  let store: Awaited<ReturnType<typeof createEv000EnrollmentStoreFromEnv>>;
  try {
    store = await createEv000EnrollmentStoreFromEnv();
  } catch {
    return NextResponse.json(OPAQUE_FAILURE, { status: 503 });
  }

  const result = await store.withdraw(participantRef, new Date().toISOString());

  if (!result.ok) {
    // No ref in this log line, and no distinction between the failure kinds.
    console.error("[ev000-withdraw] rejected");
    return NextResponse.json(OPAQUE_FAILURE, { status: 422 });
  }

  return NextResponse.json(
    {
      ok: true,
      withdrawn: true,
      withdrawnAt: result.withdrawnAt,
      withdrawalContact: EV000_WITHDRAWAL_CONTACT,
    },
    { status: 200 },
  );
}
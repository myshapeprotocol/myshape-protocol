import { NextResponse } from "next/server";
import { RateLimiter, getClientIP } from "@/lib/rate-limiter";
import {
  createOperatorSessionToken,
  verifyOperatorSecret,
  OPERATOR_COOKIE,
  OPERATOR_COOKIE_PATH,
  OPERATOR_SESSION_SECONDS,
} from "@/lib/operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /lab/research-responses/login
 *
 * Exchanges OPERATOR_SECRET for an HttpOnly session cookie.
 *
 * The secret is read from the form body only. It is never placed in the URL,
 * never echoed back, and never logged. On failure the response is identical
 * whether the environment variable is missing or the secret is wrong, so the
 * endpoint does not disclose which case occurred.
 *
 * Rate limited per IP. The limiter instance is local to this module, so it
 * does not share counters with the survey or participation limiters.
 */
const loginLimiter = new RateLimiter({ maxRequests: 10, windowMs: 15 * 60 * 1000 });

function redirectToLogin(): NextResponse {
  return NextResponse.redirect(new URL("/lab/research-responses", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), { status: 303 });
}

export async function POST(request: Request): Promise<Response> {
  const { allowed } = loginLimiter.check(getClientIP(request));
  if (!allowed) {
    // Deliberately identical to a bad secret: no signal about the state.
    return redirectToLogin();
  }

  let submitted: string | null = null;
  try {
    const form = await request.formData();
    const raw = form.get("secret");
    submitted = typeof raw === "string" ? raw : null;
  } catch {
    return redirectToLogin();
  }

  if (!verifyOperatorSecret(submitted)) {
    // No secret, wrong secret, or unset environment variable — all fail
    // closed with no distinction to the caller.
    return redirectToLogin();
  }

  const secret = process.env.OPERATOR_SECRET as string;
  const token = createOperatorSessionToken(secret);

  const res = NextResponse.redirect(new URL("/lab/research-responses", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), { status: 303 });
  res.cookies.set(OPERATOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: OPERATOR_COOKIE_PATH,
    maxAge: OPERATOR_SESSION_SECONDS,
  });
  return res;
}

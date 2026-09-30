import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Operator session — server-only.
 *
 * A single shared operator secret gates a read-only view of the research
 * response tables. This is NOT an identity system: there are no accounts, no
 * per-operator records, and no user directory. It is a single-key gate.
 *
 * The session token is an HMAC-SHA256 signed value. The raw secret is never
 * placed in the cookie — only its signature is.
 *
 * Node runtime only. `node:crypto` is unavailable on the Edge runtime, so
 * every route/page that imports this must declare `runtime = "nodejs"`.
 */

export const OPERATOR_COOKIE = "op_session";

/** Path-scoped: the cookie is not sent to any other route. */
export const OPERATOR_COOKIE_PATH = "/lab/research-responses";

/** One hour. Enforced by the cookie and re-checked on the server. */
export const OPERATOR_SESSION_SECONDS = 60 * 60;

/** Tolerance for clock drift when rejecting future-dated tokens. */
const CLOCK_SKEW_SECONDS = 60;

type Payload = {
  /** Token format version. */
  v: 1;
  /** Issued-at, epoch seconds. */
  iat: number;
};

function b64url(input: Buffer): string {
  return input.toString("base64url");
}

function sign(data: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

/**
 * Constant-time comparison of two strings. Length is compared first, which
 * leaks only the length of the expected value — never its contents.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify a submitted secret against OPERATOR_SECRET.
 *
 * Fails closed: if the environment variable is absent, no comparison is
 * attempted and the result is false. There is no development bypass.
 */
export function verifyOperatorSecret(submitted: string | null | undefined): boolean {
  const expected = process.env.OPERATOR_SECRET;
  if (!expected) return false;
  if (!submitted) return false;
  return safeEqual(submitted, expected);
}

export function createOperatorSessionToken(secret: string, now: number = Date.now()): string {
  const payload: Payload = { v: 1, iat: Math.floor(now / 1000) };
  const encoded = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signature = b64url(sign(encoded, secret));
  return `${encoded}.${signature}`;
}

/**
 * Verify a session token.
 *
 * Rejects: missing input, wrong format, bad signature, tampered payload,
 * wrong version, expired, and future-dated tokens. Never throws.
 */
export function verifyOperatorSessionToken(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (!token || !secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return false;

  const expected = b64url(sign(encoded, secret));
  if (!safeEqual(signature, expected)) return false;

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload;
  } catch {
    return false;
  }

  if (!payload || payload.v !== 1 || typeof payload.iat !== "number") return false;

  const nowSec = Math.floor(now / 1000);
  if (payload.iat > nowSec + CLOCK_SKEW_SECONDS) return false; // future-dated
  if (nowSec - payload.iat > OPERATOR_SESSION_SECONDS) return false; // expired

  return true;
}

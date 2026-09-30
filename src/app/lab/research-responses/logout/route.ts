import { NextResponse } from "next/server";
import { OPERATOR_COOKIE, OPERATOR_COOKIE_PATH } from "@/lib/operator-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /lab/research-responses/logout
 *
 * Clears the session cookie. POST only — a GET would let a third-party page
 * sign the operator out via an image or link.
 */
export async function POST(): Promise<Response> {
  const res = NextResponse.redirect(
    new URL("/lab/research-responses", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    { status: 303 },
  );
  res.cookies.set(OPERATOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: OPERATOR_COOKIE_PATH,
    maxAge: 0,
  });
  return res;
}

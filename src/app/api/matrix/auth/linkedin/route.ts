import { NextResponse } from "next/server";

/**
 * GET /api/matrix/auth/linkedin
 *
 * Initiates LinkedIn OAuth2 Authorization Code flow.
 * Redirects to LinkedIn's consent page.
 *
 * Required env vars: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 * Callback: /api/matrix/auth/linkedin/callback
 */

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "LINKEDIN_CLIENT_ID not configured in .env.local" },
      { status: 500 },
    );
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/matrix/auth/linkedin/callback`;
  const scope = "openid profile w_member_social email";

  // Cryptographically secure CSRF state, stored in cookie for callback validation
  const state = crypto.randomUUID();

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return response;
}

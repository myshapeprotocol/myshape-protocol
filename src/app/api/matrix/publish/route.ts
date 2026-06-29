import { NextResponse } from "next/server";

/**
 * POST /api/matrix/publish
 *
 * Dual-mode publish endpoint:
 * - Bluesky: full ATP protocol push via @atproto/api
 * - LinkedIn: placeholder (LinkedIn API v2 requires OAuth user token)
 * - LINK-type platforms are handled client-side (clipboard + window.open)
 *
 * Payload: { platform, content, title, url, publishType }
 */
export async function POST(request: Request) {
  try {
    const { platform, content, title, url } = await request.json();

    if (!platform || !content) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS: platform and content required" },
        { status: 400 },
      );
    }

    const result: Record<string, unknown> = {
      platform,
      title: title || "",
      content_length: content.length,
      timestamp: new Date().toISOString(),
    };

    // ── Bluesky ──
    if (platform === "bluesky") {
      const identifier = process.env.BLUESKY_IDENTIFIER || process.env.BLUESKY_HANDLE;
      const password = process.env.BLUESKY_PASSWORD;

      if (!identifier || !password) {
        result.status = "SKIPPED";
        result.error = "BLUESKY_CREDENTIALS_MISSING";
        console.log("[matrix/publish] Bluesky skipped — missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD");
        return NextResponse.json({ success: false, ...result });
      }

      try {
        const { BskyAgent } = await import("@atproto/api");
        const agent = new BskyAgent({ service: "https://bsky.social" });
        await agent.login({ identifier: identifier.trim(), password: password.trim() });

        // Truncate to Bluesky's 300-char limit
        const truncated = content.length > 290 ? content.slice(0, 287) + "..." : content;
        const post = await agent.post({ text: truncated, createdAt: new Date().toISOString() });

        result.status = "PUBLISHED";
        result.platform_post_id = post.uri;
        console.log("[matrix/publish] Bluesky published:", post.uri);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown Bluesky error";
        result.status = "FAILED";
        result.error = msg;
        console.error("[matrix/publish] Bluesky error:", msg);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── LinkedIn ──
    if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      // LinkedIn requires OAuth2 user token — not yet implemented
      // For now: log + return preview status
      if (!clientId || !clientSecret) {
        result.status = "SKIPPED";
        result.error = "LINKEDIN_CREDENTIALS_MISSING";
        console.log("[matrix/publish] LinkedIn skipped — missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET");
      } else {
        result.status = "PREVIEW";
        result.note = "LinkedIn OAuth2 user token not configured. Credentials found — ready for next phase.";
        console.log("[matrix/publish] LinkedIn preview:", JSON.stringify({ title, content_length: content.length }));
      }
      return NextResponse.json({ success: true, ...result });
    }

    // ── Unknown / LINK-type platforms ──
    result.status = "PREVIEW";
    result.note = "LINK-type platform — handled client-side via clipboard + window.open";
    console.log("[matrix/publish] Preview for", platform, ":", JSON.stringify({ title, content_length: content.length }));
    return NextResponse.json({ success: true, ...result });

  } catch (err) {
    console.error("[matrix/publish] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

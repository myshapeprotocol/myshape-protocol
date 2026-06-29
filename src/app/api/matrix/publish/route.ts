import { NextResponse } from "next/server";

/**
 * POST /api/matrix/publish
 *
 * Receives a publish request from the Matrix Dashboard "批准并分发" button.
 * Currently returns a preview — actual platform API integration is WIP.
 *
 * Payload: { platform: "hn"|"linkedin"|"x"|"bluesky", content: string, title: string, url: string }
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

    // ── Platform routing (WIP — actual publishing coming soon) ──
    const publishResult = {
      platform,
      title: title || "",
      content_length: content.length,
      url: url || "",
      status: "PREVIEW", // Will become "PUBLISHED" once API keys are configured
      preview_at: new Date().toISOString(),
    };

    // Log to server console for audit trail
    console.log("[matrix/publish]", JSON.stringify(publishResult));

    return NextResponse.json({
      success: true,
      ...publishResult,
      note: "Platform API not yet configured — this is a preview. Content has been logged.",
    });
  } catch (err) {
    console.error("[matrix/publish] Error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

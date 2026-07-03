/**
 * GET /api/admin/calibration/status
 *
 * Returns the current calibration status — session count, active artifact
 * metadata, and whether the system meets the minimum threshold for calibration.
 *
 * Requires x-admin-secret header (same as calibration run).
 * Full artifact JSON is NOT exposed — only summary metadata.
 */

import { NextResponse } from "next/server";
import { getSessionCount } from "@/lib/research-data-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    // Admin auth — same validation as calibration run
    const secret = request.headers.get("x-admin-secret");
    const expected = process.env.ADMIN_SECRET;
    const isDev = process.env.NODE_ENV === "development";
    if (!expected && !isDev) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (expected && secret !== expected) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { getCalibrationLoader } = await import("@/lib/calibration-loader");
    const loader = await getCalibrationLoader();
    const state = loader.getState();

    let sessionCount = 0;
    try {
      sessionCount = await getSessionCount();
    } catch {
      // Session count unavailable — DB may not be configured
    }

    return NextResponse.json({
      // Calibration state
      calibrated: state.isCalibrated,
      source: state.source,

      // Current thresholds
      thresholds: state.thresholds,

      // Artifact metadata (null if vacuum)
      artifact: state.metadata,

      // Research data status
      research_sessions_count: sessionCount,
      meets_minimum_threshold: sessionCount >= 300,
      sessions_needed: Math.max(0, 300 - sessionCount),

      // Timestamps
      artifact_generated_at: state.generatedAt
        ? new Date(state.generatedAt).toISOString()
        : null,
      checked_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Status check failed";
    console.error("[admin/calibration/status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

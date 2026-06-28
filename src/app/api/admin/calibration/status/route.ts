/**
 * GET /api/admin/calibration/status
 *
 * Returns the current calibration status — session count, active artifact
 * metadata, and whether the system meets the minimum threshold for calibration.
 *
 * No authentication required for GET (read-only status).
 * Full artifact JSON is NOT exposed — only summary metadata.
 */

import { NextResponse } from "next/server";
import { getCalibrationLoader } from "@/lib/calibration-loader";
import { getSessionCount } from "@/lib/research-data-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
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

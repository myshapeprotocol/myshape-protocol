/**
 * POST /api/admin/calibration/run
 *
 * Triggers a full calibration run:
 *   1. Fetches all research sessions from Supabase
 *   2. Validates minimum session threshold (≥300)
 *   3. Runs the Phase E-2 calibration pipeline
 *   4. Validates the resulting artifact
 *   5. Stores the artifact in calibration_artifacts
 *   6. Activates it (deactivates previous)
 *   7. Refreshes the CalibrationLoader singleton
 *
 * Authentication: ADMIN_SECRET header required.
 *
 * This endpoint is designed to be called:
 *   - Manually via admin dashboard
 *   - Automatically via cron job (e.g., daily)
 *   - As a Supabase Database Webhook (on research_sessions INSERT)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchResearchSessions } from "@/lib/research-data-loader";
import { runCalibration, validateArtifact, run120DimCalibration } from "@/engine/calibration/index";
import type { CalibrationConfig } from "@/engine/calibration/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Admin Auth ────────────────────────────────────────────────────

function validateAdminAuth(request: Request): boolean {
  const secret = request.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    // If ADMIN_SECRET is not configured, allow in development only
    return process.env.NODE_ENV === "development";
  }
  return secret === expected;
}

// ── Supabase Client ───────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return createClient(url, key);
}

// ── Handler ───────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  // ── Auth ──
  if (!validateAdminAuth(request)) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Valid x-admin-secret header required" },
      { status: 401 },
    );
  }

  const startTime = Date.now();

  try {
    // ── Step 1: Fetch Sessions ──
    console.log("[admin/calibration/run] Fetching research sessions...");
    const { sessions, totalCount, meetsThreshold } = await fetchResearchSessions();

    if (!meetsThreshold) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_DATA",
          message: `Need ≥300 sessions for calibration. Current: ${totalCount}. Need ${300 - totalCount} more.`,
          session_count: totalCount,
        },
        { status: 400 },
      );
    }

    // Filter to sessions with adequate data
    const validSessions = sessions.filter(
      (s) => s.landmark_data && s.landmark_data.length >= 30,
    );

    if (validSessions.length < 300) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_VALID_DATA",
          message: `Found ${totalCount} total sessions but only ${validSessions.length} have ≥30 valid frames. Need ${300 - validSessions.length} more valid sessions.`,
          total_sessions: totalCount,
          valid_sessions: validSessions.length,
        },
        { status: 400 },
      );
    }

    // ── Step 2: Parse config overrides ──
    let configOverrides: Partial<CalibrationConfig> = {};
    let useRustFeatures = false;
    try {
      const body = await request.json();
      if (body.pca_output_dim) configOverrides.pcaOutputDim = body.pca_output_dim;
      if (body.feature_mode) configOverrides.featureMode = body.feature_mode;
      if (body.target_fars) configOverrides.targetFars = body.target_fars;
      if (body.min_variance) configOverrides.minVarianceRetained = body.min_variance;
      if (body.use_rust_features === true) useRustFeatures = true;
    } catch {
      // No body or invalid JSON — use defaults
    }

    // ── Step 3: Run Calibration ──
    let artifact;
    let diagnostics: { sessionCount: number; featureDim?: number; varianceRetained: number; separationMargin: number; warnings: string[] };

    if (useRustFeatures) {
      // Route B: 120-dim Rust-native feature calibration
      console.log(`[admin/calibration/run] Running 120-dim Rust-native calibration on ${validSessions.length} sessions...`);
      const wasm = await loadWasmForCalibration();
      const result = await run120DimCalibration(validSessions, wasm, configOverrides);
      artifact = result.artifact;
      diagnostics = {
        sessionCount: result.diagnostics.sessionCount,
        featureDim: result.diagnostics.featureDim,
        varianceRetained: artifact.pca.cumulativeVariance.length > 0
          ? artifact.pca.cumulativeVariance[artifact.pca.cumulativeVariance.length - 1]
          : 0,
        separationMargin: 0, // computed below
        warnings: result.diagnostics.warnings,
      };
    } else {
      // Default: 54-dim posture calibration
      console.log(`[admin/calibration/run] Running 54-dim posture calibration on ${validSessions.length} sessions...`);
      const result = runCalibration(validSessions, configOverrides);
      artifact = result.artifact;
      diagnostics = result.diagnostics;
    }

    // ── Step 4: Validate ──
    const validationErrors = validateArtifact(artifact);
    if (validationErrors.length > 0) {
      console.error("[admin/calibration/run] Artifact validation failed:", validationErrors);
      return NextResponse.json(
        {
          success: false,
          error: "ARTIFACT_VALIDATION_FAILED",
          validation_errors: validationErrors,
        },
        { status: 500 },
      );
    }

    // ── Step 5: Store in Supabase ──
    console.log("[admin/calibration/run] Storing artifact...");
    const supabase = getSupabase();

    const ops = artifact.roc.operatingPoints;
    const thresholdLow = ops[2]?.threshold ?? 0.70;  // 10% FAR
    const thresholdMed = ops[1]?.threshold ?? 0.75;  // 5% FAR
    const thresholdHigh = ops[0]?.threshold ?? 0.80; // 1% FAR

    const { data: inserted, error: insertError } = await supabase
      .from("calibration_artifacts")
      .insert({
        version: artifact.version,
        label: artifact.label,
        artifact_json: artifact as unknown as Record<string, unknown>,
        session_count: artifact.totalSessions,
        frame_count: artifact.totalFrames,
        pca_output_dim: artifact.pca.outputDim,
        variance_retained: diagnostics.varianceRetained,
        d_prime: artifact.roc.dPrime,
        eer: artifact.roc.eer,
        auc: artifact.roc.auc,
        threshold_low: thresholdLow,
        threshold_med: thresholdMed,
        threshold_high: thresholdHigh,
        is_active: false, // will activate below
        training_set_hash: artifact.trainingSetHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[admin/calibration/run] Insert failed:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: "STORAGE_FAILED",
          message: insertError.message,
        },
        { status: 500 },
      );
    }

    const newArtifactId: number = (inserted as { id: number }).id;

    // ── Step 6: Activate (deactivate previous, activate new) ──
    console.log(`[admin/calibration/run] Activating artifact #${newArtifactId}...`);

    // Deactivate all currently active
    const { error: deactivateError } = await supabase
      .from("calibration_artifacts")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      console.warn("[admin/calibration/run] Deactivate warning:", deactivateError.message);
    }

    // Activate the new one
    const { error: activateError } = await supabase
      .from("calibration_artifacts")
      .update({ is_active: true, activated_at: new Date().toISOString() })
      .eq("id", newArtifactId);

    if (activateError) {
      console.error("[admin/calibration/run] Activation failed:", activateError);
    }

    // ── Step 7: Refresh CalibrationLoader ──
    const { getCalibrationLoader } = await import("@/lib/calibration-loader");
    const loader = await getCalibrationLoader();
    await loader.refresh();
    const newState = loader.getState();

    const elapsed = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        artifact_id: newArtifactId,
        activated: !activateError,
        elapsed_ms: elapsed,

        // Artifact summary
        sessions: artifact.totalSessions,
        frames: artifact.totalFrames,
        pca_input_dim: artifact.pca.inputDim,
        pca_output_dim: artifact.pca.outputDim,
        variance_retained: diagnostics.varianceRetained,
        d_prime: artifact.roc.dPrime,
        eer: artifact.roc.eer,
        auc: artifact.roc.auc,

        // New thresholds
        threshold_low: thresholdLow,
        threshold_med: thresholdMed,
        threshold_high: thresholdHigh,

        // Diagnostics
        separation_margin: diagnostics.separationMargin,
        warnings: diagnostics.warnings,

        // Loader state
        loader_source: newState.source,
        loader_calibrated: newState.isCalibrated,

        // Artifact (compact — full JSON stored in DB)
        artifact_label: artifact.label,
        artifact_hash: artifact.trainingSetHash,
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Calibration failed";
    console.error("[admin/calibration/run] Fatal error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "CALIBRATION_FAILED",
        message,
        elapsed_ms: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

// ── WASM Engine Loader (for 120-dim calibration) ──────────────────

interface WasmCalibrationModule {
  extract_feature_vector(motion_json: string): string;
  get_feature_dim(): number;
}

let _wasmForCalibration: WasmCalibrationModule | null = null;

async function loadWasmForCalibration(): Promise<WasmCalibrationModule> {
  if (_wasmForCalibration) return _wasmForCalibration;

  // Dynamic import from the WASM package
  const wasm = await import('../../../../../../wasm/pkg/myshape_wasm.js');
  _wasmForCalibration = wasm as WasmCalibrationModule;
  return _wasmForCalibration;
}

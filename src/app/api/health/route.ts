/**
 * GET /api/health — System Health Check
 *
 * Verifies critical service connectivity without exposing secrets.
 * Returns 200 if all services are reachable, 503 if any are down.
 *
 * Checked services:
 *   - Supabase (research_sessions table accessible)
 *   - WASM engine (loadable)
 *   - Calibration state (vacuum or active)
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: Record<string, { ok: boolean; latency_ms: number; error?: string }>;
  calibration: {
    active: boolean;
    source: string;
    sessions_collected: number;
  };
}

export async function GET(): Promise<Response> {
  const services: HealthStatus["services"] = {};
  let allOk = true;

  // ── Supabase ──
  const supabaseStart = Date.now();
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      services.supabase = { ok: false, latency_ms: Date.now() - supabaseStart, error: "Missing env vars" };
      allOk = false;
    } else {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key);
      const { error } = await supabase.from("research_sessions").select("session_id", { count: "exact", head: true });
      services.supabase = {
        ok: !error,
        latency_ms: Date.now() - supabaseStart,
        ...(error ? { error: error.message } : {}),
      };
      if (error) allOk = false;
    }
  } catch (err) {
    services.supabase = { ok: false, latency_ms: Date.now() - supabaseStart, error: (err as Error).message };
    allOk = false;
  }

  // ── WASM Engine ──
  const wasmStart = Date.now();
  try {
    const wasm = await import('../../../../wasm/pkg/myshape_wasm.js');
    // Verify a basic function is callable
    const dim = wasm.get_feature_dim?.() ?? 0;
    services.wasm = {
      ok: dim === 120,
      latency_ms: Date.now() - wasmStart,
      ...(dim !== 120 ? { error: `Unexpected feature dim: ${dim}` } : {}),
    };
    if (dim !== 120) allOk = false;
  } catch (err) {
    services.wasm = { ok: false, latency_ms: Date.now() - wasmStart, error: (err as Error).message };
    allOk = false;
  }

  // ── Calibration State ──
  let calibrationActive = false;
  let calibrationSource = "unknown";
  let sessionsCollected = 0;
  try {
    const { getCalibrationLoader } = await import("@/lib/calibration-loader");
    const loader = await getCalibrationLoader();
    const state = loader.getState();
    calibrationActive = state.isCalibrated;
    calibrationSource = state.source;
    // Try to get session count from stats endpoint (same process — may not have Supabase)
    sessionsCollected = state.metadata?.sessionCount ?? 0;
  } catch {
    // Calibration loader unavailable — expected if Supabase not configured
  }

  const status: HealthStatus = {
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services,
    calibration: {
      active: calibrationActive,
      source: calibrationSource,
      sessions_collected: sessionsCollected,
    },
  };

  return NextResponse.json(status, {
    status: allOk ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

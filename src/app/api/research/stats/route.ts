/**
 * GET /api/research/stats — Public Research Statistics
 *
 * Returns the current state of the anonymous motion research pipeline.
 * No authentication required. Response is cached for 5 minutes (CDN-friendly).
 *
 * This endpoint serves three purposes:
 *   1. Live counter for the homepage "N research contributions" display
 *   2. Quick health check for the data collection pipeline
 *   3. Transparency — shows exactly what's being collected (no PII)
 *
 * Response:
 *   {
 *     session_count: number,        // total anonymous research sessions
 *     sessions_needed: number,      // remaining to hit 300 minimum
 *     meets_threshold: boolean,     // whether calibration can run
 *     progress_pct: number,         // 0-100, capped at 100
 *     latest_session_at: string | null,  // ISO timestamp of most recent upload
 *   }
 */

import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Simple in-memory cache (edge-compatible)
let cachedResponse: { data: ResearchStatsResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface ResearchStatsResponse {
  session_count: number;
  sessions_needed: number;
  meets_threshold: boolean;
  progress_pct: number;
  latest_session_at: string | null;
  checked_at: string;
}

export async function GET(): Promise<Response> {
  // Check cache
  const now = Date.now();
  if (cachedResponse && now - cachedResponse.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { ...cachedResponse.data, checked_at: new Date().toISOString() },
      { headers: cacheHeaders() },
    );
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      // No Supabase configured — return zeros gracefully
      const fallback: ResearchStatsResponse = {
        session_count: 0,
        sessions_needed: 300,
        meets_threshold: false,
        progress_pct: 0,
        latest_session_at: null,
        checked_at: new Date().toISOString(),
      };
      return NextResponse.json(fallback, {
        headers: { ...cacheHeaders(), "X-Data-Source": "vacuum" },
      });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);

    // Get count
    const { count, error: countError } = await supabase
      .from("research_sessions")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    const sessionCount = count ?? 0;

    // Get latest timestamp
    const { data: latest, error: latestError } = await supabase
      .from("research_sessions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const latestAt = latestError || !latest ? null : (latest as { created_at: string }).created_at;

    const response: ResearchStatsResponse = {
      session_count: sessionCount,
      sessions_needed: Math.max(0, 300 - sessionCount),
      meets_threshold: sessionCount >= 300,
      progress_pct: Math.min(100, Math.round((sessionCount / 300) * 100)),
      latest_session_at: latestAt,
      checked_at: new Date().toISOString(),
    };

    // Update cache
    cachedResponse = { data: response, timestamp: now };

    return NextResponse.json(response, { headers: cacheHeaders() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stats unavailable";
    console.error("[research/stats]", message);

    // Return stale cache if available
    if (cachedResponse) {
      return NextResponse.json(
        { ...cachedResponse.data, checked_at: new Date().toISOString() },
        { headers: { ...cacheHeaders(), "X-Data-Source": "stale-cache" } },
      );
    }

    return NextResponse.json(
      {
        session_count: 0,
        sessions_needed: 300,
        meets_threshold: false,
        progress_pct: 0,
        latest_session_at: null,
        checked_at: new Date().toISOString(),
        error: message,
      },
      {
        status: 200, // Don't error out the UI — show zeros
        headers: { ...cacheHeaders(), "X-Data-Source": "error" },
      },
    );
  }
}

function cacheHeaders(): Record<string, string> {
  return {
    "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
  };
}

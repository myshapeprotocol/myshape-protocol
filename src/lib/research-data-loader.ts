// ============================================================
// MyShape Protocol — Phase E-3 Research Data Loader
// ============================================================
//
// Fetches anonymous research sessions from Supabase for
// calibration pipeline consumption.
//
// Privacy: only loads landmark_data + metadata. No PII.

import type { ResearchSession } from "@/engine/calibration/types";

export interface SessionQueryResult {
  sessions: ResearchSession[];
  totalCount: number;
  /** Whether the minimum threshold for calibration is met */
  meetsThreshold: boolean;
}

/**
 * Fetch all research sessions from Supabase.
 *
 * Loads landmark_data as JSONB. For large datasets, pagination
 * should be added. The current Phase E-2 target (300 sessions ×
 * ~900 frames × 54 dims × 8 bytes ≈ 116 MB) fits in memory
 * for server-side processing.
 */
export async function fetchResearchSessions(): Promise<SessionQueryResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  // First, get the count
  const { count, error: countError } = await supabase
    .from("research_sessions")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;
  const totalCount = count ?? 0;

  // Fetch all sessions
  const { data, error } = await supabase
    .from("research_sessions")
    .select("session_id, node_handle, landmark_data, pes_score, device_os, device_browser, lighting_condition")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const sessions: ResearchSession[] = (data ?? []).map((row: Record<string, unknown>) => ({
    session_id: row.session_id as string,
    node_handle: (row.node_handle as string) ?? null,
    landmark_data: row.landmark_data as ResearchSession["landmark_data"],
    pes_score: row.pes_score as number | null,
    device_os: row.device_os as string | null,
    device_browser: row.device_browser as string | null,
    lighting_condition: row.lighting_condition as string | null,
  }));

  return {
    sessions,
    totalCount,
    meetsThreshold: totalCount >= 300,
  };
}

/**
 * Get only the session count (cheap query for status checks).
 */
export async function getSessionCount(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const { count, error } = await supabase
    .from("research_sessions")
    .select("*", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

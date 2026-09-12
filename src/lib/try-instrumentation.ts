/**
 * BATCH-005B — Diagnostic instrumentation for /try verification runs.
 *
 * Scope: DEVELOPMENT/RESEARCH DIAGNOSTICS ONLY.
 *
 * This module provides read-only access to locally-stored verification
 * diagnostics. It does NOT touch any protocol semantics, CPS-0001,
 * EE-001/003, signing, Supabase, or network behavior.
 *
 * Storage:
 *   localStorage["myshape-diagnostic-sessions"]
 *   → Array of session objects (most recent at end)
 *   → Each session contains roundInstrumentation[]
 *   → roundInstrumentation contains raw sensor samples per round
 *
 * This is a research-only diagnostic surface. Production verification
 * logic is NOT affected.
 */

export const DIAGNOSTIC_STORAGE_KEY = "myshape-diagnostic-sessions";

export interface RawSensorSample {
  t: number;
  alpha: number;
  beta: number;
  gamma: number;
  ax: number;
  ay: number;
  az: number;
  orientation: number | "unknown";
}

export interface RoundInstrumentation {
  roundId: string;
  direction: string;
  axis: "rx" | "ry";
  expectedSign: number;
  samples: RawSensorSample[];
  peakMagnitude: number;
  signedPeakDegS: number;
  match: boolean;
  orientation: number | "unknown";
}

export interface DiagnosticSession {
  sessionId: string;
  timestamp: string;
  userAgent: string;
  host: string;
  route: string;
  rounds: RoundInstrumentation[];
}

/**
 * Read all diagnostic sessions from localStorage.
 * Returns empty array if none exist or if running in SSR.
 */
export function getDiagnosticSessions(): DiagnosticSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DiagnosticSession[];
  } catch {
    return [];
  }
}

/**
 * Copy all diagnostic sessions to clipboard as formatted JSON.
 * Uses navigator.clipboard with a textarea fallback.
 */
export async function copyDiagnosticSessions(): Promise<"copied" | "failed"> {
  const sessions = getDiagnosticSessions();
  const json = JSON.stringify(sessions, null, 2);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(json);
      return "copied";
    }
    // Fallback: create hidden textarea
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = json;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok ? "copied" : "failed";
    }
    return "failed";
  } catch {
    return "failed";
  }
}

/**
 * Trigger a browser download of all diagnostic sessions as a JSON file.
 * Filename: myshape-diagnostic-sessions.json
 * Fully client-side — no network requests.
 */
export function downloadDiagnosticSessions(): void {
  const sessions = getDiagnosticSessions();
  const json = JSON.stringify(sessions, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "myshape-diagnostic-sessions.json";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convenience helper for browser console access.
 */
declare global {
  interface Window {
    __myshape_export_diagnostics__: () => DiagnosticSession[];
  }
}

if (typeof window !== "undefined") {
  window.__myshape_export_diagnostics__ = getDiagnosticSessions;
}

// ═══════════════════════════════════════════════════════════════════
// EE-003-EVIDENCE-001 — session writer (observation-only)
//
// The reader surface above existed without any producer: nothing on /try
// ever populated "myshape-diagnostic-sessions". These functions add the
// missing writer so real-phone runs persist per-round raw rotationRate
// samples (alpha/beta/gamma + orientation). Strictly additive: no
// verification state, EE-001/EE-003 scoring, threshold, verdict, or
// receipt semantics are touched.
// ═══════════════════════════════════════════════════════════════════

/** Cap on stored sessions — raw per-round sample arrays are large; keep the
 * most recent sessions only (localStorage quota safety). */
export const MAX_DIAGNOSTIC_SESSIONS = 25;

/** Session identifier: crypto.randomUUID() when available (secure contexts —
 * /try requires HTTPS in production), else a timestamped fallback. Diagnostic
 * correlation id only — not security-relevant. */
export function newDiagnosticSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `diag-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Append a DiagnosticSession (most recent at end) and trim to
 * MAX_DIAGNOSTIC_SESSIONS. Returns true on success; false on SSR or quota
 * errors. Never throws — evidence recording must not break verification.
 */
export function recordDiagnosticSession(session: DiagnosticSession): boolean {
  if (typeof window === "undefined") return false;
  try {
    const next = [...getDiagnosticSessions(), session].slice(-MAX_DIAGNOSTIC_SESSIONS);
    localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
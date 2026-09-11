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
// ═══════════════════════════════════════════════════════════════════
// EE-003-DIAGNOSTICS-002 — Compact diagnostic instrumentation for /try
//
// Scope: DEVELOPMENT/RESEARCH DIAGNOSTICS ONLY.
//
// This module provides read/write access to locally-stored verification
// diagnostics. It does NOT touch any protocol semantics, CPS-0001,
// EE-001/EE-003, signing, Supabase, or network behavior.
//
// Storage (compact, bounded):
//   localStorage["myshape-diagnostic-sessions-v2"]
//   → Array of CompactDiagnosticSession objects (most recent at end)
//   → At most MAX_DIAGNOSTIC_SESSIONS sessions retained
//   → Each round retains only bounded representative samples (first /
//     peak / last) — NOT the full raw DeviceMotion sample array.
//
// Full raw DeviceMotion samples are no longer persisted continuously;
// they were causing localStorage bloat (observed 265 KB on production
// phones after repeated /try runs with 25 retained sessions).
//
// Migration: on first access, the legacy "myshape-diagnostic-sessions"
// key is cleaned up (best-effort) so old oversized payloads do not
// linger.
//
// This is a research-only diagnostic surface. Production verification
// logic is NOT affected.
// ═══════════════════════════════════════════════════════════════════


// Compact schema (v2): rounds carry bounded representative samples only.
export const DIAGNOSTIC_STORAGE_KEY = "myshape-diagnostic-sessions-v2";

// Legacy key (v1): stored full raw sample arrays. Cleaned up on migration.
const LEGACY_DIAGNOSTIC_STORAGE_KEY = "myshape-diagnostic-sessions";

// Maximum number of sessions retained in localStorage.
export const MAX_DIAGNOSTIC_SESSIONS = 3;

// Maximum number of representative samples kept per round.
const MAX_REPRESENTATIVE_SAMPLES = 3;

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

export interface RepresentativeSample {
  t: number;
  alpha: number;
  beta: number;
  gamma: number;
  ax: number;
  ay: number;
  az: number;
  orientation: number | "unknown";
  role: "first" | "peak" | "last";
}

export interface CompactRoundInstrumentation {
  roundId: string;
  direction: string;
  axis: "rx" | "ry";
  expectedSign: number;
  sampleCount: number;
  representativeSamples: RepresentativeSample[];
  peakMagnitude: number;
  signedPeakDegS: number;
  match: boolean;
  orientation: number | "unknown";
}

export interface CompactDiagnosticSession {
  sessionId: string;
  timestamp: string;
  userAgent: string;
  host: string;
  route: string;
  rounds: CompactRoundInstrumentation[];
}

// Backward-compatible aliases so existing consumers compile without changes.
export type DiagnosticSession = CompactDiagnosticSession;
export type RoundInstrumentation = CompactRoundInstrumentation;

/**
 * Build a bounded set of representative samples (first / peak / last) from
 * an array of raw samples. If the input is empty, returns an empty array.
 * The peak sample is chosen by absolute value on the EE-003 relevant axis.
 */
export function toRepresentativeSamples(
  samples: RawSensorSample[],
  signedPeakAxis: "alpha" | "beta" | "gamma",
): RepresentativeSample[] {
  if (samples.length === 0) return [];
  const out: RepresentativeSample[] = [toRepresentative(samples[0], "first")];
  let peakIdx = 0;
  let peakAbs = Math.abs(samples[0][signedPeakAxis]);
  for (let i = 1; i < samples.length; i++) {
    const v = Math.abs(samples[i][signedPeakAxis]);
    if (v > peakAbs) {
      peakAbs = v;
      peakIdx = i;
    }
  }
  const lastIdx = samples.length - 1;
  if (peakIdx !== 0) out.push(toRepresentative(samples[peakIdx], "peak"));
  if (lastIdx !== 0 && lastIdx !== peakIdx) {
    out.push(toRepresentative(samples[lastIdx], "last"));
  }
  return out.slice(0, MAX_REPRESENTATIVE_SAMPLES);
}

function toRepresentative(
  s: RawSensorSample,
  role: RepresentativeSample["role"],
): RepresentativeSample {
  return {
    t: s.t,
    alpha: s.alpha,
    beta: s.beta,
    gamma: s.gamma,
    ax: s.ax,
    ay: s.ay,
    az: s.az,
    orientation: s.orientation,
    role,
  };
}

/**
 * Read all compact diagnostic sessions from localStorage.
 * Returns empty array if none exist or if running in SSR.
 * Silently migrates from the legacy v1 key on first read.
 */
export function getDiagnosticSessions(): CompactDiagnosticSession[] {
  if (typeof window === "undefined") return [];
  migrateLegacyStorage();
  try {
    const raw = localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CompactDiagnosticSession[];
  } catch {
    return [];
  }
}

/**
 * Best-effort migration: remove the legacy oversized key so old payloads
 * do not compound localStorage bloat. Failures are swallowed.
 */
function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(LEGACY_DIAGNOSTIC_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_DIAGNOSTIC_STORAGE_KEY);
    }
  } catch {
    // ignore — localStorage access can fail (private mode, quota, etc.)
  }
}

/**
 * Copy all diagnostic sessions to clipboard as compact, formatted JSON.
 * Uses navigator.clipboard with a textarea fallback. Graceful on failure.
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
    __myshape_export_diagnostics__: () => CompactDiagnosticSession[];
  }
}

if (typeof window !== "undefined") {
  window.__myshape_export_diagnostics__ = getDiagnosticSessions;
}

// ═══════════════════════════════════════════════════════════════════
// Session writer (observation-only)
//
// Strictly additive: no verification state, EE-001/EE-003 scoring,
// threshold, verdict, or receipt semantics are touched.
// ═══════════════════════════════════════════════════════════════════

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
 * Append a compact DiagnosticSession (most recent at end) and trim to
 * MAX_DIAGNOSTIC_SESSIONS. Returns true on success; false on SSR or quota
 * errors. Never throws — evidence recording must not break verification.
 */
export function recordDiagnosticSession(session: CompactDiagnosticSession): boolean {
  if (typeof window === "undefined") return false;
  try {
    migrateLegacyStorage();
    const next = [...getDiagnosticSessions(), session].slice(-MAX_DIAGNOSTIC_SESSIONS);
    localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

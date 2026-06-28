"use client";

/**
 * AdminClient — Calibration Control Dashboard (Route C)
 *
 * Monitors research data collection, displays calibration status,
 * and provides one-click calibration triggers with live feedback.
 *
 * Access: /admin (no auth for status reads; actions require ADMIN_SECRET)
 */

import { useState, useEffect, useCallback } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";

interface CalibrationStatus {
  calibrated: boolean;
  source: string;
  thresholds: { low: number; medium: number; high: number };
  artifact: {
    sessionCount: number;
    pcaOutputDim: number;
    varianceRetained: number;
    dPrime: number;
    eer: number;
    auc: number;
  } | null;
  research_sessions_count: number;
  meets_minimum_threshold: boolean;
  sessions_needed: number;
  artifact_generated_at: string | null;
}

interface ResearchStats {
  session_count: number;
  sessions_needed: number;
  meets_threshold: boolean;
  progress_pct: number;
  latest_session_at: string | null;
}

type RunState = "idle" | "running" | "success" | "error";

export default function AdminClient() {
  const [status, setStatus] = useState<CalibrationStatus | null>(null);
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [runResult, setRunResult] = useState<string>("");
  const [use120Dim, setUse120Dim] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch("/api/admin/calibration/status"),
        fetch("/api/research/stats"),
      ]);
      setStatus(await statusRes.json());
      setStats(await statsRes.json());
    } catch {
      // Dashboard unavailable — probably no Supabase configured
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000); // 30s refresh
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleRunCalibration = async () => {
    if (!adminSecret) { setRunResult("Enter ADMIN_SECRET first"); return; }
    setRunState("running");
    setRunResult("");
    try {
      const res = await fetch("/api/admin/calibration/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Secret": adminSecret,
        },
        body: JSON.stringify({ use_rust_features: use120Dim }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRunState("success");
        setRunResult(
          `✓ Calibrated! #${data.artifact_id} | d'=${data.d_prime?.toFixed(2)} | ` +
          `Thresholds: L=${data.threshold_low?.toFixed(2)} M=${data.threshold_med?.toFixed(2)} H=${data.threshold_high?.toFixed(2)} | ` +
          `${data.elapsed_ms}ms`,
        );
        fetchStatus();
      } else {
        setRunState("error");
        setRunResult(`✗ ${data.error}: ${data.message || ""}`);
      }
    } catch (err) {
      setRunState("error");
      setRunResult(`✗ Network error: ${(err as Error).message}`);
    }
  };

  const progressPct = stats?.progress_pct ?? 0;
  const meetsMin = status?.meets_minimum_threshold ?? false;

  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono min-h-screen">
      <ProtocolHeader />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
        <div className="space-y-4 mb-10">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">Engine_Calibration // Admin_Console</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.12em] text-white uppercase">
            Calibration <span style={{ color: "rgba(144,200,255,0.6)" }}>Control</span>
          </h1>
        </div>

        {/* ── Status Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Research Sessions */}
          <div className="border border-white/10 bg-black/40 p-5 space-y-3" style={{ borderRadius: 4 }}>
            <div className="text-white/25 text-[8px] tracking-[0.2em] uppercase">Research Sessions</div>
            <div className="text-3xl font-light text-white/70 tabular-nums">
              {stats?.session_count ?? "—"}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-white/15">Toward 300</span>
                <span className="text-cyan-400/40">{progressPct}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: meetsMin
                      ? "rgba(34,211,238,0.6)"
                      : "linear-gradient(90deg, rgba(144,200,255,0.2), rgba(144,200,255,0.5))",
                  }} />
              </div>
            </div>
            {stats?.latest_session_at && (
              <div className="text-white/15 text-[7px]">
                Latest: {new Date(stats.latest_session_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Calibration State */}
          <div className="border border-white/10 bg-black/40 p-5 space-y-3" style={{ borderRadius: 4 }}>
            <div className="text-white/25 text-[8px] tracking-[0.2em] uppercase">Calibration</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status?.calibrated ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "bg-white/20"}`} />
              <span className={`text-lg font-light ${status?.calibrated ? "text-cyan-300/80" : "text-white/30"}`}>
                {status?.calibrated ? "ACTIVE" : "VACUUM"}
              </span>
            </div>
            <div className="text-white/15 text-[8px] uppercase tracking-[0.1em]">
              Source: {status?.source ?? "—"}
            </div>
            {status?.artifact && (
              <div className="text-white/20 text-[8px] space-y-0.5">
                <div>d&apos;={status.artifact.dPrime.toFixed(2)} | EER={(status.artifact.eer * 100).toFixed(1)}%</div>
                <div>{status.artifact.sessionCount} sessions | {status.artifact.pcaOutputDim}d PCA</div>
              </div>
            )}
          </div>

          {/* Thresholds */}
          <div className="border border-white/10 bg-black/40 p-5 space-y-3" style={{ borderRadius: 4 }}>
            <div className="text-white/25 text-[8px] tracking-[0.2em] uppercase">Thresholds</div>
            <div className="space-y-2">
              {(["high", "medium", "low"] as const).map((level) => (
                <div key={level} className="flex justify-between items-center">
                  <span className="text-white/20 text-[9px] uppercase tracking-[0.15em]">{level}</span>
                  <span className="text-cyan-300/60 text-[14px] tabular-nums font-mono">
                    {status?.thresholds[level]?.toFixed(3) ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Calibration Trigger ── */}
        <div className="border border-white/10 bg-black/40 p-5 space-y-4" style={{ borderRadius: 4 }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-white/30 text-[10px] tracking-[0.15em] uppercase mb-1">Run Calibration</div>
              <div className="text-white/15 text-[8px]">
                {meetsMin
                  ? `${stats?.session_count ?? 0} sessions collected — ready to calibrate`
                  : `Need ${status?.sessions_needed ?? 300} more sessions`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[9px] text-white/25 cursor-pointer">
                <input
                  type="checkbox"
                  checked={use120Dim}
                  onChange={(e) => setUse120Dim(e.target.checked)}
                  className="accent-cyan-400"
                />
                120-dim Rust
              </label>
              <input
                type="password"
                placeholder="ADMIN_SECRET"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="bg-black/60 border border-white/10 px-3 py-1.5 text-[9px] text-white/50 tracking-[0.1em] outline-none focus:border-cyan-400/30 w-36"
                style={{ borderRadius: 2 }}
              />
              <button
                onClick={handleRunCalibration}
                disabled={runState === "running" || !meetsMin}
                className="px-6 py-2 border text-[9px] tracking-[0.2em] uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  borderColor: meetsMin ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.05)",
                  color: meetsMin ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.15)",
                  borderRadius: 2,
                }}
              >
                {runState === "running" ? "Running..." : "Calibrate"}
              </button>
            </div>
          </div>

          {/* Result */}
          {runResult && (
            <div className={`p-3 border text-[9px] tracking-[0.06em] font-mono ${
              runState === "success" ? "border-cyan-400/20 bg-cyan-400/[0.03] text-cyan-300/60" :
              runState === "error" ? "border-red-400/20 bg-red-400/[0.03] text-red-300/60" :
              "border-white/10 bg-white/[0.02] text-white/40"
            }`} style={{ borderRadius: 3 }}>
              {runResult}
            </div>
          )}
        </div>

        {/* ── Quick Links ── */}
        <div className="mt-8 flex gap-4 text-[8px] tracking-[0.15em] uppercase">
          <a href="/motion-demo" className="text-cyan-400/30 hover:text-cyan-400/60 transition-colors">Motion Demo →</a>
          <a href="/api/research/stats" className="text-cyan-400/30 hover:text-cyan-400/60 transition-colors">Stats API →</a>
          <a href="/api/admin/calibration/status" className="text-cyan-400/30 hover:text-cyan-400/60 transition-colors">Status API →</a>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}

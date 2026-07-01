"use client";
import { useState, useEffect } from "react";

interface Status { total_nodes: number; genesis_nodes: number; genesis_remaining: number; active_humans: number; agents: number; last_scan: string | null; cohort_sealed: boolean; status: string; }

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const f = () => window.fetch("/api/nodes/status").then(r => r.json()).then(d => { if (d.status) setStatus(d); setLoading(false); }).catch(() => setLoading(false));
    f(); const i = setInterval(f, 30000); return () => clearInterval(i);
  }, []);

  if (loading) return (
    <div className="text-center">
      <span className="text-white/10 font-mono text-[10px] tracking-[0.15em]">$ protocol_status --sync...</span>
    </div>
  );

  if (!status) return (
    <div className="text-center">
      <span className="text-red-400/20 font-mono text-[10px] tracking-[0.15em]">$ signal_lost</span>
    </div>
  );

  const hasNodes = status.total_nodes > 0;
  const daysUp = Math.max(1, Math.floor((Date.now() - new Date("2026-06-01").getTime()) / 86400000));

  return (
    <div className="text-center select-none">
      <span className="font-mono text-[10px] md:text-[11px] tracking-[0.12em] leading-relaxed"
        style={{ color: "rgba(255,255,255,0.18)" }}>
        <span style={{ color: "rgba(144,200,255,0.25)" }}>$ </span>
        protocol
        <span style={{ color: hasNodes ? "rgba(74,222,128,0.35)" : "rgba(144,200,255,0.3)" }}>:{status.status}</span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}> | </span>
        genesis
        <span style={{ color: status.cohort_sealed ? "rgba(74,222,128,0.35)" : status.genesis_nodes > 0 ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.15)" }}>:{status.genesis_nodes}/100</span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}> | </span>
        nodes
        <span style={{ color: hasNodes ? "rgba(144,200,255,0.3)" : "rgba(255,255,255,0.15)" }}>:{status.active_humans}h+{status.agents}a</span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}> | </span>
        uptime
        <span style={{ color: "rgba(255,255,255,0.2)" }}>:T+{daysUp}d</span>
        <span style={{ color: "rgba(255,255,255,0.06)" }}> | </span>
        <span style={{ color: hasNodes ? "rgba(144,200,255,0.3)" : "rgba(255,255,255,0.15)" }}>
          {hasNodes ? "mesh_active" : "pre_genesis"}
        </span>
        <span className="animate-pulse" style={{ color: "rgba(144,200,255,0.2)" }}>_</span>
      </span>
    </div>
  );
}

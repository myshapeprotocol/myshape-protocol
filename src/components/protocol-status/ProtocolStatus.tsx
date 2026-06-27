"use client";
import { useState, useEffect } from "react";

interface Status {
  total_nodes: number;
  genesis_nodes: number;
  genesis_remaining: number;
  active_humans: number;
  agents: number;
  last_scan: string | null;
  cohort_sealed: boolean;
  status: string;
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const fetch = () => {
      window
        .fetch("/api/nodes/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.status) {
            const prev = status?.total_nodes || 0;
            setStatus(data);
            if (data.total_nodes > prev) {
              setPulse(true);
              setTimeout(() => setPulse(false), 1500);
            }
          }
        })
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div className="w-full border-t border-white/[0.04] bg-transparent py-3">
      <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[9px] tracking-[0.2em] uppercase font-mono">
        {/* 活性指示器 */}
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${pulse ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-cyan-400/60 shadow-[0_0_4px_rgba(34,211,238,0.4)]"}`} />
          <span className="text-white/20">Protocol</span>
          <span className="text-cyan-400/60">{status.status}</span>
        </div>

        <span className="text-white/[0.06] hidden md:block">|</span>

        {/* 创世席位 */}
        <div className="flex items-center gap-2">
          <span className="text-white/15">Genesis</span>
          <span className="text-cyan-400/50">{status.genesis_nodes}</span>
          <span className="text-white/10">/100</span>
          {!status.cohort_sealed && (
            <span className="text-white/[0.08]">— {status.genesis_remaining} open</span>
          )}
          {status.cohort_sealed && (
            <span className="text-cyan-400/30 text-[7px] tracking-[0.3em]">SEALED</span>
          )}
        </div>

        <span className="text-white/[0.06] hidden md:block">|</span>

        {/* 活跃节点 */}
        <div className="flex items-center gap-2">
          <span className="text-white/15">Nodes</span>
          <span className="text-cyan-400/50">{status.active_humans}</span>
          <span className="text-white/10">human</span>
          <span className="text-white/[0.06]">+</span>
          <span className="text-cyan-400/30">{status.agents}</span>
          <span className="text-white/10">agent</span>
        </div>

        {status.last_scan && (
          <>
            <span className="text-white/[0.06] hidden md:block">|</span>
            <div className="flex items-center gap-2">
              <span className="text-white/15">Last Scan</span>
              <span className="text-white/20">{status.last_scan}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";

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

function Dot({ color = "cyan", pulse = false }: { color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean }) {
  const map = {
    cyan:  "bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]",
    green: "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]",
    amber: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.4)]",
    muted: "bg-white/15",
  };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${map[color]} ${pulse ? "animate-pulse" : ""}`} />;
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pulse, setPulse] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  // Scan line animation
  useEffect(() => {
    const t = setInterval(() => setScanPos(p => (p + 1) % 100), 100);
    return () => clearInterval(t);
  }, []);

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

  const hasNodes = status.total_nodes > 0;

  return (
    <div className="relative w-full border-t border-white/[0.03] bg-gradient-to-b from-white/[0.01] to-transparent">
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-[1px]"
          style={{
            top: `${scanPos}%`,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.04) 50%, transparent)",
          }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-4">
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-x-6 gap-y-2">
          {/* Left: protocol identity */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-default group/status"
              onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}
            >
              <Dot color={hasNodes ? "green" : "cyan"} pulse={hasNodes} />
              <span className="text-white/30 text-[11px] tracking-[0.15em] uppercase font-mono group-hover/status:text-white/55 transition-colors">
                PROTOCOL
              </span>
              <span className="text-cyan-400/70 text-[11px] tracking-[0.12em] uppercase font-mono group-hover/status:text-cyan-400/90 transition-colors">
                {status.status}
              </span>
            </div>

            <span className="text-white/[0.06] select-none">·</span>

            <div
              className="flex items-center gap-2 cursor-default group/status"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
            >
              <Dot color={status.cohort_sealed ? "green" : "amber"} pulse={!status.cohort_sealed && status.genesis_nodes > 0} />
              <span className="text-white/30 text-[11px] tracking-[0.15em] uppercase font-mono group-hover/status:text-white/55 transition-colors">
                GENESIS
              </span>
              <span className="text-amber-400/70 text-[11px] tracking-[0.12em] uppercase font-mono group-hover/status:text-amber-400/90 transition-colors">
                {status.genesis_nodes}<span className="text-white/15">/100</span>
              </span>
              {status.cohort_sealed && (
                <span className="text-green-400/70 text-[10px] tracking-[0.2em] uppercase font-mono">SEALED</span>
              )}
              {!status.cohort_sealed && status.genesis_nodes > 0 && (
                <span className="text-white/22 text-[10px] tracking-[0.1em] uppercase font-mono">{status.genesis_remaining} open</span>
              )}
            </div>

            <span className="text-white/[0.06] select-none">·</span>

            <div
              className="flex items-center gap-2 cursor-default group/status"
              onMouseEnter={() => playTick(550, "sine", 0.04, 0.01)}
            >
              <Dot color={hasNodes ? "cyan" : "muted"} pulse={hasNodes} />
              <span className="text-white/30 text-[11px] tracking-[0.15em] uppercase font-mono group-hover/status:text-white/55 transition-colors">
                NODES
              </span>
              <span className="text-cyan-400/70 text-[11px] tracking-[0.12em] uppercase font-mono group-hover/status:text-cyan-400/90 transition-colors">
                {status.active_humans}h
              </span>
              <span className="text-white/[0.08]">+</span>
              <span className="text-cyan-400/60 text-[11px] tracking-[0.12em] uppercase font-mono group-hover/status:text-cyan-400/90 transition-colors">
                {status.agents}a
              </span>
            </div>
          </div>

          {/* Right: meta */}
          <div className="flex items-center gap-4">
            {status.last_scan && (
              <div
                className="flex items-center gap-2 cursor-default group/status"
                onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
              >
                <span className="text-white/22 text-[10px] tracking-[0.12em] uppercase font-mono group-hover/status:text-white/40 transition-colors">
                  LAST_SCAN
                </span>
                <span className="text-white/30 text-[10px] tracking-[0.06em] font-mono group-hover/status:text-white/55 transition-colors">
                  {status.last_scan}
                </span>
              </div>
            )}

            <span className="text-white/[0.04] select-none">|</span>

            <div className="flex items-center gap-2">
              <span className="text-white/22 text-[10px] tracking-[0.15em] uppercase font-mono">
                T+{(status.total_nodes * 7) || 0}d
              </span>
              <span className="text-white/22 text-[10px] tracking-[0.1em] uppercase font-mono">
                {status.total_nodes > 0 ? "MESH_ACTIVE" : "AWAITING"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

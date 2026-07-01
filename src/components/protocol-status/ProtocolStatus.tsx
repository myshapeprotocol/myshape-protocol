"use client";
import { useState, useEffect, useRef } from "react";
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

function StatBadge({ label, value, color = "cyan", pulse = false, freq = 500 }: {
  label: string; value: React.ReactNode; color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean; freq?: number;
}) {
  const accentVal = {
    cyan:  "text-cyan-400/70 group-hover/b:text-cyan-400/90",
    green: "text-green-400/70 group-hover/b:text-green-400/90",
    amber: "text-amber-400/70 group-hover/b:text-amber-400/90",
    muted: "text-white/30 group-hover/b:text-white/55",
  };
  return (
    <div className="flex items-center gap-2 cursor-default group/b"
      onMouseEnter={() => playTick(freq, "sine", 0.04, 0.01)}>
      <Dot color={color} pulse={pulse} />
      <span className="text-white/30 group-hover/b:text-white/55 text-[11px] tracking-[0.15em] uppercase font-mono transition-colors duration-300">{label}</span>
      <span className={`text-[11px] tracking-[0.12em] uppercase font-mono transition-colors duration-300 ${accentVal[color]}`}>{value}</span>
    </div>
  );
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const scanRef = useRef<HTMLDivElement>(null);

  // CSS-only scan line
  useEffect(() => {
    const el = scanRef.current;
    if (!el) return;
    let pos = 0;
    const timer = setInterval(() => {
      pos = (pos + 0.6) % 100;
      el.style.top = `${pos}%`;
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Data fetch
  useEffect(() => {
    const fetch = () => {
      window.fetch("/api/nodes/status")
        .then(r => r.json())
        .then(data => {
          if (data.status) {
            setStatus(prev => {
              if (prev && data.total_nodes > prev.total_nodes) {
                setPulse(true);
                setTimeout(() => setPulse(false), 1500);
              }
              return data;
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  // Loading / empty state
  if (loading) {
    return (
      <div className="w-full border border-cyan-400/[0.10] bg-gradient-to-b from-white/[0.005] to-transparent"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-4 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-pulse" />
          <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase font-mono">SYNCHRONIZING...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="w-full border border-red-400/[0.12] bg-gradient-to-b from-red-400/[0.005] to-transparent"
        style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-4 flex items-center justify-center">
          <span className="text-red-400/30 text-[10px] tracking-[0.15em] uppercase font-mono">PROTOCOL_SIGNAL_LOST</span>
        </div>
      </div>
    );
  }

  const hasNodes = status.total_nodes > 0;
  const daysUp = Math.max(1, Math.floor((Date.now() - new Date("2026-06-01").getTime()) / 86400000));

  return (
    <div className="relative w-full border border-cyan-400/[0.10] bg-gradient-to-b from-white/[0.008] to-transparent"
      style={{
        clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        boxShadow: `inset 0 1px 0 rgba(34,211,238,${hasNodes ? 0.08 : 0.03})`,
      }}>
      {/* CSS-driven scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div ref={scanRef} className="absolute w-full h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.04) 50%, transparent)" }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-4">
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-x-5 gap-y-2">
          {/* Left: stats */}
          <div className="flex items-center gap-3">
            <StatBadge label="PROTOCOL" value={status.status} color={hasNodes ? "green" : "cyan"} pulse={hasNodes} freq={450} />

            <span className="text-white/[0.05] select-none">·</span>

            <StatBadge label="GENESIS"
              value={<>{status.genesis_nodes}<span className="text-white/15">/100</span></>}
              color={status.cohort_sealed ? "green" : status.genesis_nodes > 0 ? "amber" : "muted"}
              pulse={!status.cohort_sealed && status.genesis_nodes > 0}
              freq={500} />

            <span className="text-white/[0.05] select-none">·</span>

            <StatBadge label="NODES"
              value={<>{status.active_humans}<span className="text-white/20">h</span> <span className="text-white/[0.06]">+</span> {status.agents}<span className="text-white/20">a</span></>}
              color={hasNodes ? "cyan" : "muted"}
              pulse={hasNodes}
              freq={550} />
          </div>

          {/* Right: meta */}
          <div className="flex items-center gap-3">
            {status.last_scan ? (
              <>
                <div className="flex items-center gap-2 cursor-default group/b"
                  onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
                  <span className="text-white/22 text-[10px] tracking-[0.12em] uppercase font-mono group-hover/b:text-white/40 transition-colors duration-300">LAST_SCAN</span>
                  <span className="text-white/30 text-[10px] tracking-[0.06em] font-mono group-hover/b:text-white/55 transition-colors duration-300">{status.last_scan}</span>
                </div>
                <span className="text-white/[0.05] select-none">|</span>
              </>
            ) : (
              <span className="text-white/[0.04] select-none hidden md:inline">—</span>
            )}

            <div className="flex items-center gap-2 cursor-default group/b"
              onMouseEnter={() => playTick(350, "sine", 0.03, 0.008)}>
              <span className="text-white/22 group-hover/b:text-white/40 text-[10px] tracking-[0.15em] uppercase font-mono transition-colors duration-300">
                T+{daysUp}d
              </span>
              <span className={`text-[10px] tracking-[0.1em] uppercase font-mono transition-colors duration-300 ${hasNodes ? "text-cyan-400/50 group-hover/b:text-cyan-400/70" : "text-white/22 group-hover/b:text-white/40"}`}>
                {hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

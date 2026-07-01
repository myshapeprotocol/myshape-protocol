"use client";
import { useState, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";

interface Status { total_nodes: number; genesis_nodes: number; genesis_remaining: number; active_humans: number; agents: number; last_scan: string | null; cohort_sealed: boolean; status: string; }

const ICE = "rgba(144,200,255,";
const BORDER = `${ICE}0.16)`;
const BORDER_HOVER = `${ICE}0.45)`;

function Dot({ color = "cyan", pulse }: { color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean }) {
  const m = { cyan: "bg-[#90c8ff] shadow-[0_0_5px_rgba(144,200,255,0.5)]", green: "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]", amber: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.4)]", muted: "bg-white/15" };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m[color]} ${pulse ? "animate-pulse" : ""}`} />;
}

function Stat({ label, value, color = "cyan", pulse, freq = 500 }: { label: string; value: React.ReactNode; color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean; freq?: number }) {
  return (
    <div className="flex items-center gap-1.5 cursor-default group/s" onMouseEnter={() => playTick(freq, "sine", 0.04, 0.01)}>
      <Dot color={color} pulse={pulse} />
      <span className="text-white/40 group-hover/s:text-white/75 text-[10px] tracking-[0.12em] uppercase font-mono transition-colors duration-300">{label}</span>
      <span className={`text-[10px] tracking-[0.1em] uppercase font-mono transition-colors duration-300 ${color === "muted" ? "text-white/25 group-hover/s:text-white/50" : "text-white/70 group-hover/s:text-white"}`}>{value}</span>
    </div>
  );
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const f = () => window.fetch("/api/nodes/status").then(r => r.json()).then(d => { if (d.status) { setStatus(prev => { if (prev && d.total_nodes > prev.total_nodes) { setPulse(true); setTimeout(() => setPulse(false), 1500); } return d; }); } setLoading(false); }).catch(() => setLoading(false));
    f(); const i = setInterval(f, 30000); return () => clearInterval(i);
  }, []);

  const wrap = (children: React.ReactNode, border?: string) => (
    <div className="mx-auto w-fit" style={{ border: border ? `1px solid ${border}` : `1px solid ${BORDER}` }}>
      <div className="px-3 md:px-4 py-1.5 flex items-center justify-center">{children}</div>
    </div>
  );

  if (loading) return wrap(<><span className="w-1 h-1 bg-[#90c8ff]/40 rounded-full animate-pulse" /><span className="text-white/15 text-[9px] tracking-[0.15em] uppercase font-mono ml-1.5">SYNC...</span></>);
  if (!status) return wrap(<span className="text-red-400/25 text-[9px] tracking-[0.12em] uppercase font-mono">SIGNAL_LOST</span>, "rgba(248,113,113,0.1)");

  const hasNodes = status.total_nodes > 0;
  const daysUp = Math.max(1, Math.floor((Date.now() - new Date("2026-06-01").getTime()) / 86400000));

  return (
    <div className="relative mx-auto w-fit transition-all duration-500"
      style={{
        border: `1px solid ${hover ? BORDER_HOVER : BORDER}`,
        boxShadow: hover ? `0 2px 12px -2px ${ICE}0.06)` : "none",
      }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      <div className="px-3 md:px-4 py-1.5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          <Stat label="PROTOCOL" value={status.status} color={hasNodes ? "green" : "cyan"} pulse={hasNodes} freq={450} />
          <span className="text-white/[0.06] select-none text-[10px]">·</span>
          <Stat label="GENESIS" value={<>{status.genesis_nodes}<span className="text-white/15">/100</span></>} color={status.cohort_sealed ? "green" : status.genesis_nodes > 0 ? "amber" : "muted"} pulse={!status.cohort_sealed && status.genesis_nodes > 0} freq={500} />
          <span className="text-white/[0.06] select-none text-[10px]">·</span>
          <Stat label="NODES" value={<>{status.active_humans}<span className="text-white/20">h</span> <span className="text-white/[0.06]">+</span> {status.agents}<span className="text-white/20">a</span></>} color={hasNodes ? "cyan" : "muted"} pulse={hasNodes} freq={550} />
          {status.last_scan && (
            <>
              <span className="text-white/[0.06] select-none text-[10px]">·</span>
              <div className="flex items-center gap-1 cursor-default group/s" onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
                <span className="text-white/18 group-hover/s:text-white/40 text-[9px] tracking-[0.1em] uppercase font-mono transition-colors duration-300">LAST</span>
                <span className="text-white/45 group-hover/s:text-white/75 text-[9px] tracking-[0.05em] font-mono transition-colors duration-300">{status.last_scan}</span>
              </div>
            </>
          )}
          <span className="text-white/[0.06] select-none text-[10px]">·</span>
          <div className="flex items-center gap-1 cursor-default group/s" onMouseEnter={() => playTick(350, "sine", 0.03, 0.008)}>
            <span className="text-white/18 group-hover/s:text-white/40 text-[9px] tracking-[0.1em] uppercase font-mono transition-colors duration-300">T+{daysUp}d</span>
            <span className={`text-[9px] tracking-[0.08em] uppercase font-mono transition-colors duration-300 ${hasNodes ? "text-[#90c8ff]/40 group-hover/s:text-[#90c8ff]/70" : "text-white/18 group-hover/s:text-white/40"}`}>{hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

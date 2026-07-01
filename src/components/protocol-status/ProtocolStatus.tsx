"use client";
import { useState, useEffect, useRef } from "react";
import { playTick } from "@/utils/useAudioTick";

interface Status { total_nodes: number; genesis_nodes: number; genesis_remaining: number; active_humans: number; agents: number; last_scan: string | null; cohort_sealed: boolean; status: string; }

const ICE = "rgba(144,200,255,";
const BORDER = `${ICE}0.10)`;
const BORDER_HOVER = `${ICE}0.35)`;

function Dot({ color = "cyan", pulse }: { color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean }) {
  const m = { cyan: "bg-[#90c8ff] shadow-[0_0_5px_rgba(144,200,255,0.5)]", green: "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]", amber: "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.4)]", muted: "bg-white/15" };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m[color]} ${pulse ? "animate-pulse" : ""}`} />;
}

function Stat({ label, value, color = "cyan", pulse, freq = 500 }: { label: string; value: React.ReactNode; color?: "cyan" | "green" | "amber" | "muted"; pulse?: boolean; freq?: number }) {
  return (
    <div className="flex items-center gap-2 cursor-default group/s" onMouseEnter={() => playTick(freq, "sine", 0.04, 0.01)}>
      <Dot color={color} pulse={pulse} />
      <span className="text-white/55 group-hover/s:text-white/85 text-[12px] tracking-[0.15em] uppercase font-mono transition-colors duration-300">{label}</span>
      <span className={`text-[12px] tracking-[0.12em] uppercase font-mono transition-colors duration-300 ${color === "muted" ? "text-white/30 group-hover/s:text-white/55" : "text-white/80 group-hover/s:text-white"}`}>{value}</span>
    </div>
  );
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [hover, setHover] = useState(false);
  const scanRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const el = scanRef.current; if (!el) return; let p = 0; const t = setInterval(() => { p = (p + 0.5) % 100; el.style.top = `${p}%`; }, 60); return () => clearInterval(t); }, []);

  useEffect(() => {
    const f = () => window.fetch("/api/nodes/status").then(r => r.json()).then(d => { if (d.status) { setStatus(prev => { if (prev && d.total_nodes > prev.total_nodes) { setPulse(true); setTimeout(() => setPulse(false), 1500); } return d; }); } setLoading(false); }).catch(() => setLoading(false));
    f(); const i = setInterval(f, 30000); return () => clearInterval(i);
  }, []);

  const wrap = (children: React.ReactNode, border?: string) => (
    <div className="w-full transition-all duration-700" style={{ border: border ? `1px solid ${border}` : `1px solid ${BORDER}`, clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-10 py-4 flex items-center justify-center">{children}</div>
    </div>
  );

  if (loading) return wrap(<><span className="w-1.5 h-1.5 bg-[#90c8ff]/40 rounded-full animate-pulse" /><span className="text-white/20 text-[10px] tracking-[0.2em] uppercase font-mono ml-2">SYNCHRONIZING...</span></>);
  if (!status) return wrap(<span className="text-red-400/30 text-[10px] tracking-[0.15em] uppercase font-mono">PROTOCOL_SIGNAL_LOST</span>, "rgba(248,113,113,0.12)");

  const hasNodes = status.total_nodes > 0;
  const daysUp = Math.max(1, Math.floor((Date.now() - new Date("2026-06-01").getTime()) / 86400000));

  return (
    <div className="relative w-full bg-gradient-to-b from-[rgba(144,200,255,0.01)] to-transparent transition-all duration-700"
      style={{
        border: `1px solid ${hover ? BORDER_HOVER : BORDER}`,
        clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
        boxShadow: hover ? `0 8px 32px -8px ${ICE}0.10), inset 0 1px 0 ${ICE}${hasNodes ? 0.08 : 0.03})` : `inset 0 1px 0 ${ICE}${hasNodes ? 0.08 : 0.03})`,
      }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-6 h-[1px] bg-gradient-to-r from-[#90c8ff]/20 to-transparent" />
      <div className="absolute top-0 left-0 w-[1px] h-6 bg-gradient-to-b from-[#90c8ff]/20 to-transparent" />
      <div className="absolute bottom-0 right-0 w-6 h-[1px] bg-gradient-to-l from-[#90c8ff]/20 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[1px] h-6 bg-gradient-to-t from-[#90c8ff]/20 to-transparent" />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div ref={scanRef} className="absolute w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${ICE}0.03) 50%, transparent)` }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-4">
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-x-5 gap-y-2">
          <div className="flex items-center gap-3">
            <Stat label="PROTOCOL" value={status.status} color={hasNodes ? "green" : "cyan"} pulse={hasNodes} freq={450} />
            <span className="text-white/[0.05] select-none">·</span>
            <Stat label="GENESIS" value={<>{status.genesis_nodes}<span className="text-white/15">/100</span></>} color={status.cohort_sealed ? "green" : status.genesis_nodes > 0 ? "amber" : "muted"} pulse={!status.cohort_sealed && status.genesis_nodes > 0} freq={500} />
            <span className="text-white/[0.05] select-none">·</span>
            <Stat label="NODES" value={<>{status.active_humans}<span className="text-white/20">h</span> <span className="text-white/[0.06]">+</span> {status.agents}<span className="text-white/20">a</span></>} color={hasNodes ? "cyan" : "muted"} pulse={hasNodes} freq={550} />
          </div>
          <div className="flex items-center gap-3">
            {status.last_scan ? (
              <>
                <div className="flex items-center gap-2 cursor-default group/s" onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
                  <span className="text-white/22 group-hover/s:text-white/45 text-[10px] tracking-[0.12em] uppercase font-mono transition-colors duration-300">LAST_SCAN</span>
                  <span className="text-white/55 group-hover/s:text-white/85 text-[10px] tracking-[0.06em] font-mono transition-colors duration-300">{status.last_scan}</span>
                </div>
                <span className="text-white/[0.05] select-none">|</span>
              </>
            ) : <span className="text-white/[0.04] select-none hidden md:inline">—</span>}
            <div className="flex items-center gap-2 cursor-default group/s" onMouseEnter={() => playTick(350, "sine", 0.03, 0.008)}>
              <span className="text-white/22 group-hover/s:text-white/45 text-[10px] tracking-[0.15em] uppercase font-mono transition-colors duration-300">T+{daysUp}d</span>
              <span className={`text-[10px] tracking-[0.1em] uppercase font-mono transition-colors duration-300 ${hasNodes ? "text-[#90c8ff]/50 group-hover/s:text-[#90c8ff]/80" : "text-white/22 group-hover/s:text-white/45"}`}>{hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

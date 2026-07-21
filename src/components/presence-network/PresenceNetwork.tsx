"use client";
import { useEffect, useRef, useState } from "react";
import { playTick } from "@/utils/useAudioTick";

/* ── Types ── */
interface NetworkNode { handle: string; mask: string; status: string; particleLevel: number; entropy: number; lastSeen: string; scans: number; isGenesis: boolean; }
interface NetworkData { totalNodes: number; activeHumans: number; sovereignNodes: number; agents: number; activeToday: number; totalScans: number; lastInbound: { handle: string; mask: string; timestamp: string } | null; nodes: NetworkNode[]; engines: number; attackSigs: number; coreTests: string; }
interface NodePosition { x: number; y: number; vx: number; vy: number; node: NetworkNode; radius: number; glow: number; phase: number; }

/* ── Design tokens — aligned with Vision cards ── */
const ICE = "rgba(144,200,255,";
const BORDER = `${ICE}0.10)`;
const BORDER_HOVER = `${ICE}0.35)`;
const SHADOW_HOVER = `0 12px 32px -8px ${ICE}0.12)`;

/* ── Console row ── */
function Row({ label, value, sub, accent = "cyan", pulse, flash, freq = 600, stripe }: {
  label: string; value: string | number; sub?: string; accent?: "cyan" | "amber" | "green" | "muted"; pulse?: boolean; flash?: boolean; freq?: number; stripe?: boolean;
}) {
  const dot = {
    cyan:  "bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.5)]",
    amber: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]",
    green: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]",
    muted: "bg-white/10",
  }[accent];

  return (
    <div className={`flex items-center gap-3 group/r px-4 py-2.5 -mx-4 transition-all duration-500 ${flash ? "bg-[rgba(144,200,255,0.06)]" : stripe ? "bg-[rgba(144,200,255,0.01)]" : ""} hover:bg-[rgba(144,200,255,0.04)]`}
      onMouseEnter={() => playTick(freq, "sine", 0.06, 0.015)}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-[#90c8ff]/20 group-hover/r:text-[#90c8ff]/40 text-[13px] tracking-[0.1em] font-mono shrink-0 w-[14px] text-right transition-colors duration-500">{">"}</span>
      <span className="text-white/55 group-hover/r:text-white/85 text-[13px] tracking-[0.12em] uppercase font-mono shrink-0 w-[90px] transition-colors duration-500">{label}</span>
      <span className="text-[18px] tracking-[0.02em] font-mono font-light text-white/80 group-hover/r:text-white transition-colors duration-500">{value}</span>
      {sub && <span className="text-[13px] tracking-[0.08em] font-mono text-white/22 group-hover/r:text-white/45 ml-2 transition-colors duration-500">{sub}</span>}
    </div>
  );
}

/* ── Topology: empty state ── */
function TopologyEmpty() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 200 }}>
      {/* Radar rings */}
      {[0.25, 0.45, 0.65, 0.85].map((s, i) => (
        <div key={i} className="absolute rounded-full border border-[#90c8ff]/[0.03]"
          style={{ width: `${s * 100}%`, height: `${s * 100}%`, top: `${(1 - s) * 50}%`, left: `${(1 - s) * 50}%` }} />
      ))}
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: `radial-gradient(circle, ${ICE}0.6) 0.4px, transparent 0.4px)`, backgroundSize: "16px 16px" }} />
      {/* Core */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#90c8ff]/[0.04] animate-ping" style={{ animationDuration: "4s" }} />
          <div className="absolute inset-2 rounded-full border border-[#90c8ff]/[0.06] animate-ping opacity-50" style={{ animationDuration: "3s", animationDelay: "1.5s" }} />
          <div className="absolute -inset-1 rounded-full border border-[#90c8ff]/[0.02] animate-spin border-dashed" style={{ animationDuration: "16s" }} />
          <div className="relative w-2.5 h-2.5 rounded-full bg-[#90c8ff]/30 shadow-[0_0_14px_rgba(144,200,255,0.2)] z-10">
            <span className="absolute inset-0 rounded-full bg-[#90c8ff]/40 animate-ping" style={{ animationDuration: "2.5s" }} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white/35 text-[11px] tracking-[0.2em] uppercase font-mono">NETWORK_TOPOLOGY</p>
          <p className="text-white/20 text-[11px] tracking-[0.12em] uppercase font-mono max-w-[280px] leading-relaxed">MESH_INITIALIZES_WHEN_FIRST_NODE_COMPLETES_GENESIS_RITUAL</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function PresenceNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanPos, setScanPos] = useState(0);
  const [breath, setBreath] = useState(0);
  const [leds, setLeds] = useState([false, false, false]);
  const [flashRows, setFlashRows] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState(false);
  const positionsRef = useRef<NodePosition[]>([]);

  // Animations
  useEffect(() => { let t = 0; const i = setInterval(() => { t++; setScanPos(t % 100); setBreath(Math.sin(t / 18) * 0.5 + 0.5); }, 80); return () => clearInterval(i); }, []);
  useEffect(() => { const tick = () => setLeds(Array.from({ length: 3 }, () => Math.random() > 0.5)); tick(); const i = setInterval(tick, 1400); return () => clearInterval(i); }, []);

  // Data
  useEffect(() => {
    const tick = () => fetch("/api/presence/network").then(r => r.json()).then(d => {
      setData(prev => {
        if (prev && d.totalNodes !== undefined) { const c = new Set<string>(); if (d.totalNodes !== prev.totalNodes) c.add("NODES"); if (d.sovereignNodes !== prev.sovereignNodes) c.add("GENESIS"); if (d.activeToday !== prev.activeToday) c.add("TODAY"); if (c.size > 0) { setFlashRows(c); setTimeout(() => setFlashRows(new Set()), 800); } }
        return d;
      });
      setLoading(false);
    }).catch(() => setLoading(false));
    tick(); const i = setInterval(tick, 15000); return () => clearInterval(i);
  }, []);

  // Canvas
  useEffect(() => {
    if (!data || !canvasRef.current || (data.nodes?.length ?? 0) === 0) return;
    const canvas = canvasRef.current, ctx = canvas.getContext("2d")!;
    let id: number;
    const w = canvas.offsetWidth * (devicePixelRatio || 1), h = canvas.offsetHeight * (devicePixelRatio || 1);
    canvas.width = w; canvas.height = h;
    if (positionsRef.current.length === 0) positionsRef.current = data.nodes.map((n, i) => { const a = (2 * Math.PI * i) / Math.max(1, data.nodes.length), r = Math.min(w, h) * (0.25 + Math.random() * 0.2); return { x: w / 2 + Math.cos(a) * r + (Math.random() - 0.5) * 60, y: h / 2 + Math.sin(a) * r + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, node: n, radius: 2 + n.particleLevel * 1.5, glow: 0.1 + n.particleLevel * 0.1, phase: Math.random() * Math.PI * 2 }; });
    const pp = positionsRef.current;
    (function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pp.length; i++) for (let j = i + 1; j < pp.length; j++) { const dx = pp[i].x - pp[j].x, dy = pp[i].y - pp[j].y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < Math.min(w, h) * 0.3) { ctx.beginPath(); ctx.moveTo(pp[i].x, pp[i].y); ctx.lineTo(pp[j].x, pp[j].y); ctx.strokeStyle = `${ICE}${(1 - dist / (Math.min(w, h) * 0.3)) * 0.12})`; ctx.lineWidth = 0.5; ctx.stroke(); } }
      const now = Date.now();
      for (const p of pp) { p.x += p.vx; p.y += p.vy; if (p.x < p.radius || p.x > w - p.radius) p.vx *= -1; if (p.y < p.radius || p.y > h - p.radius) p.vy *= -1; p.vx += (w / 2 - p.x) * 0.0001; p.vy += (h / 2 - p.y) * 0.0001; const pulse = 1 + Math.sin(now / 1000 + p.phase) * 0.3, r = p.radius * pulse; if (p.node.isGenesis) { const g = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r * 3); g.addColorStop(0, `${ICE}${p.glow * 2})`); g.addColorStop(1, `${ICE}0)`); ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); } const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2); g2.addColorStop(0, `rgba(255,255,255,${p.glow})`); g2.addColorStop(0.5, `${ICE}${p.glow})`); g2.addColorStop(1, `${ICE}0)`); ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill(); ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2); ctx.fillStyle = p.node.isGenesis ? "rgba(255,255,255,0.9)" : "rgba(200,230,255,0.6)"; ctx.fill(); }
      id = requestAnimationFrame(draw);
    })();
    return () => cancelAnimationFrame(id);
  }, [data]);

  if (loading) return (
    <div className="relative overflow-hidden transition-all duration-700" style={{ border: `1px solid ${BORDER}`, clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
      <div className="flex items-center gap-2 px-5 py-8 justify-center"><span className="w-1.5 h-1.5 bg-[#90c8ff]/40 rounded-full animate-pulse" /><span className="text-[#90c8ff]/40 text-[11px] tracking-[0.2em] font-mono">PROTOCOL_ENCLAVE_HANDSHAKE...</span></div>
    </div>
  );
  if (!data) return (
    <div className="relative overflow-hidden transition-all duration-700" style={{ border: "1px solid rgba(248,113,113,0.10)", clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
      <div className="px-5 py-8 text-center"><span className="text-red-400/40 text-[11px] tracking-[0.2em] font-mono">NETWORK_UNREACHABLE</span></div>
    </div>
  );

  const hasNodes = (data.nodes?.length ?? 0) > 0;
  const genesisPct = Math.min(100, Math.round((data.sovereignNodes / 100) * 100));

  return (
    <div className="relative bg-[#02040a]/60 backdrop-blur-sm overflow-hidden transition-all duration-700"
      style={{
        border: `1px solid ${hover ? BORDER_HOVER : BORDER}`,
        clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        boxShadow: hover ? `${SHADOW_HOVER}, 0 0 ${20 + breath * 12}px ${ICE}${0.03 + breath * 0.04})` : `0 0 ${20 + breath * 12}px ${ICE}${0.03 + breath * 0.04})`,
      }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      {/* Ambient scan line */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="absolute w-full h-px" style={{ top: `${scanPos}%`, background: `linear-gradient(90deg, transparent, ${ICE}0.04) 20%, ${ICE}0.08) 50%, ${ICE}0.04) 80%, transparent)` }} />
      </div>

      {/* Corner glow accents */}
      <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-[#90c8ff]/30 to-transparent" />
      <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-[#90c8ff]/30 to-transparent" />
      <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gradient-to-l from-[#90c8ff]/30 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gradient-to-t from-[#90c8ff]/30 to-transparent" />

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-white/[0.03]"
        onMouseEnter={() => playTick(300, "sine", 0.04, 0.01)}>
        <div className="flex items-center gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasNodes ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)] animate-pulse" : "bg-[#90c8ff]/40 shadow-[0_0_4px_rgba(144,200,255,0.2)]"}`} />
          <span className="text-white/35 text-[11px] tracking-[0.15em] uppercase font-mono">PROTOCOL_ENCLAVE</span>
          <span className="text-white/[0.06] select-none">|</span>
          <span className={`text-[11px] tracking-[0.12em] uppercase font-mono ${hasNodes ? "text-green-400/70" : "text-white/22"}`}>{hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5">
            {leds.map((on, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${on ? "bg-[#90c8ff]/80 shadow-[0_0_5px_rgba(144,200,255,0.5)]" : "bg-white/10"}`} />)}
          </div>
          {data.lastInbound && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/15 text-[11px] tracking-[0.1em] uppercase font-mono">LAST_INBOUND</span>
              <span className="text-white/30 text-[11px] tracking-[0.08em] font-mono">{data.lastInbound.mask}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Console readout ── */}
      <div className="relative px-5 py-4 space-y-0">
        <Row label="ENCLAVE"  value={hasNodes ? "OPERATIONAL" : "STANDBY"} accent={hasNodes ? "green" : "muted"} pulse={hasNodes} flash={flashRows.has("ENCLAVE")} freq={400} />
        <Row label="NODES"    value={data.totalNodes} sub={data.totalNodes === 0 ? "(awaiting first uplink)" : `human:${data.activeHumans}  agent:${data.agents}`} accent={data.totalNodes > 0 ? "cyan" : "muted"} pulse={data.totalNodes > 0} flash={flashRows.has("NODES")} freq={500} stripe />
        <Row label="GENESIS"  value="Alpha" sub="(restricted access)" accent="amber" pulse flash={flashRows.has("GENESIS")} freq={600} />
        <Row label="TODAY"    value={data.activeToday} sub={data.activeToday > 0 ? "scans recorded" : "(no activity)"} accent={data.activeToday > 0 ? "green" : "muted"} flash={flashRows.has("TODAY")} freq={700} stripe />
        <Row label="ENGINES"  value={data.engines} sub="WASM + PES" accent="cyan" freq={800} />
        <Row label="SPEC"     value={data.attackSigs} sub="threat sigs indexed" accent={data.attackSigs > 0 ? "amber" : "muted"} freq={900} stripe />
        <Row label="CORE"     value={data.coreTests} accent="green" pulse freq={1000} />
      </div>

      {/* ── Genesis progress ── */}
      <div className="relative px-5 py-3 border-y border-white/[0.02] group/p cursor-default transition-all duration-500 hover:bg-[rgba(144,200,255,0.03)]"
        onMouseEnter={() => playTick(550, "triangle", 0.05, 0.012)}>
        {/* Progress glow */}
        <div className="absolute inset-y-0 left-5 transition-all duration-1000 rounded-full blur-md opacity-30"
          style={{ width: `${genesisPct}%`, maxWidth: "calc(100% - 2.5rem)", background: `linear-gradient(90deg, ${ICE}0.3), transparent)` }} />
        <div className="relative flex items-center gap-3">
          <span className="text-white/55 group-hover/p:text-white/85 text-[11px] tracking-[0.15em] uppercase font-mono shrink-0 transition-colors duration-300">GENESIS_PROGRESS</span>
          <div className="flex-1 h-[2px] bg-white/[0.04] overflow-hidden rounded-full">
            <div className="h-full rounded-full transition-all duration-1000 shadow-[0_0_6px_rgba(144,200,255,0.3)]"
              style={{ width: `${genesisPct}%`, background: `linear-gradient(90deg, ${ICE}0.6), ${ICE}0.4), transparent)` }} />
          </div>
          <span className="text-[#90c8ff]/70 group-hover/p:text-[#90c8ff]/90 text-[11px] tracking-[0.1em] font-mono shrink-0 transition-colors duration-300">{genesisPct}%</span>
        </div>
      </div>

      {/* ── Network topology ── */}
      <div className="relative" style={{ height: 200 }}>
        {hasNodes ? (
          <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-4 right-4 text-right pointer-events-none">
              <div className="text-[11px] tracking-[0.25em] text-white/20 uppercase font-light font-mono">SCANS</div>
              <div className="text-[15px] font-mono text-[#90c8ff]/70 tracking-[0.06em]">{data.totalScans}</div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-4 pointer-events-none">
              <div className="flex items-center gap-1.5"><span className="relative flex w-2 h-2"><span className="absolute inset-0 rounded-full bg-white/80 animate-ping" style={{ animationDuration: "2s" }} /><span className="relative w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]" /></span><span className="text-white/25 text-[11px] tracking-[0.12em] uppercase font-mono">GENESIS</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.4)]" /><span className="text-white/18 text-[11px] tracking-[0.12em] uppercase font-mono">ACTIVE</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400/40 shadow-[0_0_3px_rgba(168,85,247,0.3)]" /><span className="text-white/15 text-[11px] tracking-[0.12em] uppercase font-mono">AGENT</span></div>
            </div>
          </>
        ) : (
          <TopologyEmpty />
        )}
      </div>
    </div>
  );
}

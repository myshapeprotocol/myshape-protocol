"use client";
import { useEffect, useRef, useState } from "react";
import { playTick } from "@/utils/useAudioTick";

interface NetworkNode {
  handle: string; mask: string; status: string;
  particleLevel: number; entropy: number; lastSeen: string;
  scans: number; isGenesis: boolean;
}

interface NetworkData {
  totalNodes: number; activeHumans: number; genesisNodes: number;
  agents: number; activeToday: number; totalScans: number;
  lastInbound: { handle: string; mask: string; timestamp: string } | null;
  nodes: NetworkNode[]; engines: number; attackSigs: number;
  specSections: number; integrationLines: string; coreTests: string;
  protocolEnclave: boolean;
}

interface NodePosition {
  x: number; y: number; vx: number; vy: number;
  node: NetworkNode; radius: number; glow: number; phase: number;
}

/* ── Accent color map ── */
const accentMap = {
  cyan:  { dot: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]", val: "text-cyan-400/70 group-hover/r:text-cyan-300/90", sub: "text-cyan-400/30 group-hover/r:text-cyan-400/60" },
  amber: { dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]", val: "text-amber-400/70 group-hover/r:text-amber-300/90", sub: "text-amber-400/30 group-hover/r:text-amber-400/60" },
  green: { dot: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]", val: "text-green-400/70 group-hover/r:text-green-300/90", sub: "text-green-400/30 group-hover/r:text-green-400/60" },
  muted: { dot: "bg-white/10",                        val: "text-white/30 group-hover/r:text-white/55",     sub: "text-white/22 group-hover/r:text-white/40" },
  red:   { dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]",  val: "text-red-400/70 group-hover/r:text-red-300/90",   sub: "text-red-400/30 group-hover/r:text-red-400/60" },
};

type Accent = keyof typeof accentMap;

/* ── Console readout row ── */
function ConsoleRow({
  label, value, sub, accent = "cyan", pulse = false, flash = false, freq = 600,
}: {
  label: string; value: string | number; sub?: string;
  accent?: Accent; pulse?: boolean; flash?: boolean; freq?: number;
}) {
  const c = accentMap[accent];
  return (
    <div
      className={`flex items-center gap-3 group/r px-3 py-2 -mx-3 transition-all duration-300 ${flash ? "bg-cyan-400/[0.04]" : ""} hover:bg-white/[0.015]`}
      onMouseEnter={() => playTick(freq, "sine", 0.06, 0.015)}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-cyan-400/25 group-hover/r:text-cyan-400/50 text-[13px] tracking-[0.1em] font-mono shrink-0 w-[14px] text-right transition-colors duration-300">{">"}</span>
      <span className="text-white/30 group-hover/r:text-white/55 text-[13px] tracking-[0.12em] uppercase font-mono shrink-0 w-[90px] transition-colors duration-300">{label}</span>
      <span className={`text-[15px] tracking-[0.02em] font-mono font-light transition-colors duration-300 ${c.val}`}>{value}</span>
      {sub && <span className={`text-[11px] tracking-[0.1em] font-mono transition-colors duration-300 ml-1 ${c.sub}`}>{sub}</span>}
    </div>
  );
}

/* ── Topology placeholder ── */
function TopologyPlaceholder() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 200 }}>
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.6) 0.5px, transparent 0.5px)", backgroundSize: "18px 18px" }} />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/[0.05] animate-ping" style={{ animationDuration: "4s" }} />
          <div className="absolute inset-2 rounded-full border border-cyan-400/[0.08] animate-ping opacity-60" style={{ animationDuration: "3s", animationDelay: "1.2s" }} />
          <div className="absolute inset-4 rounded-full border border-cyan-400/[0.06] border-dashed" />
          <div className="absolute -inset-1 rounded-full border border-cyan-400/[0.03] animate-spin border-dashed" style={{ animationDuration: "14s" }} />
          <div className="absolute inset-6 rounded-full bg-cyan-400/[0.03] blur-[5px] animate-pulse" style={{ animationDuration: "2.2s" }} />
          <div className="relative w-2.5 h-2.5 rounded-full bg-cyan-400/35 shadow-[0_0_12px_rgba(34,211,238,0.25)] z-10">
            <span className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping" style={{ animationDuration: "2.5s" }} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-mono">NETWORK_TOPOLOGY</p>
          <p className="text-white/15 text-[10px] tracking-[0.12em] uppercase font-mono max-w-[280px] leading-relaxed">MESH_INITIALIZES_WHEN_FIRST_NODE_COMPLETES_GENESIS_RITUAL</p>
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
  const positionsRef = useRef<NodePosition[]>([]);

  // Scan line + breathing border
  useEffect(() => {
    let t = 0;
    const timer = setInterval(() => {
      t++;
      setScanPos(t % 100);
      setBreath(Math.sin(t / 18) * 0.5 + 0.5);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Random LED flicker
  useEffect(() => {
    const tick = () => {
      setLeds(Array.from({ length: 3 }, () => Math.random() > 0.5));
    };
    tick();
    const timer = setInterval(tick, 1400);
    return () => clearInterval(timer);
  }, []);

  // Data fetch
  useEffect(() => {
    const tick = () => {
      fetch("/api/presence/network")
        .then(r => r.json())
        .then(d => {
          setData(prev => {
            if (prev && d.totalNodes !== undefined) {
              const changed = new Set<string>();
              if (d.totalNodes !== prev.totalNodes) changed.add("NODES");
              if (d.genesisNodes !== prev.genesisNodes) changed.add("GENESIS");
              if (d.activeToday !== prev.activeToday) changed.add("TODAY");
              if (changed.size > 0) {
                setFlashRows(changed);
                setTimeout(() => setFlashRows(new Set()), 800);
              }
            }
            return d;
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, []);

  // Canvas
  useEffect(() => {
    if (!data || !canvasRef.current || (data.nodes?.length ?? 0) === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let id: number;
    const w = canvas.offsetWidth * (window.devicePixelRatio || 1);
    const h = canvas.offsetHeight * (window.devicePixelRatio || 1);
    canvas.width = w; canvas.height = h;

    if (positionsRef.current.length === 0) {
      positionsRef.current = data.nodes.map((n, i) => {
        const a = (2 * Math.PI * i) / Math.max(1, data.nodes.length);
        const r = Math.min(w, h) * (0.25 + Math.random() * 0.2);
        return { x: w / 2 + Math.cos(a) * r + (Math.random() - 0.5) * 60, y: h / 2 + Math.sin(a) * r + (Math.random() - 0.5) * 60, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, node: n, radius: 2 + n.particleLevel * 1.5, glow: 0.1 + n.particleLevel * 0.1, phase: Math.random() * Math.PI * 2 };
      });
    }
    const pp = positionsRef.current;

    (function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pp.length; i++) {
        for (let j = i + 1; j < pp.length; j++) {
          const dx = pp[i].x - pp[j].x, dy = pp[i].y - pp[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < Math.min(w, h) * 0.3) {
            ctx.beginPath(); ctx.moveTo(pp[i].x, pp[i].y); ctx.lineTo(pp[j].x, pp[j].y);
            ctx.strokeStyle = `rgba(144,200,255,${(1 - dist / (Math.min(w, h) * 0.3)) * 0.12})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      const now = Date.now();
      for (const p of pp) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < p.radius || p.x > w - p.radius) p.vx *= -1;
        if (p.y < p.radius || p.y > h - p.radius) p.vy *= -1;
        p.vx += (w / 2 - p.x) * 0.0001; p.vy += (h / 2 - p.y) * 0.0001;
        const pulse = 1 + Math.sin(now / 1000 + p.phase) * 0.3;
        const r = p.radius * pulse;
        if (p.node.isGenesis) {
          const g = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r * 3);
          g.addColorStop(0, `rgba(144,200,255,${p.glow * 2})`); g.addColorStop(1, "rgba(144,200,255,0)");
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }
        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        g2.addColorStop(0, `rgba(255,255,255,${p.glow})`); g2.addColorStop(0.5, `rgba(144,200,255,${p.glow})`); g2.addColorStop(1, "rgba(144,200,255,0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2); ctx.fillStyle = g2; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = p.node.isGenesis ? "rgba(255,255,255,0.9)" : "rgba(200,230,255,0.6)"; ctx.fill();
      }
      id = requestAnimationFrame(draw);
    })();
    return () => cancelAnimationFrame(id);
  }, [data]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="relative border border-cyan-400/[0.06] bg-cyan-400/[0.01] overflow-hidden"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
        <div className="flex items-center gap-2 px-5 py-8 justify-center">
          <span className="w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-pulse" />
          <span className="text-cyan-400/40 text-[10px] tracking-[0.2em] font-mono">PROTOCOL_ENCLAVE_HANDSHAKE...</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (!data) {
    return (
      <div className="relative border border-red-400/[0.06] bg-red-400/[0.01] overflow-hidden"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
        <div className="px-5 py-8 text-center">
          <span className="text-red-400/40 text-[10px] tracking-[0.2em] font-mono">NETWORK_UNREACHABLE</span>
        </div>
      </div>
    );
  }

  const hasNodes = (data.nodes?.length ?? 0) > 0;
  const genesisPct = Math.min(100, Math.round((data.genesisNodes / 100) * 100));

  // ── Main render ──
  return (
    <div
      className="relative border border-cyan-400/[0.06] bg-gradient-to-b from-cyan-400/[0.012] to-transparent overflow-hidden"
      style={{
        clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
        boxShadow: `0 0 ${18 + breath * 12}px rgba(34,211,238,${0.03 + breath * 0.05})`,
      }}
    >
      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="absolute w-full h-px" style={{ top: `${scanPos}%`, background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.05) 20%, rgba(34,211,238,0.10) 50%, rgba(34,211,238,0.05) 80%, transparent)" }} />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.03]"
        onMouseEnter={() => playTick(300, "sine", 0.04, 0.01)}>
        <div className="flex items-center gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasNodes ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)] animate-pulse" : "bg-cyan-400/40 shadow-[0_0_4px_rgba(34,211,238,0.2)]"}`} />
          <span className="text-white/35 text-[11px] tracking-[0.15em] uppercase font-mono">PROTOCOL_ENCLAVE</span>
          <span className="text-white/[0.06] select-none">|</span>
          <span className={`text-[10px] tracking-[0.12em] uppercase font-mono ${hasNodes ? "text-green-400/70" : "text-white/22"}`}>
            {hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5">
            {leds.map((on, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${on ? "bg-cyan-400/80 shadow-[0_0_5px_rgba(34,211,238,0.5)]" : "bg-white/10"}`} />
            ))}
          </div>
          {data.lastInbound && (
            <div className="flex items-center gap-1.5">
              <span className="text-white/15 text-[9px] tracking-[0.1em] uppercase font-mono">LAST_INBOUND</span>
              <span className="text-white/30 text-[10px] tracking-[0.08em] font-mono">{data.lastInbound.mask}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Console readout ── */}
      <div className="px-5 py-4 border-b border-white/[0.02] space-y-0.5">
        <ConsoleRow label="ENCLAVE"  value={hasNodes ? "OPERATIONAL" : "STANDBY"} accent={hasNodes ? "green" : "muted"} pulse={hasNodes} flash={flashRows.has("ENCLAVE")} freq={400} />
        <ConsoleRow label="NODES"    value={data.totalNodes} sub={data.totalNodes === 0 ? "(awaiting first uplink)" : `human:${data.activeHumans}  agent:${data.agents}`} accent={data.totalNodes > 0 ? "cyan" : "muted"} pulse={data.totalNodes > 0} flash={flashRows.has("NODES")} freq={500} />
        <ConsoleRow label="GENESIS"  value={`${data.genesisNodes}/100`} sub={genesisPct > 0 ? `${genesisPct}%` : "(cohort forming)"} accent={data.genesisNodes > 0 ? "amber" : "muted"} pulse={data.genesisNodes > 0} flash={flashRows.has("GENESIS")} freq={600} />
        <ConsoleRow label="TODAY"    value={data.activeToday} sub={data.activeToday > 0 ? "scans recorded" : "(no activity)"} accent={data.activeToday > 0 ? "green" : "muted"} flash={flashRows.has("TODAY")} freq={700} />
        <ConsoleRow label="ENGINES"  value={data.engines} sub="operational" accent="cyan" freq={800} />
        <ConsoleRow label="ATK_SIGS" value={data.attackSigs} sub="indexed" accent={data.attackSigs > 0 ? "amber" : "muted"} freq={900} />
        <ConsoleRow label="CORE"     value={data.coreTests} accent="green" pulse freq={1000} />
      </div>

      {/* ── Genesis progress ── */}
      <div className="px-5 py-2.5 border-b border-white/[0.02] group/p cursor-default transition-colors duration-300 hover:bg-white/[0.012]"
        onMouseEnter={() => playTick(550, "triangle", 0.05, 0.012)}>
        <div className="flex items-center gap-3">
          <span className="text-white/30 group-hover/p:text-white/55 text-[11px] tracking-[0.15em] uppercase font-mono shrink-0 transition-colors duration-300">GENESIS_PROGRESS</span>
          <div className="flex-1 h-[2px] bg-white/[0.04] overflow-hidden rounded-full">
            <div className="h-full bg-gradient-to-r from-cyan-500/50 via-cyan-400/30 to-cyan-300/10 transition-all duration-1000 rounded-full"
              style={{ width: `${genesisPct}%` }} />
          </div>
          <span className="text-cyan-400/70 group-hover/p:text-cyan-400/90 text-[11px] tracking-[0.1em] font-mono shrink-0 transition-colors duration-300">{genesisPct}%</span>
        </div>
      </div>

      {/* ── Network topology ── */}
      <div className="relative" style={{ height: 200 }}>
        {hasNodes ? (
          <>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-4 right-4 text-right pointer-events-none">
              <div className="text-[10px] tracking-[0.25em] text-white/20 uppercase font-light font-mono">SCANS</div>
              <div className="text-[15px] font-mono text-cyan-400/70 tracking-[0.06em]">{data.totalScans}</div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-4 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-white/80 animate-ping" style={{ animationDuration: "2s" }} />
                  <span className="relative w-2 h-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </span>
                <span className="text-white/25 text-[10px] tracking-[0.12em] uppercase font-mono">GENESIS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400/60 shadow-[0_0_4px_rgba(34,211,238,0.4)]" />
                <span className="text-white/18 text-[10px] tracking-[0.12em] uppercase font-mono">ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400/40 shadow-[0_0_3px_rgba(168,85,247,0.3)]" />
                <span className="text-white/15 text-[10px] tracking-[0.12em] uppercase font-mono">AGENT</span>
              </div>
            </div>
          </>
        ) : (
          <TopologyPlaceholder />
        )}
      </div>
    </div>
  );
}

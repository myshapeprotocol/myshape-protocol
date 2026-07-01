"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface NetworkNode {
  handle: string;
  mask: string;
  status: string;
  particleLevel: number;
  entropy: number;
  lastSeen: string;
  scans: number;
  isGenesis: boolean;
}

interface NetworkData {
  totalNodes: number;
  activeHumans: number;
  genesisNodes: number;
  agents: number;
  activeToday: number;
  totalScans: number;
  lastInbound: { handle: string; mask: string; timestamp: string } | null;
  nodes: NetworkNode[];
  engines: number;
  attackSigs: number;
  specSections: number;
  integrationLines: string;
  coreTests: string;
  protocolEnclave: boolean;
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  node: NetworkNode;
  radius: number;
  glow: number;
  phase: number;
}

/* ── Console readout row ── */
function ConsoleRow({
  label,
  value,
  sub,
  accent = "cyan",
  pulse = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "amber" | "green" | "muted" | "red";
  pulse?: boolean;
}) {
  const accentColor = {
    cyan:  { dot: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]", val: "text-cyan-400/70", sub: "text-cyan-400/30" },
    amber: { dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]", val: "text-amber-400/70", sub: "text-amber-400/30" },
    green: { dot: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]", val: "text-green-400/70", sub: "text-green-400/30" },
    muted: { dot: "bg-white/10", val: "text-white/30", sub: "text-white/22" },
    red:   { dot: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.4)]", val: "text-red-400/70", sub: "text-red-400/30" },
  };
  const c = accentColor[accent];

  return (
    <div className="flex items-center gap-3 group/row hover:bg-white/[0.015] px-3 py-2 -mx-3 transition-colors duration-500">
      {pulse && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} animate-pulse`} />}
      {!pulse && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />}
      <span className="text-cyan-400/25 text-[13px] tracking-[0.1em] font-mono shrink-0 w-4 text-right">{">"}</span>
      <span className="text-white/30 text-[13px] tracking-[0.12em] uppercase font-mono shrink-0 w-[80px]">{label}</span>
      <span className={`text-[15px] tracking-[0.02em] font-mono font-light ${c.val}`}>{value}</span>
      {sub && <span className={`text-[11px] tracking-[0.1em] font-mono ${c.sub}`}>{sub}</span>}
    </div>
  );
}

/* ── Empty topology: protocol diagram placeholder ── */
function EmptyTopology() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: "200px" }}>
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.8) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }} />

      {/* Central cluster */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {/* Pulse rings */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-ping opacity-30"
            style={{ animationDuration: "3s" }} />
          <div className="absolute inset-2 rounded-full border border-cyan-400/[0.06]" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.25)]" />
        </div>

        <div className="text-center space-y-1">
          <p className="text-white/22 text-[11px] tracking-[0.2em] uppercase font-mono">
            TOPOLOGY_AWAITING_GENESIS
          </p>
          <p className="text-white/15 text-[10px] tracking-[0.15em] uppercase font-mono max-w-[260px] leading-relaxed">
            mesh initializes when first node completes genesis ritual
          </p>
        </div>
      </div>

      {/* Bracket corners */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-cyan-400/[0.06]" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-cyan-400/[0.06]" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-cyan-400/[0.06]" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-cyan-400/[0.06]" />
    </div>
  );
}

export default function PresenceNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanPos, setScanPos] = useState(0);
  const positionsRef = useRef<NodePosition[]>([]);

  // Scan line animation
  useEffect(() => {
    const timer = setInterval(() => {
      setScanPos(p => (p + 1) % 100);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Fetch network data
  useEffect(() => {
    fetch("/api/presence/network")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Canvas animation loop
  useEffect(() => {
    if (!data || !canvasRef.current || (data.nodes?.length ?? 0) === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const w = canvas.offsetWidth * (window.devicePixelRatio || 1);
    const h = canvas.offsetHeight * (window.devicePixelRatio || 1);
    canvas.width = w;
    canvas.height = h;

    if (positionsRef.current.length === 0 && data.nodes?.length > 0) {
      positionsRef.current = data.nodes.map((n: NetworkNode, i: number) => {
        const angle = (2 * Math.PI * i) / Math.max(1, data.nodes.length);
        const r = Math.min(w, h) * (0.25 + Math.random() * 0.2);
        return {
          x: w / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 60,
          y: h / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          node: n,
          radius: 2 + n.particleLevel * 1.5,
          glow: 0.1 + n.particleLevel * 0.1,
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    const positions = positionsRef.current;

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.min(w, h) * 0.3;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = `rgba(144,200,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      const now = Date.now();
      for (const p of positions) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < p.radius || p.x > w - p.radius) p.vx *= -1;
        if (p.y < p.radius || p.y > h - p.radius) p.vy *= -1;
        p.vx += (w / 2 - p.x) * 0.0001;
        p.vy += (h / 2 - p.y) * 0.0001;

        const pulse = 1 + Math.sin(now / 1000 + p.phase) * 0.3;
        const r = p.radius * pulse;

        if (p.node.isGenesis) {
          const g = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r * 3);
          g.addColorStop(0, `rgba(144,200,255,${p.glow * 2})`);
          g.addColorStop(1, "rgba(144,200,255,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        g2.addColorStop(0, `rgba(255,255,255,${p.glow})`);
        g2.addColorStop(0.5, `rgba(144,200,255,${p.glow})`);
        g2.addColorStop(1, "rgba(144,200,255,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = p.node.isGenesis ? "rgba(255,255,255,0.9)" : "rgba(200,230,255,0.6)";
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [data]);

  if (loading) {
    return (
      <div className="relative border border-cyan-400/[0.08] bg-cyan-400/[0.01] overflow-hidden"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
        <div className="flex items-center gap-2 px-5 py-8 justify-center">
          <span className="w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse" />
          <span className="text-cyan-400/40 text-[10px] tracking-[0.2em] font-mono">
            PROTOCOL_ENCLAVE_HANDSHAKE...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative border border-red-400/[0.08] bg-red-400/[0.01] overflow-hidden"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
        <div className="px-5 py-8 text-center">
          <span className="text-red-400/40 text-[10px] tracking-[0.2em] font-mono">NETWORK_UNREACHABLE</span>
        </div>
      </div>
    );
  }

  const hasNodes = (data.nodes?.length ?? 0) > 0;
  const genesisPct = Math.min(100, Math.round((data.genesisNodes / 100) * 100));

  return (
    <div className="relative border border-cyan-400/[0.08] bg-gradient-to-b from-cyan-400/[0.015] to-transparent overflow-hidden"
      style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>

      {/* ── Scan line ── */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        <div className="absolute w-full h-[1px] transition-all duration-80"
          style={{
            top: `${scanPos}%`,
            background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.06) 20%, rgba(34,211,238,0.12) 50%, rgba(34,211,238,0.06) 80%, transparent)",
          }} />
      </div>

      {/* ── Corner decorations ── */}
      <div className="absolute top-0 left-0 w-3 h-[1px] bg-cyan-400/20" />
      <div className="absolute top-0 left-0 w-[1px] h-3 bg-cyan-400/20" />
      <div className="absolute bottom-0 right-0 w-3 h-[1px] bg-cyan-400/20" />
      <div className="absolute bottom-0 right-0 w-[1px] h-3 bg-cyan-400/20" />

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasNodes ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)] animate-pulse" : "bg-cyan-400/40 shadow-[0_0_4px_rgba(34,211,238,0.2)]"}`} />
          <span className="text-white/35 text-[11px] tracking-[0.15em] uppercase font-mono">
            PROTOCOL_ENCLAVE
          </span>
          <span className="text-white/[0.08]">|</span>
          <span className={`text-[10px] tracking-[0.12em] uppercase font-mono ${hasNodes ? "text-green-400/70" : "text-white/22"}`}>
            {hasNodes ? "MESH_ACTIVE" : "PRE_GENESIS"}
          </span>
        </div>
        {data.lastInbound && (
          <div className="flex items-center gap-1.5">
            <span className="text-white/15 text-[9px] tracking-[0.1em] uppercase font-mono">LAST_INBOUND</span>
            <span className="text-white/30 text-[10px] tracking-[0.08em] font-mono">{data.lastInbound.mask}</span>
          </div>
        )}
      </div>

      {/* ── Console readout ── */}
      <div className="px-5 py-4 border-b border-white/[0.02] space-y-0.5">
        <ConsoleRow label="ENCLAVE" value={hasNodes ? "OPERATIONAL" : "STANDBY"} accent={hasNodes ? "green" : "muted"} pulse={hasNodes} />
        <ConsoleRow label="NODES" value={data.totalNodes} sub={data.totalNodes === 0 ? "(awaiting first uplink)" : `human:${data.activeHumans}  agent:${data.agents}`} accent={data.totalNodes > 0 ? "cyan" : "muted"} pulse={data.totalNodes > 0} />
        <ConsoleRow label="GENESIS" value={`${data.genesisNodes}/100`} sub={genesisPct > 0 ? `${genesisPct}% complete` : "(cohort forming)"} accent={data.genesisNodes > 0 ? "amber" : "muted"} pulse={data.genesisNodes > 0} />
        <ConsoleRow label="TODAY" value={data.activeToday} sub={data.activeToday > 0 ? "scans recorded" : "(no activity)"} accent={data.activeToday > 0 ? "green" : "muted"} />
        <ConsoleRow label="ENGINES" value={data.engines} sub="operational" accent="cyan" />
        <ConsoleRow label="ATK_SIGS" value={data.attackSigs} sub="indexed · monitoring" accent={data.attackSigs > 0 ? "amber" : "muted"} />
        <ConsoleRow label="CORE" value={data.coreTests} sub="all tests passing" accent="green" pulse />
      </div>

      {/* ── Genesis progress bar ── */}
      <div className="px-5 py-2 border-b border-white/[0.02]">
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-[11px] tracking-[0.15em] uppercase font-mono shrink-0">GENESIS_PROGRESS</span>
          <div className="flex-1 h-[2px] bg-white/[0.04] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-amber-300/30 transition-all duration-1000"
              style={{ width: `${genesisPct}%` }} />
          </div>
          <span className="text-amber-400/70 text-[11px] tracking-[0.1em] font-mono shrink-0">{genesisPct}%</span>
        </div>
      </div>

      {/* ── Network topology ── */}
      {hasNodes ? (
        <div className="relative" style={{ height: "240px" }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-4 right-4 text-right pointer-events-none">
            <div className="text-[10px] tracking-[0.25em] text-white/30 uppercase font-light">SCANS</div>
            <div className="text-[15px] font-mono text-cyan-400/70 tracking-[0.06em]">{data.totalScans}</div>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 text-[7px] tracking-[0.12em] pointer-events-none">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_3px_rgba(255,255,255,0.4)]" /><span className="text-white/25">GENESIS</span></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" /><span className="text-white/15">ACTIVE</span></div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400/30" /><span className="text-white/10">AGENT</span></div>
          </div>
        </div>
      ) : (
        <EmptyTopology />
      )}
    </div>
  );
}

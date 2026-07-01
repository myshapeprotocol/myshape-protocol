"use client";
import { useEffect, useRef, useState } from "react";

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

/* ── Metric chip sub-component ── */
function MetricChip({
  label,
  value,
  sub,
  accent = "cyan",
  pulse = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "amber" | "green" | "muted";
  pulse?: boolean;
}) {
  const accentMap = {
    cyan:   { dot: "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]", value: "text-cyan-300/90", sub: "text-cyan-400/30" },
    amber:  { dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]", value: "text-amber-300/90", sub: "text-amber-400/30" },
    green:  { dot: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]", value: "text-green-300/90", sub: "text-green-400/30" },
    muted:  { dot: "bg-white/20", value: "text-white/50", sub: "text-white/15" },
  };
  const a = accentMap[accent];

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2.5 transition-all duration-500 hover:bg-white/[0.02] rounded">
      <div className="flex items-center gap-1.5">
        {pulse && <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-pulse`} />}
        <span className="text-white/20 text-[8px] tracking-[0.2em] uppercase font-mono">{label}</span>
      </div>
      <span className={`text-[13px] font-light tracking-[0.04em] font-mono ${a.value}`}>
        {value}
      </span>
      {sub && <span className={`text-[7px] tracking-[0.15em] uppercase font-mono ${a.sub}`}>{sub}</span>}
    </div>
  );
}

/* ── Empty network state ── */
function EmptyTopology() {
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ height: "220px" }}>
      {/* Subtle protocol grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34,211,238,0.8) 0.5px, transparent 0.5px), linear-gradient(rgba(34,211,238,0.06) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(34,211,238,0.06) 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px, 48px 48px, 48px 48px",
        }}
      />

      {/* Central pulse ring */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer rings */}
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ width: 80, height: 80, marginLeft: -40, marginTop: -40, border: "1px solid rgba(34,211,238,0.3)" }} />
          <div className="absolute inset-0 rounded-full"
            style={{ width: 60, height: 60, marginLeft: -30, marginTop: -30, border: "1px solid rgba(34,211,238,0.15)" }} />
          {/* Core dot */}
          <div className="relative w-4 h-4 rounded-full bg-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-pulse"
            style={{ margin: "28px" }} />
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-cyan-400/50 text-[10px] tracking-[0.2em] uppercase font-mono">
            NETWORK_TOPOLOGY
          </p>
          <p className="text-white/15 text-[8px] tracking-[0.15em] uppercase font-mono max-w-[260px] leading-relaxed">
            awaiting first genesis node to initialize protocol mesh
          </p>
        </div>

        {/* Decorative corner brackets */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-cyan-400/10" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-cyan-400/10" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-cyan-400/10" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-cyan-400/10" />
      </div>
    </div>
  );
}

export default function PresenceNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const positionsRef = useRef<NodePosition[]>([]);

  // Fetch network data
  useEffect(() => {
    fetch("/api/presence/network")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Canvas animation loop
  useEffect(() => {
    if (!data || !canvasRef.current || data.nodes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const w = canvas.offsetWidth * (window.devicePixelRatio || 1);
    const h = canvas.offsetHeight * (window.devicePixelRatio || 1);
    canvas.width = w;
    canvas.height = h;

    // Initialize node positions if needed
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

      // Draw connections between nearby nodes
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const dx = positions[i].x - positions[j].x;
          const dy = positions[i].y - positions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.min(w, h) * 0.3;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(positions[j].x, positions[j].y);
            ctx.strokeStyle = `rgba(144,200,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
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
        ctx.fillStyle = p.node.isGenesis
          ? "rgba(255,255,255,0.9)"
          : "rgba(200,230,255,0.6)";
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [data]);

  if (loading) {
    return (
      <div className="border border-cyan-400/10 bg-cyan-400/[0.02] p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-cyan-400/40 text-[10px] tracking-[0.2em] font-mono">
          <span className="w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse" />
          PROTOCOL_ENCLAVE_HANDSHAKE...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border border-red-400/10 bg-red-400/[0.02] p-8 text-center">
        <div className="text-red-400/40 text-[10px] tracking-[0.2em] font-mono">
          NETWORK_UNREACHABLE
        </div>
      </div>
    );
  }

  const hasNodes = data.nodes.length > 0;

  return (
    <div className="border border-cyan-400/10 bg-cyan-400/[0.015] overflow-hidden"
      style={{ boxShadow: "inset 0 1px 0 rgba(34,211,238,0.04)" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasNodes ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-cyan-400/40 shadow-[0_0_4px_rgba(34,211,238,0.3)]"} ${hasNodes ? "animate-pulse" : ""}`} />
        <span className="text-cyan-400/50 text-[9px] tracking-[0.2em] uppercase font-mono">
          PROTOCOL_ENCLAVE
        </span>
        <span className="text-white/15 text-[8px] tracking-[0.15em] uppercase font-mono">
          {hasNodes ? "ACTIVE_MESH" : "PRE_GENESIS"}
        </span>
        {data.lastInbound && (
          <>
            <span className="text-white/[0.06] ml-2">|</span>
            <span className="text-white/15 text-[7px] tracking-[0.12em] uppercase font-mono">
              LAST: {data.lastInbound.mask}
            </span>
          </>
        )}
      </div>

      {/* ── Metrics row ── */}
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0 px-2 py-3 border-b border-white/[0.03]">
        <MetricChip label="NODES" value={data.totalNodes} sub={data.totalNodes === 0 ? "awaiting" : `${data.activeHumans}h + ${data.agents}a`} accent={data.totalNodes > 0 ? "cyan" : "muted"} pulse={data.totalNodes > 0} />
        <span className="text-white/[0.04] text-[10px] select-none">·</span>
        <MetricChip label="GENESIS" value={`${data.genesisNodes}/100`} sub={data.genesisNodes >= 100 ? "SEALED" : "forming"} accent={data.genesisNodes > 0 ? "amber" : "muted"} pulse={data.genesisNodes > 0} />
        <span className="text-white/[0.04] text-[10px] select-none">·</span>
        <MetricChip label="TODAY" value={data.activeToday} sub={data.activeToday > 0 ? "active scans" : "—"} accent={data.activeToday > 0 ? "green" : "muted"} />
        <span className="text-white/[0.04] text-[10px] select-none">·</span>
        <MetricChip label="ENGINES" value={data.engines} sub="running" accent="cyan" />
        <span className="text-white/[0.04] text-[10px] select-none">·</span>
        <MetricChip label="ATTACK_SIGS" value={data.attackSigs} sub="indexed" accent="amber" />
        <span className="text-white/[0.04] text-[10px] select-none">·</span>
        <MetricChip label="CORE" value={data.coreTests} sub="all pass" accent="green" />
      </div>

      {/* ── Network visualization ── */}
      {hasNodes ? (
        <div className="relative" style={{ height: "280px" }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Overlay: total scans */}
          <div className="absolute top-4 right-4 text-right pointer-events-none">
            <div className="text-[7px] tracking-[0.3em] text-white/20 uppercase font-light">TOTAL_SCANS</div>
            <div className="text-[14px] font-mono text-cyan-400/40 tracking-[0.1em]">{data.totalScans}</div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[7px] tracking-[0.15em] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
              <span className="text-white/30">GENESIS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
              <span className="text-white/20">ACTIVE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
              <span className="text-white/15">AGENT</span>
            </div>
          </div>
        </div>
      ) : (
        <EmptyTopology />
      )}
    </div>
  );
}

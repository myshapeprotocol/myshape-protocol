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
    if (!data || !canvasRef.current) return;
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
        // Move
        p.x += p.vx;
        p.y += p.vy;
        // Bounce off edges
        if (p.x < p.radius || p.x > w - p.radius) p.vx *= -1;
        if (p.y < p.radius || p.y > h - p.radius) p.vy *= -1;
        // Keep centered
        p.vx += (w / 2 - p.x) * 0.0001;
        p.vy += (h / 2 - p.y) * 0.0001;

        const pulse = 1 + Math.sin(now / 1000 + p.phase) * 0.3;
        const r = p.radius * pulse;

        // Outer glow (genesis nodes get extra)
        if (p.node.isGenesis) {
          const g = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r * 3);
          g.addColorStop(0, `rgba(144,200,255,${p.glow * 2})`);
          g.addColorStop(1, "rgba(144,200,255,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        // Inner glow
        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        g2.addColorStop(0, `rgba(255,255,255,${p.glow})`);
        g2.addColorStop(0.5, `rgba(144,200,255,${p.glow})`);
        g2.addColorStop(1, "rgba(144,200,255,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();

        // Core dot
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

  return (
    <div className="border border-cyan-400/15 bg-cyan-400/[0.02] overflow-hidden">
      {/* Header stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 border-b border-white/5 bg-white/[0.02] text-[9px] tracking-[0.12em] font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,211,238,0.6)] animate-pulse shrink-0" />
        <span className="text-cyan-400/60 uppercase">PROTOCOL_ENCLAVE: ACTIVE</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">NODES</span>
        <span className="text-white/50">{data.totalNodes}</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">GENESIS</span>
        <span className="text-amber-400/50">{data.genesisNodes}/100</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">TODAY</span>
        <span className="text-green-400/50">{data.activeToday}</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">ENGINES</span>
        <span className="text-white/50">{data.engines}</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">ATTACK_SIGS</span>
        <span className="text-white/50">{data.attackSigs}</span>
        <span className="text-white/10">|</span>
        <span className="text-white/30">CORE</span>
        <span className="text-green-400/50">{data.coreTests}</span>
      </div>

      {/* Network visualization */}
      <div className="relative" style={{ height: "280px" }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Overlay: last inbound */}
        {data.lastInbound && (
          <div className="absolute bottom-4 right-4 text-right pointer-events-none">
            <div className="text-[7px] tracking-[0.3em] text-cyan-500/40 uppercase font-light mb-1">
              LAST_NODE_INBOUND
            </div>
            <div className="text-[10px] font-mono text-white/50 tracking-[0.15em]">
              {data.lastInbound.mask}
            </div>
            <div className="text-[7px] text-white/20 tracking-[0.1em] mt-0.5">
              STATUS: STREAMED
            </div>
          </div>
        )}

        {/* Overlay: total scans */}
        <div className="absolute top-4 right-4 text-right pointer-events-none">
          <div className="text-[7px] tracking-[0.3em] text-white/20 uppercase font-light">
            TOTAL_SCANS
          </div>
          <div className="text-[14px] font-mono text-cyan-400/40 tracking-[0.1em]">
            {data.totalScans}
          </div>
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
    </div>
  );
}

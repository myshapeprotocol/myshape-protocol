"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

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
  nodes: NetworkNode[];
  engines: number;
  attackSigs: number;
  protocolEnclave: boolean;
}

function computeEvolutionaryEntropy(data: NetworkData): number {
  if (!data.nodes.length) return 0;
  const totalEntropy = data.nodes.reduce((sum, n) => sum + (n.entropy || 0), 0);
  const activeEntropy = data.nodes.filter(n => n.scans > 0).length;
  const meanEntropy = totalEntropy / Math.max(data.nodes.length, 1);
  const diversityFactor = Math.min(activeEntropy / Math.max(data.nodes.length, 1), 1);
  return +(meanEntropy * diversityFactor * (1 + Math.log(Math.max(data.totalScans, 1)))).toFixed(1);
}

export default function ContinuityClient() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/presence/network")
        .then(r => r.json())
        .then(d => {
          if (d.error) { setData(null); setLoading(false); return; }
          setData(d);
          setLoading(false);
        })
        .catch(() => { setData(null); setLoading(false); });
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const evoEntropy = data ? computeEvolutionaryEntropy(data) : 0;

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono">
      <ProtocolHeader />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="text-cyan-500/45 text-[10px] tracking-[0.5em] uppercase">State Chain of Subject Evolution</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>
            Global Continuity Network
          </h1>
          <p className="text-white/30 text-[11px] tracking-[0.08em] max-w-lg">
            Not a user list. A network of verified trajectories — each node a sovereign subject evolving across time.
          </p>
        </div>

        {/* KPI Row */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Trajectories", value: data.totalNodes, extra: `${data.activeHumans} human · ${data.agents} agent` },
              { label: "Evolutionary Entropy", value: evoEntropy, extra: "protocol vitality index" },
              { label: "Presence Receipts", value: data.totalScans, extra: "total notarized becomings" },
              { label: "Active Today", value: data.activeToday, extra: "continuity signals / 24h" },
            ].map(kpi => (
              <div key={kpi.label}
                onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
                className="p-4 border bg-cyan-400/[0.01] transition-all hover:border-cyan-400/30"
                style={{ borderColor: "rgba(144,200,255,0.1)" }}>
                <div className="text-white/20 text-[8px] tracking-[0.25em] uppercase mb-2">{kpi.label}</div>
                <div className="text-white/80 text-[28px] font-light font-mono">{kpi.value}</div>
                <div className="text-cyan-400/25 text-[8px] mt-1">{kpi.extra}</div>
              </div>
            ))}
          </div>
        )}

        {/* Genesis Nodes */}
        {data && data.genesisNodes > 0 && (
          <section className="border p-6 space-y-3"
            style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.02)" }}>
            <div className="flex items-center justify-between">
              <span className="text-amber-400/50 text-[9px] tracking-[0.3em] uppercase">Founding Cohort</span>
              <span className="text-amber-400/30 text-[9px]">{data.genesisNodes} / 100</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.nodes.filter(n => n.isGenesis).slice(0, 20).map((n, i) => (
                <div key={n.handle || i}
                  className="px-3 py-1.5 border text-[9px] tracking-[0.1em]"
                  style={{ borderColor: "rgba(212,175,55,0.2)", background: "rgba(212,175,55,0.04)", color: "rgba(212,175,55,0.6)" }}>
                  {n.handle || `GNS_${i + 1}`}
                </div>
              ))}
              {data.genesisNodes > 20 && (
                <div className="px-3 py-1.5 border text-[9px]"
                  style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}>
                  +{data.genesisNodes - 20} more
                </div>
              )}
            </div>
          </section>
        )}

        {/* Network Nodes */}
        {data && data.nodes.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase">Connected Trajectories</span>
              <span className="text-white/10 text-[8px]">{data.nodes.length} nodes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.nodes.slice(0, 20).map((node) => (
                <div key={node.handle || node.mask}
                  className="flex items-center justify-between p-3 border transition-all hover:border-cyan-400/20"
                  style={{ borderColor: "rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.01)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: node.isGenesis ? "#d4af37" : node.scans > 0 ? "#22d3ee" : "#333",
                        boxShadow: node.isGenesis ? "0 0 6px rgba(212,175,55,0.6)" : node.scans > 0 ? "0 0 6px rgba(34,211,238,0.4)" : "none",
                      }} />
                    <div>
                      <div className="text-white/40 text-[10px] tracking-[0.05em]">{node.handle || node.mask}</div>
                      <div className="text-white/15 text-[7px] tracking-[0.1em]">
                        {node.scans} receipts · Lv.{node.particleLevel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400/40 text-[8px] font-mono">{node.entropy?.toFixed(0) || "—"}</div>
                    <div className="text-white/10 text-[7px]">entropy</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && (!data || data.nodes.length === 0) && (
          <div className="text-center py-20 border border-cyan-400/12 bg-cyan-400/[0.01] space-y-4">
            <div className="text-cyan-400/30 text-[10px] tracking-[0.4em] uppercase">No Trajectories Yet</div>
            <p className="text-white/25 text-[12px] max-w-md mx-auto leading-relaxed">
              The network is waiting for its first verified trajectories. Be the first to establish a sovereign continuity chain.
            </p>
            <Link href="/genesis"
              className="inline-block px-10 py-3.5 border border-cyan-400/30 text-cyan-300/70 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all mt-4"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}>
              Initialize Your Trajectory →
            </Link>
          </div>
        )}

        {/* Protocol Stats Footer */}
        {data && (
          <div className="border-t pt-6 flex flex-wrap gap-6 justify-center"
            style={{ borderColor: "rgba(144,200,255,0.06)" }}>
            {[
              { label: "Protocol Engines", value: data.engines },
              { label: "Attack Signatures", value: data.attackSigs },
              { label: "Enclave", value: data.protocolEnclave ? "ACTIVE" : "DEGRADED" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-white/10 text-[7px] tracking-[0.15em] uppercase">{s.label}</div>
                <div className="text-white/25 text-[10px] font-mono">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22d3ee", boxShadow: "0 0 10px rgba(34,211,238,0.9)" }} />
              <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase">Scanning network...</span>
            </div>
          </div>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

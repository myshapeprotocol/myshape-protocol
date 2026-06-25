"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import GenesisBadge from "@/components/genesis-badge/GenesisBadge";
import { playTick } from "@/utils/useAudioTick";

interface NodeStats {
  email: string;
  status: string;
  is_genesis: boolean;
  is_active: boolean;
  scan_count: number;
  data_contribution: number;
  tier: string;
  early_access: boolean;
  registered_at: string;
}

function getOrbitalTier(sc: number): { count: number; name: string } {
  if (sc >= 100) return { count: 8, name: "Genesis Sealed" };
  if (sc >= 85) return { count: 7, name: "Saturated" };
  if (sc >= 70) return { count: 6, name: "Stabilized" };
  if (sc >= 50) return { count: 5, name: "Anchored" };
  if (sc >= 30) return { count: 4, name: "Fusion" };
  if (sc >= 15) return { count: 3, name: "Resonant" };
  if (sc >= 5) return { count: 2, name: "Linked" };
  if (sc >= 1) return { count: 1, name: "Awakened" };
  return { count: 0, name: "Awaiting" };
}

export default function DashboardClient() {
  const [stats, setStats] = useState<NodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenesis, setIsGenesis] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = sessionStorage.getItem("genesis_email");
    const completed = sessionStorage.getItem("genesis_completed") === "1";
    setIsGenesis(completed);

    if (!email) { setLoading(false); return; }

    fetch(`/api/node/privileges?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.email) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // 每 30 秒刷新
    const interval = setInterval(() => {
      fetch(`/api/node/privileges?email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(data => { if (data.email) setStats(data); })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const tier = stats ? getOrbitalTier(stats.scan_count) : { count: 0, name: "—" };
  const progressPct = stats ? Math.min((stats.scan_count / 100) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-16 space-y-16">
        {/* Header */}
        <div>
          <div className="text-cyan-500/40 text-[9px] tracking-[0.5em] uppercase mb-4">SOVEREIGN_IDENTITY_HUB</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase mb-2">Dashboard</h1>
          <p className="text-white/30 text-[11px] tracking-[0.1em]">Your Genesis identity, consolidated.</p>
        </div>

        {!isGenesis ? (
          /* Not Genesis — prompt */
          <div className="text-center py-16 border border-cyan-400/10 bg-cyan-400/[0.02] space-y-6">
            <div className="text-cyan-400/30 text-[9px] tracking-[0.4em] uppercase">Identity Not Initialized</div>
            <p className="text-white/25 text-[12px] leading-relaxed max-w-md mx-auto">
              Complete the Genesis Ritual to unlock your sovereign identity dashboard — scan tracking, orbital particle tier, and protocol contribution metrics.
            </p>
            <Link href="/genesis"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-block px-8 py-3 border border-cyan-400/30 text-cyan-300/70 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] transition-all">
              Initialize Genesis →
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-16 text-white/15 text-[10px] tracking-[0.3em] uppercase animate-pulse">
            Decrypting identity stream...
          </div>
        ) : stats ? (
          <>
            {/* Identity Card */}
            <section>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <GenesisBadge />
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-cyan-400/10 bg-cyan-400/[0.02]">
                      <div className="text-white/20 text-[7px] tracking-[0.3em] uppercase mb-2">Status</div>
                      <div className="text-cyan-300/80 text-[14px] tracking-[0.15em] uppercase">{stats.tier}</div>
                    </div>
                    <div className="p-4 border border-cyan-400/10 bg-cyan-400/[0.02]">
                      <div className="text-white/20 text-[7px] tracking-[0.3em] uppercase mb-2">Access Level</div>
                      <div className="text-cyan-300/80 text-[14px] tracking-[0.15em] uppercase">{stats.early_access ? "OMEGA" : "STANDARD"}</div>
                    </div>
                    <div className="p-4 border border-cyan-400/10 bg-cyan-400/[0.02]">
                      <div className="text-white/20 text-[7px] tracking-[0.3em] uppercase mb-2">Total Scans</div>
                      <div className="text-white/80 text-[24px] font-light font-mono">{stats.scan_count}</div>
                    </div>
                    <div className="p-4 border border-cyan-400/10 bg-cyan-400/[0.02]">
                      <div className="text-white/20 text-[7px] tracking-[0.3em] uppercase mb-2">Data Contrib</div>
                      <div className="text-white/80 text-[24px] font-light font-mono">{stats.data_contribution}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Orbital Tier Progress */}
            <section className="border border-cyan-400/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase">Orbital Evolution</span>
                <span className="text-cyan-400/50 font-mono text-[10px]">{tier.count} / 8 — {tier.name}</span>
              </div>
              <div className="relative h-2 bg-white/[0.04] overflow-hidden mb-2">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/40 via-cyan-400/60 to-cyan-300/40 transition-all duration-1000"
                  style={{ width: `${Math.max(progressPct, 1)}%`, boxShadow: "0 0 8px rgba(34,211,238,0.3)" }} />
              </div>
              <div className="flex justify-between text-[7px] text-white/10 tracking-[0.15em] uppercase">
                <span>Awakening</span><span>Linked</span><span>Resonant</span><span>Fusion</span><span>Anchored</span><span>Stabilized</span><span>Saturated</span><span>Sealed</span>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="flex flex-wrap gap-4 justify-center">
              <Link href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-cyan-400/20 text-cyan-300/50 text-[9px] tracking-[0.25em] uppercase hover:border-cyan-400/40 hover:text-cyan-200 transition-all">
                ◈ Scan Now →
              </Link>
              <Link href="/whitepaper"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-cyan-400/15 text-white/20 text-[9px] tracking-[0.25em] uppercase hover:border-cyan-400/30 hover:text-white/40 transition-all">
                Whitepaper →
              </Link>
              <Link href="/protocol"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-cyan-400/15 text-white/20 text-[9px] tracking-[0.25em] uppercase hover:border-cyan-400/30 hover:text-white/40 transition-all">
                Protocol →
              </Link>
            </section>
          </>
        ) : (
          <div className="text-center py-16 text-white/15 text-[10px] tracking-[0.3em] uppercase">
            Unable to load identity data. Please re-initialize Genesis.
          </div>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

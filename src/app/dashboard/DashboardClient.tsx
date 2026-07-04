"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import GenesisBadge from "@/components/genesis-badge/GenesisBadge";
import { playTick } from "@/utils/useAudioTick";

interface NodeStats {
  email: string; status: string; is_genesis: boolean; is_active: boolean;
  scan_count: number; data_contribution: number; tier: string;
  early_access: boolean; registered_at: string;
  entropy_score?: number; particle_level?: number; streak_days?: number;
  position_number?: number;
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

function StatCard({ label, value, pulse, extra }: { label: string; value: string | number; pulse?: boolean; extra?: string }) {
  return (
    <div
      onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
      className={`p-4 border bg-[#90c8ff]/[0.02] transition-all duration-300 group cursor-default ${pulse ? "border-[#90c8ff]/50 shadow-[0_0_20px_rgba(144,200,255,0.4)] scale-[1.02]" : "border-white/[0.06] hover:border-[#90c8ff]/30"}`}>
      <div className="text-white/25 text-[8px] tracking-[0.3em] uppercase mb-2 group-hover:text-white/40 transition-colors">{label}</div>
      <div className="text-white/85 text-[26px] font-light font-mono">{value}</div>
      {extra && <div className="text-[#90c8ff]/30 text-[9px] mt-1">{extra}</div>}
    </div>
  );
}

export default function DashboardClient() {
  const [stats, setStats] = useState<NodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [witnessNumber, setWitnessNumber] = useState<number | undefined>(undefined);
  const witnessNumberRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    const n = parseInt(sessionStorage.getItem("witness_number") || "0") || undefined;
    setWitnessNumber(n);
    witnessNumberRef.current = n;
  }, []);
  const [isGenesis, setIsGenesis] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const prevScanRef = { current: 0 };

  /* ── 双向兼容：Genesis 流程 (genesis_*) 和 Handshake 流程 (node_*) ── */
  const nodeHandle = typeof window !== "undefined"
    ? (sessionStorage.getItem("node_handle") || sessionStorage.getItem("genesis_node_handle") || null)
    : null;
  const isHandshakeNode = typeof window !== "undefined"
    ? !!sessionStorage.getItem("node_token")
    : false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = sessionStorage.getItem("node_email") || sessionStorage.getItem("genesis_email");
    const completed = sessionStorage.getItem("genesis_completed") === "1";
    const hasNode = !!sessionStorage.getItem("node_token");
    setIsGenesis(completed || hasNode);

    // Handshake 节点：直接用 sessionStorage 数据，不调 API
    if (hasNode && !completed) {
      setStats({
        email: email || "",
        status: sessionStorage.getItem("genesis_status") || "GENESIS_CONNECTED",
        is_genesis: false,
        is_active: true,
        scan_count: 0,
        data_contribution: 0,
        tier: "Awakened",
        early_access: false,
        registered_at: new Date().toISOString(),
        entropy_score: undefined,
        particle_level: 0,
        streak_days: 0,
        position_number: undefined,
      });
      setLoading(false);
      return;
    }

    if (!email) { setLoading(false); return; }

    const fetchStats = () => {
      Promise.all([
        fetch(`/api/node/privileges?email=${encodeURIComponent(email)}`).then(r => r.json()),
        fetch(`/api/node/entropy?email=${encodeURIComponent(email)}`).then(r => r.json()),
      ])
        .then(([priv, ent]) => {
          if (priv.email) {
            if (priv.scan_count > prevScanRef.current) { setScanPulse(true); setTimeout(() => setScanPulse(false), 800); }
            prevScanRef.current = priv.scan_count;
            setStats({
              ...priv,
              entropy_score: ent.entropyScore,
              particle_level: ent.particleLevel,
              streak_days: ent.streakDays,
              position_number: priv.position_number || witnessNumberRef.current,
            });
          } else Sentry.captureMessage("Dashboard: empty node data", { extra: { email: email.slice(0, 3) + "***" } });
          setLoading(false);
        })
        .catch(err => { Sentry.captureException(err, { tags: { page: "dashboard" } }); setLoading(false); });
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const tier = stats ? getOrbitalTier(stats.scan_count) : { count: 0, name: "—" };
  const progressPct = stats ? Math.min((stats.scan_count / 100) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-12 md:space-y-14">
        {/* Header */}
        <div>
          <div className="text-[#90c8ff]/45 text-[10px] tracking-[0.5em] uppercase mb-4">Evolutionary Trajectory</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase mb-2"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Your Continuity</h1>
          <p className="text-white/35 text-[11px] tracking-[0.1em]">
            Identity is a snapshot. Continuity is a trajectory.
          </p>
        </div>

        {!isGenesis ? (
          <div className="text-center py-16 border border-[#90c8ff]/12 bg-[#90c8ff]/[0.02] space-y-6"
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
            <div className="text-[#90c8ff]/35 text-[10px] tracking-[0.4em] uppercase">Identity Not Initialized</div>
            <p className="text-white/30 text-[12px] leading-relaxed max-w-md mx-auto">
              Complete the Genesis Ritual or Node Handshake to unlock your sovereign identity dashboard — scan tracking, orbital particle tier, and protocol contribution metrics.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/genesis"
                onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                className="inline-block px-10 py-3.5 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white transition-all"
                style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", background: "rgba(144,200,255,0.03)" }}>
                Genesis →
              </Link>
              <Link href="/handshake"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="inline-block px-10 py-3.5 border border-[#90c8ff]/20 text-[#90c8ff]/45 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all"
                style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", background: "rgba(144,200,255,0.015)" }}>
                Node Handshake →
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#90c8ff", boxShadow: "0 0 10px rgba(144,200,255,0.9)" }} />
              <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase">Decrypting identity stream...</span>
            </div>
          </div>
        ) : stats ? (
          <>
            {/* ── Node Identity Card (Handshake 用户专属) ── */}
            {isHandshakeNode && nodeHandle && (
              <section className="border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-5"
                onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d0f0ff] shadow-[0_0_8px_rgba(180,220,255,0.8)] animate-pulse" />
                  <span className="text-[#a0d0ff]/50 text-[8px] tracking-[0.3em] uppercase">Sovereign Node Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-white/25 text-[7px] tracking-[0.2em] uppercase mb-1">Node_Handle</div>
                    <div className="text-[#b0dcff] font-mono text-lg tracking-[0.1em]" style={{ textShadow: "0 0 12px rgba(160,210,255,0.3)" }}>
                      {nodeHandle}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/25 text-[7px] tracking-[0.2em] uppercase mb-1">Protocol_Status</div>
                    <div className="text-[#90c8ff]/60 font-mono text-sm tracking-[0.15em]">
                      {stats.status || "GENESIS_CONNECTED"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#90c8ff]/8 flex items-center justify-between text-[8px]">
                  <div className="flex items-center gap-4">
                    <span className="text-white/20">Registered: {stats.registered_at ? new Date(stats.registered_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</span>
                    {stats.is_active && <span className="text-green-400/50 tracking-[0.15em] uppercase">● Active</span>}
                  </div>
                  <a href="/handshake"
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="text-[#90c8ff]/35 hover:text-[#90c8ff]/70 text-[9px] tracking-[0.15em] uppercase no-underline transition-colors">
                    ← Sphere
                  </a>
                </div>
              </section>
            )}

            {/* Identity Card */}
            <section itemScope itemType="https://schema.org/Person"
              onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
              <meta itemProp="identifier" content={stats.email.slice(0, 3) + "***"} />
              <meta itemProp="description" content={`MyShape Protocol node — tier: ${stats.tier}, scans: ${stats.scan_count}`} />
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.7)] animate-pulse" />
                <span className="text-[#90c8ff]/30 text-[8px] tracking-[0.25em] uppercase">Identity Stream Active</span>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div itemScope itemType="https://schema.org/DefinedTerm" itemProp="memberOf">
                  <meta itemProp="name" content="Genesis Cohort" />
                  <GenesisBadge />
                </div>
                <div className="flex-1">
                  {stats.position_number && (
                    <div className="text-amber-400/60 text-[10px] tracking-[0.2em] uppercase mb-3 font-mono">
                      Genesis #{String(stats.position_number).padStart(3, '0')}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Presence Receipts" value={stats.scan_count} pulse={scanPulse} extra="notarized becomings" />
                    <StatCard label="Continuity Sessions" value={stats.data_contribution} extra="research contributions" />
                    <StatCard label="Entropy Score" value={stats.entropy_score != null ? stats.entropy_score.toFixed(0) : "—"} extra={stats.particle_level != null ? `Level ${stats.particle_level}` : undefined} />
                    <StatCard label="Streak" value={stats.streak_days != null ? `${stats.streak_days} days` : "—"} extra="continuity chain" />
                  </div>
                </div>
              </div>
            </section>

            {/* Trajectory Evolution */}
            <section className="border border-[#90c8ff]/12 p-6 bg-[#90c8ff]/[0.01]"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/25 text-[9px] tracking-[0.3em] uppercase">Trajectory Evolution</span>
                <span className="text-[#90c8ff]/55 font-mono text-[11px]">{tier.count} / 8 — {tier.name}</span>
              </div>
              <div className="relative h-2 bg-white/[0.04] overflow-hidden mb-2">
                <div className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(progressPct, 1)}%`, background: "linear-gradient(90deg, rgba(144,200,255,0.45), rgba(144,200,255,0.7), rgba(144,200,255,0.55))", boxShadow: "0 0 12px rgba(144,200,255,0.4)" }} />
              </div>
              <div className="flex justify-between text-[8px] text-white/12 tracking-[0.15em] uppercase">
                <span>Awakening</span><span>Linked</span><span>Resonant</span><span>Fusion</span><span>Anchored</span><span>Stabilized</span><span>Saturated</span><span>Sealed</span>
              </div>
              <p className="text-white/15 text-[8px] mt-3 text-center tracking-[0.1em]">
                Each Presence Receipt advances your trajectory. You cannot rush continuity — it accrues.
              </p>
            </section>

            {/* Quick Actions */}
            <section className="flex flex-wrap gap-4 justify-center">
              <Link href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/55 text-[10px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/45 hover:text-[#90c8ff] hover:bg-[#90c8ff]/[0.03] transition-all">
                ◈ Scan Now →
              </Link>
              {isHandshakeNode && (
                <Link href="/handshake"
                  onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                  className="px-6 py-3 border border-[#d0f0ff]/25 text-[#b0d8ff]/55 text-[10px] tracking-[0.25em] uppercase hover:border-[#d0f0ff]/45 hover:text-[#d0f0ff] hover:bg-[#d0f0ff]/[0.03] transition-all">
                  ◇ Node Manager →
                </Link>
              )}
              <Link href="/whitepaper"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-[#90c8ff]/18 text-white/25 text-[10px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/35 hover:text-white/45 transition-all">
                Whitepaper →
              </Link>
              <Link href="/protocol"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-[#90c8ff]/18 text-white/25 text-[10px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/35 hover:text-white/45 transition-all">
                Protocol →
              </Link>
              <Link href="/genesis/cohort"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-3 border border-[#90c8ff]/18 text-white/25 text-[10px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/35 hover:text-white/45 transition-all">
                Cohort →
              </Link>
            </section>
          </>
        ) : (
          <div className="text-center py-16 text-white/20 text-[10px] tracking-[0.3em] uppercase space-y-4">
            <div>Unable to load identity data.</div>
            <div className="flex gap-4 justify-center">
              <Link href="/genesis" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors">Genesis →</Link>
              <Link href="/handshake" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors">Handshake →</Link>
            </div>
          </div>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

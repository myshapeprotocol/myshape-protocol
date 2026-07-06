"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import DashboardHero from "@/components/dashboard/DashboardHero";
import CapabilityMatrix from "@/components/dashboard/CapabilityMatrix";
import ActionCall from "@/components/dashboard/ActionCall";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import type { ProtocolProgress } from "@/types/protocol-progress";
import "@/components/dashboard/dashboard.css";

interface PrivilegesResponse {
  email: string;
  status: string;
  is_genesis: boolean;
  is_active: boolean;
  scan_count: number;
  tier: string;
  protocol_progress: ProtocolProgress;
  registered_at: string;
}

export default function DashboardClient() {
  const [progress, setProgress] = useState<ProtocolProgress | null>(null);
  const [nodeHandle, setNodeHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIdentity, setHasIdentity] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const email =
      sessionStorage.getItem("node_email") ||
      sessionStorage.getItem("genesis_email");
    const completed = sessionStorage.getItem("genesis_completed") === "1";
    const hasNode = !!sessionStorage.getItem("node_token");
    const handle =
      sessionStorage.getItem("node_handle") ||
      sessionStorage.getItem("genesis_node_handle") ||
      null;

    setNodeHandle(handle);
    setHasIdentity(completed || hasNode);

    if (!email) {
      setLoading(false);
      return;
    }

    const fetchProgress = () => {
      fetch(`/api/node/privileges?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((data: PrivilegesResponse) => {
          if (data.protocol_progress) {
            setProgress(data.protocol_progress);
          }
          setLoading(false);
        })
        .catch((err) => {
          Sentry.captureException(err, { tags: { page: "dashboard" } });
          setLoading(false);
        });
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-8 md:space-y-10">
        {/* ── Header ── */}
        <div>
          <div className="text-[#90c8ff]/45 text-[10px] tracking-[0.5em] uppercase mb-4">
            Protocol Journey
          </div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase mb-2"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>
            Your Evolution
          </h1>
          <p className="text-white/35 text-[11px] tracking-[0.1em]">
            Identity is a snapshot. Continuity is a trajectory.
          </p>
        </div>

        {/* ── Not initialized ── */}
        {!hasIdentity && !loading && (
          <div className="text-center py-16 border border-[#90c8ff]/12 bg-[#90c8ff]/[0.02] space-y-6">
            <div className="text-[#90c8ff]/35 text-[10px] tracking-[0.4em] uppercase">
              Identity Not Initialized
            </div>
            <p className="text-white/30 text-[12px] leading-relaxed max-w-md mx-auto">
              Complete the Genesis Ritual or Node Handshake to unlock your
              sovereign identity dashboard — particle evolution, capability
              matrix, and protocol journey tracking.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/genesis"
                className="inline-block px-10 py-3.5 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white transition-all"
                style={{
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                  background: "rgba(144,200,255,0.03)",
                }}
              >
                Genesis →
              </Link>
              <Link
                href="/handshake"
                className="inline-block px-10 py-3.5 border border-[#90c8ff]/20 text-[#90c8ff]/45 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-all"
                style={{
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                  background: "rgba(144,200,255,0.015)",
                }}
              >
                Node Handshake →
              </Link>
            </div>
          </div>
        )}

        {/* ── Loading: three-layer skeleton mirrors the dashboard structure ── */}
        {loading && <DashboardSkeleton />}

        {/* ── Three-Layer Dashboard (render-guarded) ── */}
        {progress && !loading && (
          <>
            <DashboardErrorBoundary>
              {/* Layer 1: Hero — Stage + Particle Progress */}
              <DashboardHero progress={progress} />

              {/* Layer 2: Capability Matrix — isEligibleFor */}
              <CapabilityMatrix progress={progress} />

              {/* Layer 3: Action Call — Next Step */}
              <ActionCall progress={progress} />
            </DashboardErrorBoundary>

            {/* ── Quick nav ── */}
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <Link
                href="/genesis/cohort"
                className="px-5 py-2.5 border border-[#90c8ff]/15 text-white/20 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/35 hover:text-white/40 transition-all no-underline"
              >
                Cohort →
              </Link>
              <Link
                href="/protocol"
                className="px-5 py-2.5 border border-[#90c8ff]/15 text-white/20 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/35 hover:text-white/40 transition-all no-underline"
              >
                Protocol →
              </Link>
              <Link
                href="/whitepaper"
                className="px-5 py-2.5 border border-[#90c8ff]/15 text-white/20 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/35 hover:text-white/40 transition-all no-underline"
              >
                Whitepaper →
              </Link>
            </div>
          </>
        )}

        {/* ── Error: no data ── */}
        {!progress && !loading && hasIdentity && (
          <div className="text-center py-16 text-white/20 text-[10px] tracking-[0.3em] uppercase space-y-4">
            <div>Unable to load identity data.</div>
            <div className="flex gap-4 justify-center">
              <Link href="/genesis" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors">
                Genesis →
              </Link>
              <Link href="/handshake" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors">
                Handshake →
              </Link>
            </div>
          </div>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import ContinuityKPI from "@/components/continuity/ContinuityKPI";
import ContinuityGenesisNodes from "@/components/continuity/ContinuityGenesisNodes";
import ContinuityNodeList from "@/components/continuity/ContinuityNodeList";
import ContinuitySkeleton from "@/components/continuity/ContinuitySkeleton";
import ContinuityEmptyState from "@/components/continuity/ContinuityEmptyState";
import ContinuityErrorState from "@/components/continuity/ContinuityErrorState";
import ContinuityStatsFooter from "@/components/continuity/ContinuityStatsFooter";
import type { NetworkData } from "@/components/continuity/types";
import { computeEvolutionaryEntropy } from "@/components/continuity/types";
import "@/components/continuity/continuity.css";

type PageState = "loading" | "ready" | "empty" | "error";

export default function ContinuityClient() {
  const [data, setData] = useState<NetworkData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");

  const fetchData = useCallback(() => {
    setPageState((prev) => (prev === "ready" || prev === "empty" ? prev : "loading"));
    fetch("/api/presence/network")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setPageState(d.nodes?.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        setData(null);
        setPageState("error");
      });
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const evoEntropy = data ? computeEvolutionaryEntropy(data) : 0;

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-10">
        {/* ── Header ── */}
        <header className="space-y-3">
          <div className="text-[#90c8ff]/45 text-[10px] tracking-[0.5em] uppercase">
            State Chain of Subject Evolution
          </div>
          <h1
            className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white uppercase"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}
          >
            Global Continuity Network
          </h1>
          <p className="text-white/30 text-[11px] tracking-[0.08em] max-w-lg">
            Not a user list. A network of verified trajectories — each node a
            sovereign subject evolving across time.
          </p>
        </header>

        {/* ── Loading ── */}
        {pageState === "loading" && <ContinuitySkeleton />}

        {/* ── Error ── */}
        {pageState === "error" && (
          <ContinuityErrorState onRetry={fetchData} />
        )}

        {/* ── Empty ── */}
        {pageState === "empty" && <ContinuityEmptyState />}

        {/* ── Data ── */}
        {pageState === "ready" && data && (
          <>
            {/* KPI Row */}
            <section aria-labelledby="kpi-heading">
              <h2 id="kpi-heading" className="sr-only">
                Network Statistics
              </h2>
              <ContinuityKPI data={data} evoEntropy={evoEntropy} />
            </section>

            {/* Genesis Nodes */}
            <ContinuityGenesisNodes data={data} />

            {/* Network Nodes */}
            <ContinuityNodeList data={data} />

            {/* Protocol Stats Footer */}
            <ContinuityStatsFooter data={data} />
          </>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

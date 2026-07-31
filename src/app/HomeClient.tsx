"use client";
import React from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import HeroTrail from "@/components/hero-trail/HeroTrail";
import TryIt from "@/components/try-it/TryIt";
import ResearchObservatory from "@/components/research-observatory/ResearchObservatory";
import TerminalEntry from "@/components/terminal-entry/TerminalEntry";
import EvidenceStrip from "@/components/evidence-strip/EvidenceStrip";
import Vision from "@/components/vision/Vision";
import OpenQuestions from "@/components/vision/OpenQuestions";

export default function HomeClient() {
  return (
    <>
      <ProtocolHeader />
      <main className="relative z-0 w-full overflow-x-clip">

        {/* ═══════════ 01 Hero ═══════════ */}
        <HeroTrail />

        {/* ═══════════ 02 TRY IT ═══════════ */}
        <TryIt />

        {/* ═══════════ 03 Research ═══════════ */}
        <ResearchObservatory />

        {/* ═══════════ 04 Developer ═══════════ */}
        <TerminalEntry />

        {/* ═══════════ 05 Evidence ═══════════ */}
        <EvidenceStrip />

        {/* ═══════════ 06 How It Works ═══════════ */}
        <Vision />

        {/* ═══════════ 07 Open Questions ═══════════ */}
        <OpenQuestions />

      </main>
      <ProtocolFooter />
    </>
  );
}

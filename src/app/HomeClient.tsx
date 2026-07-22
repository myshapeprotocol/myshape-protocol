"use client";
import React from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import HeroDemo from "@/components/hero-demo/HeroDemo";
import Vision from "@/components/vision/Vision";
import MotionPreview from "@/components/motion-preview/MotionPreview";

export default function HomeClient() {
  return (
    <>
      <ProtocolHeader />


      <main className="relative z-0 w-full overflow-x-clip">
        <HeroDemo />

        {/* ── Hero Value Proposition ── */}
        <div className="relative z-10 pt-32 md:pt-32 pb-6 md:pb-8 px-6 text-center">
          <p className="text-white/85 text-[clamp(1.3rem,3.5vw,2rem)] font-light tracking-[0.03em] leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            Identity answers who you are.
          </p>
          <p className="text-white/60 text-[clamp(1rem,2.8vw,1.6rem)] font-light tracking-[0.03em] leading-relaxed max-w-3xl mx-auto mt-3">
            Continuity answers whether you remained you.
          </p>

          {/* Desktop CTAs — things desktop users can actually do */}
          <div className="hidden md:flex justify-center gap-4 mt-6">
            <a href="/research/notes/008-continuity-protocol-core" className="px-6 py-2.5 border border-[#60A5FA]/25 text-[#60A5FA]/60 text-[11px] tracking-[0.15em] uppercase font-mono hover:bg-[#60A5FA]/8 hover:border-[#60A5FA]/40 transition-all no-underline">Read CPS-0001 →</a>
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 border border-white/10 text-white/35 text-[11px] tracking-[0.15em] uppercase font-mono hover:bg-white/[0.04] hover:border-white/20 hover:text-white/55 transition-all no-underline">GitHub →</a>
          </div>
        </div>

        {/* Desktop: full experience below */}
        <div className="hidden md:block">
        <div className="relative z-10 -mt-6 pb-8">
          <div className="max-w-lg mx-auto px-4">
            <MotionPreview />
          </div>
        </div>

        {/* ── Research Quick Links ── */}
        <section className="relative z-10 -mt-6 mb-8">
          <div className="max-w-3xl mx-auto px-6 flex justify-center gap-4">
            <a href="/research/notes/004-motion-signature-rfc" className="px-5 py-3 border border-[#1E293B] bg-[#0B1220] text-[#A7B4C6] text-[11px] tracking-[0.15em] uppercase font-mono hover:border-[#60A5FA]/30 hover:text-[#60A5FA] transition-all">RFC-0001</a>
            <a href="/research/notes/006-continuity-proof-rfc" className="px-5 py-3 border border-[#1E293B] bg-[#0B1220] text-[#A7B4C6] text-[11px] tracking-[0.15em] uppercase font-mono hover:border-[#60A5FA]/30 hover:text-[#60A5FA] transition-all">RFC-0002</a>
            <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" className="px-5 py-3 border border-[#1E293B] bg-[#0B1220] text-[#A7B4C6] text-[11px] tracking-[0.15em] uppercase font-mono hover:border-[#60A5FA]/30 hover:text-[#60A5FA] transition-all">npm</a>
            <a href="https://github.com/myshapeprotocol" className="px-5 py-3 border border-[#1E293B] bg-[#0B1220] text-[#A7B4C6] text-[11px] tracking-[0.15em] uppercase font-mono hover:border-[#60A5FA]/30 hover:text-[#60A5FA] transition-all">GitHub</a>
          </div>
        </section>

        {/* ── Protocol Stack ── */}
        <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-white/35 text-[11px] tracking-[0.6em] uppercase mb-4">Protocol_Stack</div>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
                Human <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Presence</span> Protocol
              </h2>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7, marginLeft: "auto", marginRight: "auto" }}>
                Reference implementation. Open specification. Developer-ready.
              </p>
            </div>

            {/* ── Cryptographic Sovereign Spine ── */}
            <div className="relative max-w-4xl mx-auto">
              {/* Mobile: simplified stack */}
              <div className="md:hidden space-y-2">
                {[
                  { l: "EE-001", name: "PRESENCE DETECTION", desc: "4-dimensional entropy scoring from IMU data. Distinguishes embodied entities from synthetic motion.", meta: "PASS_RATE: 100%_FLOOR // N: ALL", delay: "0s" },
                  { l: "EE-002", name: "CAUSAL COUPLING", desc: "Cross-modal event binding. Proves IMU and camera observe the same physical event.", meta: "TEMPORAL_ALIGNMENT: 100% // N: 316", delay: "0.3s" },
                  { l: "EE-003", name: "CHALLENGE RESPONSE", desc: "Randomized gyroscope challenges with jittered timing. Defeats replay attacks.", meta: "PASS_RATE: 59% // N: 200", delay: "0.6s" },
                  { l: "VS-001", name: "VERIFICATION SESSION", desc: "Dual-engine pipeline. Passive presence + active challenge escalation.", meta: "PASS_RATE: 93% // N: 60", delay: "0.9s" },
                  { l: "RFC-0002", name: "CONTINUITY PROOF", desc: "Hash-chained evidence receipts. Verifiable proof of persistent entity continuity.", meta: "FORMAT: EVIDENCE_RECEIPT // SHA-256_CHAINED", delay: "1.2s" },
                ].map(layer => (
                  <div key={layer.l} className="group p-6 transition-all duration-500"
                    style={{ border: "1px solid rgba(144,200,255,0.1)", borderRadius: "12px", background: "transparent" }}
                    onMouseEnter={e => { playTick(600, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[11px] shrink-0" style={{ color: "rgba(144,200,255,0.4)", textShadow: "0 0 6px rgba(144,200,255,0.15)", animation: `nodePulse 2.5s ease-in-out ${layer.delay} infinite` }}>{layer.l}</span>
                      <span className="text-white/80 text-[15px] font-light tracking-[0.02em] group-hover:text-white transition-colors duration-500">{layer.name}</span>
                    </div>
                    <p className="text-white/30 text-[13px] font-light leading-relaxed mb-2 group-hover:text-white/55 transition-colors duration-500">{layer.desc}</p>
                    <div className="inline-block px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] rounded border border-[#90c8ff]/15 text-[#90c8ff]/40 bg-[#90c8ff]/[0.03] group-hover:border-[#90c8ff]/35 group-hover:text-[#90c8ff]/70 transition-all duration-500">{layer.meta}</div>
                  </div>
                ))}
              </div>

              {/* Desktop: Quantum Spine */}
              <div className="hidden md:block">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px]"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.3), rgba(144,200,255,0.2), rgba(144,200,255,0.1), transparent)" }} />
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] opacity-20"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(144,200,255,0.4), rgba(144,200,255,0.2), transparent)", filter: "blur(4px)" }} />
              <div className="absolute left-1/2 -translate-x-1/2 z-20"
                style={{ animation: "dropletScroll 6s ease-in-out infinite" }}>
                <div className="relative w-3 h-4 rounded-full"
                  style={{
                    background: "radial-gradient(ellipse at 35% 25%, rgba(220,240,255,0.6) 0%, rgba(140,200,240,0.2) 40%, transparent 70%)",
                    boxShadow: "0 0 10px rgba(160,210,240,0.25), inset 0 -1px 2px rgba(100,160,210,0.2)",
                  }}>
                  <div className="absolute top-[20%] left-[30%] w-1 h-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.5)" }} />
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-16"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(200,230,255,0.3), transparent)",
                  animation: "spineScan 4s ease-in-out infinite",
                  filter: "blur(1px)",
                }} />

              {[
                { l: "EE-001", name: "PRESENCE DETECTION", desc: "4-dimensional entropy scoring from IMU data. Distinguishes embodied entities from synthetic motion.", meta: "PASS_RATE: 100%_FLOOR // N: ALL", hue: 180, side: "right" as const, delay: "0s" },
                { l: "EE-002", name: "CAUSAL COUPLING", desc: "Cross-modal event binding. Proves IMU and camera observe the same physical event.", meta: "TEMPORAL_ALIGNMENT: 100% // N: 316", hue: 195, side: "left" as const, delay: "0.3s" },
                { l: "EE-003", name: "CHALLENGE RESPONSE", desc: "Randomized gyroscope challenges with jittered timing. Defeats replay attacks.", meta: "PASS_RATE: 59% // N: 200", hue: 210, side: "right" as const, delay: "0.6s" },
                { l: "VS-001", name: "VERIFICATION SESSION", desc: "Dual-engine pipeline. Passive presence + active challenge escalation.", meta: "PASS_RATE: 93% // N: 60", hue: 230, side: "left" as const, delay: "0.9s" },
                { l: "RFC-0002", name: "CONTINUITY PROOF", desc: "Hash-chained evidence receipts. Verifiable proof of persistent entity continuity.", meta: "FORMAT: EVIDENCE_RECEIPT // SHA-256_CHAINED", hue: 270, side: "right" as const, delay: "1.2s" },
              ].map((layer) => (
                <div key={layer.l} className={`relative flex items-center mb-4 ${layer.side === "left" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="absolute top-1/2 z-10"
                    style={{
                      left: layer.side === "left" ? "calc(50% - 14px)" : "50%",
                      width: "14px",
                      height: "1px",
                      background: "rgba(144,200,255,0.15)",
                    }} />

                  <div className={`w-[calc(50%-20px)] group`}>
                    <div className="relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
                      style={{ background: "transparent", border: "1px solid rgba(144,200,255,0.1)", borderRadius: "12px" }}
                      onMouseEnter={e => {
                        playTick([400, 550, 700, 850, 1000][parseInt(layer.l.slice(1)) - 1] || 600, "sine", 0.10, 0.02);
                        e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
                        e.currentTarget.style.background = "radial-gradient(circle at top left, rgba(144,200,255,0.06) 0%, transparent 70%)";
                        e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(144,200,255,0.12)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <span className="absolute top-0 bottom-0 w-[8px] opacity-20 group-hover:opacity-80 transition-opacity duration-500"
                        style={{
                          [layer.side === "left" ? "left" : "right"]: 0,
                          borderLeft: layer.side === "left" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderRight: layer.side === "right" ? "1px solid rgba(144,200,255,0.35)" : "none",
                          borderTop: "none",
                          borderBottom: "none",
                        }} />
                      <span className={`absolute top-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />
                      <span className={`absolute bottom-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${layer.side === "left" ? "left-0" : "right-0"}`}
                        style={{ background: "rgba(144,200,255,0.35)" }} />

                      <div className={`${layer.side === "left" ? "pl-5 pr-4" : "pr-5 pl-4"} py-4`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[11px] tracking-[0.3em] shrink-0 group-hover:text-[#90c8ff]/80 transition-all duration-500"
                            style={{
                              color: "rgba(144, 200, 255, 0.4)",
                              textShadow: "0 0 6px rgba(144,200,255,0.15)",
                              animation: `nodePulse 2.5s ease-in-out ${layer.delay} infinite`,
                            }}>
                            {layer.l}
                          </span>
                          <span className="text-white text-[15px] font-light tracking-[0.02em] group-hover:text-white transition-colors duration-500">
                            {layer.name}
                          </span>
                        </div>
                        <p className="text-white/35 text-[13px] font-light leading-relaxed mb-2 group-hover:text-white/55 transition-colors duration-500">
                          {layer.desc}
                        </p>
                        <div className="inline-block px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] rounded group-hover:border-[#90c8ff]/30 group-hover:text-[#90c8ff]/70 transition-all duration-500"
                          style={{
                            border: "1px solid rgba(144, 200, 255, 0.15)",
                            color: "rgba(144, 200, 255, 0.5)",
                            background: "rgba(144, 200, 255, 0.04)",
                          }}>
                          {layer.meta}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-[calc(50%-20px)]" />
                </div>
              ))}
            </div>
            </div>

          </div>
        </section>

        <Vision />

        {/* ── Research Stream ── */}
        <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-5xl mx-auto px-6">

            {/* ── Terminal-style header ── */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/30 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
                </span>
                <span className="font-mono text-[11px] tracking-[0.35em] uppercase text-[#90c8ff]/50">
                  &gt; research_stream <span className="text-white/15">--active</span>
                </span>
                <span className="font-mono text-[11px] tracking-[0.2em] text-white/8 ml-auto">001/005</span>
              </div>
              <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
                The <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Continuity</span> Problem
              </h2>
              <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7 }}>
                Why proving &ldquo;I am still me&rdquo; may become the missing cryptographic primitive of the AI era.
              </p>
            </div>

            {/* ── Specimen Card ── */}
            <div className="relative max-w-2xl mx-auto">
              <Link href="/research/notes/001-the-continuity-problem" className="group block" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
                <div className="relative overflow-hidden transition-all duration-700"
                  style={{ border: "1px solid rgba(144,200,255,0.12)", background: "rgba(2,6,14,0.85)", backdropFilter: "blur(12px)" }}>

                  {/* Scan beam — vertical light sweeps across, visible on hover */}
                  <div className="absolute inset-y-0 w-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-visible"
                    style={{
                      background: "linear-gradient(to bottom, transparent 0%, rgba(144,200,255,0.5) 15%, rgba(180,220,255,0.3) 50%, rgba(144,200,255,0.5) 85%, transparent 100%)",
                      boxShadow: "0 0 24px rgba(144,200,255,0.2), 2px 0 16px rgba(144,200,255,0.06), -2px 0 16px rgba(144,200,255,0.04)",
                    }}>
                    <div className="absolute inset-0" style={{ animation: "researchScanSweep 4s ease-in-out infinite" }} />
                  </div>

                  {/* Signal trace — animated oscilloscope line */}
                  <div className="absolute top-0 left-4 right-4 h-px opacity-30 group-hover:opacity-60 transition-opacity duration-700"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(144,200,255,0.5) 20%, rgba(144,200,255,0.15) 50%, rgba(144,200,255,0.5) 80%, transparent)" }} />

                  {/* Measurement grid — subtle graph paper */}
                  <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700"
                    style={{ backgroundImage: "linear-gradient(rgba(144,200,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(144,200,255,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                  {/* Content */}
                  <div className="relative p-6 md:p-10">
                    {/* Specimen metadata bar */}
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#90c8ff]/8">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.6)]" />
                      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#3fb950]/70">SIGNAL_ACTIVE</span>
                      <span className="text-white/10">·</span>
                      <span className="font-mono text-[11px] tracking-[0.15em] text-white/25">SPECIMEN RN_001</span>
                      <span className="text-white/10">·</span>
                      <span className="font-mono text-[11px] tracking-[0.15em] text-white/25">2026.07.09</span>
                    </div>

                    {/* The question */}
                    <p className="text-center text-[17px] md:text-[20px] font-light tracking-[0.04em] text-white/85 leading-relaxed mb-6 group-hover:text-white transition-colors duration-500"
                      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
                      Can <span style={{ color: "rgba(144,200,255,0.8)" }}>continuity</span> be made a verifiable property of digital existence?
                    </p>

                    {/* Sub-line */}
                    <p className="text-center text-white/25 text-[11px] tracking-[0.1em] leading-relaxed mb-8 group-hover:text-white/40 transition-colors duration-500">
                      Four attack scenarios where identity succeeds and continuity fails.
                    </p>

                    {/* Bottom status bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#90c8ff]/6">
                      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#90c8ff]/50 group-hover:text-[#90c8ff]/70 transition-colors duration-500">
                        The Continuity Lab — Research Note Series
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.15em] text-white/35 group-hover:text-white/55 transition-all duration-500 group-hover:translate-x-1 inline-block">
                        Open →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* ── Terminal command bar ── */}
              <div className="mt-8 flex items-center gap-4 px-1">
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(144,200,255,0.15), rgba(144,200,255,0.05))" }} />
                <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/18 shrink-0 select-none">stream_actions</span>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(144,200,255,0.05), rgba(144,200,255,0.15), transparent)" }} />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
                <Link
                  href="/research"
                  className="group/cta flex items-center gap-3 px-4 py-2.5 w-full sm:w-auto justify-center transition-all"
                  style={{ border: "1px solid rgba(144,200,255,0.1)", background: "rgba(144,200,255,0.02)" }}
                  onMouseEnter={(e) => {
                    playTick(600, "sine", 0.05, 0.015);
                    e.currentTarget.style.borderColor = "rgba(144,200,255,0.3)";
                    e.currentTarget.style.background = "rgba(144,200,255,0.06)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(144,200,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
                    e.currentTarget.style.background = "rgba(144,200,255,0.02)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span className="font-mono text-[11px] text-[#90c8ff]/30 group-hover/cta:text-[#90c8ff]/65 transition-colors">&gt;</span>
                  <span className="font-mono text-[11px] tracking-[0.15em] text-[#90c8ff]/50 group-hover/cta:text-[#90c8ff]/80 transition-colors">research_hub</span>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-white/18 group-hover/cta:text-white/20 transition-colors hidden sm:inline">--open</span>
                </Link>
                <Link
                  href="/research/agenda"
                  className="group/cta flex items-center gap-3 px-4 py-2.5 w-full sm:w-auto justify-center transition-all"
                  style={{ border: "1px solid rgba(212,175,55,0.1)", background: "rgba(212,175,55,0.015)" }}
                  onMouseEnter={(e) => {
                    playTick(600, "sine", 0.05, 0.015);
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
                    e.currentTarget.style.background = "rgba(212,175,55,0.05)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(212,175,55,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.1)";
                    e.currentTarget.style.background = "rgba(212,175,55,0.015)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span className="font-mono text-[11px] text-[#d4af37]/30 group-hover/cta:text-[#d4af37]/65 transition-colors">&gt;</span>
                  <span className="font-mono text-[11px] tracking-[0.15em] text-[#d4af37]/50 group-hover/cta:text-[#d4af37]/80 transition-colors">research_agenda</span>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-white/18 group-hover/cta:text-white/20 transition-colors hidden sm:inline">--view</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        </div>{/* end desktop-only */}

        {/* CTA — Research by The Continuity Lab */}
        <div className="relative z-10 pb-12 text-center">
          <a href="https://thecontinuitylab.org" className="inline-flex items-center gap-2 px-6 py-3 border text-[11px] tracking-[0.1em] uppercase transition-all"
            style={{ borderColor: "rgba(96,165,250,0.15)", color: "rgba(96,165,250,0.5)", background: "rgba(96,165,250,0.03)" }}
            onMouseEnter={(e) => { playTick(600, "sine", 0.06, 0.02); e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)"; e.currentTarget.style.color = "rgba(96,165,250,0.8)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(96,165,250,0.15)"; e.currentTarget.style.color = "rgba(96,165,250,0.5)"; }}>
            Research by The Continuity Lab →
          </a>
        </div>
      </main>

      <ProtocolFooter />
    </>
  );
}

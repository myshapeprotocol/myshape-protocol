"use client";
import React from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import LatestUpdates from "@/components/latest-updates/LatestUpdates";
import { playTick } from "@/utils/useAudioTick";
import HeroDemo from "@/components/hero-demo/HeroDemo";
import Vision from "@/components/vision/Vision";
import MotionPreview from "@/components/motion-preview/MotionPreview";

const QUESTION_LAYERS = [
  {
    question: "Can AI generate a face? Yes. A voice? Yes. But can it generate biological entropy?",
    label: "THE GAP",
    meta: "381 experiments // 4-dimensional entropy scoring",
  },
  {
    question: "If two sensors see the same physical event, do their signals agree?",
    label: "CAUSAL COUPLING",
    meta: "Cross-modal binding // N: 316",
  },
  {
    question: "What happens when we send a randomized gyroscope challenge — something a recording can't predict?",
    label: "CHALLENGE RESPONSE",
    meta: "Jittered timing defeats replay // N: 200",
  },
  {
    question: "Can we chain these checks into a single verification session — passive first, then escalating?",
    label: "VERIFICATION SESSION",
    meta: "Dual-engine pipeline // N: 60",
  },
  {
    question: "After verification, what remains? A yes? A no? Or evidence — signed, timestamped, hash-chained?",
    label: "CONTINUITY PROOF",
    meta: "Evidence Receipt // SHA‑256 chained",
  },
];

export default function HomeClient() {
  return (
    <>
      <ProtocolHeader />

      <main className="relative z-0 w-full overflow-x-clip">
        <HeroDemo />

        {/* ── Hero Value Proposition ── */}
        <div className="relative z-10 pt-2 md:pt-32 pb-2 md:pb-8 px-6 text-center">
          <p
            className="text-white/85 text-[clamp(1.3rem,3.5vw,2rem)] font-light tracking-[0.03em] leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
          >
            Identity answers who you are.
          </p>
          <p className="text-white/60 text-[clamp(1rem,2.8vw,1.6rem)] font-light tracking-[0.03em] leading-relaxed max-w-3xl mx-auto mt-3">
            Continuity answers whether you remained you.
          </p>

          <div className="flex justify-center gap-4 mt-6">
            <a
              href="/continuity"
              className="px-6 py-2.5 border border-[#60A5FA]/25 text-[#60A5FA]/60 text-[11px] tracking-[0.15em] uppercase font-mono hover:bg-[#60A5FA]/8 hover:border-[#60A5FA]/40 transition-all no-underline"
            >
              Why Continuity →
            </a>
            <a
              href="/lab"
              className="px-6 py-2.5 border border-white/10 text-white/35 text-[11px] tracking-[0.15em] uppercase font-mono hover:bg-white/[0.04] hover:border-white/20 hover:text-white/55 transition-all no-underline"
            >
              The Lab →
            </a>
          </div>
        </div>

        {/* Desktop: full experience below */}
        <div className="hidden md:block">
          <div className="relative z-10 -mt-6 pb-8">
            <div className="max-w-lg mx-auto px-4">
              <MotionPreview />
            </div>
          </div>

          {/* ── The Questions We're Asking ── */}
          <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-16">
                <div className="text-white/35 text-[11px] tracking-[0.6em] uppercase mb-4">
                  Research_Questions
                </div>
                <h2
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.2rem)",
                    fontWeight: 200,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  The <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Continuity</span> Problem
                </h2>
                <p
                  style={{
                    fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: "1.8rem",
                    maxWidth: "550px",
                    lineHeight: 1.7,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  AI didn't break identity. It broke continuity.
                  <br />
                  We can no longer tell whether the same entity is still here.
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9em" }}>
                    These are the questions we are investigating.
                  </span>
                </p>
              </div>

              {/* Mobile: simplified stack */}
              <div className="md:hidden space-y-2">
                {QUESTION_LAYERS.map((layer) => (
                  <div
                    key={layer.label}
                    className="group p-6 transition-all duration-500"
                    style={{
                      border: "1px solid rgba(144,200,255,0.1)",
                      borderRadius: "12px",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      playTick(600, "sine", 0.08, 0.02);
                      e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="font-mono text-[11px] shrink-0"
                        style={{
                          color: "rgba(144,200,255,0.4)",
                          textShadow: "0 0 6px rgba(144,200,255,0.15)",
                        }}
                      >
                        {layer.label}
                      </span>
                    </div>
                    <p className="text-white/55 text-[15px] font-light leading-relaxed mb-2 group-hover:text-white/80 transition-colors duration-500">
                      {layer.question}
                    </p>
                    <div
                      className="inline-block px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] rounded border border-[#90c8ff]/15 text-[#90c8ff]/40 bg-[#90c8ff]/[0.03] group-hover:border-[#90c8ff]/35 group-hover:text-[#90c8ff]/70 transition-all duration-500"
                    >
                      {layer.meta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Quantum Spine */}
              <div className="hidden md:block">
                <div className="relative max-w-4xl mx-auto">
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgba(144,200,255,0.3), rgba(144,200,255,0.2), rgba(144,200,255,0.1), transparent)",
                    }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] opacity-20"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgba(144,200,255,0.4), rgba(144,200,255,0.2), transparent)",
                      filter: "blur(4px)",
                    }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-20"
                    style={{ animation: "dropletScroll 6s ease-in-out infinite" }}
                  >
                    <div
                      className="relative w-3 h-4 rounded-full"
                      style={{
                        background:
                          "radial-gradient(ellipse at 35% 25%, rgba(220,240,255,0.6) 0%, rgba(140,200,240,0.2) 40%, transparent 70%)",
                        boxShadow:
                          "0 0 10px rgba(160,210,240,0.25), inset 0 -1px 2px rgba(100,160,210,0.2)",
                      }}
                    >
                      <div
                        className="absolute top-[20%] left-[30%] w-1 h-1 rounded-full"
                        style={{ background: "rgba(255,255,255,0.5)" }}
                      />
                    </div>
                  </div>

                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-[2px] h-16"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, rgba(200,230,255,0.3), transparent)",
                      animation: "spineScan 4s ease-in-out infinite",
                      filter: "blur(1px)",
                    }}
                  />

                  {QUESTION_LAYERS.map((layer, i) => {
                    const side = i % 2 === 0 ? "right" : "left";
                    const hue = 180 + i * 25;
                    return (
                      <div
                        key={layer.label}
                        className={`relative flex items-center mb-4 ${side === "left" ? "flex-row" : "flex-row-reverse"}`}
                      >
                        <div
                          className="absolute top-1/2 z-10"
                          style={{
                            left: side === "left" ? "calc(50% - 14px)" : "50%",
                            width: "14px",
                            height: "1px",
                            background: "rgba(144,200,255,0.15)",
                          }}
                        />

                        <div className="w-[calc(50%-20px)] group">
                          <div
                            className="relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
                            style={{
                              background: "transparent",
                              border: "1px solid rgba(144,200,255,0.1)",
                              borderRadius: "12px",
                            }}
                            onMouseEnter={(e) => {
                              playTick(600, "sine", 0.1, 0.02);
                              e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
                              e.currentTarget.style.background =
                                "radial-gradient(circle at top left, rgba(144,200,255,0.06) 0%, transparent 70%)";
                              e.currentTarget.style.boxShadow =
                                "0 12px 32px -8px rgba(144,200,255,0.12)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)";
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <span
                              className="absolute top-0 bottom-0 w-[8px] opacity-20 group-hover:opacity-80 transition-opacity duration-500"
                              style={{
                                [side === "left" ? "left" : "right"]: 0,
                                borderLeft:
                                  side === "left"
                                    ? "1px solid rgba(144,200,255,0.35)"
                                    : "none",
                                borderRight:
                                  side === "right"
                                    ? "1px solid rgba(144,200,255,0.35)"
                                    : "none",
                              }}
                            />
                            <span
                              className={`absolute top-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${side === "left" ? "left-0" : "right-0"}`}
                              style={{ background: "rgba(144,200,255,0.35)" }}
                            />
                            <span
                              className={`absolute bottom-0 h-[1px] w-6 opacity-20 group-hover:opacity-80 transition-opacity duration-500 ${side === "left" ? "left-0" : "right-0"}`}
                              style={{ background: "rgba(144,200,255,0.35)" }}
                            />

                            <div
                              className={`${side === "left" ? "pl-5 pr-4" : "pr-5 pl-4"} py-4`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span
                                  className="font-mono text-[11px] tracking-[0.3em] shrink-0 group-hover:text-[#90c8ff]/80 transition-all duration-500"
                                  style={{
                                    color: "rgba(144, 200, 255, 0.4)",
                                    textShadow: "0 0 6px rgba(144,200,255,0.15)",
                                  }}
                                >
                                  {layer.label}
                                </span>
                              </div>
                              <p className="text-white/45 text-[14px] font-light leading-relaxed mb-2 group-hover:text-white/65 transition-colors duration-500">
                                {layer.question}
                              </p>
                              <div
                                className="inline-block px-2 py-0.5 font-mono text-[11px] tracking-[0.1em] rounded group-hover:border-[#90c8ff]/30 group-hover:text-[#90c8ff]/70 transition-all duration-500"
                                style={{
                                  border: "1px solid rgba(144, 200, 255, 0.15)",
                                  color: "rgba(144, 200, 255, 0.5)",
                                  background: "rgba(144, 200, 255, 0.04)",
                                }}
                              >
                                {layer.meta}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="w-[calc(50%-20px)]" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <Vision />

          {/* ── Open Problems ── */}
          <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <div className="text-white/35 text-[11px] tracking-[0.6em] uppercase mb-4">
                Open_Questions
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                  fontWeight: 200,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: "#fff",
                  margin: 0,
                }}
              >
                What we still don't know
              </h2>
              <p
                style={{
                  fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: "1.5rem",
                  lineHeight: 1.8,
                }}
              >
                Can two sensors agree on the same physical event — every time?
                <br />
                What happens when someone deliberately tries to break the system?
                <br />
                Can continuity be made as verifiable as a cryptographic signature?
                <br />
                What would a standard for continuity proofs look like?
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <Link
                  href="/research"
                  className="group/cta flex items-center gap-3 px-5 py-2.5 transition-all"
                  style={{
                    border: "1px solid rgba(144,200,255,0.12)",
                    background: "rgba(144,200,255,0.02)",
                  }}
                  onMouseEnter={(e) => {
                    playTick(600, "sine", 0.05, 0.015);
                    e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
                    e.currentTarget.style.background = "rgba(144,200,255,0.06)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(144,200,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(144,200,255,0.12)";
                    e.currentTarget.style.background = "rgba(144,200,255,0.02)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span className="font-mono text-[11px] text-[#90c8ff]/30 group-hover/cta:text-[#90c8ff]/65 transition-colors">
                    &gt;
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.15em] text-[#90c8ff]/50 group-hover/cta:text-[#90c8ff]/80 transition-colors">
                    research_hub
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-white/18 group-hover/cta:text-white/25 transition-colors hidden sm:inline">
                    --open
                  </span>
                </Link>
                <Link
                  href="/research/agenda"
                  className="group/cta flex items-center gap-3 px-5 py-2.5 transition-all"
                  style={{
                    border: "1px solid rgba(212,175,55,0.12)",
                    background: "rgba(212,175,55,0.015)",
                  }}
                  onMouseEnter={(e) => {
                    playTick(600, "sine", 0.05, 0.015);
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)";
                    e.currentTarget.style.background = "rgba(212,175,55,0.05)";
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(212,175,55,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.12)";
                    e.currentTarget.style.background = "rgba(212,175,55,0.015)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span className="font-mono text-[11px] text-[#d4af37]/30 group-hover/cta:text-[#d4af37]/65 transition-colors">
                    &gt;
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.15em] text-[#d4af37]/50 group-hover/cta:text-[#d4af37]/80 transition-colors">
                    research_agenda
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-white/18 group-hover/cta:text-white/25 transition-colors hidden sm:inline">
                    --view
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </div>
        {/* end desktop-only */}

        {/* CTA — Research by The Continuity Lab */}
        <div className="relative z-10 pb-12 text-center">
          <a
            href="https://thecontinuitylab.org"
            className="inline-flex items-center gap-2 px-6 py-3 border text-[11px] tracking-[0.1em] uppercase transition-all"
            style={{
              borderColor: "rgba(96,165,250,0.15)",
              color: "rgba(96,165,250,0.5)",
              background: "rgba(96,165,250,0.03)",
            }}
            onMouseEnter={(e) => {
              playTick(600, "sine", 0.06, 0.02);
              e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)";
              e.currentTarget.style.color = "rgba(96,165,250,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(96,165,250,0.15)";
              e.currentTarget.style.color = "rgba(96,165,250,0.5)";
            }}
          >
            Research by The Continuity Lab →
          </a>
        </div>
      </main>

      <LatestUpdates />
      <ProtocolFooter />
    </>
  );
}

"use client";
import React from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import HeroDemo from "@/components/hero-demo/HeroDemo";
import Vision from "@/components/vision/Vision";
import PresenceNetwork from "@/components/presence-network/PresenceNetwork";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";
import GenesisProgress from "@/components/genesis-progress/GenesisProgress";
import GenesisCohortBadge from "@/components/genesis-cohort-badge/GenesisCohortBadge";
import MotionPreview from "@/components/motion-preview/MotionPreview";

export default function HomeClient() {
  return (
    <>
      <ProtocolHeader />


      <main className="relative z-0 w-full overflow-x-clip">
        <HeroDemo />

        {/* Mobile: counter + CTA — wallet lives in header */}
        <div className="relative z-10 -mt-6 pb-12 md:hidden flex flex-col items-center gap-4 px-6">
          <GenesisCohortBadge />
          <a
            href="/genesis"
            className="px-8 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/60 text-[10px] tracking-[0.2em] uppercase font-mono hover:bg-[#90c8ff]/8 hover:border-[#90c8ff]/40 transition-all"
          >
            Join Genesis Cohort
          </a>
        </div>

        {/* Desktop: full experience below */}
        <div className="hidden md:block">
        <div className="relative z-10 -mt-6 pb-8">
          <div className="max-w-lg mx-auto px-4">
            <MotionPreview />
          </div>
        </div>

        {/* ── Genesis Cohort Progress ── */}
        <section className="relative z-10 -mt-6 mb-8">
          <div className="max-w-3xl mx-auto px-6">
            <GenesisProgress />
          </div>
        </section>

        {/* ── Protocol Stack ── */}
        <section className="relative pt-16 md:pt-32 pb-12 md:pb-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-white/35 text-[9px] tracking-[0.6em] uppercase mb-4">Protocol_Stack</div>
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
                  { l: "L1", name: "MOTION CAPTURE", desc: "Real-time local camera input. All processing on-device. Zero data upload.", meta: "HARDWARE: LOCAL_SANDBOX // ENCLAVE_SECURE", delay: "0s" },
                  { l: "L2", name: "BEHAVIOR ENCODING", desc: "4-dimensional entropy scoring detects and flags AI-generated synthetic motion.", meta: "ENTROPY: 4D_SCORING_VERIFIED // 0.992_REAL", delay: "0.3s" },
                  { l: "L3", name: "IDENTITY VECTOR", desc: "Motion geometry distilled into a compact, non-replicable signature.", meta: "GEOMETRY: VECTOR_3D_DISTILLED // SIG_SECURE", delay: "0.6s" },
                  { l: "L4", name: "PROOF LAYER", desc: "Zero-knowledge proofs. Verify presence without exposing raw motion data.", meta: "VERIFIER: ZK_SNARK_PASS // SIG_OK", delay: "0.9s" },
                  { l: "L5", name: "AGENT IDENTITY", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", meta: "PROOF_STATE: ACTIVE_COEXISTENCE // 0x2A19F", delay: "1.2s" },
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
                    <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] rounded border border-[#90c8ff]/15 text-[#90c8ff]/40 bg-[#90c8ff]/[0.03] group-hover:border-[#90c8ff]/35 group-hover:text-[#90c8ff]/70 transition-all duration-500">{layer.meta}</div>
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
                { l: "L1", name: "MOTION CAPTURE", desc: "Real-time local camera input. All processing on-device. Zero data upload.", meta: "HARDWARE: LOCAL_SANDBOX // ENCLAVE_SECURE", hue: 180, side: "right" as const, delay: "0s" },
                { l: "L2", name: "BEHAVIOR ENCODING", desc: "4-dimensional entropy scoring detects and flags AI-generated synthetic motion.", meta: "ENTROPY: 4D_SCORING_VERIFIED // 0.992_REAL", hue: 195, side: "left" as const, delay: "0.3s" },
                { l: "L3", name: "IDENTITY VECTOR", desc: "Motion geometry distilled into a compact, non-replicable signature.", meta: "GEOMETRY: VECTOR_3D_DISTILLED // SIG_SECURE", hue: 210, side: "right" as const, delay: "0.6s" },
                { l: "L4", name: "PROOF LAYER", desc: "Zero-knowledge proofs. Verify presence without exposing raw motion data.", meta: "VERIFIER: ZK_SNARK_PASS // SIG_OK", hue: 230, side: "left" as const, delay: "0.9s" },
                { l: "L5", name: "AGENT IDENTITY", desc: "Cross-species verification. Human and AI identities coexist in one protocol.", meta: "PROOF_STATE: ACTIVE_COEXISTENCE // 0x2A19F", hue: 270, side: "right" as const, delay: "1.2s" },
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
                        <div className="inline-block px-2 py-0.5 font-mono text-[8px] tracking-[0.1em] rounded group-hover:border-[#90c8ff]/30 group-hover:text-[#90c8ff]/70 transition-all duration-500"
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

            {/* ── Presence Network — live node mesh ── */}
            <div className="mt-10 max-w-4xl mx-auto">
              <PresenceNetwork />
            </div>
          </div>
        </section>

        <Vision />
        </div>{/* end desktop-only */}

        {/* CTA — both mobile and desktop */}
        <JoinWaitlist id="genesis" />
      </main>

      <ProtocolFooter />
    </>
  );
}

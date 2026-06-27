"use client";
import React from "react";
import Link from "next/link";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

const pillars = [
  {
    id: "PIL_01",
    title: "AI-NATIVE IDENTITY",
    subtitle: "Designed for coexistence",
    desc: "A new category of identity — built for a world where human and machine intelligence coexist. Motion-Signature verification bridges the gap between biological presence and digital authentication.",
    accent: "from-cyan-400/80 to-cyan-400/0",
    color: "rgba(34,211,238,0.4)",
  },
  {
    id: "PIL_02",
    title: "SPATIAL SOVEREIGNTY",
    subtitle: "Privacy as a right",
    desc: "The right to remain private within immersive 3D environments. ZK-Presence proves you are human without revealing who you are, where you are, or how you move.",
    accent: "from-cyan-400/60 to-cyan-400/0",
    color: "rgba(34,211,238,0.35)",
  },
  {
    id: "PIL_03",
    title: "PROTOCOL PERMANENCE",
    subtitle: "Ownership by physics",
    desc: "Your Motion-Signature is permanently inscribed into the protocol's root entropy source. No platform can revoke it. No server can lose it. Your identity geometry is yours — forever.",
    accent: "from-cyan-400/45 to-cyan-400/0",
    color: "rgba(34,211,238,0.3)",
  },
  {
    id: "PIL_04",
    title: "CONTINUOUS PRESENCE",
    subtitle: "Living proof",
    desc: "Identity is not a one-time verification. It is a continuous stream of proof — each scan adds entropy, each verification strengthens the mesh. Your presence evolves with you.",
    accent: "from-cyan-400/35 to-cyan-400/0",
    color: "rgba(34,211,238,0.25)",
  },
];

const futureStates = [
  { label: "TODAY", desc: "Genesis Cohort — 100 founding nodes anchoring the identity mesh.", active: true },
  { label: "NEXT", desc: "On-chain ZK verification. Cross-platform presence proof. Multi-device aggregation." },
  { label: "THEN", desc: "Global identity mesh. One billion sovereign nodes. The protocol becomes invisible infrastructure." },
];

export default function VisionClient() {
  return (
    <ProtocolLayout
      refId="006" category="CIV_LAYER" title="VISION"
      secLevel="CLASS_OMEGA" systemStatus="PROTOCOL_EXPANDING"
    >
      <div className="space-y-24 md:space-y-36">
        {/* ── 0. 行业宣言 ── */}
        <section className="relative max-w-3xl"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.01)}>
          <div className="text-cyan-500/[0.03] text-[140px] font-bold absolute -top-20 -left-10 select-none pointer-events-none leading-none">I</div>
          <div className="relative z-10 border-l-2 border-cyan-400/25 pl-6 md:pl-10 py-3">
            <div className="text-cyan-400/50 text-[10px] tracking-[0.3em] uppercase font-mono mb-5">// PROTOCOL_MANIFESTO</div>
            <p className="text-white/75 text-[15px] md:text-[18px] leading-[1.8] font-light mb-5">
              AI can replicate your face. Clone your voice. Forge your writing style.
              Every static credential is a snapshot that generative models will eventually learn to reproduce.
            </p>
            <p className="text-white/60 text-[13px] md:text-[15px] leading-[1.9] font-light">
              The only signal a machine cannot fabricate is the continuous, irreducible entropy
              of a living entity in motion. <span className="text-cyan-300/80 font-medium">Presence is not stored. Presence is generated.</span>
            </p>
          </div>
        </section>

        {/* ── 1. 协议立场 ── */}
        <section className="relative max-w-3xl">
          <div className="text-cyan-500/[0.06] text-[90px] font-bold absolute -top-12 -left-6 select-none pointer-events-none">EYE</div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8"
              style={{ textShadow: "0 0 60px rgba(144,200,255,0.15)" }}>
              Beyond Surveillance, <br />
              Towards <span className="text-cyan-400">Sovereignty</span>.
            </h2>
            <p className="text-white/55 text-[14px] tracking-[0.1em] leading-[1.9] font-light max-w-2xl">
              Identity is not a credential. It is a physical property of a living entity — irreducible,
              unforgeable, and sovereign by default. MyShape Protocol translates motion into geometry,
              geometry into proof, and proof into presence — creating the first identity layer that
              belongs to the individual, not the platform.
            </p>
          </div>
        </section>

        {/* ── 2. 四大支柱 ── */}
        <section>
          <div className="text-white/20 text-[9px] tracking-[0.5em] uppercase mb-12 text-center hover:text-cyan-300/40 transition-colors cursor-default"
            onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
            // PROTOCOL_PILLARS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="group border p-6 transition-all duration-500"
                style={{ borderColor: "rgba(144,200,255,0.08)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.08, 0.015); e.currentTarget.style.borderColor = pillar.color; e.currentTarget.style.background = "rgba(144,200,255,0.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.08)"; e.currentTarget.style.background = "transparent"; }}>
                <div className={`h-[2px] mb-5 bg-gradient-to-r ${pillar.accent} w-12 group-hover:w-full transition-all duration-700`} />
                <div className="text-cyan-400/40 text-[9px] tracking-[0.4em] font-mono mb-2 group-hover:text-cyan-400/70 transition-colors">
                  {pillar.id}
                </div>
                <h3 className="text-white/80 text-[13px] tracking-[0.25em] font-bold uppercase mb-2 group-hover:text-white transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-cyan-400/30 text-[9px] tracking-[0.15em] uppercase mb-4 group-hover:text-cyan-400/50 transition-colors">
                  {pillar.subtitle}
                </p>
                <p className="text-white/35 text-[11px] tracking-[0.1em] leading-[1.8] group-hover:text-white/55 transition-colors">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. 协议轨迹 ── */}
        <section className="border-t border-white/[0.04] pt-16">
          <div className="text-white/20 text-[9px] tracking-[0.5em] uppercase mb-14 text-center hover:text-cyan-300/40 transition-colors cursor-default"
            onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
            Protocol Trajectory
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {futureStates.map((s, i) => (
              <div key={s.label} className="group text-center"
                onMouseEnter={() => playTick(500 + i * 120, "sine", 0.06, 0.015)}>
                <div className={`text-[11px] tracking-[0.3em] uppercase mb-5 font-mono font-bold transition-all duration-500 ${s.active ? "text-cyan-400/70" : "text-white/25 group-hover:text-cyan-400/50"}`}>
                  {s.label}
                </div>
                <div className={`h-[2px] mx-auto mb-5 transition-all duration-500 ${s.active ? "bg-cyan-400/50 w-16" : "bg-white/10 w-8 group-hover:bg-cyan-400/25 group-hover:w-14"}`} />
                <p className="text-white/35 text-[11px] leading-[1.8] group-hover:text-white/50 transition-colors">
                  {s.desc}
                </p>
                {s.active && (
                  <div className="mt-3 text-cyan-400/30 text-[8px] tracking-[0.2em] uppercase">◈ ACTIVE</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 哲学 ── */}
        <section className="py-20 border-y border-white/[0.04] relative overflow-hidden"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.01)}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent" />
          <div className="max-w-xl mx-auto text-center space-y-8 relative z-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-cyan-400/20" />
              <span className="text-white/18 text-[9px] tracking-[0.4em] uppercase font-mono hover:text-cyan-400/40 transition-colors cursor-default"
                onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>Internal_Projection_088</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-cyan-400/20" />
            </div>
            <blockquote className="text-white/60 text-[14px] md:text-[16px] tracking-[0.12em] leading-[1.9] font-light italic">
              &ldquo;The history of identity is the history of control.<br />
              The future of identity is the geometry of motion.&rdquo;
            </blockquote>
            <div className="flex justify-center gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-cyan-400/20 rounded-full hover:bg-cyan-400/50 transition-all duration-300 hover:scale-125 cursor-default"
                  style={{ boxShadow: "0 0 6px rgba(34,211,238,0.15)" }}
                  onMouseEnter={() => playTick(350, "sine", 0.02, 0.005)} />
              ))}
            </div>
            <p className="text-white/12 text-[9px] tracking-[0.2em] uppercase">
              — MyShape Protocol &middot; V1.0_GENESIS
            </p>
          </div>
        </section>

        {/* ── 5. CTA ── */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-3">
            <div className="text-cyan-400/55 text-[11px] tracking-[0.4em] font-bold uppercase">
              Status: Protocol_Expanding
            </div>
            <p className="text-white/30 text-[11px] tracking-[0.12em] max-w-sm leading-relaxed">
              Current protocol parameters optimized for the Genesis Cohort.
              Scaling toward a million-node identity mesh.
            </p>
            <Link href="/genesis"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-block mt-4 px-10 py-3.5 border border-cyan-400/30 text-cyan-300/70 text-[11px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white hover:border-cyan-400/50 transition-all"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", background: "rgba(34,211,238,0.03)" }}>
              Join the Genesis →
            </Link>
          </div>
          <div className="text-[40px] font-extralight text-white/[0.04] tracking-tighter select-none">
            V1.0_GENESIS
          </div>
        </section>
      </div>

      <div className="sr-only">
        <h2>AI-Native Identity Protocol Vision</h2>
        <p>MyShape defines a new category of identity: AI-native identity. Motion-Signature verification, ZK-Presence, and sovereign data-body architecture for the decentralized human.</p>
        <a href="/genesis">Genesis Identity Protocol</a>
        <a href="/protocol">Protocol Architecture</a>
        <a href="/identity">AI-Native Identity Layer</a>
        <a href="/papers">Technical Papers</a>
      </div>
    </ProtocolLayout>
  );
}

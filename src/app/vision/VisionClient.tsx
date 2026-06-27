"use client";
import React from "react";
import Link from "next/link";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

const pillars = [
  {
    id: "PIL_01",
    title: "AI-NATIVE IDENTITY",
    desc: "A new category of identity — designed for a world where human and machine intelligence coexist. Motion-Signature verification bridges the gap between biological presence and digital authentication.",
    accent: "from-cyan-400/70 to-cyan-400/0",
  },
  {
    id: "PIL_02",
    title: "SPATIAL SOVEREIGNTY",
    desc: "The right to remain private within immersive 3D environments. ZK-Presence proves you are human without revealing who you are, where you are, or how you move.",
    accent: "from-blue-400/70 to-blue-400/0",
  },
  {
    id: "PIL_03",
    title: "PROTOCOL PERMANENCE",
    desc: "Your Motion-Signature is permanently inscribed into the protocol's root entropy source. No platform can revoke it. No server can lose it. You own your identity geometry — forever.",
    accent: "from-indigo-400/70 to-indigo-400/0",
  },
];

const futureStates = [
  { label: "TODAY", desc: "Genesis Cohort — 100 founding nodes anchoring the identity mesh." },
  { label: "NEXT", desc: "On-chain ZK verification. Cross-platform presence proof. Multi-device aggregation." },
  { label: "THEN", desc: "Global identity mesh. One billion sovereign nodes. The protocol becomes invisible infrastructure." },
];

export default function VisionClient() {
  return (
    <ProtocolLayout
      refId="006" category="CIV_LAYER" title="VISION"
      secLevel="CLASS_OMEGA" systemStatus="PROTOCOL_EXPANDING"
    >
      <div className="space-y-28 md:space-y-36">
        {/* ── 0. 行业宣言 ── */}
        <section className="relative max-w-3xl"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.01)}>
          <div className="text-cyan-500/[0.03] text-[120px] font-bold absolute -top-16 -left-8 select-none pointer-events-none leading-none">I</div>
          <div className="relative z-10 border-l-2 border-cyan-400/20 pl-6 md:pl-8 py-2">
            <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-mono mb-4">The Identity Crisis of the AI Era</p>
            <p className="text-white/70 text-[15px] md:text-[17px] leading-[1.8] font-light mb-4">
              AI can replicate your face. Clone your voice. Forge your writing style.
              Every static credential — passwords, biometrics, identity documents — is a snapshot
              that generative models will eventually learn to reproduce.
            </p>
            <p className="text-white/55 text-[13px] leading-[1.9] font-light">
              The only signal a machine cannot fabricate is the continuous, irreducible entropy
              of a living entity in motion. <span className="text-cyan-300/70">Presence is not stored. Presence is generated.</span>
            </p>
          </div>
        </section>

        {/* ── 1. 协议立场 ── */}
        <section className="relative max-w-3xl">
          <div className="text-cyan-500/10 text-[80px] font-bold absolute -top-12 -left-6 select-none pointer-events-none">EYE</div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8"
              style={{ textShadow: "0 0 60px rgba(144,200,255,0.15)" }}>
              Beyond Surveillance, <br />
              Towards <span className="text-cyan-400">Sovereignty</span>.
            </h2>
            <p className="text-white/50 text-[13px] tracking-[0.12em] leading-[1.9] font-light max-w-2xl">
              Identity is not a credential. It is a physical property of a living entity — irreducible,
              unforgeable, and sovereign by default. MyShape Protocol translates motion into geometry,
              geometry into proof, and proof into presence — creating the first identity layer that
              belongs to the individual, not the platform.
            </p>
          </div>
        </section>

        {/* ── 2. 三大支柱 ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="group"
              onMouseEnter={() => playTick(600, "sine", 0.08, 0.015)}>
              <div className="text-cyan-500/40 text-[9px] tracking-[0.4em] font-mono mb-4 group-hover:text-cyan-400/70 transition-colors">
                {pillar.id}
              </div>
              <div className={`h-[1px] mb-6 bg-gradient-to-r ${pillar.accent} opacity-30 group-hover:opacity-80 transition-opacity`} />
              <h3 className="text-white/80 text-[13px] tracking-[0.25em] font-bold uppercase mb-5 group-hover:text-cyan-300 transition-colors">
                {pillar.title}
              </h3>
              <p className="text-white/35 text-[10px] tracking-[0.12em] leading-[1.8] group-hover:text-white/50 transition-colors">
                {pillar.desc}
              </p>
            </div>
          ))}
        </section>

        {/* ── 3. 时间线 ── */}
        <section className="border-t border-white/[0.04] pt-16">
          <div className="text-white/15 text-[9px] tracking-[0.5em] uppercase mb-12 text-center">Protocol Trajectory</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {futureStates.map((s, i) => (
              <div key={s.label} className="group text-center"
                onMouseEnter={() => playTick(500 + i * 100, "sine", 0.05, 0.012)}>
                <div className={`text-[10px] tracking-[0.3em] uppercase mb-4 font-mono font-bold ${i === 0 ? "text-cyan-400/60" : "text-white/20 group-hover:text-cyan-400/40"} transition-colors`}>
                  {s.label}
                </div>
                <div className={`w-8 h-[2px] mx-auto mb-4 transition-all duration-500 ${i === 0 ? "bg-cyan-400/40 w-12" : "bg-white/10 group-hover:bg-cyan-400/20 group-hover:w-12"}`} />
                <p className="text-white/30 text-[10px] leading-[1.7] group-hover:text-white/45 transition-colors">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 哲学 — 保留原有氛围 ── */}
        <section className="py-16 border-y border-white/[0.03] relative overflow-hidden"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.01)}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
          <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
            <h4 className="text-white/15 text-[8px] tracking-[0.5em] uppercase">Internal_Projection_088</h4>
            <p className="text-white/45 text-[12px] tracking-[0.2em] leading-loose uppercase italic">
              &ldquo;The history of identity is the history of control.<br />
              The future of identity is the geometry of motion.&rdquo;
            </p>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-cyan-400/30 rounded-full hover:bg-cyan-400/60 transition-colors cursor-default"
                  onMouseEnter={() => playTick(350, "sine", 0.02, 0.005)} />
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. CTA ── */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-3">
            <div className="text-cyan-400/50 text-[11px] tracking-[0.4em] font-bold uppercase">
              Status: Protocol_Expanding
            </div>
            <p className="text-white/25 text-[10px] tracking-[0.15em] max-w-sm leading-relaxed">
              Current protocol parameters optimized for the Genesis Cohort.
              Scaling toward a million-node identity mesh.
            </p>
            <Link href="/genesis"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-block mt-4 px-8 py-3 border border-cyan-400/25 text-cyan-300/60 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all">
              Join the Genesis →
            </Link>
          </div>
          <div className="text-[36px] font-extralight text-white/[0.04] tracking-tighter select-none">
            V1.0_GENESIS
          </div>
        </section>
      </div>

      {/* 隐层 SEO */}
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

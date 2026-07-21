"use client";
import React from "react";
import Link from "next/link";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

const pillars = [
  {
    id: "PIL_01",
    title: "PRESENCE FIRST",
    subtitle: "Identity is generated, not stored",
    desc: "Every identity system today stores a credential. MyShape verifies presence — the continuous, entropy-rich signal of a living entity in motion. Presence is the identity. Everything else is just a record.",
    accent: "from-[#90c8ff]/80 to-[#90c8ff]/0",
    color: "rgba(144,200,255,0.4)",
  },
  {
    id: "PIL_02",
    title: "ZERO-KNOWLEDGE BY DEFAULT",
    subtitle: "Prove without revealing",
    desc: "Continuity proofs verify that an entity is physically present without exposing who they are, where they are, or how they move. Privacy is not an option. It is the protocol default.",
    accent: "from-[#90c8ff]/60 to-[#90c8ff]/0",
    color: "rgba(144,200,255,0.35)",
  },
  {
    id: "PIL_03",
    title: "SOVEREIGN BY PROTOCOL",
    subtitle: "No platform can revoke you",
    desc: "Your Motion-Signature is inscribed into the protocol's root entropy source. No server holds it. No platform controls it. No authority can revoke it. Sovereignty is not granted — it is mathematically enforced.",
    accent: "from-[#90c8ff]/45 to-[#90c8ff]/0",
    color: "rgba(144,200,255,0.3)",
  },
  {
    id: "PIL_04",
    title: "PROOF OF CONTINUITY",
    subtitle: "The verification primitive for the Agent Economy",
    desc: "Every AI agent — financial, creative, governance — must prove it remains backed by the same sovereign subject. Continuity Proofs form a verifiable timeline that no credential or key can provide. This is not identity. This is the Continuity Layer for the Simulation Age.",
    accent: "from-[#90c8ff]/35 to-[#90c8ff]/0",
    color: "rgba(144,200,255,0.25)",
  },
];

const futureStates = [
  { label: "TODAY", desc: "Genesis Cohort — 100 founding nodes. Continuity verification for sovereign digital subjects.", active: true },
  { label: "NEXT", desc: "The Continuity Layer. Cross-agent verification. Continuity Proofs as infrastructure for the Agent Economy." },
  { label: "THEN", desc: "The protocol disappears. Continuity becomes a property of the network itself — invisible, universal, assumed." },
];

export default function VisionClient() {
  return (
    <ProtocolLayout
      refId="006" category="CIV_LAYER" title="VISION"
      secLevel="v1.0-RC" systemStatus="PROTOCOL_EXPANDING"
    >
      <div className="space-y-24 md:space-y-36">
        {/* ── 0. 范式宣言：从 Identity 到 Continuity ── */}
        <section className="relative max-w-3xl"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.022)}>
          <div className="text-[#90c8ff]/[0.03] text-[140px] font-bold absolute -top-20 -left-10 select-none pointer-events-none leading-none">C</div>
          <div className="relative z-10 border-l-2 border-[#90c8ff]/25 pl-6 md:pl-10 py-3">
            <div className="text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase font-mono mb-5">// THE CONTINUITY THESIS</div>
            <p className="text-white/80 text-[15px] md:text-[18px] leading-[1.8] font-light mb-5">
              The digital world spent three decades answering <span className="text-[#90c8ff]/70">Who are you?</span>
              {' '}Passwords, presence-verification, DID, wallets — every identity system verifies a credential at a point in time.
            </p>
            <p className="text-white/70 text-[13px] md:text-[15px] leading-[1.9] font-light mb-5">
              That question is now obsolete. AI can generate your face, clone your voice, forge your behavior.
              Everything that can be <span className="text-white/40">stored</span> can be <span className="text-white/40">copied</span>.
              Everything that can be copied can be <span className="text-white/40">forged</span>.
            </p>
            <p className="text-white/60 text-[13px] md:text-[15px] leading-[1.9] font-light">
              The question that matters now is not who you are. It is{' '}
              <span className="text-[#90c8ff]/90 font-medium">who continues to be you.</span>
              {' '}Identity is a snapshot. Continuity is a trajectory. And continuity is the one thing AI cannot fake.
            </p>
          </div>
        </section>

        {/* ── 1. 协议立场 ── */}
        <section className="relative max-w-3xl">
          <div className="text-[#90c8ff]/[0.2] text-[90px] font-bold absolute -top-12 -left-6 select-none pointer-events-none">EYE</div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8"
              style={{ textShadow: "0 0 60px rgba(144,200,255,0.15)" }}>
              Beyond Surveillance, <br />
              Towards <span className="text-[#90c8ff]">Sovereignty</span>.
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
          <div className="text-white/30 md:text-white/35 text-[11px] md:text-[12px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-12 text-center hover:text-[#90c8ff]/50 transition-colors cursor-default"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.022)}>
            // PROTOCOL_PILLARS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.id} className="group border p-6 transition-all duration-500"
                style={{ borderColor: "rgba(144,200,255,0.08)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.08, 0.015); e.currentTarget.style.borderColor = pillar.color; e.currentTarget.style.background = "rgba(144,200,255,0.02)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.08)"; e.currentTarget.style.background = "transparent"; }}>
                <div className={`h-[2px] mb-5 bg-gradient-to-r ${pillar.accent} w-12 group-hover:w-full transition-all duration-700`} />
                <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.4em] font-mono mb-2 group-hover:text-[#90c8ff]/70 transition-colors">
                  {pillar.id}
                </div>
                <h3 className="text-white/80 text-[13px] tracking-[0.25em] font-bold uppercase mb-2 group-hover:text-white transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-[#90c8ff]/30 text-[11px] tracking-[0.15em] uppercase mb-4 group-hover:text-[#90c8ff]/50 transition-colors">
                  {pillar.subtitle}
                </p>
                <p className="text-white/35 text-[12px] tracking-[0.1em] leading-[1.8] group-hover:text-white/55 transition-colors">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. 协议轨迹 ── */}
        <section className="border-t border-white/[0.04] pt-16">
          <div className="text-white/30 md:text-white/35 text-[11px] md:text-[12px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-14 text-center hover:text-[#90c8ff]/50 transition-colors cursor-default"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.022)}>
            Protocol Trajectory
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {futureStates.map((s, i) => (
              <div key={s.label} className="group text-center"
                onMouseEnter={() => playTick(500 + i * 120, "sine", 0.06, 0.015)}>
                <div className={`text-[12px] tracking-[0.3em] uppercase mb-5 font-mono font-bold transition-all duration-500 ${s.active ? "text-[#90c8ff]/70" : "text-white/25 group-hover:text-[#90c8ff]/50"}`}>
                  {s.label}
                </div>
                <div className={`h-[2px] mx-auto mb-5 transition-all duration-500 ${s.active ? "bg-[#90c8ff]/50 w-16" : "bg-white/10 w-8 group-hover:bg-[#90c8ff]/25 group-hover:w-14"}`} />
                <p className="text-white/35 text-[12px] leading-[1.8] group-hover:text-white/50 transition-colors">
                  {s.desc}
                </p>
                {s.active && (
                  <div className="mt-3 text-[#90c8ff]/30 text-[11px] tracking-[0.2em] uppercase">◈ ACTIVE</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 哲学 ── */}
        <section className="py-20 border-y border-white/[0.04] relative overflow-hidden"
          onMouseEnter={() => playTick(400, "sine", 0.03, 0.022)}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#90c8ff]/[0.03] to-transparent" />
          <div className="max-w-xl mx-auto text-center space-y-8 relative z-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#90c8ff]/20" />
              <span className="text-white/28 text-[11px] tracking-[0.4em] uppercase font-mono hover:text-[#90c8ff]/40 transition-colors cursor-default"
                onMouseEnter={() => playTick(450, "sine", 0.03, 0.022)}>Continuity_Projection_001</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#90c8ff]/20" />
            </div>
            <blockquote className="text-white/60 text-[14px] md:text-[16px] tracking-[0.12em] leading-[1.9] font-light italic">
              &ldquo;Identity tells us who you claim to be.<br />
              Continuity tells us that you are still you.&rdquo;
            </blockquote>
            <div className="flex justify-center gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-[#90c8ff]/20 rounded-full hover:bg-[#90c8ff]/50 transition-all duration-300 hover:scale-125 cursor-default"
                  style={{ boxShadow: "0 0 6px rgba(144,200,255,0.15)" }}
                  onMouseEnter={() => playTick(350, "sine", 0.02, 0.005)} />
              ))}
            </div>
            <p className="text-white/30 text-[11px] tracking-[0.2em] uppercase">
              — MyShape Protocol &middot; CPS-0001 v1.0-RC
            </p>
          </div>
        </section>

        {/* ── 5. CTA ── */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-3">
            <div className="text-[#90c8ff]/55 text-[12px] tracking-[0.4em] font-bold uppercase">
              Status: Continuity_Layer_Active
            </div>
            <p className="text-white/30 text-[12px] tracking-[0.12em] max-w-sm leading-relaxed">
              The Continuity Layer is operational. Genesis Cohort validating the first persistent digital subjects.
              Building toward the verification primitive for the Agent Economy.
            </p>
            <Link href="/genesis"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-block mt-4 px-10 py-3.5 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[12px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white hover:border-[#90c8ff]/50 transition-all"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", background: "rgba(144,200,255,0.03)" }}>
              Join the Genesis →
            </Link>
          </div>
          <div className="text-[40px] font-extralight text-white/[0.04] tracking-tighter select-none">
            CONTINUITY_LAYER
          </div>
        </section>
      </div>

      <div className="sr-only">
        <h2>The Continuity Layer for the Simulation Age</h2>
        <p>MyShape defines a new primitive: verifiable digital continuity. When AI can generate your face, voice, and behavior — what proves that you continue to exist? Motion-Signature verification, ZK-Continuity proofs, and sovereign data-body architecture for persistent digital subjects in the Agent Economy.</p>
        <a href="/genesis">Genesis Identity Protocol</a>
        <a href="/protocol">Protocol Architecture</a>
        <a href="/identity">AI-Native Identity Layer</a>
        <a href="/papers">Technical Papers</a>
      </div>
    </ProtocolLayout>
  );
}

"use client";
import React from "react";
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function VisionClient() {
  const visionPillars = [
    {
      id: "PIL_01",
      title: "AI-NATIVE IDENTITY",
      desc: "Creating a verifiable bridge between human kinetic energy and artificial intelligence agents.",
    },
    {
      id: "PIL_02",
      title: "SPATIAL SOVEREIGNTY",
      desc: "Establishing the right to remain private within increasingly immersive 3D digital environments.",
    },
    {
      id: "PIL_03",
      title: "DATA PERMANENCE",
      desc: "Ensuring your motion-signature remains yours across the shifting sands of platforms and servers.",
    },
  ];

  return (
    <ProtocolLayout
      refId="006"
      category="CIV_LAYER"
      title="VISION"
      secLevel="CLASS_OMEGA"
      systemStatus="FUTURE_STAMP"
    >
      {/* ------------------------------
          隐藏式 H1（AI / Google 可读）
      ------------------------------- */}
      <h1 className="sr-only">
        MyShape Vision — The Future of AI-Native Identity
      </h1>

      <div className="space-y-32">
        {/* --- 1. 核心愿景：文明的维度 --- */}
        <section className="relative">
          <div className="text-cyan-500/20 text-[60px] font-bold absolute -top-10 -left-6 select-none pointer-events-none">
            EYE
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-extralight tracking-[0.5em] text-white leading-tight uppercase mb-10">
              Beyond Surveillance, <br />
              Towards <span className="text-cyan-400">Expression</span>.
            </h2>
            <p className="text-white/60 text-lg tracking-[0.15em] leading-relaxed font-light max-w-3xl">
              We envision a future where the digital version of yourself is as
              authentic, private, and sovereign as your physical form. MyShape
              is the protocol that makes this autonomy possible in the age of
              total simulation.
            </p>
          </div>
        </section>

        {/* --- 2. 三大愿景支柱 --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {visionPillars.map((pillar) => (
            <div key={pillar.id} className="group">
              <div className="text-cyan-500 text-[10px] tracking-[0.4em] font-bold mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                {pillar.id}
              </div>
              <h3 className="text-white text-[14px] tracking-[0.3em] font-bold uppercase mb-6 group-hover:text-cyan-400 transition-colors">
                {pillar.title}
              </h3>
              <p className="text-white/30 text-[10px] tracking-[0.2em] leading-loose uppercase group-hover:text-white/50 transition-colors">
                {pillar.desc}
              </p>
              <div className="mt-8 h-[2px] w-8 bg-white/10 group-hover:w-full group-hover:bg-cyan-500/30 transition-all duration-700" />
            </div>
          ))}
        </section>

        {/* --- 3. 哲学探讨 --- */}
        <section className="py-20 border-y border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent animate-pulse" />

          <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
            <h4 className="text-white/20 text-[9px] tracking-[0.6em] uppercase">
              Internal_Projection_088
            </h4>
            <p className="text-white/80 text-[11px] tracking-[0.3em] leading-loose uppercase">
              &ldquo;The history of identity is the history of control. The future of
              identity is the history of movement.&rdquo;
            </p>
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-cyan-500/40 rounded-full" />
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. 底部 CTA --- */}
        <section className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <div className="text-cyan-400 text-[10px] tracking-[0.5em] font-bold uppercase italic">
              Status: System_Expansion
            </div>
            <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase max-w-sm">
              Current protocol parameters are optimized for a million-node
              identity mesh. Scaling to global civilization layer...
            </p>
          </div>
          <div className="text-[40px] font-extralight text-white/5 tracking-tighter select-none">
            2026_VISION
          </div>
        </section>
      </div>

      {/* -----------------------------------------
          AI-Native Invisible Semantic Layer
      ------------------------------------------ */}
      <div className="sr-only">
        <h2>AI-Native Identity Protocol Vision</h2>
        <p>
          MyShape defines a new category of identity: AI-native identity. It
          transforms human motion-signatures into a sovereign, zero-knowledge
          authentication layer that works across platforms, agents, and digital
          environments.
        </p>

        <p>
          The Vision page outlines three pillars: AI-native identity, spatial
          sovereignty, and data permanence. These concepts form the foundation
          of a post-surveillance identity protocol designed for the AI era.
        </p>

        <p>
          Related concepts include: kinetic identity, motion-based
          authentication, privacy-preserving identity, decentralized identity
          mesh, zero-knowledge proofs, and embodied digital presence.
        </p>

        {/* 隐形内部链接 */}
        <a href="/genesis">Genesis Identity Protocol</a>
        <a href="/protocol">Protocol Architecture</a>
        <a href="/identity">AI-Native Identity Layer</a>
        <a href="/papers">Technical Papers</a>
      </div>

      {/* -----------------------------------------
          Schema.org Structured Data
      ------------------------------------------ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "MyShape Vision — AI-Native Identity",
            description:
              "The MyShape Vision outlines the future of AI-native identity, spatial sovereignty, and data permanence.",
            author: {
              "@type": "Organization",
              name: "MyShape Protocol",
            },
            mainEntityOfPage: "https://www.myshape.com/vision",
            keywords: [
              "AI-native identity",
              "identity protocol",
              "spatial sovereignty",
              "motion signature",
              "zero-knowledge identity",
              "kinetic authentication",
              "post-surveillance identity",
            ],
          }),
        }}
      />
    </ProtocolLayout>
  );
}

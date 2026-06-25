"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

export default function IdentityLayer() {
  const models = [
    {
      name: "HALO",
      status: "COMPUTING",
      desc: "The spiritual radiance of identity data.",
      detail: "Visualizing the foundational frequency of the sovereign presence.",
      accent: "from-cyan-400/60 to-cyan-400/0",
    },
    {
      name: "PARTICLE",
      status: "STABLE",
      desc: "The discrete data points of motion capture.",
      detail: "Granular movement vectors translated into verifiable identity atoms.",
      accent: "from-blue-400/60 to-blue-400/0",
    },
    {
      name: "SCANLINE",
      status: "ACTIVE",
      desc: "The temporal record of existence.",
      detail: "Continuous verification stream across the time-identity axis.",
      accent: "from-cyan-300/60 to-cyan-300/0",
    },
    {
      name: "FIELD",
      status: "EXPANDING",
      desc: "The interactive zone of the energy-presence.",
      detail: "The influence radius of a data-presence within the digital civilization.",
      accent: "from-indigo-400/60 to-indigo-400/0",
    },
  ];

  return (
    <ProtocolLayout
      refId="002"
      category="PROTOCOL_CORE"
      title="IDENTITY_LAYER"
      secLevel="CLASS_A"
      systemStatus="ACTIVE_NODE"
    >
      <div className="space-y-16 md:space-y-24">
        {/* ── 1. 核心定义 ── */}
        <section className="max-w-3xl">
          <h2 className="text-white/25 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gradient-to-r from-cyan-500/60 to-transparent" />
            Core_Concept
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            In the MyShape ecosystem, identity is not a string of characters, but a{" "}
            <span className="text-cyan-300/90">dynamic geometric expression</span>.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-widest leading-loose font-light">
            Through the Energy-Presence Model, we translate raw motion data into a
            multi-dimensional visual and cryptographic state. This is the first step
            toward becoming a sovereign data-body.
          </p>

          <div className="mt-10 p-6 border border-cyan-400/10 bg-cyan-400/[0.02]">
            <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase mb-4">The Geometric Primitive</div>
            <p className="text-white/35 text-sm leading-[1.9] font-light">
              2D images are projections. They collapse depth into pixels, discarding the
              spatial relationships that make a motion signature unique. A 3D Motion
              Signature preserves what 2D cannot — bone lengths, joint angles, acceleration
              vectors — forming an irreducible geometric primitive that no AI model can
              reconstruct from flat training data.
            </p>
            <p className="mt-4 text-white/25 text-sm leading-[1.9] font-light">
              The Nyquist limit ensures that 30 fps video cannot resolve dynamics above 15 Hz,
              precisely where the 8–12 Hz physiological tremor band resides. Depth ambiguity
              from 2D-to-3D lifting introduces ±10% uncertainty in skeletal proportions. And
              the sensor noise floor sits at the millimeter scale — the exact scale of the
              micro-kinematic signals that distinguish individuals. These are not temporary
              AI limitations. They are laws of physics and information theory.
            </p>
          </div>
        </section>

        {/* ── 2. 四大身份模型 ── */}
        <section>
          <h3 className="text-white/15 text-[9px] tracking-[0.5em] uppercase mb-8 text-center">
            // IDENTITY_MODELS_CLASSIFICATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {models.map((model) => (
              <div
                key={model.name}
                onMouseEnter={() => playTick(600, "sine", 0.08, 0.015)}
                className="group relative p-8 md:p-10 transition-all duration-700"
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}
              >
                {/* Hover 背景辉光 */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 30% 20%, rgba(34,211,238,0.04) 0%, transparent 60%)",
                  }}
                />

                {/* 顶部色条 */}
                <div className={`absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r ${model.accent} opacity-30 group-hover:opacity-80 transition-opacity duration-700`} />

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <h4 className="text-xl tracking-[0.4em] font-extralight text-white/85 group-hover:text-cyan-300/90 transition-colors duration-500">
                    {model.name}
                  </h4>
                  <span
                    className="text-[9px] tracking-[0.25em] uppercase font-mono px-3 py-0.5 transition-all duration-500"
                    style={{
                      border: "1px solid rgba(34,211,238,0.25)",
                      color: "rgba(34,211,238,0.6)",
                      textShadow: "0 0 6px rgba(34,211,238,0.2)",
                    }}
                  >
                    {model.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-white/60 text-[11px] tracking-[0.2em] uppercase mb-5 font-light italic leading-relaxed">
                  {model.desc}
                </p>

                {/* Animated divider */}
                <div className="h-[1px] mb-5 bg-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent w-0 group-hover:w-full transition-all duration-700" />
                </div>

                {/* Detail */}
                <p className="text-white/25 text-[10px] tracking-widest leading-relaxed uppercase group-hover:text-white/40 transition-colors duration-500">
                  {model.detail}
                </p>

                {/* 左下角装饰 */}
                <div className="absolute bottom-3 left-3 flex gap-1 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  <span className="w-1 h-1 rounded-full bg-cyan-400/50" />
                  <span className="w-1 h-1 rounded-full bg-cyan-400/20" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. 底部声明 ── */}
        <section className="relative py-20 text-center">
          {/* Top accent line */}
          <div className="max-w-xs mx-auto mb-14 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <p className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-8 font-mono">
            Identity_Architecture_Finality
          </p>

          <p className="text-base md:text-lg font-light tracking-[0.2em] text-white/80 leading-relaxed max-w-2xl mx-auto">
            IDENTITY IS GEOMETRY.
            <br className="md:hidden" />{" "}
            GEOMETRY IS DATA.
            <br className="md:hidden" />{" "}
            <span className="md:block mt-2">DATA IS{" "}
              <span className="text-cyan-300/80">SOVEREIGNTY</span>
            </span>
          </p>

          {/* Bottom accent line */}
          <div className="max-w-xs mx-auto mt-14 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        </section>
      </div>
    </ProtocolLayout>
  );
}

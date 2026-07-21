"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";
import "./Vision.css";

/* ---------------------- 卡片组件 ---------------------- */
interface CardProps { index: number; glyph: string; title: string; desc1: string; desc2?: string; }

const VisionCard = ({ index, glyph, title, desc1, desc2 }: CardProps) => (
  <div className="vision-card-container" onMouseEnter={() => playTick(800, "triangle", 0.10, 0.025)}>
    <div className="v-scan-line" />
    <div className="vision-card-header">
      <div className="vision-glyph">{glyph}</div>
      <div className="vision-card-index">V_{String(index).padStart(2, "0")}</div>
    </div>
    <div className="vision-text-wrapper">
      <h3 className="vision-card-title">{title}</h3>
      <p className="vision-card-desc-main">{desc1}</p>
      {desc2 && <p className="vision-card-desc-sub">{desc2}</p>}
    </div>
  </div>
);

/* ---------------------- 主模块 ---------------------- */
export default function Vision() {
  const cards = [
    { glyph: "◈", title: "Biological Sovereignty", desc1: "Your geometry is your identity.", desc2: "Own the mathematical rights." },
    { glyph: "◇", title: "ZK‑Presence", desc1: "Verification without exposure.", desc2: "Identity withheld by default." },
    { glyph: "◎", title: "AI‑Native Existence", desc1: "Persistent across agents.", desc2: "Continuity in synthetic layers." },
    { glyph: "⊡", title: "Temporal Record", desc1: "Immutable history of presence.", desc2: "Decentralized state persistence." },
    { glyph: "⟁", title: "Kinematic Privacy", desc1: "End-to-end motion encryption.", desc2: "Secure physical intent." },
    { glyph: "⌬", title: "Neural Synthesis", desc1: "Bridge between form and code.", desc2: "Algorithmic self-definition." },
  ];

  return (
    <section className="w-full py-40 px-[6%] flex flex-col items-center bg-transparent"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-[1200px] w-full">
        <div className="flex justify-between items-end mb-32">
          <div className="max-w-[650px]">
            <span className="text-[11px] tracking-[0.6em] text-white/20 block mb-4 uppercase">VISION</span>
            <h2 className="text-[3.2rem] font-light -tracking-[0.02em] leading-[1.1] text-white m-0">
              Identity as <span className="text-[#90c8ff]/80">Geometry.</span>
            </h2>
            <p className="text-[1.1rem] font-light text-white/70 mt-7 max-w-[550px] leading-[1.7]">
              A cryptographic layer defining the future of human-AI interaction through motion-native primitives.
            </p>
          </div>
          <div className="text-[0.8rem] text-[#90c8ff]/30 text-right border-r border-[#90c8ff]/15 pr-6 leading-[1.8] font-mono mb-[5px]">
            PROTOCOL_VISION<br />{"// STATE: ACTIVE"}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-10">
          {cards.map((c, i) => <VisionCard key={i} index={i + 1} {...c} />)}
        </div>
      </div>
    </section>
  );
}

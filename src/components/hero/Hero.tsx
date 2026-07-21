"use client";

import React, { useState, useEffect, useRef } from "react";
import HeroVisual from "./HeroVisual";
import GlowVortexButton from "./GlowVortexButton";
import "./Hero.css";
import NarrativeText from "./NarrativeText";
import "./Hero.css";
import { playTick } from "@/utils/useAudioTick";

export default function Hero() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [genesisCompleted, setGenesisCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("sovereign_enrolled") === "1") {
      setGenesisCompleted(true);
    }
  }, []);

  useEffect(() => {
    const closeAll = () => {
      setShowLeft(false);
      setShowRight(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const handleEnterGenesis = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("protocol:particle-pulse"));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("pt:navigate", { detail: { href: "/genesis" } }));
    }, 1200);
  };

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    let frame = 0;
    const pulse = setInterval(() => {
      frame++;
      const phase = Math.sin(frame * 0.04);
      const blur = 20 + phase * 14;
      const alpha = 0.2 + phase * 0.3;
      el.style.textShadow = `0 0 ${blur}px rgba(144,200,255,${alpha}), 0 0 ${blur * 2}px rgba(144,200,255,${alpha * 0.5})`;
    }, 50);
    return () => clearInterval(pulse);
  }, []);

  const leftLines = [
    "PRESENCE IS A SIGNAL.",
    "THE SELF IS A FIELD.",
    "GEOMETRY HOLDS MEMORY.",
    "FORM CARRIES INTENT.",
    "SOVEREIGNTY BEGINS HERE.",
  ];
  const rightLines = [
    "YOU ARE A SHAPE.",
    "A PATTERN IN MOTION.",
    "A FIELD OF MEMORY.",
    "A VECTOR OF INTENT.",
    "MYSHAPE MAKES IT YOURS.",
  ];

  return (
    <>
      {/* 🚀 影子星空：强制设为 zIndex -1，确保它在所有模块的最底层，绝不遮挡文字 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          backgroundColor: "#02040a",
        }}
      >
        <HeroVisual showCore={false} />
      </div>

      {/* 🚀 首页 Hero 容器：强制背景透明，透出底层的固定星空 */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100dvh",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        {/* 首页粒子核心：随 Hero 模块一起滚动 */}
        <HeroVisual showCore={true} />

        {/* 严格还原：文案位置与字号 */}
        <div className="absolute top-[14vh] left-0 w-full z-100 pointer-events-none text-center px-6">
          <h1
            ref={titleRef}
            className="text-[1.4rem] md:text-[1.8rem] font-extralight uppercase text-white/90"
            style={{ letterSpacing: "0.8em", textIndent: "0.8em", filter: "drop-shadow(0 0 30px rgba(144,200,255,0.4))" }}
          >
            PROOF OF PRESENCE
          </h1>
          <p className="mt-5 text-[11px] md:text-[11px] tracking-[0.25em] text-blue-200/45 uppercase font-mono max-w-2xl mx-auto leading-relaxed"
            style={{ textShadow: "0 0 12px rgba(144,200,255,0.15)" }}>
            Identity is not stored. Presence is the identity.
          </p>
        </div>

        {/* 严格还原：按钮容器 */}
        <div className="absolute inset-0 flex items-center justify-between px-[8vw] z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            <GlowVortexButton
              onClick={(e) => {
                e.stopPropagation();
                setShowRight(false);
                setShowLeft(!showLeft);
              }}
            />
          </div>
          <div className="pointer-events-auto">
            <GlowVortexButton
              onClick={(e) => {
                e.stopPropagation();
                setShowLeft(false);
                setShowRight(!showRight);
              }}
            />
          </div>
        </div>

        {/* 叙事文本 */}
        <NarrativeText lines={leftLines} visible={showLeft} side="left" />
        <NarrativeText lines={rightLines} visible={showRight} side="right" />

        {/* 主入口 CTA：粒子云下方 */}
        <div className="absolute top-[calc(50%+280px)] left-0 w-full z-100 text-center">
          <button
            onClick={handleEnterGenesis}
            onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
            className="enter-genesis group relative inline-block px-12 py-4 bg-transparent"
          >
            <span className="relative z-10 font-mono font-extralight text-[12px] tracking-[0.6em] text-white/90 group-hover:text-[#90c8ff] transition-all duration-700">
              [ ENTER_GENESIS ]
            </span>
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(144,200,255,0.12) 0%, transparent 70%)', filter: 'blur(12px)' }} />
            <div className="flow-boundary absolute -bottom-3 left-[5%] right-[5%] h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="flow-dot left-0" />
              <div className="flow-dot left-[15%]" />
              <div className="flow-dot left-[30%]" />
              <div className="flow-glow" />
              <div className="flow-dot right-[30%]" />
              <div className="flow-dot right-[15%]" />
              <div className="flow-dot right-0" />
            </div>
          </button>
        </div>

        {/* Motion Demo 入口 — 醒目 CTA */}
        <div className="absolute bottom-[56px] md:bottom-[92px] left-0 w-full z-100 text-center pointer-events-auto">
          <a href="/motion-demo"
            onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
            className="group relative inline-block px-8 py-2.5 border border-[#90c8ff]/25 text-[#90c8ff]/50 hover:text-[#90c8ff] hover:border-[#90c8ff]/60 text-[11px] md:text-[11px] tracking-[0.25em] uppercase font-mono transition-all duration-500"
            style={{ boxShadow: "0 0 20px rgba(144,200,255,0.06)" }}>
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(ellipse at center, rgba(144,200,255,0.08) 0%, transparent 70%)" }} />
            <span className="relative z-10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_rgba(144,200,255,0.6)]" />
              TRY_LIVE_DEMO →
            </span>
          </a>
        </div>
        {/* 系统状态行 — 始终可见 */}
        <div className="absolute bottom-[30px] md:bottom-[60px] left-0 w-full z-100 text-center pointer-events-none">
          <span className="font-mono font-light text-[11px] md:text-[11px] tracking-[0.4em] transition-all duration-700"
            style={genesisCompleted
              ? { color: "rgba(180,220,255,0.8)", textShadow: "0 0 10px rgba(144,200,255,0.5), 0 0 20px rgba(144,200,255,0.2)" }
              : { color: "rgba(255,255,255,0.18)" }}>
            {genesisCompleted
              ? "[ PROTOCOL_GENESIS::INITIALIZED ]"
              : "[ PROTOCOL_GENESIS::awaiting_input ]"}
          </span>
        </div>
      </section>

    </>
  );
}
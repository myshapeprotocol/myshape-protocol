"use client";

import React, { useState, useEffect } from "react";
import HeroVisual from "./HeroVisual";
import GlowVortexButton from "./GlowVortexButton";
import NarrativeText from "./NarrativeText";

export default function Hero() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [genesisCompleted, setGenesisCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1") {
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

  const leftLines = [
    "THE BODY IS A SIGNAL.",
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
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        {/* 首页粒子核心：随 Hero 模块一起滚动 */}
        <HeroVisual showCore={true} />

        {/* 严格还原：文案位置与字号 */}
        <div className="absolute top-[14vh] left-0 w-full z-100 pointer-events-none text-center px-6">
          <h1
            className="text-[1.4rem] md:text-[1.8rem] font-extralight uppercase text-white/90"
            style={{ letterSpacing: "0.8em", textIndent: "0.8em" }}
          >
            THE SOVEREIGN IDENTITY LAYER
          </h1>
          <p className="mt-5 text-[10px] md:text-[11px] tracking-[0.25em] text-blue-200/45 uppercase font-mono max-w-2xl mx-auto leading-relaxed"
            style={{ textShadow: "0 0 12px rgba(144,200,255,0.15)" }}>
            The decentralized motion-native protocol for verifiable human-AI existence.
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
            className="enter-genesis group relative inline-block px-12 py-4 bg-transparent"
          >
            <span className="relative z-10 font-mono font-extralight text-[12px] tracking-[0.6em] text-white/90 group-hover:text-cyan-400 transition-all duration-700">
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

        {/* 系统状态行 */}
        <div className="absolute bottom-[30px] md:bottom-[60px] left-0 w-full z-100 text-center pointer-events-none">
          <span className="font-mono font-light text-[9px] md:text-[10px] tracking-[0.4em] transition-all duration-700"
            style={genesisCompleted
              ? { color: "rgba(180,220,255,0.8)", textShadow: "0 0 10px rgba(144,200,255,0.5), 0 0 20px rgba(144,200,255,0.2)" }
              : { color: "rgba(255,255,255,0.18)" }}>
            {genesisCompleted
              ? "[ PROTOCOL_GENESIS::INITIALIZED ]"
              : "[ PROTOCOL_GENESIS::awaiting_input ]"}
          </span>
        </div>
      </section>

      <style>{`
        .flow-boundary {
          background: radial-gradient(ellipse at center, rgba(144, 200, 255, 0.06) 0%, transparent 70%);
        }
        .flow-dot {
          position: absolute;
          top: 50%;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(144, 200, 255, 0.35);
          transform: translateY(-50%);
          filter: blur(1px);
          opacity: 0;
        }
        .flow-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 2px;
          border-radius: 50%;
          background: rgba(144, 200, 255, 0.15);
          transform: translate(-50%, -50%);
          filter: blur(3px);
          opacity: 0;
        }
        .enter-genesis:hover .flow-dot {
          animation: flowCenter 0.9s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
        .enter-genesis:hover .flow-glow {
          opacity: 1;
          animation: glowPulse 1.5s ease-in-out infinite;
        }
        .enter-genesis:hover .flow-dot:nth-child(1) { animation-delay: 0s; }
        .enter-genesis:hover .flow-dot:nth-child(2) { animation-delay: 0.15s; }
        .enter-genesis:hover .flow-dot:nth-child(3) { animation-delay: 0.3s; }
        .enter-genesis:hover .flow-dot:nth-child(5) { animation-delay: 0.15s; }
        .enter-genesis:hover .flow-dot:nth-child(6) { animation-delay: 0.3s; }
        .enter-genesis:hover .flow-dot:nth-child(7) { animation-delay: 0s; }
        @keyframes flowCenter {
          0% { opacity: 0; transform: translateY(-50%) translateX(var(--tx-start, -10px)) scale(0.5); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-50%) translateX(0) scale(1.2); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
        .flow-dot:nth-child(1) { --tx-start: -18px; }
        .flow-dot:nth-child(2) { --tx-start: -12px; }
        .flow-dot:nth-child(3) { --tx-start: -6px; }
        .flow-dot:nth-child(5) { --tx-start: 6px; }
        .flow-dot:nth-child(6) { --tx-start: 12px; }
        .flow-dot:nth-child(7) { --tx-start: 18px; }
        .protocol-command.glitch span {
          animation: textGlitch 0.8s ease-out forwards;
        }
        @keyframes textGlitch {
          0% { filter: blur(0); transform: translateX(0); opacity: 0.15; }
          10% { filter: blur(3px); transform: translateX(-4px); opacity: 0.6; }
          20% { filter: blur(1px); transform: translateX(3px); opacity: 0.3; }
          30% { filter: blur(4px); transform: translateX(-6px); opacity: 0.7; }
          50% { filter: blur(0); transform: translateX(2px); opacity: 0.2; }
          70% { filter: blur(2px); transform: translateX(-3px); opacity: 0.5; }
          100% { filter: blur(0); transform: translateX(0); opacity: 0.15; }
        }
      `}</style>
    </>
  );
}
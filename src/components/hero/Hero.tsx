"use client";

import React, { useState, useEffect } from "react";
import HeroVisual from "./HeroVisual";
import GlowVortexButton from "./GlowVortexButton";
import NarrativeText from "./NarrativeText";

export default function Hero() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  /* 点击任意处关闭叙事 */
  useEffect(() => {
    const closeAll = () => {
      setShowLeft(false);
      setShowRight(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  /* 文案出现时触发能量脉冲 */
  useEffect(() => {
    if (showLeft || showRight) {
      document.body.classList.add("vortex-pulse");
      setTimeout(() => {
        document.body.classList.remove("vortex-pulse");
      }, 300);
    }
  }, [showLeft, showRight]);

  /* 最终文案（B++） */
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
    <section className="relative w-full h-screen overflow-hidden bg-black">

      {/* 粒子视觉层（背景） */}
      <HeroVisual showCore={true} />

      {/* ⭐ 仅修改此处的文案、字号与位置 (上移并缩小) */}
      <div className="absolute top-[14vh] left-0 w-full z-[5000] pointer-events-none text-center px-6">
        <h1 
          className="text-[1.4rem] md:text-[1.8rem] font-extralight uppercase text-white/90"
          style={{ letterSpacing: '0.8em', textIndent: '0.8em' }}
        >
          THE SOVEREIGN IDENTITY LAYER
        </h1>

        <p className="mt-5 text-[10px] md:text-[11px] tracking-[0.4em] text-blue-300/40 uppercase font-mono">
          The Decentralized 3D Identity Standard
        </p>
      </div>

      {/* ⭐⭐⭐ 关键修复点：按钮容器必须在最高层 ⭐⭐⭐ */}
      <div className="absolute inset-0 flex items-center justify-between px-[8vw] z-[9999] pointer-events-auto">
        <GlowVortexButton
          onClick={(e) => {
            e.stopPropagation();
            setShowRight(false);
            setShowLeft(!showLeft);
          }}
        />

        <GlowVortexButton
          onClick={(e) => {
            e.stopPropagation();
            setShowLeft(false);
            setShowRight(!showRight);
          }}
        />
      </div>

      {/* 左右叙事文本 */}
      <NarrativeText lines={leftLines} visible={showLeft} side="left" />
      <NarrativeText lines={rightLines} visible={showRight} side="right" />
    </section>
  );
}
"use client";

import React from "react";

export default function NarrativeText({
  lines,
  visible,
  side,
}: {
  lines: string[];
  visible: boolean;
  side: "left" | "right";
}) {
  return (
    <div
      className={`
        absolute top-1/2 -translate-y-1/2 z-40
        text-[12px] tracking-[0.28em]
        font-light uppercase pointer-events-none
        transition-opacity duration-700
        ${visible ? "opacity-100" : "opacity-0"}
        ${side === "left" ? "left-[14vw] text-left" : "right-[14vw] text-right"}
      `}
      style={{ 
        color: "rgba(180,220,255,0.35)",
        minWidth: "300px" // 锁定宽度防止文字换行引起高度跳变
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className="relative overflow-hidden"
          style={{
            // ⭐ 核心修复：强制每一行占位 1.8 倍行高
            // 即使内部 span 是 opacity-0，外层 div 高度也是固定的
            height: "2.2em", 
            display: "flex",
            alignItems: "center",
            justifyContent: side === "left" ? "flex-start" : "flex-end"
          }}
        >
          <div
            className={`
              relative
              animate-[float_6s_ease-in-out_infinite]
            `}
            style={{
              animationDelay: `${i * 0.15}s`,
            }}
          >
            {line.split("").map((char, j) => (
              <span
                key={j}
                className="relative inline-block opacity-0"
                style={{
                  // 使用 visibility 辅助，确保不可见时依然占据空间
                  visibility: "visible",
                  animationName: visible ? "flash" : "none",
                  animationDuration: "0.4s",
                  animationTimingFunction: "ease-out",
                  animationFillMode: "forwards",
                  animationDelay: `${i * 0.25 + j * 0.03}s`,
                }}
              >
                {/* 色散层 */}
                <span className="absolute inset-0 text-[rgba(255,80,80,0.12)] blur-[0.6px] pointer-events-none">
                  {char === " " ? "\u00A0" : char}
                </span>
                <span className="absolute inset-0 text-[rgba(80,160,255,0.12)] blur-[0.6px] pointer-events-none">
                  {char === " " ? "\u00A0" : char}
                </span>

                {/* 主文字 - 处理空格占位 */}
                <span className="relative">
                  {char === " " ? "\u00A0" : char}
                </span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
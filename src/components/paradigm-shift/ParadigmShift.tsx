"use client";
import React, { useState } from "react";
import { playTick } from "@/utils/useAudioTick";

interface ConceptNode {
  id: string;
  legacyText: string;
  myshapeText: string;
  statusCode: string;
}

const NODES: ConceptNode[] = [
  { id: "IDENTITY_DATA", legacyText: "Static profile picture", myshapeText: "Dynamic particle data-body", statusCode: "0x01_DATA" },
  { id: "PRIVACY_LEVEL", legacyText: "Centralized credential store", myshapeText: "Sovereign local enclave", statusCode: "0x02_PRIV" },
  { id: "AUTH_FACTOR", legacyText: "Physiological template", myshapeText: "Motion-signature (ZK-verified)", statusCode: "0x03_AUTH" },
  { id: "ACCESS_GATE", legacyText: "Username / password", myshapeText: "Presence proof", statusCode: "0x04_GATE" },
  { id: "RECOVERY_PATH", legacyText: "Account recovery email", myshapeText: "Identity mesh", statusCode: "0x05_RCVR" },
  { id: "VISUAL_FORM", legacyText: "2D static image", myshapeText: "3D wireframe anatomy", statusCode: "0x06_VSUL" },
  { id: "PORTABILITY", legacyText: "Fragmented across platforms", myshapeText: "Single identity vector", statusCode: "0x07_PORT" },
  { id: "TRUST_MODEL", legacyText: "KYC / third-party trust", myshapeText: "Zero-knowledge verified", statusCode: "0x08_TRST" },
];

export default function ParadigmShift() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="relative z-10 w-full py-16 md:py-24 font-mono">

      {/* 顶部标题 — 左对齐 + 右侧状态指示 */}
      <div className="w-full max-w-4xl mx-auto px-6 mb-12 flex justify-between items-end border-b border-white/[0.06] pb-6"
        onMouseEnter={() => playTick(700, "sine", 0.06, 0.02)}>
        <div>
          <div className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-3">Identity Paradigm Shift</div>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Legacy <span style={{ color: "rgba(144,200,255,0.6)" }}>vs</span> MyShape
          </h2>
          <p style={{ fontSize: "clamp(0.8rem, 1.4vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", marginTop: "0.8rem" }}>
            From fragmented 2D identity to sovereign 3D presence.
          </p>
        </div>
        <div className="text-right text-[9px] tracking-widest hidden md:block pb-1">
          <span className="text-white/15">STATUS:</span>{" "}
          <span className="text-cyan-400/50">MATRIX_DECODING_ACTIVE</span>
        </div>
      </div>

      {/* 核心轨道布局 */}
      <div className="w-full max-w-4xl mx-auto px-6 relative z-10 flex flex-col">

        {NODES.map((node) => {
          const isHovered = hoveredId === node.id;
          return (
            <div
              key={node.id}
              onMouseEnter={() => { setHoveredId(node.id); playTick(500, "sine", 0.04, 0.01); }}
              onMouseLeave={() => setHoveredId(null)}
              className="relative flex flex-col md:flex-row items-stretch justify-between transition-all duration-300"
              style={{ minHeight: "64px" }}
            >
              {/* 左：Legacy 废弃区 */}
              <div className="w-full md:w-[42%] flex flex-col justify-center items-end text-right pr-6">
                <span className={`text-[9px] tracking-[0.3em] mb-1 transition-colors duration-300 ${
                  isHovered ? "text-white/35" : "text-white/20"
                }`}>
                  [ {node.statusCode} // DEPRECATED ]
                </span>
                <span className={`text-[13px] tracking-[0.04em] transition-all duration-300 ${
                  isHovered
                    ? "text-white/45 line-through scale-[0.98]"
                    : "text-white/30"
                }`}
                style={{ textDecorationColor: isHovered ? "rgba(255,255,255,0.2)" : undefined }}>
                  {node.legacyText}
                </span>
              </div>

              {/* 中央：数据轴 */}
              <div className="hidden md:flex w-[16%] flex-col items-center justify-center relative">
                <div className="absolute inset-y-0 w-[1px] bg-white/[0.04]" />
                <div className={`w-2 h-2 rounded-full border transition-all duration-500 z-10 ${
                  isHovered
                    ? "bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)] scale-125"
                    : "bg-transparent border-white/10"
                }`} />
                <div className={`absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent transition-all duration-500 ${
                  isHovered ? "w-[120%] opacity-100" : "w-0 opacity-0"
                }`} />
                <span className={`absolute -top-2 text-[9px] font-mono tracking-[0.2em] px-2 transition-all duration-300 z-20 ${
                  isHovered
                    ? "text-cyan-400/80 opacity-100 translate-y-0"
                    : "text-white/10 opacity-0 -translate-y-1"
                }`}
                style={{ background: "#02040a" }}>
                  {node.id}
                </span>
              </div>

              {/* 移动端变量标签 */}
              <div className="md:hidden text-center my-1">
                <span className="text-[10px] font-mono text-white/20 tracking-widest">{node.id}</span>
              </div>

              {/* 右：MyShape 主权区 */}
              <div className="w-full md:w-[42%] flex flex-col justify-center items-start text-left pl-6">
                <span className={`text-[9px] tracking-[0.3em] mb-1 transition-colors duration-300 ${
                  isHovered ? "text-cyan-400/70" : "text-cyan-400/25"
                }`}>
                  {isHovered ? "▶ INSTANTIATED_TRUE" : "• PROTOCOL_PRIMITIVE"}
                </span>
                <span className={`text-[13px] tracking-[0.04em] transition-all duration-300 ${
                  isHovered
                    ? "text-cyan-200/90 translate-x-1"
                    : "text-cyan-400/40"
                }`}
                style={{
                  textShadow: isHovered ? "0 0 12px rgba(144,200,255,0.5)" : "none",
                }}>
                  {node.myshapeText}
                </span>
              </div>

              {/* 整行辉光边界 */}
              <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
                isHovered ? "bg-gradient-to-r from-transparent via-cyan-500/[0.03] to-transparent" : ""
              }`}
              style={{
                borderTop: isHovered ? "1px solid rgba(144,200,255,0.08)" : "1px solid transparent",
                borderBottom: isHovered ? "1px solid rgba(144,200,255,0.06)" : "1px solid transparent",
              }} />
            </div>
          );
        })}
      </div>

      {/* 底部校准线 */}
      <div className="w-full max-w-4xl mx-auto px-6 mt-14 pt-4 border-t border-white/[0.06] flex justify-center text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}
        onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
        SYSTEM_SHIFT_CALIBRATION: [ COMPLETED_100% ]
      </div>
    </section>
  );
}

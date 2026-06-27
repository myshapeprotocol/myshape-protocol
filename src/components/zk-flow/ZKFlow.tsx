"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const STEPS = [
  { num: "01", label: "CAMERA", desc: "Real-time 30fps pose capture via MediaPipe. All processing on-device.", icon: "●" },
  { num: "02", label: "SST_18PT", desc: "33-point → 18-point Skeleton Topology. Bones, joints, angles.", icon: "◈" },
  { num: "03", label: "PES_4D", desc: "4-dimensional Entropy Scoring: timing, noise, frequency, biological.", icon: "◆" },
  { num: "04", label: "128D_VECTOR", desc: "Kinematics + Acceleration + Jerk + Jerk Spectrum → Motion Signature.", icon: "◇" },
  { num: "05", label: "ZK_PROOF", desc: "PoP + MP + EP composite proof. Verifiable without revealing data.", icon: "⬡" },
];

export default function ZKFlow() {
  return (
    <div className="relative py-6">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-0">
        {/* 连接线 */}
        <div className="hidden md:block absolute top-1/2 left-[6%] right-[6%] h-[1px]"
          style={{ transform: "translateY(-50%)", background: "linear-gradient(90deg, rgba(34,211,238,0.08), rgba(34,211,238,0.25), rgba(34,211,238,0.08))" }} />

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            onMouseEnter={e => {
              playTick(600 + i * 80, "sine", 0.08, 0.02);
              e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(144,200,255,0.08)";
            }}
            className="relative flex flex-row md:flex-col items-center gap-4 md:gap-4 py-3 md:py-0 md:w-[18%] group transition-all duration-500 p-3 md:p-4"
            style={{ border: "1px solid rgba(144,200,255,0.08)", background: "transparent" }}
          >
            {/* 节点圆 */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                style={{
                  borderColor: i === 4 ? "rgba(34,211,238,0.45)" : "rgba(34,211,238,0.18)",
                  background: i === 4 ? "rgba(34,211,238,0.06)" : "transparent",
                  boxShadow: i === 4 ? "0 0 16px rgba(34,211,238,0.15)" : "none",
                }}>
                <span className="text-cyan-400/50 group-hover:text-cyan-300/80 text-[13px] transition-colors">
                  {step.icon}
                </span>
              </div>
              <div className="absolute inset-0 rounded-full border border-cyan-400/8 opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{ animation: "ping 3s cubic-bezier(0,0,0.2,1) infinite" }} />
            </div>

            {/* 文字 */}
            <div className="flex-1 text-center md:text-center">
              <div className="text-cyan-400/25 text-[8px] tracking-[0.35em] mb-2 font-mono">{step.num}</div>
              <div className="text-white/55 text-[10px] tracking-[0.2em] uppercase mb-2 group-hover:text-white/85 transition-colors font-bold">
                {step.label}
              </div>
              <div className="hidden md:block text-white/20 text-[8px] leading-[1.6] max-w-[140px] mx-auto group-hover:text-white/35 transition-colors">
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <span className="text-cyan-400/12 text-[8px] tracking-[0.3em] uppercase">
          From Geometry → Proof in 5 steps. Zero raw data leaves the device.
        </span>
      </div>
    </div>
  );
}

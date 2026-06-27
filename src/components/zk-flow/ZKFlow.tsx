"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const STEPS = [
  { step: "01", title: "CAPTURE", label: "LOCAL_DEVICE", desc: "Raw kinetic energy captured via local visual sensors. No cloud streaming." },
  { step: "02", title: "EXTRACT", label: "GEOMETRY_ENGINE", desc: "Anonymizing skeletal data into pure motion geometry vectors." },
  { step: "03", title: "SCORE", label: "PES_4D_ENGINE", desc: "4-dimensional Entropy Scoring: timing, noise, frequency, biological." },
  { step: "04", title: "SIGN", label: "MOTION_SIGNATURE", desc: "Kinematics + Acceleration + Jerk + Jerk Spectrum → 128D Vector." },
  { step: "05", title: "PROVE", label: "ZK_PROOF_GEN", desc: "PoP + MP + EP composite proof. Verifiable without revealing data." },
];

export default function ZKFlow() {
  return (
    <div className="relative pt-4 pb-8">
      {/* 水平连接线 */}
      <div className="hidden md:block absolute top-[32px] left-0 w-full h-[1px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-4 relative z-10">
        {STEPS.map((item) => (
          <div key={item.step} className="group flex flex-col items-center text-center"
            onMouseEnter={() => playTick(800, "sine", 0.08, 0.02)}>
            {/* 圆形节点 */}
            <div className="w-16 h-16 rounded-full border border-white/10 bg-[#02040a] flex items-center justify-center mb-8 group-hover:border-cyan-500 transition-all duration-700 relative">
              <span className="text-[11px] text-white/30 group-hover:text-cyan-400 font-bold tracking-widest transition-colors">
                {item.step}
              </span>
              <div className="absolute inset-[-4px] border-[1px] border-cyan-500/0 border-t-cyan-500/40 rounded-full opacity-0 group-hover:opacity-100"
                style={{ animation: "spin 1.5s linear infinite" }} />
            </div>

            {/* 文字区 */}
            <div className="space-y-4">
              <h4 className="text-white text-[13px] tracking-[0.4em] font-bold uppercase group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h4>
              <div className="text-cyan-500/40 text-[9px] tracking-[0.3em] font-mono">
                [{item.label}]
              </div>
              <p className="text-white/30 text-[10px] tracking-[0.2em] leading-relaxed uppercase max-w-[180px] mx-auto group-hover:text-white/60 transition-colors">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <span className="text-white/15 text-[8px] tracking-[0.4em] uppercase">
          From Geometry → Proof. Zero raw data leaves the device.
        </span>
      </div>
    </div>
  );
}

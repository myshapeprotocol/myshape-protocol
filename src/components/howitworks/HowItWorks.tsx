"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";
import "./HowItWorks.css";

export default function HowItWorks() {
  const playPipelineTick = (stepIndex: number) => playTick([600, 800, 1000][stepIndex] || 800, "sine", 0.10, 0.025);

  return (
    <section className="w-full px-[6%] flex flex-col items-center bg-transparent relative"
      style={{ paddingTop: "clamp(4rem, 10vw, 10rem)", paddingBottom: "clamp(4rem, 10vw, 10rem)", fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <h2 className="sr-only">How MyShape Works — Motion-Native Zero-Knowledge Identity Pipeline</h2>

      <div className="max-w-[1200px] w-full">
        {/* 标题区 */}
        <div className="flex justify-between items-end mb-[clamp(3rem,6vw,6rem)]">
          <div className="max-w-[650px]">
            <span className="text-[9px] tracking-[0.6em] text-white/20 block mb-4 uppercase">HOW IT WORKS</span>
            <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-extralight -tracking-[0.02em] leading-[1.1] text-white m-0">
              The protocol behind <span className="text-[#90c8ff]/90">your identity.</span>
            </h2>
            <p className="text-[1.2rem] font-light text-white/85 mt-6 max-w-[600px] leading-[1.6]">
              A motion-native pipeline that turns how you move into a zero-knowledge identity.
            </p>
          </div>
          <div className="text-[0.9rem] text-[#90c8ff]/40 text-right border-r border-[#90c8ff]/20 pr-6 leading-[1.6] font-mono mb-[5px]">
            SYSTEM_PROCESS_V2.0<br />// PIPELINE: ACTIVE
          </div>
        </div>

        {/* 三步协议流网格 */}
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-16 mt-16">
          <div className="pipeline-line" />

          {[
            { step: "01", title: "LOCAL MOTION CAPTURE", desc: "On-device posture, balance, and micro-movement reading — processed locally." },
            { step: "02", title: "BEHAVIORAL ENCODING", desc: "Movement becomes a compact identity vector — non-corporeal and irreversible." },
            { step: "03", title: "ZERO-KNOWLEDGE VERIFICATION", desc: "Prove identity without exposing raw data — portable across AI and onchain worlds." },
          ].map((s, i) => (
            <div key={s.step} className="step-container relative"
              onMouseEnter={() => playPipelineTick(i)}>
              <div className="w-3 h-3 bg-white rounded-full mb-12 z-[2] relative animate-[pulseDot_2s_infinite]"
                style={{ animationDelay: `${i * 0.5}s` }} />
              <div className="text-motion-wrapper">
                <span className="text-item index-num font-mono text-[0.8rem] text-[#90c8ff]/50">0{i + 1}</span>
                <h3 className="text-item text-[1.2rem] font-extralight text-white my-4">{s.title}</h3>
                <p className="text-item text-[0.95rem] text-white/60 leading-[1.7] font-light">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO semantic layer */}
      <div className="sr-only">
        <h2>How MyShape Works — Motion-Native Identity Pipeline</h2>
        <p>MyShape transforms human motion into a zero-knowledge identity layer. The pipeline consists of three stages: local motion capture, behavioral encoding, and zero-knowledge verification.</p>
        <p>Related concepts include: motion identity, kinetic authentication, privacy-preserving identity, decentralized identity mesh, and AI-native identity protocols.</p>
        <a href="/genesis">Genesis Protocol</a>
        <a href="/identity">Identity Layer</a>
        <a href="/protocol">Protocol Architecture</a>
        <a href="/papers">Technical Papers</a>
      </div>

      {/* Schema.org structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "HowTo",
        name: "How MyShape Works — Motion-Native Identity Pipeline",
        description: "Learn how MyShape transforms human motion into a zero-knowledge identity layer through local capture, behavioral encoding, and ZK verification.",
        step: [
          { "@type": "HowToStep", name: "Local Motion Capture", text: "On-device posture, balance, and micro-movement reading." },
          { "@type": "HowToStep", name: "Behavioral Encoding", text: "Movement becomes a compact, irreversible identity vector." },
          { "@type": "HowToStep", name: "Zero-Knowledge Verification", text: "Prove identity without exposing raw data." },
        ],
        keywords: ["motion identity", "zero-knowledge identity", "kinetic authentication", "AI-native identity", "behavioral encoding"],
      })}} />
    </section>
  );
}

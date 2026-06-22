"use client";

import React from "react";
import { playTick } from "@/utils/useAudioTick";
import "./HowItWorks.css";

export default function HowItWorks() {
  const playPipelineTick = (stepIndex: number) => playTick([600, 800, 1000][stepIndex] || 800, "sine", 0.10, 0.025);

  return (
    <section
      style={{
        width: "100%",
        padding: "clamp(4rem, 10vw, 10rem) 6%",
        background: "transparent",
        position: "relative",
        fontFamily: "var(--font-geist-sans), sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ------------------------------
          隐藏式 H1（SEO / AI 可读）
      ------------------------------- */}
      <h1 className="sr-only">
        How MyShape Works — Motion-Native Zero-Knowledge Identity Pipeline
      </h1>

      <div style={{ maxWidth: "1200px", width: "100%" }}>
        
        {/* 标题区 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "clamp(3rem, 6vw, 6rem)" }}>
          <div style={{ maxWidth: "650px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.6em", color: "rgba(255, 255, 255, 0.2)", display: "block", marginBottom: "1rem", textTransform: "uppercase" }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
              The protocol behind <span style={{ color: "rgba(144, 200, 255, 0.9)" }}>your identity.</span>
            </h2>
            <p style={{ fontSize: "1.2rem", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: "1.5rem", maxWidth: "600px", lineHeight: 1.6 }}>
              A motion-native pipeline that turns how you move into a zero-knowledge identity.
            </p>
          </div>

          <div style={{ fontSize: "0.9rem", opacity: 0.4, color: "rgba(144,200,255,0.7)", textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.2)", paddingRight: "1.5rem", lineHeight: "1.6", fontFamily: "monospace", marginBottom: "5px" }}>
            SYSTEM_PROCESS_V2.0<br />// PIPELINE: ACTIVE
          </div>
        </div>

        {/* 三步协议流网格 */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", marginTop: "4rem" }}>
          <div className="pipeline-line" />

          {/* STEP 01 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(0)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>01</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>LOCAL MOTION CAPTURE</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>On-device posture, balance, and micro-movement reading — processed locally.</p>
            </div>
          </div>

          {/* STEP 02 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(1)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite 0.5s" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>02</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>BEHAVIORAL ENCODING</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>Movement becomes a compact identity vector — non-corporeal and irreversible.</p>
            </div>
          </div>

          {/* STEP 03 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(2)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite 1s" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>03</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>ZERO-KNOWLEDGE VERIFICATION</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>Prove identity without exposing raw data — portable across AI and onchain worlds.</p>
            </div>
          </div>

        </div>
      </div>

      {/* -----------------------------------------
          AI-Native Invisible Semantic Layer
      ------------------------------------------ */}
      <div className="sr-only">
        <h2>How MyShape Works — Motion-Native Identity Pipeline</h2>
        <p>
          MyShape transforms human motion into a zero-knowledge identity layer.
          The pipeline consists of three stages: local motion capture, behavioral
          encoding, and zero-knowledge verification. This process ensures privacy,
          sovereignty, and cross-platform portability.
        </p>

        <p>
          Related concepts include: motion identity, kinetic authentication,
          privacy-preserving identity, decentralized identity mesh, and
          AI-native identity protocols.
        </p>

        {/* 隐形内部链接 */}
        <a href="/genesis">Genesis Protocol</a>
        <a href="/identity">Identity Layer</a>
        <a href="/protocol">Protocol Architecture</a>
        <a href="/papers">Technical Papers</a>
      </div>

      {/* -----------------------------------------
          Schema.org Structured Data
      ------------------------------------------ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How MyShape Works — Motion-Native Identity Pipeline",
            description:
              "Learn how MyShape transforms human motion into a zero-knowledge identity layer through local capture, behavioral encoding, and ZK verification.",
            step: [
              {
                "@type": "HowToStep",
                name: "Local Motion Capture",
                text: "On-device posture, balance, and micro-movement reading.",
              },
              {
                "@type": "HowToStep",
                name: "Behavioral Encoding",
                text: "Movement becomes a compact, irreversible identity vector.",
              },
              {
                "@type": "HowToStep",
                name: "Zero-Knowledge Verification",
                text: "Prove identity without exposing raw data.",
              },
            ],
            keywords: [
              "motion identity",
              "zero-knowledge identity",
              "kinetic authentication",
              "AI-native identity",
              "behavioral encoding",
            ],
          }),
        }}
      />
    </section>
  );
}

"use client";

import React, { useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";
import { useRouter } from "next/navigation";
import "./Capabilities.css";

/* ---------------------- 卡片组件 ---------------------- */

type CardProps = {
  index: string; title: string; line1: string; line2: string; line3: string;
  params: Record<string, string>; side: string; motionType: string;
};

const CapabilityCard = ({
  index, title, line1, line2, line3, params, side, motionType,
}: CardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const themeColor = "144, 200, 255";

  const playPrimitiveTick = () => playTick(750, "triangle", 0.10, 0.025);

  return (
    <div 
      className={`cap-box ${side}`}
      onMouseEnter={() => {
        setIsHovered(true);
        playPrimitiveTick();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="cap-scan-line" />

      <div className="cap-inner">
        <div className="cap-header">
          <span className="cap-index">PRIMITIVE_{index}</span>
          <div className={`cap-visual-icon ${motionType}`}>
            <div className="core-dot" />
            <div className="ring r1" />
            <div className="ring r2" />
          </div>
        </div>

        <div className="cap-content">
          <h3 className="cap-title">{title}</h3>
          <p className="cap-text-main">{line1}</p>
          <p className="cap-text-sub">{line2}</p>
          <p className="cap-text-highlight">{line3}</p>
        </div>

        <div className="cap-footer">
          {Object.entries(params).map(([k, v]: [string, string]) => (
            <div key={k} className="param-row">
              <span className="param-key">{k}</span>
              <span className="param-val">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------------- 主模块 ---------------------- */

export default function Capabilities() {
  const router = useRouter();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [statusText, setStatusText] = useState("");

  const statusLines = [
    "[ DECRYPTING_PRIMITIVE_SYSTEM_SPEC ]",
    "[ // AUTHENTICATING_LOCAL_ANCHOR ]",
    "[ // ACCESS_GRANTED_CLASS_OMEGA_DECRYPT_COMPLETE ]",
  ];

  const handleDecrypt = useCallback(() => {
    if (isDecrypting) return;
    setIsDecrypting(true);
    setIsGlitching(true);
    setProgress(0);
    setStatusText("");
    const startTime = Date.now();

    // Phase 1: intensified glitch 0-400ms
    setTimeout(() => setIsGlitching(false), 400);

    // Phase 2: typewriter sequence starting at 400ms
    const typeSequence = async () => {
      await new Promise((r) => setTimeout(r, 400));
      for (let i = 1; i <= statusLines[0].length; i++) {
        setStatusText(statusLines[0].substring(0, i));
        await new Promise((r) => setTimeout(r, 15));
      }
      await new Promise((r) => setTimeout(r, 120));
      const prefix1 = statusLines[0] + "\n";
      for (let i = 1; i <= statusLines[1].length; i++) {
        setStatusText(prefix1 + statusLines[1].substring(0, i));
        await new Promise((r) => setTimeout(r, 15));
      }
      await new Promise((r) => setTimeout(r, 120));
      const prefix2 = statusLines[0] + "\n" + statusLines[1] + "\n";
      for (let i = 1; i <= statusLines[2].length; i++) {
        setStatusText(prefix2 + statusLines[2].substring(0, i));
        await new Promise((r) => setTimeout(r, 12));
      }
    };
    typeSequence();

    // Phase 3: progress bar from 400ms to 2500ms
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        setProgress(0);
        requestAnimationFrame(animate);
        return;
      }
      const t = Math.min((elapsed - 400) / 2100, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * 100);
      if (elapsed < 2500) {
        requestAnimationFrame(animate);
      } else {
        router.push("/protocol");
        setTimeout(() => {
          setIsDecrypting(false);
          setProgress(0);
          setStatusText("");
        }, 2000);
      }
    };
    requestAnimationFrame(animate);
  }, [isDecrypting, router]);

  return (
    <section style={{ 
      width: "100%", 
      padding: "clamp(4rem, 8vw, 10rem) 6%", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      background: "transparent"
    }}>
      
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "clamp(4rem, 10vw, 10rem)" }}>
        <div style={{ maxWidth: "650px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.6em", color: "rgba(255, 255, 255, 0.2)", display: "block", marginBottom: "1rem", textTransform: "uppercase" }}>
            CAPABILITIES
          </span>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Sovereignty as <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Protocol.</span>
          </h2>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7 }}>
            A unified suite of primitives for secure, behavioral identity in the age of AI.
          </p>
        </div>

        {/* 2. 修改右侧区域：增加跳转按钮 */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2rem" }}>
          <div style={{ 
            fontSize: "0.8rem", opacity: 0.3, color: "rgba(144,200,255,0.7)", 
            textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.15)", 
            paddingRight: "1.5rem", lineHeight: "1.8", fontFamily: "monospace"
          }}>
            PROTOCOL_CORE_V1.86<br />// STREAM: ENCRYPTED<br />// STATE: ACTIVE
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem", marginTop: "20px" }}>
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className={`decrypt-btn ${isGlitching ? 'glitch-active' : ''}`}
              style={{
                padding: "0.8rem 1.5rem",
                border: "none",
                color: isDecrypting ? "rgba(144, 200, 255, 0.4)" : "rgba(144, 200, 255, 0.8)",
                fontSize: "0.7rem",
                letterSpacing: "0.6em",
                textTransform: "uppercase",
                cursor: isDecrypting ? "not-allowed" : "pointer",
                background: "transparent",
                transition: "all 0.3s",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                if (!isDecrypting) {
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseOut={(e) => {
                if (!isDecrypting) {
                  e.currentTarget.style.color = "rgba(144, 200, 255, 0.8)";
                }
              }}
            >
              DECRYPT_CORE_DOCS →
            </button>

            {isDecrypting && (
              <>
                <div style={{
                  width: "100%",
                  height: "4px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#22d3ee",
                    borderRadius: "2px",
                    transition: "width 0.08s linear",
                  }} />
                </div>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: "0.5rem",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.2em",
                  whiteSpace: "pre-line",
                  textAlign: "right",
                  lineHeight: "1.6",
                }}>
                  {statusText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "1200px", gap: "3rem", flexWrap: "wrap" }}>
        <CapabilityCard
          index="01" side="left" motionType="lock"
          title="Neural Lock"
          line1="Bind identity to your motion geometry."
          line2="A cryptographic tether forged from your unique physiological topology."
          line3="Unforgeable. Uncopyable. Irreversible."
          params={{ MOTION_HASH: "SEALED", FORGE_RISK: "NULL" }}
        />
        <CapabilityCard
          index="02" side="center" motionType="privacy"
          title="ZK-Privacy"
          line1="Protect your geometry with zero-knowledge proofs."
          line2="Verification without exposure. Data never leaves the enclave."
          line3="EXPOSURE: ZERO. PRIVACY: ABSOLUTE."
          params={{ EXPOSURE: "ZERO", ZK_STATE: "ACTIVE" }}
        />
        <CapabilityCard
          index="03" side="right" motionType="omni"
          title="Omni-Presence"
          line1="Deploy one identity across infinite agents."
          line2="A unified protocol presence that persists across systems."
          line3="SYNC: CONTINUOUS. PERSISTENCE: 100%."
          params={{ SYNC_STATE: "CONTI", AGENT_LINKS: "ACTIVE" }}
        />
      </div>
    </section>
  );
}
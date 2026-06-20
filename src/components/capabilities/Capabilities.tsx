"use client";

import React, { useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";
import { useRouter } from "next/navigation";

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

  const playPrimitiveTick = () => playTick(750, "triangle", 0.05, 0.012);

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

        <div className="cap-body">
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

      <style>{`
        .cap-box {
          position: relative;
          width: 320px;
          height: 380px;
          background: transparent;
          border: 1px solid rgba(144, 200, 255, 0.1);
          border-radius: 12px;
          padding: 2.2rem;
          transition: all 0.7s cubic-bezier(0.2, 1, 0.3, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .left   { transform: translateY(-30px); }
        .center { transform: translateY(50px); z-index: 2; }
        .right  { transform: translateY(-10px); }

        .cap-box:hover {
          background: radial-gradient(circle at top right, rgba(144, 200, 255, 0.05) 0%, transparent 70%);
          border-color: rgba(144, 200, 255, 0.35);
          z-index: 10 !important;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        }

        .left:hover   { transform: translateY(-45px) scale(1.01); }
        .center:hover { transform: translateY(35px) scale(1.01); }
        .right:hover  { transform: translateY(-25px) scale(1.01); }

        .cap-inner {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .cap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .cap-index {
          font-family: monospace;
          font-size: 0.7rem;
          color: rgba(144, 200, 255, 0.4);
          letter-spacing: 0.2em;
        }

        .cap-visual-icon {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .core-dot {
          position: absolute;
          left: 50%; top: 50%; width: 2px; height: 2px;
          background: #fff; border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(144, 200, 255, 0.2);
          border-radius: 50%;
        }

        .lock .r1 { animation: pulse 3s infinite; }
        .privacy::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 1px;
          background: rgba(144, 200, 255, 0.6); 
          box-shadow: 0 0 8px rgba(144, 200, 255, 0.4);
          animation: scanLine 2.5s infinite ease-in-out;
        }
        .omni .r1 { animation: spread 4s infinite linear; }

        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(24px); opacity: 0; }
        }

        @keyframes spread {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .cap-title { 
          font-size: 1.2rem; 
          font-weight: 300; 
          color: #fff; 
          margin: 0 0 1rem 0; 
          letter-spacing: 0.02em; 
        }
        .cap-text-main { 
          font-size: 0.9rem; 
          font-weight: 300; 
          line-height: 1.6; 
          color: rgba(255,255,255,0.75); 
          margin-bottom: 0.5rem; 
        }
        .cap-text-sub { 
          font-size: 0.85rem; 
          font-weight: 300; 
          line-height: 1.6; 
          color: rgba(255,255,255,0.35); 
          margin-bottom: 0.8rem; 
        }
        .cap-text-highlight { 
          font-size: 0.8rem; 
          font-weight: 300; 
          color: rgba(144, 200, 255, 0.6); 
          text-transform: uppercase; 
          letter-spacing: 0.1em; 
        }

        .cap-footer { 
          margin-top: auto; 
          padding-top: 1.2rem; 
          border-top: 1px solid rgba(144, 200, 255, 0.08); 
        }
        .param-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .param-key { font-size: 0.7rem; opacity: 0.3; font-weight: 300; text-transform: uppercase; }
        .param-val { font-size: 0.7rem; opacity: 0.6; color: rgba(144, 200, 255, 0.8); font-family: monospace; }

        .cap-scan-line {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(144, 200, 255, 0.01), transparent);
          background-size: 100% 4px; pointer-events: none;
        }
      `}</style>
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
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.6em", color: "rgba(144, 200, 255, 0.4)", display: "block", marginBottom: "1.5rem" }}>
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
          line1="Bind identity to your biological signature."
          line2="A cryptographic tether forged from your unique physiological topology."
          line3="Unforgeable. Uncopyable. Irreversible."
          params={{ BIOMETRIC_HASH: "SEALED", FORGE_RISK: "NULL" }}
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
          line2="A unified protocol body that persists across systems."
          line3="SYNC: CONTINUOUS. PERSISTENCE: 100%."
          params={{ SYNC_STATE: "CONTI", AGENT_LINKS: "ACTIVE" }}
        />
      </div>

      <style>{`
        .decrypt-btn {
          font-family: monospace;
          font-weight: 200;
        }
        .decrypt-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          animation: textVibrate 0.15s ease-in-out infinite;
        }
        .decrypt-btn.glitch-active {
          animation: decryptGlitch 0.4s ease-out forwards;
        }
        @keyframes decryptGlitch {
          0% { filter: blur(0); transform: translateX(0); opacity: 1; }
          5% { filter: blur(3px); transform: translateX(-6px); opacity: 0.4; }
          8% { filter: blur(0); transform: translateX(4px); opacity: 1; }
          12% { filter: blur(4px); transform: translateX(-8px); opacity: 0.3; }
          16% { filter: blur(0); transform: translateX(5px); opacity: 1; }
          22% { filter: blur(5px); transform: translateX(-7px); opacity: 0.2; }
          28% { filter: blur(0); transform: translateX(3px); opacity: 1; }
          35% { filter: blur(3px); transform: translateX(-5px); opacity: 0.5; }
          45% { filter: blur(0); transform: translateX(2px); opacity: 1; }
          60% { filter: blur(2px); transform: translateX(-3px); opacity: 0.6; }
          80% { filter: blur(0); transform: translateX(1px); opacity: 1; }
          100% { filter: blur(0); transform: translateX(0); opacity: 1; }
        }
        @keyframes textVibrate {
          0% { transform: translateX(0); }
          25% { transform: translateX(-0.5px); }
          50% { transform: translateX(0.5px); }
          75% { transform: translateX(-0.3px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
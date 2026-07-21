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

const CapabilityCard = ({ index, title, line1, line2, line3, params, side, motionType }: CardProps) => (
  <div className={`cap-box ${side}`} onMouseEnter={() => playTick(750, "triangle", 0.10, 0.025)}>
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
        {Object.entries(params).map(([k, v]) => (
          <div key={k} className="param-row">
            <span className="param-key">{k}</span>
            <span className="param-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    "[ // ACCESS_GRANTED_v1.0-RC_DECRYPT_COMPLETE ]",
  ];

  const handleDecrypt = useCallback(() => {
    if (isDecrypting) return;
    setIsDecrypting(true); setIsGlitching(true); setProgress(0); setStatusText("");
    const startTime = Date.now();
    setTimeout(() => setIsGlitching(false), 400);

    const typeSequence = async () => {
      await new Promise((r) => setTimeout(r, 400));
      for (let i = 1; i <= statusLines[0].length; i++) { setStatusText(statusLines[0].substring(0, i)); await new Promise((r) => setTimeout(r, 15)); }
      await new Promise((r) => setTimeout(r, 120));
      const p1 = statusLines[0] + "\n";
      for (let i = 1; i <= statusLines[1].length; i++) { setStatusText(p1 + statusLines[1].substring(0, i)); await new Promise((r) => setTimeout(r, 15)); }
      await new Promise((r) => setTimeout(r, 120));
      const p2 = statusLines[0] + "\n" + statusLines[1] + "\n";
      for (let i = 1; i <= statusLines[2].length; i++) { setStatusText(p2 + statusLines[2].substring(0, i)); await new Promise((r) => setTimeout(r, 12)); }
    };
    typeSequence();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) { setProgress(0); requestAnimationFrame(animate); return; }
      const t = Math.min((elapsed - 400) / 2100, 1);
      setProgress((1 - Math.pow(1 - t, 3)) * 100);
      if (elapsed < 2500) requestAnimationFrame(animate);
      else { router.push("/protocol"); setTimeout(() => { setIsDecrypting(false); setProgress(0); setStatusText(""); }, 2000); }
    };
    requestAnimationFrame(animate);
  }, [isDecrypting, router]);

  return (
    <section className="w-full flex flex-col items-center bg-transparent"
      style={{ padding: "clamp(4rem, 8vw, 10rem) 6%" }}>

      <div className="w-full max-w-[1200px] flex justify-between items-end mb-[clamp(4rem,10vw,10rem)]">
        <div className="max-w-[650px]">
          <span className="text-[11px] tracking-[0.6em] text-white/20 block mb-4 uppercase">CAPABILITIES</span>
          <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-light -tracking-[0.02em] leading-[1.1] text-white m-0">
            Sovereignty as <span className="text-[#90c8ff]/80">Protocol.</span>
          </h2>
          <p className="text-[clamp(0.9rem,2vw,1.1rem)] font-light text-white/70 mt-7 max-w-[550px] leading-[1.7]">
            A unified suite of primitives for secure, behavioral identity in the age of AI.
          </p>
        </div>

        <div className="text-right flex flex-col items-end gap-8">
          <div className="text-[0.8rem] text-[#90c8ff]/30 text-right border-r border-[#90c8ff]/15 pr-6 leading-[1.8] font-mono">
            PROTOCOL_CORE_V1.86<br />// STREAM: ENCRYPTED<br />// STATE: ACTIVE
          </div>
          <div className="flex flex-col items-end gap-2.5 mt-5">
            <button onClick={handleDecrypt} disabled={isDecrypting}
              className="decrypt-btn px-5 py-3 border-none bg-transparent transition-all duration-300 relative overflow-hidden uppercase tracking-[0.6em] text-[0.7rem]"
              style={{ color: isDecrypting ? "rgba(144,200,255,0.4)" : "rgba(144,200,255,0.8)", cursor: isDecrypting ? "not-allowed" : "pointer" }}>
              DECRYPT_CORE_DOCS →
            </button>
            {isDecrypting && (
              <>
                <div className="w-full h-1 bg-white/10 rounded-sm overflow-hidden">
                  <div className="h-full bg-[#90c8ff] rounded-sm transition-[width] duration-[0.08s] ease-linear"
                    style={{ width: `${progress}%` }} />
                </div>
                <span className="font-mono text-[0.5rem] text-white/40 tracking-[0.2em] whitespace-pre-line text-right leading-[1.6]">
                  {statusText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center w-full max-w-[1200px] gap-12 flex-wrap">
        <CapabilityCard index="01" side="left" motionType="lock"
          title="Neural Lock" line1="Bind identity to your motion geometry."
          line2="A cryptographic tether forged from your unique physiological topology."
          line3="Unforgeable. Uncopyable. Irreversible."
          params={{ MOTION_HASH: "SEALED", FORGE_RISK: "NULL" }} />
        <CapabilityCard index="02" side="center" motionType="privacy"
          title="Privacy-Preserving" line1="Protect your geometry with continuity receipts."
          line2="Verification without exposure. Data never leaves the enclave."
          line3="EXPOSURE: ZERO. PRIVACY: ABSOLUTE."
          params={{ EXPOSURE: "ZERO", ZK_STATE: "ACTIVE" }} />
        <CapabilityCard index="03" side="right" motionType="omni"
          title="Omni-Presence" line1="Deploy one identity across infinite agents."
          line2="A unified protocol presence that persists across systems."
          line3="SYNC: CONTINUOUS. PERSISTENCE: 100%."
          params={{ SYNC_STATE: "CONTI", AGENT_LINKS: "ACTIVE" }} />
      </div>
    </section>
  );
}

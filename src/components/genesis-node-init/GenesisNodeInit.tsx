"use client";
import { useState, useRef } from "react";
import { playTick } from "@/utils/useAudioTick";

type Stage = "idle" | "input" | "initializing" | "done" | "error";

interface HandshakeResponse {
  node_token?: string;
  initialized_at?: string;
  stage?: string;
  message?: string;
  error?: string;
  retry_after_s?: number;
}

const PROTOCOL_STAGES = [
  "Initializing local entropy sandbox...",
  "Establishing cryptographic boundary...",
  "Synchronizing with Genesis Cohort...",
  "Verifying network topology integrity...",
  "Handshake complete. You are now a verified node.",
];

export default function GenesisNodeInit({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("input");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<HandshakeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [protocolStep, setProtocolStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle through protocol stage messages during initialization
  useEffect(() => {
    if (stage !== "initializing") return;
    setProtocolStep(0);
    const timer = setInterval(() => {
      setProtocolStep(p => Math.min(p + 1, PROTOCOL_STAGES.length - 1));
    }, 1200);
    return () => clearInterval(timer);
  }, [stage]);

  const handleHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    setStage("initializing");
    setErrorMsg("");
    playTick(600, "sine", 0.06, 0.015);

    try {
      const r = await fetch("/api/nodes/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origin: window.location.origin }),
      });
      const d: HandshakeResponse = await r.json();
      setResult(d);
      if (d.node_token) {
        setStage("done");
        playTick(800, "sine", 0.10, 0.025);
      } else {
        setStage("error");
        setErrorMsg(d.error || "HANDSHAKE_FAILED");
      }
    } catch {
      setStage("error");
      setErrorMsg("PROTOCOL_CORE_UNREACHABLE");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-md mx-4 overflow-hidden transition-all duration-700"
        style={{
          border: "1px solid rgba(144,200,255,0.15)",
          clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
          background: "linear-gradient(180deg, rgba(6,18,36,0.95), rgba(2,10,20,0.98))",
          boxShadow: "0 0 60px rgba(144,200,255,0.06), 0 20px 60px rgba(0,0,0,0.5)",
        }}>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-[1px] bg-gradient-to-r from-[#90c8ff]/30 to-transparent" />
        <div className="absolute top-0 left-0 w-[1px] h-6 bg-gradient-to-b from-[#90c8ff]/30 to-transparent" />
        <div className="absolute bottom-0 right-0 w-6 h-[1px] bg-gradient-to-l from-[#90c8ff]/30 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[1px] h-6 bg-gradient-to-t from-[#90c8ff]/30 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            stage === "initializing" ? "bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.4)]" :
            stage === "done" ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" :
            stage === "error" ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]" :
            "bg-[#90c8ff]/40"
          }`} />
          <span className="text-white/35 text-[10px] tracking-[0.15em] uppercase font-mono">
            {stage === "done" ? "NODE_ACTIVE" : "GENESIS_NODE_INITIALIZATION"}
          </span>
          <button onClick={onClose} className="ml-auto text-white/10 hover:text-white/30 text-[12px] transition-colors"
            onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>×</button>
        </div>

        {/* Body */}
        <div className="px-5 py-6">
          {stage === "input" && (
            <form onSubmit={handleHandshake} className="space-y-4">
              <div>
                <p className="text-white/40 text-[12px] leading-relaxed mb-4 font-light">
                  Initialize your node on the protocol mesh. Your identity vector will be provisioned instantly — no approval required.
                </p>
                <label className="block text-white/25 text-[9px] tracking-[0.2em] uppercase mb-2 font-mono">
                  Identity Vector (Email)
                </label>
                <input ref={inputRef} type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@institution.io"
                  className="w-full bg-transparent border-b border-white/10 py-3 text-[13px] text-white/70 placeholder:text-white/10 focus:outline-none focus:border-[#90c8ff]/40 transition-all tracking-[0.08em] font-mono" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={!email.includes("@")}
                  onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}
                  className="flex-1 py-2.5 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.2em] uppercase font-mono hover:bg-[#90c8ff]/[0.06] hover:text-white hover:border-[#90c8ff] transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                  Initialize Node →
                </button>
                <button type="button" onClick={onClose}
                  onMouseEnter={() => playTick(350, "sine", 0.03, 0.008)}
                  className="px-4 py-2.5 border border-white/10 text-white/20 text-[10px] tracking-[0.15em] uppercase font-mono hover:border-white/20 hover:text-white/40 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {stage === "initializing" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border border-[#90c8ff]/20 animate-spin" style={{ borderTopColor: "rgba(144,200,255,0.7)" }} />
                <div className="absolute inset-0 rounded-full border border-[#90c8ff]/[0.04] animate-ping opacity-50" style={{ animationDuration: "2s" }} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[#90c8ff]/60 text-[10px] tracking-[0.3em] uppercase font-mono animate-pulse">
                  PROVISIONING_ACCESS_TOKEN...
                </p>
                {PROTOCOL_STAGES.slice(0, protocolStep + 1).map((msg, i) => (
                  <p key={i} className="text-white/20 text-[9px] tracking-[0.08em] font-mono transition-all duration-500"
                    style={{ opacity: i === protocolStep ? 0.5 : 0.2 }}>
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}

          {stage === "done" && result && (() => {
            const identityHash = result.node_token!.slice(8, 24).split("").reduce((h, c) => h + c.charCodeAt(0).toString(16).slice(-1), "").slice(0, 16).toUpperCase();
            return (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[#90c8ff]/15 animate-ping" style={{ animationDuration: "3s" }} />
                  <div className="relative w-3 h-3 rounded-full bg-[#90c8ff]/60 shadow-[0_0_12px_rgba(144,200,255,0.4)]" />
                </div>
                <p className="text-[#90c8ff]/80 text-[11px] tracking-[0.2em] uppercase font-mono">
                  LINKING_NODE_ID // SUCCESS
                </p>
              </div>
              <div className="p-4 bg-black/40 border border-[#90c8ff]/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/30 text-[9px] tracking-[0.15em] uppercase font-mono">NODE_TOKEN</span>
                  <span className="text-[#90c8ff]/60 text-[9px] tracking-[0.05em] font-mono">{result.node_token!.slice(0, 20)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 text-[9px] tracking-[0.15em] uppercase font-mono">IDENTITY_HASH</span>
                  <span className="text-[#90c8ff]/45 text-[9px] tracking-[0.1em] font-mono">{identityHash}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 text-[9px] tracking-[0.15em] uppercase font-mono">INITIALIZED</span>
                  <span className="text-white/40 text-[9px] tracking-[0.05em] font-mono">{result.initialized_at}</span>
                </div>
                <button onClick={() => {
                  navigator.clipboard.writeText(result.node_token!);
                  playTick(700, "sine", 0.08, 0.02);
                }}
                  onMouseEnter={() => playTick(600, "sine", 0.05, 0.012)}
                  className="w-full mt-2 py-2 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[9px] tracking-[0.2em] uppercase font-mono hover:bg-[#90c8ff]/[0.04] hover:text-[#90c8ff] hover:border-[#90c8ff]/40 transition-all">
                  Copy Token to Clipboard
                </button>
              </div>
              <p className="text-white/20 text-[10px] leading-relaxed text-center font-light">
                Handshake complete. You are now a verified node.
              </p>
            </div>
          )})()}

          {stage === "error" && (
            <div className="space-y-4 text-center">
              <p className="text-red-400/60 text-[10px] tracking-[0.2em] uppercase font-mono">
                {`> ${errorMsg}`}
              </p>
              <button onClick={() => { setStage("input"); setErrorMsg(""); }}
                onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}
                className="px-6 py-2 border border-white/15 text-white/40 text-[9px] tracking-[0.15em] uppercase font-mono hover:border-white/30 hover:text-white/70 transition-all">
                Retry Handshake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

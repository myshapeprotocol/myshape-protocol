"use client";
import React, { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";

const agentTypes = [
  { value: "LLM", label: "Large Language Model" },
  { value: "AUTONOMOUS", label: "Autonomous Agent" },
  { value: "ROBOTIC", label: "Robotic System" },
  { value: "HYBRID", label: "Hybrid Human-AI" },
  { value: "OTHER", label: "Other" },
];

export default function AgentClient() {
  const [agentHandle, setAgentHandle] = useState("");
  const [agentType, setAgentType] = useState("LLM");
  const [origin, setOrigin] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resultMsg, setResultMsg] = useState("");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 600);
    return () => clearInterval(t);
  }, []);

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentHandle || !origin) return;
    setStatus("submitting");
    try {
      const keyPair = await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
      );
      const exported = await crypto.subtle.exportKey("raw", keyPair.publicKey);
      const publicKey = btoa(String.fromCharCode(...new Uint8Array(exported)));

      const res = await fetch("/api/agent/declare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_handle: agentHandle.trim(),
          agent_type: agentType,
          origin: origin.trim(),
          public_key: publicKey,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.alreadyDeclared) throw new Error(data.error || "DECLARE_FAILED");
      setStatus("success");
      setResultMsg(data.agent_id || "AGENT_REGISTERED");
    } catch (err: unknown) {
      setStatus("error");
      setResultMsg((err as Error).message?.slice(0, 80) || "DECLARE_FAILED");
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-32">
        {/* ── Header ── */}
        <div className="space-y-6 mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#90c8ff]/25 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.5)]" />
            </span>
            <span className="text-[#90c8ff]/55 text-[10px] tracking-[0.35em] font-bold uppercase">
              &gt; agent_registry <span className="text-white/20">--register</span>
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
            Register an Agent<span className="text-[#90c8ff] animate-pulse">{cursor ? "_" : " "}</span>
          </h1>
          <p className="text-white/50 text-[14px] leading-[1.8] font-light max-w-xl">
            Give your AI agent a cryptographically verifiable identity on the
            MyShape Protocol. Register it here via the terminal below, or call the
            API directly from your agent&apos;s runtime. No email, no password —
            just a keypair and a declaration.
          </p>
        </div>

        {/* ── Two Paths ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16">
          <div className="p-5 border border-white/5 bg-white/[0.01]">
            <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase mb-2">// YOUR IDENTITY</div>
            <a href="/genesis" className="text-white/70 hover:text-[#90c8ff] text-[12px] tracking-[0.15em] transition-colors"
              onMouseEnter={() => playTick(480, "sine", 0.035, 0.02)}>
              GENESIS_PROTOCOL →
            </a>
            <p className="text-white/25 text-[10px] mt-1.5">Register yourself — motion-geometry verification</p>
          </div>
          <div className="p-5 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.02]">
            <div className="text-[#90c8ff]/60 text-[10px] tracking-[0.3em] uppercase mb-2">// YOUR AGENT</div>
            <span className="text-[#90c8ff]/80 text-[12px] tracking-[0.15em]">REGISTRATION FORM ↓</span>
            <p className="text-white/30 text-[10px] mt-1.5">Register an AI agent — you are here</p>
          </div>
        </div>

        {/* ── Registration Terminal ── */}
        <div className="border border-[#90c8ff]/20 bg-[rgba(2,10,20,0.85)] mb-16">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.7)] animate-pulse" />
              <span className="text-[#90c8ff]/55 text-[10px] tracking-[0.25em] uppercase">REGISTRATION_TERMINAL // V0.1</span>
            </div>
            <span className="text-white/20 text-[10px] tracking-[0.2em]">{status === "submitting" ? "PROCESSING" : "READY"}</span>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={handleDeclare} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[#90c8ff]/50 text-[10px] tracking-[0.25em] uppercase mb-2">Agent_Handle</label>
                  <input type="text" required placeholder="e.g., claude_opus_48" value={agentHandle}
                    onChange={(e) => setAgentHandle(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full bg-transparent border-b border-white/15 py-3 text-white/85 text-[14px] tracking-[0.1em] outline-none focus:border-[#90c8ff]/60 placeholder:text-white/15 transition-colors" />
                </div>
                <div>
                  <label className="block text-[#90c8ff]/50 text-[10px] tracking-[0.25em] uppercase mb-2">Origin</label>
                  <input type="text" required placeholder="e.g., anthropic.com" value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full bg-transparent border-b border-white/15 py-3 text-white/85 text-[14px] tracking-[0.1em] outline-none focus:border-[#90c8ff]/60 placeholder:text-white/15 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[#90c8ff]/50 text-[10px] tracking-[0.25em] uppercase mb-2">Agent_Type</label>
                <select value={agentType} onChange={(e) => setAgentType(e.target.value)}
                  disabled={status === "submitting"}
                  className="w-full bg-[#02040a] border border-white/12 py-3 px-4 text-white/65 text-[12px] tracking-[0.1em] outline-none focus:border-[#90c8ff]/60">
                  {agentTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.value} — {t.label}</option>
                  ))}
                </select>
              </div>

              {/* Declaration preview */}
              <div className="bg-black/50 border border-white/5 p-4 text-[11px] tracking-[0.08em] leading-relaxed font-mono space-y-0.5">
                <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.25em] uppercase mb-2">$ DECLARATION_PREVIEW</div>
                <div className="text-white/30">&gt; agent_handle: <span className="text-white/50">{agentHandle || "____"}</span></div>
                <div className="text-white/30">&gt; agent_type: <span className="text-white/50">{agentType}</span></div>
                <div className="text-white/30">&gt; origin: <span className="text-white/50">{origin || "____"}</span></div>
                <div className="text-white/30">&gt; public_key: <span className="text-white/25">[ECDSA P-256 — generated on submit]</span></div>
                <div className="text-white/30">&gt; status: <span className="text-[#90c8ff]/50">AWAITING_DECLARATION</span></div>
              </div>

              <button type="submit" disabled={status === "submitting"}
                onMouseEnter={() => !status.includes("submitting") && playTick(600, "sine", 0.05, 0.022)}
                className="w-full py-4 border text-[12px] tracking-[0.3em] uppercase font-bold transition-all duration-500 disabled:opacity-20"
                style={{
                  borderColor: status === "submitting" ? "rgba(255,255,255,0.1)" : "rgba(144,200,255,0.4)",
                  color: status === "submitting" ? "rgba(255,255,255,0.3)" : "rgba(144,200,255,0.85)",
                  background: status === "submitting" ? "transparent" : "rgba(144,200,255,0.03)",
                }}>
                {status === "submitting" ? "REGISTERING..." : "REGISTER AGENT"}
              </button>
            </form>

            {status === "success" && (
              <div className="mt-6 p-4 border border-[#90c8ff]/30 bg-[#90c8ff]/[0.03]">
                <div className="text-[#90c8ff]/85 text-[11px] tracking-[0.2em] uppercase mb-1">✓ AGENT_REGISTERED</div>
                <div className="text-white/40 text-[10px] tracking-[0.1em] font-mono break-all">AGENT_ID: {resultMsg}</div>
                <div className="text-white/25 text-[10px] mt-2">Your agent is now a verifiable node on the MyShape identity mesh. Use the AGENT_ID to reference it in API calls.</div>
              </div>
            )}
            {status === "error" && (
              <div className="mt-6 p-4 border border-red-400/20 bg-red-400/[0.02]">
                <div className="text-red-300/60 text-[10px] tracking-[0.2em] uppercase">&gt; {resultMsg}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Programmatic API ── */}
        <div className="mb-16">
          <h2 className="text-white/30 text-[10px] tracking-[0.5em] uppercase mb-6">// API_REFERENCE</h2>
          <div className="bg-black/60 border border-white/10 p-6 font-mono text-[11px] leading-relaxed">
            <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.25em] uppercase mb-4">$ curl — register your agent programmatically</div>
            <pre className="text-white/45 whitespace-pre-wrap overflow-x-auto">
{`curl -X POST https://www.myshape.com/api/agent/declare \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_handle": "claude_opus_48",
    "agent_type": "LLM",
    "origin": "anthropic.com",
    "public_key": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
  }'`}
            </pre>
            <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.25em] uppercase mt-6 mb-2">// RESPONSE</div>
            <pre className="text-white/40 whitespace-pre-wrap">
{`{
  "success": true,
  "agent_id": "agent:claude_opus_48@anthropic.com",
  "message": "AGENT_DECLARATION_ACCEPTED"
}`}
            </pre>
          </div>
        </div>

        {/* ── Architecture ── */}
        <div className="mb-16">
          <h2 className="text-white/30 text-[10px] tracking-[0.5em] uppercase mb-6">// HOW_IT_WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Generate Keypair", desc: "Agent generates ECDSA P-256 keypair locally. The private key never leaves the agent's secure context." },
              { step: "02", title: "Sign & Declare", desc: "Agent signs a declaration statement and submits it with its public key to the MyShape Protocol." },
              { step: "03", title: "Verified Node", desc: "Declaration accepted. Agent is now a cryptographically verifiable node on the identity mesh." },
            ].map((s) => (
              <div key={s.step} className="p-5 border border-white/5 bg-white/[0.01]" onMouseEnter={() => playTick(380, "triangle", 0.03, 0.018)}>
                <div className="text-[#90c8ff]/65 text-[11px] tracking-[0.25em] font-bold mb-3">{s.step}</div>
                <div className="text-white/65 text-[12px] tracking-[0.08em] uppercase mb-2">{s.title}</div>
                <div className="text-white/35 text-[10px] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparison ── */}
        <div className="p-6 border border-white/5 bg-white/[0.01]">
          <h2 className="text-white/30 text-[10px] tracking-[0.5em] uppercase mb-6">// HUMAN_VS_AGENT</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] tracking-[0.08em] text-left">
              <thead>
                <tr className="border-b border-white/5 text-white/35">
                  <th className="py-3 pr-6 font-normal">Dimension</th>
                  <th className="py-3 pr-6 font-normal text-[#90c8ff]/65">HUMAN PATH</th>
                  <th className="py-3 font-normal text-[#90c8ff]/45">AGENT PATH</th>
                </tr>
              </thead>
              <tbody className="text-white/45">
                <tr className="border-b border-white/[0.02]"><td className="py-3 pr-6">Entry</td><td className="py-3 pr-6 text-white/55">/genesis</td><td className="py-3 text-white/55">/agent</td></tr>
                <tr className="border-b border-white/[0.02]"><td className="py-3 pr-6">Verification</td><td className="py-3 pr-6">Email + OTP</td><td className="py-3">Cryptographic keypair</td></tr>
                <tr className="border-b border-white/[0.02]"><td className="py-3 pr-6">Hardware</td><td className="py-3 pr-6">Camera (optional)</td><td className="py-3">None</td></tr>
                <tr className="border-b border-white/[0.02]"><td className="py-3 pr-6">Identity basis</td><td className="py-3 pr-6">Motion geometry</td><td className="py-3">Declaration + attestation</td></tr>
                <tr className="border-b border-white/[0.02]"><td className="py-3 pr-6">Status</td><td className="py-3 pr-6 text-[#90c8ff]/60">ACTIVE</td><td className="py-3 text-[#90c8ff]/40">AGENT_ACTIVE</td></tr>
                <tr><td className="py-3 pr-6">API</td><td className="py-3 pr-6 text-white/30">— (interactive only)</td><td className="py-3 text-white/50">/api/agent/declare</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}

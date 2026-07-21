"use client";

import React, { useCallback, useEffect, useState } from "react";
import HeroVisual from "@/components/hero/HeroVisual";
import ParticleEngine from "@/components/animations/ParticleEngine";
import GenesisBadge from "@/components/genesis-badge/GenesisBadge";
import { playTick } from "@/utils/useAudioTick";
import "./identity.css";

function makeGenesisId() {
  const t = Date.now().toString(16).toUpperCase();
  const r = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `GNS_${t.slice(-6)}_${r}`;
}

export default function IdentityClient() {
  const [clientReady, setClientReady] = useState(false);
  const [isFormed, setIsFormed] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorHint, setErrorHint] = useState("");
  const [genesisId, setGenesisId] = useState("GNS_------_--------");

  useEffect(() => {
    setGenesisId(makeGenesisId());
  }, []);
  const [isSovereign, setIsGenesisUser] = useState(false);

  useEffect(() => {
    const isGenesis = sessionStorage.getItem("sovereign_enrolled") === "1";
    setIsGenesisUser(isGenesis);
    const savedEmail = sessionStorage.getItem("sovereign_email") || "";
    // Wallet-derived keys are not real emails — don't pre-fill
    if (savedEmail && !savedEmail.startsWith("wallet:")) {
      setEmail(savedEmail);
    }
    // If user already completed genesis, skip directly to success — no re-submit needed
    if (isGenesis) {
      setStatus("success");
    }
    setClientReady(true);
  }, []);

  const identityState =
    !isFormed ? "GENESIS_LOCKING"
    : status === "submitting" ? "GENESIS_WRITING"
    : status === "success" ? "GENESIS_ESTABLISHED"
    : status === "error" ? "UPLINK_INTERRUPTED"
    : "AWAITING_UPLINK";

  const handleCollapseComplete = useCallback(() => setIsFormed(true), []);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorHint("");
    setStatus("submitting");

    window.dispatchEvent(new Event("particle-contract"));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("particle-recolor", { detail: { color: "160, 225, 255" } }));
    }, 400);
    setTimeout(() => {
      window.dispatchEvent(new Event("particle-expand"));
      window.dispatchEvent(new Event("speed-up"));
    }, 700);

    try {
      const response = await fetch("/api/uplink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), node_handle: genesisId }),
      });
      const result = await response.json().catch(() => ({ error: "PARSE_FAILED" }));
      if (!response.ok) throw new Error(result.error || "UPLINK_REJECTED");
      sessionStorage.setItem("sovereign_enrolled", "1");
      setIsGenesisUser(true);
      setStatus("success");
      window.dispatchEvent(new Event("speed-down"));
    } catch (err: unknown) {
      window.dispatchEvent(new Event("speed-down"));
      window.dispatchEvent(new Event("particle-expand"));
      window.dispatchEvent(new CustomEvent("particle-recolor", { detail: { color: "128, 191, 255" } }));
      setStatus("error");
      setErrorHint((err as Error).message.toUpperCase());
    }
  };

  return (
    <div className="relative w-full min-h-dvh overflow-hidden bg-[#02040a] font-mono">
      <h1 className="sr-only">MyShape Identity — Sovereign Identity Dashboard</h1>

      {/* 星空背景墙 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HeroVisual showCore={false} />
      </div>

      {/* Particle system */}
      {clientReady && (
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{ transform: "translateY(-10%)" }}>
          <ParticleEngine
            onComplete={handleCollapseComplete}
            centerYOffset={0}
            durationMs={3200}
            colorRgb="128, 191, 255"
          />
          {isSovereign && isFormed && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="genesis-core-glow" />
            </div>
          )}
        </div>
      )}

      {/* Genesis badge — 实体背景阻挡粒子穿透 */}
      {isFormed && (
        <div className="absolute left-1/2 -translate-x-1/2 py-3 px-6 transition-all duration-700"
          style={{ zIndex: 50, background: "rgba(2,4,10,0.85)", backdropFilter: "blur(4px)", borderRadius: "6px", top: status !== "idle" ? "64%" : "76%" }}>
          <GenesisBadge />
        </div>
      )}

      {/* Bottom identity panel */}
      <div className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none"
        style={{ height: "min(380px, 60vh)", background: "linear-gradient(to top, rgba(2,4,10,0.97) 0%, rgba(2,4,10,0.7) 35%, rgba(2,4,10,0.25) 70%, transparent 100%)" }} />

      <section className="absolute inset-x-0 bottom-6 md:bottom-8 z-10 px-3">
        <div className={`mx-auto w-full max-w-sm transition-all duration-700 ${
          isFormed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}>
          <div className="relative overflow-hidden rounded-md font-mono">
            <div className={`pointer-events-none absolute -inset-[1px] rounded-md border transition-all duration-500 ${
              status === "submitting" ? "border-[#90c8ff]/60 shadow-[0_0_20px_rgba(144,200,255,0.3)] animate-pulse"
              : status === "success" ? "border-[#90c8ff]/40 shadow-[0_0_12px_rgba(144,200,255,0.2)]"
              : "border-[#90c8ff]/20"
            }`} />
            <div className="relative rounded-md border border-[#90c8ff]/20 bg-transparent p-2.5 md:p-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[#90c8ff]/60 shadow-[0_0_18px_rgba(144,200,255,0.55)] identity-scan" />

              {/* Telemetry Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] tracking-[0.7em] uppercase text-white/55">
                  GENESIS_TELEMETRY
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    status === "success" ? "bg-[#90c8ff] shadow-[0_0_12px_rgba(144,200,255,0.9)]" : "bg-[#90c8ff]/70 identity-pulse"
                  }`} />
                  <span className="text-[11px] tracking-[0.5em] uppercase text-white/45"
                    style={status === "success" ? { textShadow: "0 0 8px rgba(144,200,255,0.4)" } : {}}>
                    {identityState}
                  </span>
                </div>
              </div>

              {/* Telemetry Data */}
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px] tracking-[0.28em] uppercase">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">GENESIS_SECTOR</span>
                  <span className="text-[#90c8ff]/90">IDENTITY_LAYER</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/40">SECTOR_KEY</span>
                  <span className="text-[#90c8ff]/90">{genesisId}</span>
                </div>
              </div>

              <div className="mt-2.5 h-px w-full bg-gradient-to-r from-transparent via-[#90c8ff]/25 to-transparent" />

              {/* Email Form */}
              <form onSubmit={submitEmail} className="mt-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status !== "idle") setStatus("idle"); }}
                    placeholder="EMAIL@ADDRESS.IO"
                    className="w-full bg-transparent border border-[#90c8ff]/25 text-white/90 text-center md:text-left text-[11px] tracking-[0.25em] py-2 px-4 outline-none focus:border-[#90c8ff]/80"
                    type="email" required
                    disabled={status === "submitting" || status === "success"}
                  />
                  <button type="submit" disabled={status === "submitting" || status === "success"}
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                    className="relative overflow-hidden border border-white/50 text-white py-2 px-6 text-[11px] tracking-[0.36em] uppercase hover:bg-white hover:text-black transition-colors">
                    <span className="relative z-10">
                      {status === "success" ? "GENESIS_COMPLETE" : status === "submitting" ? "UPLINKING..." : "COMMENCE_UPLINK"}
                    </span>
                  </button>
                </div>

                {errorHint && (
                  <p className="mt-4 text-[11px] tracking-[0.35em] uppercase text-red-300/80 text-center animate-pulse">
                    {`> ${errorHint}`}
                  </p>
                )}
                {status === "success" && (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <p className="text-[11px] tracking-[0.35em] uppercase text-[#90c8ff]/70 text-center">
                      NODE_REGISTERED. AUTH_STATE_UPDATED.
                    </p>
                    {isSovereign && (
                      <p className="text-[11px] tracking-[0.3em] uppercase text-[#90c8ff]/60 text-center animate-pulse"
                        style={{ textShadow: "0 0 8px rgba(144,200,255,0.5)" }}>
                        ◈ GENESIS_NODE — FOUNDING_IDENTITY
                      </p>
                    )}
                    <a href="/"
                      onMouseEnter={() => { playTick(800, "sine", 0.10, 0.025); window.dispatchEvent(new CustomEvent("protocol:particle-resonance")); }}
                      className="group relative inline-flex items-center gap-3 px-8 py-2.5 border border-[#90c8ff]/30 text-[#90c8ff]/60 font-mono text-[11px] tracking-[0.35em] uppercase hover:border-[#90c8ff]/60 hover:text-[#90c8ff] transition-all duration-500"
                      style={{ textShadow: "0 0 6px rgba(144,200,255,0.2)" }}>
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{ background: "radial-gradient(ellipse at center, rgba(144,200,255,0.08) 0%, transparent 70%)" }} />
                      <span className="relative z-10">◈&nbsp;RETURN_TO_ORIGIN</span>
                      <span className="relative z-10 text-[#90c8ff]/40 group-hover:text-[#90c8ff] group-hover:translate-x-0.5 transition-all duration-500">→</span>
                    </a>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const BG_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "developer", label: "Developer / Engineer" },
  { value: "researcher", label: "Researcher / Academic" },
  { value: "designer", label: "Designer / UX" },
  { value: "community", label: "Community Builder" },
  { value: "crypto", label: "Crypto / Web3 Native" },
  { value: "other", label: "Other" },
];

function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("ref") || "direct";

  const [email, setEmail] = useState("");
  const [technicalBg, setTechnicalBg] = useState("");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [result, setResult] = useState<{
    cohort?: string;
    position?: string;
    position_number?: number;
    genesis_slots_remaining?: number;
    already_applied?: boolean;
    error?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setStatus("submitting");
    playTick(600, "sine", 0.08, 0.02);

    try {
      const res = await fetch("/api/recruitment/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          technical_bg: technicalBg,
          handle: handle.trim(),
          source,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        setStatus("done");
        playTick(800, "sine", 0.10, 0.025);

        // Redirect to motion-demo after a short pause
        setTimeout(() => {
          router.push("/motion-demo");
        }, 2500);
      } else {
        setResult({ error: data.error || "Submission failed" });
        setStatus("error");
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
      setStatus("error");
    }
  };

  const isGenesis = result.cohort === "genesis";

  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono min-h-screen">
      <ProtocolHeader />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">Protocol_Recruitment // Founding_Testers</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.12em] text-white uppercase">
            Shape the <span style={{ color: "rgba(144,200,255,0.7)" }}>Protocol</span>
          </h1>
          <p className="text-white/40 text-[13px] leading-relaxed max-w-lg">
            We are recruiting the first 300 participants to calibrate the
            motion-signature verification engine. First 50 applicants receive
            <span style={{ color: "rgba(144,200,255,0.7)" }}> Genesis Cohort</span> status — a permanent protocol-level identity anchor.
          </p>
        </div>

        {/* Status: done */}
        {status === "done" && (
          <div className="border p-6 space-y-4 mb-8" style={{ borderColor: isGenesis ? "rgba(34,211,238,0.3)" : "rgba(144,200,255,0.15)", borderRadius: 4, background: isGenesis ? "rgba(34,211,238,0.03)" : "transparent" }}>
            <div className="text-center space-y-3">
              <div className={`text-xl ${isGenesis ? "text-cyan-300" : "text-white/50"}`}>
                {isGenesis ? "◈ Genesis Cohort — Confirmed" : "✓ Application Received"}
              </div>
              <p className="text-white/35 text-[12px] leading-relaxed">
                {isGenesis
                  ? `You are founding tester #${result.position_number}. This status is permanent — not cosmetic, structural.`
                  : `You are applicant #${result.position_number}. Genesis slots are filled, but you are part of the public calibration cohort.`}
              </p>
              {isGenesis && (
                <div className="inline-block px-3 py-1 border border-cyan-400/20 bg-cyan-400/[0.04] text-cyan-400/60 text-[9px] tracking-[0.15em] uppercase rounded-sm">
                  {result.genesis_slots_remaining} genesis slots remaining
                </div>
              )}
              <p className="text-white/20 text-[10px]">Redirecting to Motion Demo...</p>
            </div>
          </div>
        )}

        {/* Status: error */}
        {status === "error" && (
          <div className="border border-red-400/20 bg-red-400/[0.03] p-4 mb-8 text-red-300/60 text-[11px]" style={{ borderRadius: 4 }}>
            {result.error || "Submission failed. Please try again."}
          </div>
        )}

        {/* Form */}
        {status !== "done" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-white/25 text-[9px] tracking-[0.15em] uppercase mb-2">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-white/70 text-[13px] outline-none focus:border-cyan-400/30 transition-colors placeholder:text-white/10"
                style={{ borderRadius: 3 }}
                disabled={status === "submitting"}
              />
            </div>

            {/* Technical Background */}
            <div>
              <label className="block text-white/25 text-[9px] tracking-[0.15em] uppercase mb-2">Technical Background</label>
              <select
                value={technicalBg}
                onChange={(e) => setTechnicalBg(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-white/50 text-[13px] outline-none focus:border-cyan-400/30 transition-colors"
                style={{ borderRadius: 3, appearance: "none" }}
                disabled={status === "submitting"}
              >
                {BG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#02040a] text-white/50">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Handle */}
            <div>
              <label className="block text-white/25 text-[9px] tracking-[0.15em] uppercase mb-2">
                Social Platform (optional)
              </label>
              <input
                type="text"
                placeholder="Bluesky / Discord / Farcaster — anything you like"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-4 py-3 text-white/70 text-[13px] outline-none focus:border-cyan-400/30 transition-colors placeholder:text-white/10"
                style={{ borderRadius: 3 }}
                disabled={status === "submitting"}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting" || !email.trim()}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="w-full py-3.5 border text-[11px] tracking-[0.3em] uppercase transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                borderRadius: 3,
                borderColor: "rgba(34,211,238,0.6)",
                color: "rgba(34,211,238,0.9)",
                background: "rgba(34,211,238,0.06)",
                boxShadow: "0 0 16px rgba(34,211,238,0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(34,211,238,0.15)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(34,211,238,0.25)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(34,211,238,0.06)";
                e.currentTarget.style.color = "rgba(34,211,238,0.9)";
                e.currentTarget.style.boxShadow = "0 0 16px rgba(34,211,238,0.1)";
              }}
            >
              {status === "submitting" ? "Submitting..." : "Apply for Early Access"}
            </button>

            <p className="text-white/15 text-[9px] text-center tracking-[0.05em]">
              First 50 applicants receive Genesis Cohort status.
              After submitting, you will be redirected to the Motion Demo.
            </p>
          </form>
        )}
      </div>

      <ProtocolFooter />
    </div>
  );
}

export default function ApplyClient() {
  return (
    <Suspense fallback={
      <div className="bg-[#02040a] min-h-screen flex items-center justify-center">
        <div className="text-cyan-400/30 text-[11px] tracking-[0.3em] uppercase animate-pulse">Loading...</div>
      </div>
    }>
      <ApplyForm />
    </Suspense>
  );
}

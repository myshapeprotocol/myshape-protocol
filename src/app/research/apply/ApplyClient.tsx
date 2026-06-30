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
  const [countdown, setCountdown] = useState(5);

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
        setCountdown(5);

        // 持久化到 sessionStorage，Dashboard 读取
        if (typeof window !== "undefined") {
          sessionStorage.setItem("witness_cohort", data.cohort || "");
          sessionStorage.setItem("witness_number", String(data.position_number || ""));
          sessionStorage.setItem("witness_slots_remaining", String(data.genesis_slots_remaining || 0));
        }

        // Countdown + redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push("/motion-demo");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
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
        {/* Edge warning */}
        {typeof window !== "undefined" && /Edg\//.test(window.navigator.userAgent) && (
          <div className="px-4 py-3 border border-amber-400/30 bg-amber-400/[0.06] text-center mb-6" style={{ borderRadius: 4 }}>
            <p className="text-amber-300/80 text-[11px] leading-relaxed">
              Edge does not support the motion capture demo.
            </p>
            <p className="text-white/30 text-[9px] mt-1">
              Please open this page in <span className="text-white/50">Chrome</span> or <span className="text-white/50">Firefox</span> for the full experience.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">Continuity Research Program</div>
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.12em] text-white uppercase">
            Genesis <span style={{ color: "rgba(144,200,255,0.7)" }}>100</span>
          </h1>
          <p className="text-white/50 text-[15px] leading-relaxed max-w-lg">
            We are not looking for users.
          </p>
          <p className="text-white/35 text-[13px] leading-relaxed max-w-lg">
            We are looking for the first 100 people who believe that
            <span style={{ color: "rgba(144,200,255,0.7)" }}> digital continuity should be verifiable</span>.
          </p>
        </div>

        {/* ── Research Question ── */}
        <div className="border p-6 mb-8 space-y-3" style={{ borderColor: "rgba(144,200,255,0.15)", borderRadius: 4, background: "rgba(144,200,255,0.02)" }}>
          <div className="text-cyan-400/40 text-[9px] tracking-[0.3em] uppercase">Research Question</div>
          <p className="text-white/60 text-[14px] font-light leading-relaxed">
            We are studying a fundamental question:
          </p>
          <p className="text-white/80 text-[16px] font-light tracking-[0.03em]" style={{ textShadow: "0 0 20px rgba(144,200,255,0.2)" }}>
            Can digital continuity be verified?
          </p>
        </div>

        {/* ── What We Collect ── */}
        <div className="border p-6 mb-8 space-y-4" style={{ borderColor: "rgba(144,200,255,0.1)", borderRadius: 4, background: "transparent" }}>
          <div className="text-white/25 text-[9px] tracking-[0.3em] uppercase">Privacy Protocol</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
            <div className="space-y-2">
              <div className="text-cyan-400/60 text-[9px] tracking-[0.15em] uppercase">What We Collect</div>
              <ul className="text-white/40 space-y-1">
                <li>✓ Motion signal (joint positions)</li>
                <li>✓ Presence receipt (entropy proof)</li>
                <li>✓ Device type & lighting conditions</li>
                <li>✓ Session timestamps</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-amber-400/50 text-[9px] tracking-[0.15em] uppercase">What We Never Collect</div>
              <ul className="text-white/30 space-y-1">
                <li>✗ Raw camera images or video</li>
                <li>✗ Facial data or biometrics</li>
                <li>✗ Personal identity documents</li>
                <li>✗ IP address or location</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Three Phases ── */}
        <div className="border p-6 mb-8 space-y-5" style={{ borderColor: "rgba(144,200,255,0.1)", borderRadius: 4, background: "transparent" }}>
          <div className="text-white/25 text-[9px] tracking-[0.3em] uppercase">Research Roadmap</div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 flex items-center justify-center border shrink-0" style={{ borderColor: "rgba(34,211,238,0.4)", borderRadius: 2, background: "rgba(34,211,238,0.06)" }}>
                <span className="text-cyan-400 text-[11px] font-mono">I</span>
              </div>
              <div>
                <div className="text-white/60 text-[12px] font-light">Founding Cohort <span className="text-cyan-400/60 text-[10px]">— 100 participants</span></div>
                <p className="text-white/25 text-[10px] leading-relaxed mt-1">Validate multi-device, multi-session, longitudinal presence stability. You come back. Your data proves continuity.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 flex items-center justify-center border shrink-0" style={{ borderColor: "rgba(144,200,255,0.2)", borderRadius: 2, background: "rgba(144,200,255,0.03)" }}>
                <span className="text-cyan-400/50 text-[11px] font-mono">II</span>
              </div>
              <div>
                <div className="text-white/40 text-[12px] font-light">Research Network <span className="text-white/20 text-[10px]">— 1,000 participants</span></div>
                <p className="text-white/20 text-[10px] leading-relaxed mt-1">Validate across age, geography, lighting, device, and behavior diversity.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 flex items-center justify-center border shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)", borderRadius: 2, background: "rgba(255,255,255,0.01)" }}>
                <span className="text-white/25 text-[11px] font-mono">III</span>
              </div>
              <div>
                <div className="text-white/30 text-[12px] font-light">Open Protocol <span className="text-white/15 text-[10px]">— 10,000+ participants</span></div>
                <p className="text-white/15 text-[10px] leading-relaxed mt-1">Continuity at scale.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status: done */}
        {status === "done" && (
          <div className="border p-6 space-y-5 mb-8" style={{ borderColor: isGenesis ? "rgba(34,211,238,0.3)" : "rgba(144,200,255,0.15)", borderRadius: 4, background: isGenesis ? "rgba(34,211,238,0.03)" : "transparent" }}>
            <div className="text-center space-y-4">

              {/* ── 勋章 ── */}
              <div className="flex justify-center" style={{ perspective: 800 }}>
                <div className="relative" style={{ width: 160, height: 200, animation: "genesisBadgePulse 3s ease-in-out infinite" }}>
                  <svg viewBox="0 0 160 200" width="160" height="200" style={{ filter: isGenesis ? "drop-shadow(0 0 16px rgba(212,175,55,0.4))" : "drop-shadow(0 0 6px rgba(255,255,255,0.08))" }}>
                    {/* 外圈齿轮边 */}
                    <circle cx="80" cy="72" r="54" fill="none" stroke={isGenesis ? "url(#goldGrad)" : "rgba(255,255,255,0.12)"} strokeWidth="1.5" strokeDasharray="4 2.5" />
                    {/* 外圈实线 */}
                    <circle cx="80" cy="72" r="48" fill="none" stroke={isGenesis ? "url(#goldGrad)" : "rgba(255,255,255,0.18)"} strokeWidth="2" />
                    {/* 内圈 */}
                    <circle cx="80" cy="72" r="38" fill={isGenesis ? "rgba(20,16,8,0.9)" : "rgba(255,255,255,0.02)"} stroke={isGenesis ? "url(#goldGradInner)" : "rgba(255,255,255,0.1)"} strokeWidth="1" />
                    {/* 文字 */}
                    <text x="80" y="64" textAnchor="middle" fill={isGenesis ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.2)"} fontSize="5" fontFamily="monospace" letterSpacing="3">PIONEER</text>
                    <text x="80" y="84" textAnchor="middle" fill={isGenesis ? "rgba(212,175,55,0.95)" : "rgba(255,255,255,0.25)"} fontSize="22" fontFamily="monospace" fontWeight="300" style={{ textShadow: isGenesis ? "0 0 12px rgba(212,175,55,0.6)" : "none" }}>#{result.position_number}</text>
                    {/* 星标 */}
                    {isGenesis && (
                      <>
                        <polygon points="80,26 82,32 88,32 83,36 85,42 80,38 75,42 77,36 72,32 78,32" fill="rgba(212,175,55,0.7)" />
                        <polygon points="80,112 82,106 88,106 83,102 85,96 80,100 75,96 77,102 72,106 78,106" fill="rgba(212,175,55,0.25)" />
                      </>
                    )}
                    {/* 渐变定义 */}
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(212,175,55,0.9)" />
                        <stop offset="50%" stopColor="rgba(180,140,40,0.3)" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0.9)" />
                      </linearGradient>
                      <linearGradient id="goldGradInner" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(180,140,40,0.5)" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0.5)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* 绶带 */}
                  {isGenesis && (
                    <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ bottom: 4 }}>
                      <div className="text-amber-400/40 text-[8px] tracking-[0.25em] uppercase font-mono">Genesis</div>
                      <div className="text-amber-300/30 text-[7px] tracking-[0.15em] font-mono">Founding Tester</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 标题 ── */}
              <div className={`text-xl font-light tracking-[0.05em] ${isGenesis ? "text-amber-200" : "text-white/50"}`} style={isGenesis ? { textShadow: "0 0 24px rgba(212,175,55,0.5)" } : undefined}>
                {isGenesis ? "◈ Early Presence Pioneer — Confirmed" : "✓ Application Received"}
              </div>

              <p className="text-white/35 text-[12px] leading-relaxed max-w-sm mx-auto">
                {isGenesis
                  ? `You are Early Presence Pioneer #${result.position_number}. This status is permanent — not cosmetic, structural. You are part of the first 100 helping to answer whether digital continuity can be made verifiable.`
                  : `You are research participant #${result.position_number}. Genesis slots may be filled, but you are still part of the calibration cohort.`}
              </p>

              {isGenesis && (
                <div className="inline-block px-3 py-1 border border-amber-400/20 bg-amber-400/[0.04] text-amber-300/60 text-[9px] tracking-[0.15em] uppercase rounded-sm">
                  {result.genesis_slots_remaining} genesis slots remaining
                </div>
              )}

              <p>
                <span className="text-cyan-300/90 text-[16px] font-light tracking-[0.05em]" style={{ textShadow: "0 0 18px rgba(34,211,238,0.5)", animation: "genesisBadgePulse 0.8s ease-in-out infinite" }}>
                  Redirecting in {countdown}s...
                </span>
                <br /><span className="text-white/40 text-[11px]">Complete a 30s motion capture to contribute your first presence receipt</span>
              </p>
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
                How did you find us? (optional)
              </label>
              <input
                type="text"
                placeholder="X / Discord / HN / Friend / Other"
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
              {status === "submitting" ? "Submitting..." : "Become an Early Presence Pioneer"}
            </button>

            <p className="text-white/15 text-[9px] text-center tracking-[0.05em]">
              First 50 receive Genesis Cohort status — a permanent protocol-level identity anchor.
              After applying, complete a 30-second motion capture to contribute to the research.
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

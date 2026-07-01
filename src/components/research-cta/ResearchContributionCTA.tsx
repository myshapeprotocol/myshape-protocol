"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

interface ResearchStats {
  session_count: number;
  sessions_needed: number;
  meets_threshold: boolean;
  progress_pct: number;
  latest_session_at: string | null;
}

const ICE = "rgba(144,200,255,";

export default function ResearchContributionCTA() {
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    fetch("/api/research/stats")
      .then(r => r.json())
      .then(data => { setStats(data); if (data.session_count > 0 || !data.meets_threshold) setVisible(true); })
      .catch(() => setVisible(true));
    const interval = setInterval(() => { fetch("/api/research/stats").then(r => r.json()).then(setStats).catch(() => {}); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const count = stats?.session_count ?? 0;
  const progressPct = stats?.progress_pct ?? 0;
  const meetsThreshold = stats?.meets_threshold ?? false;
  const needed = stats?.sessions_needed ?? 300;
  const dotTotal = 20;
  const dotFilled = Math.round((progressPct / 100) * dotTotal);

  return (
    <section className="relative py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/research/apply"
          onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
          className="block group">

          <div className="relative overflow-hidden transition-all duration-700 p-6 md:p-8"
            style={{
              border: `1px solid ${hover ? ICE}0.35)` : ICE}0.10)`,
              clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              background: `radial-gradient(ellipse at 80% 20%, ${ICE}0.04) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, ${ICE}0.02) 0%, transparent 50%)`,
              boxShadow: hover ? `0 12px 32px -8px ${ICE}0.12)` : "none",
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {/* Subtle dot grid bg */}
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: `radial-gradient(circle, ${ICE}0.6) 0.4px, transparent 0.4px)`, backgroundSize: "14px 14px" }} />

            {/* Corner glow accents */}
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-gradient-to-r from-[#90c8ff]/25 to-transparent" />
            <div className="absolute top-0 left-0 w-[1px] h-8 bg-gradient-to-b from-[#90c8ff]/25 to-transparent" />
            <div className="absolute bottom-0 right-0 w-8 h-[1px] bg-gradient-to-l from-[#90c8ff]/25 to-transparent" />
            <div className="absolute bottom-0 right-0 w-[1px] h-8 bg-gradient-to-t from-[#90c8ff]/25 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
              {/* ── Left: content ── */}
              <div className="flex-1 space-y-4">
                {/* Label */}
                <div className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${meetsThreshold ? "bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.5)]" : "bg-[#90c8ff]/50 shadow-[0_0_6px_rgba(144,200,255,0.3)]"}`} />
                  <span className="text-white/20 text-[9px] tracking-[0.3em] uppercase font-mono">
                    {meetsThreshold ? "CALIBRATION_READY" : "RESEARCH_PROTOCOL_ACTIVE"}
                  </span>
                  {count > 0 && (
                    <span className="text-[#90c8ff]/35 text-[9px] font-mono tracking-[0.1em]">
                      +{count}
                    </span>
                  )}
                </div>

                {/* Headline */}
                <h3 className="text-white/55 text-[17px] md:text-[19px] font-light tracking-[0.02em] leading-relaxed group-hover:text-white/80 transition-colors duration-500">
                  Help calibrate the{" "}
                  <span style={{ color: "rgba(144,200,255,0.75)" }}>motion-signature engine</span>.
                </h3>
                <p className="text-white/25 text-[13px] font-light leading-relaxed max-w-lg group-hover:text-white/40 transition-colors duration-500">
                  Anonymous. 30 seconds. Your movement data teaches the engine to
                  distinguish real human kinetics from synthetic motion.
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 pt-1 text-[#90c8ff]/30 group-hover:text-[#90c8ff]/65 group-hover:gap-3 transition-all duration-500">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-mono">Apply for Early Access →</span>
                  <span className="text-[8px] text-white/10 font-mono">/research/apply</span>
                </div>
              </div>

              {/* ── Right: calibration meter ── */}
              {!meetsThreshold && (
                <div className="flex flex-col items-center gap-3 shrink-0">
                  {/* Dot matrix progress */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: dotTotal }).map((_, i) => (
                      <span key={i}
                        className={`w-2 h-2 rounded-sm transition-all duration-700 ${
                          i < dotFilled
                            ? "bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.3)]"
                            : "bg-white/[0.04]"
                        } ${i === dotFilled - 1 ? "animate-pulse" : ""}`}
                      />
                    ))}
                  </div>
                  {/* Label */}
                  <div className="text-center">
                    <span className="text-[#90c8ff]/35 text-[10px] font-mono tracking-[0.08em]">
                      {progressPct}%
                    </span>
                    <span className="text-white/10 text-[9px] font-mono tracking-[0.06em] block">
                      {needed} to go
                    </span>
                  </div>
                </div>
              )}

              {meetsThreshold && (
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-[#90c8ff]/20 animate-ping" style={{ animationDuration: "3s" }} />
                    <div className="relative w-3 h-3 rounded-full bg-[#90c8ff]/70 shadow-[0_0_12px_rgba(144,200,255,0.4)]" />
                  </div>
                  <span className="text-[#90c8ff]/40 text-[9px] font-mono tracking-[0.1em] uppercase">Ready</span>
                </div>
              )}
            </div>

            {/* Animated data stream line — right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-px opacity-20 group-hover:opacity-40 transition-opacity duration-700"
              style={{ background: `linear-gradient(to bottom, transparent, ${ICE}0.5), transparent, ${ICE}0.3), transparent)` }} />
          </div>
        </Link>
      </div>
    </section>
  );
}

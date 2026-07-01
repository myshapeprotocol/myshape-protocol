"use client";

/**
 * ResearchContributionCTA — Ambient, brand-compliant research call-to-action.
 *
 * Route A: Drives traffic to /motion-demo for anonymous motion data collection.
 * Shows a live counter of research contributions (fetched from /api/research/stats)
 * and a subtle progress bar toward the 300-session calibration threshold.
 *
 * Visual: ethereal, low-profile — fits seamlessly in the Protocol Stack aesthetic.
 */

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

export default function ResearchContributionCTA() {
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fetch stats
    fetch("/api/research/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        // Only show if there's activity or we're actively collecting
        if (data.session_count > 0 || !data.meets_threshold) {
          setVisible(true);
        }
      })
      .catch(() => {
        // Stats unavailable — show a minimal version
        setVisible(true);
      });

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetch("/api/research/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const count = stats?.session_count ?? 0;
  const progressPct = stats?.progress_pct ?? 0;
  const meetsThreshold = stats?.meets_threshold ?? false;

  return (
    <section className="relative py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/research/apply"
          onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
          className="block group"
        >
          <div
            className="relative overflow-hidden transition-all duration-700 p-6 md:p-8 group-hover:shadow-[0_12px_32px_-8px_rgba(144,200,255,0.12)]"
            style={{
              border: "1px solid rgba(144,200,255,0.10)",
              clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
              background: "radial-gradient(ellipse at 70% 30%, rgba(144,200,255,0.03) 0%, transparent 60%)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.10)"; }}
          >
            {/* Top label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{
                    background: meetsThreshold ? "rgba(144,200,255,0.8)" : "rgba(144,200,255,0.5)",
                    boxShadow: meetsThreshold ? "0 0 8px rgba(144,200,255,0.5)" : "0 0 6px rgba(144,200,255,0.3)",
                  }}
                />
                <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase font-mono">
                  {meetsThreshold ? "CALIBRATION_READY" : "RESEARCH_PROTOCOL_ACTIVE"}
                </span>
              </div>
              {/* Live counter */}
              {count > 0 && (
                <span className="text-[#90c8ff]/40 text-[9px] font-mono tracking-[0.1em] ml-auto">
                  {count} <span className="text-white/15">contributions</span>
                </span>
              )}
            </div>

            {/* Message */}
            <h3
              className="text-white/45 text-[15px] md:text-[17px] font-light tracking-[0.03em] leading-relaxed mb-3 group-hover:text-white/70 transition-colors duration-500"
            >
              Help calibrate the{" "}
              <span style={{ color: "rgba(144,200,255,0.7)" }}>motion-signature engine</span>.
            </h3>
            <p className="text-white/20 text-[12px] font-light leading-relaxed max-w-lg mb-5 group-hover:text-white/35 transition-colors duration-500">
              Anonymous. 30 seconds. Your movement data teaches the engine to
              distinguish real human kinetics from synthetic motion — making the
              protocol stronger for everyone.
            </p>

            {/* Progress bar toward 300 */}
            {!meetsThreshold && (
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[7px] tracking-[0.1em] font-mono">
                  <span className="text-white/15">
                    CALIBRATION THRESHOLD
                  </span>
                  <span className="text-[#90c8ff]/30">
                    {progressPct}% — {stats?.sessions_needed ?? 300} to go
                  </span>
                </div>
                <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${progressPct}%`,
                      background: "linear-gradient(90deg, rgba(144,200,255,0.3), rgba(144,200,255,0.6))",
                      boxShadow: "0 0 8px rgba(144,200,255,0.2)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* CTA line */}
            <div className="flex items-center gap-2 text-[#90c8ff]/30 group-hover:text-[#90c8ff]/60 group-hover:gap-3 transition-all duration-500">
              <span className="text-[9px] tracking-[0.2em] uppercase font-mono">
                Apply for Early Access →
              </span>
              <span className="text-[8px] text-white/10 font-mono">
                /research/apply
              </span>
            </div>

            {/* Subtle corner accent */}
            <div
              className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-700"
              style={{
                background:
                  "radial-gradient(ellipse at 100% 0%, rgba(144,200,255,0.08) 0%, transparent 70%)",
              }}
            />
          </div>
        </Link>
      </div>
    </section>
  );
}

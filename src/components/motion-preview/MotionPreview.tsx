"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

export default function MotionPreview({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const elapsed = (now - start) / 1000;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.38;

      ctx.clearRect(0, 0, W, H);
      const scanProgress = (elapsed % 4) / 4;
      const simScore = 0.4 + Math.sin(elapsed * 0.5) * 0.2 + scanProgress * 0.3;

      // Outer ring (track)
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 2; ctx.stroke();

      // Tick marks
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
        const len = i % 6 === 0 ? 10 : 5;
        const inner = r - len - 2;
        const outer = r - 2;
        const lit = scanProgress > i / 36;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.strokeStyle = lit ? (i % 6 === 0 ? "rgba(0,229,255,0.7)" : "rgba(0,229,255,0.4)") : "rgba(255,255,255,0.05)";
        ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.8;
        ctx.stroke();
      }

      // Progress arc
      const endAngle = -Math.PI / 2 + scanProgress * Math.PI * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
      ctx.strokeStyle = simScore > 0.5 ? "rgba(52,211,153,0.7)" : "rgba(0,229,255,0.6)";
      ctx.lineWidth = 2.5; ctx.stroke();

      // Glow arc
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
      ctx.strokeStyle = simScore > 0.5 ? "rgba(52,211,153,0.12)" : "rgba(0,229,255,0.1)";
      ctx.lineWidth = 12; ctx.stroke();

      setScore(Math.min(simScore, 1));
      setPhase(Math.floor(scanProgress * 5) + 1);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "clamp(2rem, 3vw, 2.5rem) clamp(1.5rem, 3vw, 2.5rem)",
      border: "1px solid rgba(0,229,255,0.06)", background: "rgba(5,16,37,0.6)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle scan line overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.006) 2px, rgba(0,229,255,0.006) 4px)", zIndex: 1 }} />

      {/* Top status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "1rem", position: "relative", zIndex: 2 }}>
        <span style={{ fontSize: 9, color: "rgba(0,229,255,0.3)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          PRESENCE ENTROPY SCORE
        </span>
        <span style={{ fontSize: 9, color: "rgba(0,229,255,0.25)", fontFamily: "var(--font-geist-mono), monospace" }}>
          PHASE {phase}/5
        </span>
      </div>

      {/* Main gauge row */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(1rem, 2.5vw, 2.5rem)", position: "relative", zIndex: 2, flexWrap: "wrap", justifyContent: "center" }}>

        {/* Ring gauge */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <canvas ref={canvasRef} width={170} height={170} style={{ width: 150, height: 150 }} />
          {/* Center score */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 200, color: "#fff", fontFamily: "var(--font-geist-mono), monospace", lineHeight: 1 }}>
              {(score * 100).toFixed(0)}
            </span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.15em", marginTop: 2 }}>PES</span>
          </div>
        </div>

        {/* Side data panel */}
        <div style={{ minWidth: 160 }}>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: score > 0.5 ? "#34D399" : "#f56565", boxShadow: score > 0.5 ? "0 0 8px #34D399" : "0 0 8px #f56565" }} />
            <span style={{ fontSize: 10, color: score > 0.5 ? "#34D399" : "#f56565", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em" }}>
              {score > 0.7 ? "HUMAN SIGNAL" : score > 0.4 ? "PROCESSING" : "LOW ENTROPY"}
            </span>
          </div>

          {/* Mini data rows */}
          {[
            ["SCAN TIME", "30s"],
            ["SENSOR", "Camera"],
            ["PRIVACY", "Local Only"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(0,229,255,0.04)", marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em" }}>{k}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono), monospace" }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontWeight: 300, margin: 0, lineHeight: 1.5, maxWidth: 180 }}>
              No face stored. Nothing uploaded. Your motion is the key.
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link href="/motion-demo" style={{
          padding: "10px 22px", border: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.5)",
          fontSize: "10px", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em",
          textTransform: "uppercase", textDecoration: "none", flexShrink: 0,
          transition: "all 0.3s", background: "rgba(0,229,255,0.03)", borderRadius: 6,
          alignSelf: "center",
        }}
          onMouseEnter={(e) => { playTick(700, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.5)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(0,229,255,0.08)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(0,229,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.2)"; e.currentTarget.style.color = "rgba(0,229,255,0.5)"; e.currentTarget.style.background = "rgba(0,229,255,0.03)"; e.currentTarget.style.boxShadow = "none"; }}>
          Try It →
        </Link>
      </div>
    </div>
  );
}

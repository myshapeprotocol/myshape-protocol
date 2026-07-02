"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

/**
 * Simulated PES scan preview — auto-plays a looping demo animation.
 * No camera required. Designed as a homepage teaser for /motion-demo.
 */
export default function MotionPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(0);

  // Simulated PES ring animation
  useEffect(() => {
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
      const r = Math.min(W, H) * 0.3;

      ctx.clearRect(0, 0, W, H);

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Animated arc — simulates a scan in progress
      const scanProgress = (elapsed % 4) / 4; // 4s loop
      const endAngle = -Math.PI / 2 + scanProgress * Math.PI * 2;
      const simScore = 0.4 + Math.sin(elapsed * 0.5) * 0.2 + scanProgress * 0.3;

      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
      ctx.strokeStyle = simScore > 0.5
        ? "rgba(52,211,153,0.6)"
        : "rgba(144,200,255,0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
      ctx.strokeStyle = simScore > 0.5
        ? "rgba(52,211,153,0.15)"
        : "rgba(144,200,255,0.1)";
      ctx.lineWidth = 8;
      ctx.stroke();

      // Center score
      setScore(Math.min(simScore, 1));
      setPhase(Math.floor(scanProgress * 5) + 1);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex items-center gap-6 px-5 py-4 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]">
      {/* Mini PES ring */}
      <canvas ref={canvasRef} width={80} height={80} className="w-16 h-16 shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[#90c8ff]/50 text-[8px] tracking-[0.25em] uppercase mb-1">
          Motion Preview — Phase {phase}/5
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-white/70 font-mono text-lg">
            {(score * 100).toFixed(0)}
          </span>
          <span className="text-white/20 text-[10px]">PES</span>
        </div>
        <p className="text-white/20 text-[9px] leading-relaxed max-w-xs">
          30-second scan. No face stored. Nothing uploaded.
          Your motion is the key.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/motion-demo"
        onMouseEnter={() => playTick(800, "sine", 0.08, 0.02)}
        className="shrink-0 px-4 py-2 border border-[#90c8ff]/25 text-[#90c8ff]/60 text-[9px] tracking-[0.15em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all whitespace-nowrap"
      >
        Try It →
      </Link>
    </div>
  );
}

"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const QUESTIONS = [
  { q: "Can independent teams reproduce our benchmark results — on their own hardware?", t: "Reproducibility" },
  { q: "What's the minimum sensor quality needed for reliable continuity verification?", t: "Hardware Floor" },
  { q: "How does continuity verification scale across millions of entities?", t: "Scale" },
  { q: "What attack vectors haven't we found yet?", t: "Security" },
];

export default function OpenQuestions() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  /* ── intersection ─────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.4) { setVisible(true); obs.disconnect(); }
      },
      { threshold: [0, 0.3, 0.5, 0.7] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── sonar canvas ─────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const draw = () => {
      const r = container.getBoundingClientRect();
      const w = r.width;
      const h = r.height;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;
      const t = performance.now() / 1000;
      const sweepAngle = (t * 0.5) % (Math.PI * 2);

      /* ── radar disc background ────────────────────── */
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(5,16,37,0.5)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,229,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      /* ── concentric rings ─────────────────────────── */
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / 5) * i, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,229,255,${0.04 + i * 0.015})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 12]);
        ctx.lineDashOffset = -t * 8;
        ctx.stroke();
      }
      ctx.setLineDash([]);

      /* ── crosshairs ───────────────────────────────── */
      for (const a of [0, Math.PI / 2]) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * maxR * 0.3, cy + Math.sin(a) * maxR * 0.3);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.moveTo(cx - Math.cos(a) * maxR * 0.3, cy - Math.sin(a) * maxR * 0.3);
        ctx.lineTo(cx - Math.cos(a) * maxR, cy - Math.sin(a) * maxR);
        ctx.strokeStyle = "rgba(0,229,255,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      /* ── sweep trail ──────────────────────────────── */
      const trailLen = 0.5;
      for (let a = sweepAngle - trailLen; a < sweepAngle; a += 0.015) {
        const alpha = ((a - (sweepAngle - trailLen)) / trailLen) * 0.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      /* ── sweep line ───────────────────────────────── */
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      const grad = ctx.createLinearGradient(cx, cy,
        cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      grad.addColorStop(0, "rgba(0,229,255,0.7)");
      grad.addColorStop(0.6, "rgba(0,229,255,0.15)");
      grad.addColorStop(1, "rgba(0,229,255,0.02)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      /* ── orbit dots at 4 question positions ────────── */
      const angles = [Math.PI * 0.75, Math.PI * 0.25, Math.PI * 1.25, Math.PI * 1.75];
      for (let i = 0; i < 4; i++) {
        const a = angles[i];
        const ox = cx + Math.cos(a) * maxR * 0.78;
        const oy = cy + Math.sin(a) * maxR * 0.78;
        const pulse = Math.sin(t * 1.8 + i) * 0.5 + 0.5;

        /* glow ring */
        ctx.beginPath();
        ctx.arc(ox, oy, 8 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${0.04 + pulse * 0.06})`;
        ctx.fill();

        /* dot */
        ctx.beginPath();
        ctx.arc(ox, oy, 2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${0.3 + pulse * 0.5})`;
        ctx.fill();

        /* connecting line from center */
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12);
        ctx.lineTo(ox, oy);
        ctx.strokeStyle = `rgba(0,229,255,${0.04 + pulse * 0.06})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 6]);
        ctx.lineDashOffset = -t * 5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      /* ── center dot ───────────────────────────────── */
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,229,255,0.4)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,229,255,0.03)";
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => { /* canvas resizes in draw loop */ };
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [visible]);

  return (
    <section style={{
      padding: "clamp(4rem, 7vw, 7rem) clamp(1rem, 4vw, 2rem)",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      position: "relative",
      borderTop: "1px solid rgba(0,229,255,0.06)",
    }}>
      <div style={{ maxWidth: "68rem", margin: "0 auto" }}>

        {/* ── header ─────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "clamp(2.5rem, 4vw, 3.5rem)" }}>
          <div style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)", textTransform: "uppercase",
            letterSpacing: "0.5em", marginBottom: 12,
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Open Questions
          </div>
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 200,
            letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0,
          }}>
            What we <span style={{ color: "rgba(0,229,255,0.8)" }}>still don&apos;t know</span>
          </h2>
          <p style={{
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)", fontWeight: 300,
            color: "rgba(255,255,255,0.4)", marginTop: "0.8rem", lineHeight: 1.6,
          }}>
            The questions above have answers. These don&apos;t — yet.
          </p>
        </div>

        {/* ── sonar + questions grid ─────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(1rem, 3vw, 2.5rem)",
          flexWrap: "wrap",
        }}>
          {/* left column: questions 0 + 2 */}
          <div className="hidden md:flex" style={{ flexDirection: "column", gap: "clamp(2rem, 4vw, 3rem)", width: 220 }}>
            {[0, 2].map((i) => (
              <QuestionCard key={i} item={QUESTIONS[i]} side="left" />
            ))}
          </div>

          {/* radar */}
          <div ref={containerRef} style={{
            position: "relative",
            width: "clamp(280px, 38vw, 400px)",
            height: "clamp(280px, 38vw, 400px)",
            flexShrink: 0,
          }}>
            <canvas ref={canvasRef} style={{
              position: "absolute", inset: 0,
            }} />
          </div>

          {/* right column: questions 1 + 3 */}
          <div className="hidden md:flex" style={{ flexDirection: "column", gap: "clamp(2rem, 4vw, 3rem)", width: 220 }}>
            {[1, 3].map((i) => (
              <QuestionCard key={i} item={QUESTIONS[i]} side="right" />
            ))}
          </div>

          {/* mobile: stacked below radar */}
          <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            {QUESTIONS.map((item, i) => (
              <QuestionCard key={i} item={item} side="left" />
            ))}
          </div>
        </div>

        {/* ── links ───────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 20,
          marginTop: "clamp(2rem, 3vw, 2.5rem)",
        }}>
          <Link href="/research" style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)",
            fontFamily: "var(--font-geist-mono), monospace",
            textDecoration: "none", borderBottom: "1px solid rgba(0,229,255,0.08)",
          }}
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}>
            Research Hub →
          </Link>
          <Link href="/lab" style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)",
            fontFamily: "var(--font-geist-mono), monospace",
            textDecoration: "none", borderBottom: "1px solid rgba(0,229,255,0.08)",
          }}
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}>
            The Continuity Lab →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Question Card ──────────────────────────────────── */
function QuestionCard({ item, side }: { item: { q: string; t: string }; side: "left" | "right" }) {
  const align = side === "right" ? "flex-start" : "flex-end";
  const textAlign = side === "right" ? "left" : "right";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: align,
    }}>
      {/* tag */}
      <span style={{
        fontSize: 9, color: "rgba(0,229,255,0.3)",
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.15em", textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {item.t}
      </span>
      {/* question */}
      <p style={{
        fontSize: "clamp(0.78rem, 0.95vw, 0.85rem)",
        color: "rgba(255,255,255,0.42)", fontWeight: 300,
        lineHeight: 1.55, margin: 0, textAlign,
      }}>
        {item.q}
      </p>
    </div>
  );
}

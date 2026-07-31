"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";

const SURFACE = "rgba(5,16,37,0.45)";

const STAGES = [
  { label: "Signals", sub: "IMU · Camera · Logs", detail: "Any source. Engine-independent." },
  { label: "Engine", sub: "EE-001 → EE-00N", detail: "Pluggable. 4 engines today." },
  { label: "Receipt", sub: "CPS-0001 · Ed25519", detail: "Signed, hash-chained proof." },
  { label: "Verify", sub: "V₁–V₇ · In-Browser", detail: "Seven checks. No trust needed." },
  { label: "Decision", sub: "PASS · FAIL · ESCALATE", detail: "Policy-driven. Reproducible." },
];

export default function Vision() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chamberRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

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

  /* ── draw flow pipes + particles ──────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const r = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = r.width, h = r.height;
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

    /* collect chamber exit/entry points */
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < STAGES.length; i++) {
      const el = chamberRefs.current[i];
      if (!el) return;
      const er = el.getBoundingClientRect();
      pts[i] = {
        x: er.left - r.left + er.width / 2,
        y: er.top - r.top + er.height / 2,
      };
    }
    if (pts.length < STAGES.length) return;

    const t = performance.now() / 1000;

    /* draw pipes between chambers */
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = pts[i].x + 90;   // right edge of chamber i
      const x2 = pts[i + 1].x - 90; // left edge of chamber i+1
      const y = pts[i].y;
      const hot = hovered === i || hovered === i + 1;

      /* pipe */
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = hot ? "rgba(0,229,255,0.25)" : "rgba(0,229,255,0.07)";
      ctx.lineWidth = hot ? 1.5 : 0.8;
      ctx.setLineDash(hot ? [6, 3] : [3, 8]);
      ctx.lineDashOffset = -t * (hot ? 35 : 15);
      ctx.stroke();

      /* particles flowing along pipe */
      const len = x2 - x1;
      const count = hot ? 4 : 2;
      for (let j = 0; j < count; j++) {
        const offset = ((t * 60 + j * (len / count)) % len);
        const px = x1 + offset;
        ctx.beginPath();
        ctx.arc(px, y, hot ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = hot ? "rgba(0,229,255,0.6)" : "rgba(0,229,255,0.2)";
        ctx.fill();
      }
    }

    /* chamber node glow rings */
    for (let i = 0; i < pts.length; i++) {
      const hot = hovered === i;
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, hot ? 50 : 30, 0, Math.PI * 2);
      ctx.fillStyle = hot ? "rgba(0,229,255,0.03)" : "rgba(0,229,255,0.01)";
      ctx.fill();
    }
  }, [hovered]);

  /* ── animation loop ──────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, draw]);

  /* ── resize ───────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const onResize = () => draw();
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", onResize);
    return () => { ro.disconnect(); window.removeEventListener("resize", onResize); };
  }, [visible, draw]);

  return (
    <section style={{
      padding: "clamp(4rem, 7vw, 7rem) clamp(1rem, 4vw, 2rem)",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      position: "relative",
    }}>
      <style>{`
        @keyframes chamberPulse {
          0%,100% { box-shadow: 0 0 0px rgba(0,229,255,0); }
          50%     { box-shadow: 0 0 24px rgba(0,229,255,0.1); }
        }
      `}</style>

      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* ── header ─────────────────────────────────── */}
        <div style={{ marginBottom: "clamp(2.5rem, 4vw, 3.5rem)", maxWidth: 600 }}>
          <div style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)", textTransform: "uppercase",
            letterSpacing: "0.5em", marginBottom: 12,
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            How It Works
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 200,
            color: "rgba(255,255,255,0.85)", lineHeight: 1.1, margin: "0 0 0.5rem 0",
          }}>
            From signals <span style={{ color: "rgba(0,229,255,0.8)" }}>to trust</span>
          </h2>
          <p style={{
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)", fontWeight: 300,
            color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0,
          }}>
            Five stages. Engine-independent at every step. Any signal, any algorithm — one receipt format.
          </p>
        </div>

        {/* ── refinery pipeline ──────────────────────── */}
        <div ref={containerRef} style={{ position: "relative", padding: "clamp(1rem, 2vw, 2rem) 0" }}>
          <canvas ref={canvasRef} style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          }} />

          {/* chambers row */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(0.5rem, 1.5vw, 1.5rem)",
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}>
            {STAGES.map((stage, i) => (
              <div
                key={stage.label}
                ref={(el) => { chamberRefs.current[i] = el; }}
                onMouseEnter={() => { playTick(600 + i * 80, "sine", 0.08, 0.02); setHovered(i); }}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: "clamp(140px, 16vw, 180px)",
                  padding: "clamp(1rem, 1.8vw, 1.5rem) clamp(0.8rem, 1.2vw, 1rem)",
                  border: `1px solid ${hovered === i ? "rgba(0,229,255,0.3)" : "rgba(0,229,255,0.08)"}`,
                  borderRadius: 16,
                  background: hovered === i
                    ? "radial-gradient(circle at 50% 30%, rgba(0,229,255,0.08) 0%, rgba(5,16,37,0.5) 70%)"
                    : SURFACE,
                  textAlign: "center",
                  cursor: "default",
                  transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                  transform: hovered === i ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: hovered === i
                    ? "0 0 40px rgba(0,229,255,0.12), 0 12px 28px -8px rgba(0,0,0,0.4)"
                    : "none",
                  opacity: hovered !== null && hovered !== i ? 0.5 : 1,
                  position: "relative",
                }}
              >
                {/* stage number ring */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: `2px solid ${hovered === i ? "rgba(0,229,255,0.35)" : "rgba(0,229,255,0.12)"}`,
                  margin: "0 auto 0.8rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "border-color 0.4s",
                  background: hovered === i ? "rgba(0,229,255,0.06)" : "transparent",
                  animation: hovered === i ? "chamberPulse 2s ease-in-out infinite" : "none",
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: hovered === i ? "#00E5FF" : "rgba(0,229,255,0.4)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    transition: "color 0.4s",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* label */}
                <div style={{
                  fontSize: "clamp(0.9rem, 1.2vw, 1rem)", fontWeight: 400,
                  color: hovered === i ? "#fff" : "rgba(255,255,255,0.7)",
                  marginBottom: 4, transition: "color 0.4s",
                }}>
                  {stage.label}
                </div>

                {/* sub */}
                <div style={{
                  fontSize: 10, color: "rgba(0,229,255,0.4)",
                  fontFamily: "var(--font-geist-mono), monospace",
                  marginBottom: 6, letterSpacing: "0.04em",
                }}>
                  {stage.sub}
                </div>

                {/* detail */}
                <div style={{
                  fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
                  lineHeight: 1.5, fontWeight: 300,
                }}>
                  {stage.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

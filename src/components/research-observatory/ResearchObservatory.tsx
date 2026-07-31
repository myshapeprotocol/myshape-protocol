"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";

/* ── Shared surface tone ──────────────────────────────── */
const SURFACE = "rgba(5,16,37,0.45)";
const SURFACE_HOVER = "radial-gradient(circle at 30% 20%, rgba(0,229,255,0.07) 0%, rgba(5,16,37,0.7) 60%)";

/* ── Data ─────────────────────────────────────────────── */
interface RNode {
  q: string;
  l: string;
  m: string;
}

const NODES: RNode[] = [
  {
    q: "Can AI generate a face? Yes. A voice? Yes. But can it generate biological entropy?",
    l: "THE GAP",
    m: "381 experiments // 4-dimensional entropy scoring",
  },
  {
    q: "If two sensors see the same physical event, do their signals agree?",
    l: "CAUSAL COUPLING",
    m: "Cross-modal binding // N: 316",
  },
  {
    q: "What happens when we send a randomized gyroscope challenge — something a recording can't predict?",
    l: "CHALLENGE RESPONSE",
    m: "Jittered timing defeats replay // N: 200",
  },
  {
    q: "Can we chain these checks into a single verification session — passive first, then escalating?",
    l: "VERIFICATION SESSION",
    m: "Dual-engine pipeline // N: 60",
  },
  {
    q: "After verification, what remains? A yes? A no? Or evidence — signed, timestamped, hash-chained?",
    l: "CONTINUITY PROOF",
    m: "Evidence Receipt // SHA-256 chained",
  },
];

/* ── Constellation edges (which nodes connect) ────────── */
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 4],
  [0, 3],
  [1, 2],
];

/* ── Frequency bar configs — one set per card ─────────── */
const FREQ: { baseH: number; delay: number; dur: number }[][] = NODES.map(() =>
  Array.from({ length: 9 }, (_, j) => ({
    baseH: 6 + Math.abs(Math.sin(j * 1.4)) * 10 + (j % 3) * 3,
    delay: j * 0.13,
    dur: 1.3 + (j % 3) * 0.5,
  })),
);

/* ═══════════════════════════════════════════════════════
   Signal Card
   ═══════════════════════════════════════════════════════ */
function freqBars(
  bars: { baseH: number; delay: number; dur: number }[],
  isActive: boolean,
  height: number,
) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "flex-end",
        justifyContent: "center",
        height,
      }}
    >
      {bars.map((bar, j) => (
        <div
          key={j}
          style={{
            width: 3,
            height: bar.baseH,
            borderRadius: "1px 1px 0 0",
            background: isActive
              ? "rgba(0,229,255,0.55)"
              : "rgba(0,229,255,0.18)",
            transformOrigin: "bottom",
            animation: `freqAnim ${bar.dur}s ease-in-out infinite`,
            animationDelay: `${bar.delay}s`,
            transition: "background 0.45s",
          }}
        />
      ))}
    </div>
  );
}

const SignalCard = ({
  node,
  idx,
  bars,
  isActive,
  isDimmed,
  onEnter,
  onLeave,
  cardRef,
  wide = false,
}: {
  node: RNode;
  idx: number;
  bars: { baseH: number; delay: number; dur: number }[];
  isActive: boolean;
  isDimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  wide?: boolean;
}) => {
  const padding = wide ? "clamp(0.9rem, 1.5vw, 1.3rem)" : "clamp(1.2rem, 2vw, 1.8rem)";

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => {
        playTick(600, "sine", 0.08, 0.02);
        onEnter();
      }}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        padding,
        border: `1px solid ${isActive ? "rgba(0,229,255,0.25)" : "rgba(0,229,255,0.07)"}`,
        background: isActive ? SURFACE_HOVER : SURFACE,
        transition: "all 0.45s cubic-bezier(0.16,1,0.3,1)",
        transform: isActive ? "translateY(-4px)" : "translateY(0)",
        opacity: isDimmed ? 0.45 : 1,
        boxShadow: isActive
          ? "0 0 60px rgba(0,229,255,0.1), 0 8px 32px -8px rgba(0,229,255,0.1)"
          : "none",
        cursor: "default",
      }}
    >
      {/* corner brackets */}
      <span style={{ position: "absolute", top: -1, left: -1, width: 14, height: 1, background: "#00E5FF", opacity: isActive ? 0.55 : 0.18, transition: "opacity 0.45s" }} />
      <span style={{ position: "absolute", top: -1, left: -1, width: 1, height: 14, background: "#00E5FF", opacity: isActive ? 0.55 : 0.18, transition: "opacity 0.45s" }} />
      <span style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 1, background: "#00E5FF", opacity: isActive ? 0.55 : 0.18, transition: "opacity 0.45s" }} />
      <span style={{ position: "absolute", bottom: -1, right: -1, width: 1, height: 14, background: "#00E5FF", opacity: isActive ? 0.55 : 0.18, transition: "opacity 0.45s" }} />

      {wide ? (
        /* ── horizontal layout ──────────────────── */
        <div style={{ display: "flex", gap: "clamp(1rem, 2vw, 1.8rem)", alignItems: "center" }}>
          {/* left: freq bars + number */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            {bars.map((bar, j) => (
              <div
                key={j}
                style={{
                  width: 3,
                  height: bar.baseH * 0.8,
                  borderRadius: "1px 1px 0 0",
                  background: isActive ? "rgba(0,229,255,0.55)" : "rgba(0,229,255,0.18)",
                  transformOrigin: "bottom",
                  animation: `freqAnim ${bar.dur}s ease-in-out infinite`,
                  animationDelay: `${bar.delay}s`,
                  transition: "background 0.45s",
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: "rgba(0,229,255,0.5)", fontFamily: "var(--font-geist-mono), monospace", marginLeft: 4 }}>
              {String(idx + 1).padStart(2, "0")}
            </span>
          </div>
          {/* center: label + question */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, color: isActive ? "rgba(0,229,255,0.65)" : "rgba(0,229,255,0.35)",
              fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.12em", marginBottom: 3,
              textShadow: isActive ? "0 0 8px rgba(0,229,255,0.3)" : "none", transition: "color 0.45s",
            }}>
              {node.l}
            </div>
            <div style={{ fontSize: "clamp(0.8rem, 1.05vw, 0.88rem)", color: "rgba(255,255,255,0.55)", fontWeight: 300, lineHeight: 1.5 }}>
              {node.q}
            </div>
          </div>
          {/* right: metadata */}
          <div style={{
            fontSize: 10, color: isActive ? "rgba(0,229,255,0.35)" : "rgba(0,229,255,0.22)",
            fontFamily: "var(--font-geist-mono), monospace", flexShrink: 0, textAlign: "right",
            transition: "color 0.45s",
          }}>
            {node.m}
          </div>
        </div>
      ) : (
        /* ── vertical layout ────────────────────── */
        <>
          {freqBars(bars, isActive, 28)}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "rgba(0,229,255,0.5)", fontFamily: "var(--font-geist-mono), monospace" }}>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span style={{
              fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.12em",
              color: isActive ? "rgba(0,229,255,0.65)" : "rgba(0,229,255,0.35)",
              textShadow: isActive ? "0 0 8px rgba(0,229,255,0.3)" : "none", transition: "color 0.45s",
            }}>
              {node.l}
            </span>
          </div>
          <div style={{ fontSize: "clamp(0.82rem, 1.1vw, 0.9rem)", color: "rgba(255,255,255,0.55)", fontWeight: 300, lineHeight: 1.55, marginBottom: 10 }}>
            {node.q}
          </div>
          <div style={{
            fontSize: 10, fontFamily: "var(--font-geist-mono), monospace",
            color: isActive ? "rgba(0,229,255,0.35)" : "rgba(0,229,255,0.22)", transition: "color 0.45s",
          }}>
            {node.m}
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Research Observatory — main export
   ═══════════════════════════════════════════════════════ */
export default function ResearchObservatory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  /* ── intersection observer ────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.5) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: [0, 0.3, 0.5, 0.7] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── draw constellation lines ─────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const r = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    /* collect card centers */
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < NODES.length; i++) {
      const c = cards.current[i];
      if (!c) return;
      const cr = c.getBoundingClientRect();
      pts[i] = {
        x: cr.left - r.left + cr.width / 2,
        y: cr.top - r.top + cr.height / 2,
      };
    }

    const t = performance.now() / 1000;

    /* edges */
    for (const [a, b] of EDGES) {
      if (!pts[a] || !pts[b]) continue;
      const hot = hovered === a || hovered === b;

      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);

      if (hot) {
        ctx.strokeStyle = "rgba(0,229,255,0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -t * 25;
      } else {
        ctx.strokeStyle = "rgba(0,229,255,0.07)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 10]);
        ctx.lineDashOffset = -t * 10;
      }
      ctx.stroke();
    }

    /* node dots at card edges */
    for (let i = 0; i < NODES.length; i++) {
      if (!pts[i]) continue;
      const hot = hovered === i;
      if (hot) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,229,255,0.05)";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, hot ? 3.5 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = hot ? "rgba(0,229,255,0.7)" : "rgba(0,229,255,0.2)";
      ctx.fill();
    }
  }, [hovered]);

  /* ── animation loop ──────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, draw]);

  /* ── resize observer ─────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", draw);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [visible, draw]);

  /* ── render ───────────────────────────────────────── */
  return (
    <section style={{ padding: "clamp(5rem, 8vw, 8rem) 1rem", position: "relative" }}>
      <style>{`
        @keyframes freqAnim {
          0%,100% { transform: scaleY(0.25); }
          50%     { transform: scaleY(2.2); }
        }
        @keyframes corePulse {
          0%,100% { box-shadow: 0 0 6px rgba(0,229,255,0.08); transform: scale(1); }
          50%     { box-shadow: 0 0 28px rgba(0,229,255,0.22), 0 0 60px rgba(0,229,255,0.06); transform: scale(1.35); }
        }
        @keyframes scanSweep {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 0.15; }
          90%  { opacity: 0.15; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      <div style={{ maxWidth: "68rem", margin: "0 auto" }}>
        {/* ── header ─────────────────────────────────── */}
        <div style={{ marginBottom: "clamp(3rem, 5vw, 4.5rem)", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(0,229,255,0.3)", textTransform: "uppercase", letterSpacing: "0.5em", marginBottom: 12, fontFamily: "var(--font-geist-mono), monospace" }}>
            Research
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            The <span style={{ color: "rgba(0,229,255,0.8)" }}>Continuity</span> Problem
          </h2>
          <p style={{ fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", marginTop: "1rem", lineHeight: 1.7, maxWidth: 550, marginLeft: "auto", marginRight: "auto" }}>
            AI didn&apos;t break identity. It broke continuity. We can no longer tell whether the same entity is still here.
          </p>
        </div>

        {/* ── constellation (desktop) ────────────────── */}
        <div ref={containerRef} className="hidden md:block" style={{ position: "relative", padding: "clamp(0.5rem,2vw,2rem) 0" }}>
          {/* scan line */}
          {visible && (
            <div style={{
              position: "absolute", left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent)",
              pointerEvents: "none", zIndex: 5,
              animation: "scanSweep 6s linear infinite",
            }} />
          )}

          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />

          {/* 3-col × 3-row constellation grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 1fr",
            gridTemplateRows: "auto auto auto",
            gap: "clamp(1.5rem, 3vw, 2.5rem)",
            position: "relative",
            zIndex: 1,
          }}>
            {/* row 0 */}
            <SignalCard node={NODES[0]} idx={0} bars={FREQ[0]} isActive={hovered === 0} isDimmed={hovered !== null && hovered !== 0} onEnter={() => setHovered(0)} onLeave={() => setHovered(null)} cardRef={(el) => { cards.current[0] = el; }} />
            <div />
            <SignalCard node={NODES[1]} idx={1} bars={FREQ[1]} isActive={hovered === 1} isDimmed={hovered !== null && hovered !== 1} onEnter={() => setHovered(1)} onLeave={() => setHovered(null)} cardRef={(el) => { cards.current[1] = el; }} />

            {/* row 1 */}
            <SignalCard node={NODES[2]} idx={2} bars={FREQ[2]} isActive={hovered === 2} isDimmed={hovered !== null && hovered !== 2} onEnter={() => setHovered(2)} onLeave={() => setHovered(null)} cardRef={(el) => { cards.current[2] = el; }} />
            {/* central core */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "1px solid rgba(0,229,255,0.12)",
                background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)",
                animation: "corePulse 3.5s ease-in-out infinite",
                position: "relative",
              }}>
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "rgba(0,229,255,0.4)", boxShadow: "0 0 6px rgba(0,229,255,0.3)" }} />
              </div>
            </div>
            <SignalCard node={NODES[3]} idx={3} bars={FREQ[3]} isActive={hovered === 3} isDimmed={hovered !== null && hovered !== 3} onEnter={() => setHovered(3)} onLeave={() => setHovered(null)} cardRef={(el) => { cards.current[3] = el; }} />

            {/* row 2: wide horizontal card */}
            <div style={{ gridColumn: "1 / 4", maxWidth: "44rem", justifySelf: "center", width: "100%" }}>
              <SignalCard node={NODES[4]} idx={4} bars={FREQ[4]} isActive={hovered === 4} isDimmed={hovered !== null && hovered !== 4} onEnter={() => setHovered(4)} onLeave={() => setHovered(null)} cardRef={(el) => { cards.current[4] = el; }} wide />
            </div>
          </div>

          {/* bottom hint */}
          <div style={{ textAlign: "center", marginTop: "clamp(1.5rem, 2.5vw, 2rem)" }}>
            <span style={{ fontSize: 10, color: "rgba(0,229,255,0.2)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.15em" }}>
              HOVER TO ISOLATE SIGNAL
            </span>
          </div>
        </div>

        {/* ── mobile: vertical timeline ───────────────── */}
        <div className="md:hidden" style={{ position: "relative", paddingLeft: 24 }}>
          <div style={{
            position: "absolute", left: 6, top: 0, bottom: 0, width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.15) 15%, rgba(0,229,255,0.15) 85%, transparent)",
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {NODES.map((node, i) => (
              <div key={node.l} style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: -19, top: 18, width: 7, height: 7, borderRadius: "50%",
                  background: "rgba(0,229,255,0.25)", border: "1px solid rgba(0,229,255,0.15)",
                }} />
                <div style={{ padding: "1rem 1.2rem", border: "1px solid rgba(0,229,255,0.07)", background: SURFACE }}>
                  {freqBars(FREQ[i].slice(0, 7), false, 18)}
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "rgba(0,229,255,0.4)", fontFamily: "var(--font-geist-mono), monospace" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: 10, color: "rgba(0,229,255,0.35)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em" }}>{node.l}</span>
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.5)", fontWeight: 300, lineHeight: 1.55, marginBottom: 6 }}>{node.q}</div>
                  <div style={{ fontSize: 10, color: "rgba(0,229,255,0.2)", fontFamily: "var(--font-geist-mono), monospace" }}>{node.m}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

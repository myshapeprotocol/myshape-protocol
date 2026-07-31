"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";

/* ── Shared surface tone — keep all cards in sync ──────── */
const SURFACE = "rgba(5,16,37,0.45)";
const SURFACE_HOVER = "radial-gradient(circle at 30% 20%, rgba(0,229,255,0.06) 0%, rgba(5,16,37,0.65) 60%)";

/* ── Verification stages ─────────────────────────────── */
const V_STAGES = [
  { id: "V₁", label: "Signature", detail: "Ed25519 valid" },
  { id: "V₂", label: "Timestamp", detail: "Not expired" },
  { id: "V₃", label: "Entropy", detail: "PES ≥ 0.5" },
  { id: "V₄", label: "Binding", detail: "Cross-modal" },
  { id: "V₅", label: "Challenge", detail: "Nonce valid" },
  { id: "V₆", label: "Chain", detail: "SHA-256 linked" },
  { id: "V₇", label: "Threshold", detail: "5/7 passed" },
];

/* ── Timing constants ─────────────────────────────────── */
const DELAY = {
  statusBar: 400,
  npmCmd: 900,
  npmRes: 2000,
  verifyCmd: 2600,
  stagesStart: 3400,
  stageGap: 180,
  passLine: 4900,
  ctas: 5300,
};

export default function TerminalEntry() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [stagesShown, setStagesShown] = useState(0);
  const [npmText, setNpmText] = useState("");
  const [verifyText, setVerifyText] = useState("");
  const ref = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── intersection ─────────────────────────────────── */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio > 0.5) { setVisible(true); obs.disconnect(); }
      },
      { threshold: [0, 0.3, 0.5, 0.7] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* ── animation sequence ───────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const t = (cb: () => void, ms: number) => {
      const id = setTimeout(cb, ms);
      timers.current.push(id);
      return id;
    };

    t(() => setPhase(1), DELAY.statusBar);
    t(() => setPhase(2), DELAY.npmCmd);
    t(() => setNpmText("npm install @thecontinuitylab/myshape"), DELAY.npmCmd + 100);
    t(() => setPhase(3), DELAY.npmRes);
    t(() => setPhase(4), DELAY.verifyCmd);
    t(() => setVerifyText("verifyContinuity(sample)"), DELAY.verifyCmd + 100);
    t(() => setPhase(5), DELAY.stagesStart);
    for (let i = 0; i < V_STAGES.length; i++) {
      t(() => setStagesShown(i + 1), DELAY.stagesStart + i * DELAY.stageGap);
    }
    t(() => setPhase(6), DELAY.passLine);
    t(() => setPhase(7), DELAY.ctas);

    return () => timers.current.forEach(clearTimeout);
  }, [visible]);

  /* ── circuit canvas ───────────────────────────────── */
  const drawCircuits = useCallback(() => {
    const canvas = canvasRef.current;
    const container = consoleRef.current;
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

    /* ── find key positions ─────────────────────────── */
    // Verify command row (approximate: ~35% down from top)
    const cmdY = h * 0.48;

    // Collect stage tile centers
    const stageCenters: { x: number; y: number }[] = [];
    for (let i = 0; i < stageRefs.current.length; i++) {
      const el = stageRefs.current[i];
      if (!el) continue;
      const er = el.getBoundingClientRect();
      stageCenters[i] = {
        x: er.left - r.left + er.width / 2,
        y: er.top - r.top + er.height / 2,
      };
    }

    if (stageCenters.length < V_STAGES.length) return;

    const t = performance.now() / 1000;

    /* ── source point: right end of verify command ──── */
    const srcX = w * 0.18;
    const srcY = cmdY;

    /* ── sink point: pass result ────────────────────── */
    const passY = stageCenters[6].y + 50;
    const passX = w * 0.18;

    /* ── horizontal trunk from source ────────────────── */
    const trunkY = srcY;
    const trunkEnd = stageCenters[6].x + 60;

    // Draw trunk line
    ctx.beginPath();
    ctx.moveTo(srcX, trunkY);
    ctx.lineTo(trunkEnd, trunkY);
    ctx.strokeStyle = "rgba(0,229,255,0.12)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);
    ctx.stroke();

    /* ── vertical drops to each stage + branches ─────── */
    for (let i = 0; i < stageCenters.length; i++) {
      const sc = stageCenters[i];
      const active = i < stagesShown;

      // Drop line: trunk → stage
      ctx.beginPath();
      ctx.moveTo(sc.x, trunkY);
      ctx.lineTo(sc.x, sc.y);
      ctx.strokeStyle = active ? "rgba(52,211,153,0.3)" : "rgba(0,229,255,0.06)";
      ctx.lineWidth = active ? 1 : 0.4;
      ctx.setLineDash(active ? [4, 3] : [2, 6]);
      ctx.lineDashOffset = active ? -t * 20 : -t * 8;
      ctx.stroke();

      // Tiny dot at junction
      if (active) {
        ctx.beginPath();
        ctx.arc(sc.x, trunkY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52,211,153,0.5)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sc.x, trunkY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52,211,153,0.06)";
        ctx.fill();
      }
    }

    /* ── converge to pass result ─────────────────────── */
    if (stagesShown >= V_STAGES.length) {
      // Collect lines from last row stages down to pass
      for (let i = 0; i < stageCenters.length; i++) {
        const sc = stageCenters[i];
        ctx.beginPath();
        ctx.moveTo(sc.x, sc.y + 14);
        ctx.lineTo(passX, passY);
        ctx.strokeStyle = "rgba(52,211,153,0.15)";
        ctx.lineWidth = 0.4;
        ctx.setLineDash([2, 8]);
        ctx.lineDashOffset = -t * 12;
        ctx.stroke();
      }

      // Glow at convergence
      const passGlow = Math.sin(t * 2) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(passX, passY, 8 + passGlow * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52,211,153,${0.06 + passGlow * 0.06})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(passX, passY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(52,211,153,0.5)";
      ctx.fill();
    }

    /* ── source dot ─────────────────────────────────── */
    ctx.beginPath();
    ctx.arc(srcX, srcY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,229,255,0.5)";
    ctx.fill();
  }, [stagesShown]);

  /* ── circuit animation loop ───────────────────────── */
  useEffect(() => {
    if (!visible || phase < 5) return;
    let raf = 0;
    const loop = () => { drawCircuits(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, phase, drawCircuits]);

  /* ── resize ───────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;
    const onResize = () => drawCircuits();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible, drawCircuits]);

  /* ── helpers ───────────────────────────────────────── */
  const fadeIn = (p: number) => ({
    opacity: phase >= p ? 1 : 0,
    transform: phase >= p ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  });

  return (
    <section ref={ref} style={{
      padding: "clamp(4rem, 7vw, 7rem) clamp(1rem, 4vw, 2rem)",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      position: "relative",
    }}>
      <style>{`
        @keyframes statusBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes passFlash { 0%{color:rgba(52,211,153,0)} 60%{color:rgba(52,211,153,0)} 100%{color:#34D399} }
        @keyframes tileActivate {
          0%   { box-shadow: 0 0 0px rgba(52,211,153,0); }
          40%  { box-shadow: 0 0 14px rgba(52,211,153,0.5), 0 0 24px rgba(52,211,153,0.2); }
          100% { box-shadow: 0 0 4px rgba(52,211,153,0.3); }
        }
        @keyframes consoleGlow {
          0%,100% { box-shadow: 0 0 60px rgba(0,229,255,0.04), inset 0 0 60px rgba(0,229,255,0.015); }
          50%     { box-shadow: 0 0 90px rgba(0,229,255,0.08), inset 0 0 80px rgba(0,229,255,0.03); }
        }
      `}</style>

      <div style={{ maxWidth: "48rem", margin: "0 auto" }}>

        {/* ── section header ─────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "clamp(2rem, 3vw, 2.5rem)" }}>
          <div style={{
            fontSize: 11, color: "rgba(0,229,255,0.3)", textTransform: "uppercase",
            letterSpacing: "0.5em", marginBottom: 12,
            fontFamily: "var(--font-geist-mono), monospace",
          }}>
            Developer
          </div>
          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 200,
            letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0,
          }}>
            One command.<br />
            <span style={{ color: "rgba(0,229,255,0.8)" }}>Continuity verified.</span>
          </h2>
          <p style={{
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)", fontWeight: 300,
            color: "rgba(255,255,255,0.4)", marginTop: "0.8rem", lineHeight: 1.6,
          }}>
            No servers. No accounts. Three lines of code.
          </p>
        </div>

        {/* ── console body ────────────────────────────── */}
        <div
          ref={consoleRef}
          style={{
            position: "relative",
            border: "1px solid rgba(0,229,255,0.12)",
            background: SURFACE,
            animation: visible ? "consoleGlow 4s ease-in-out infinite" : "none",
          }}
        >
          {/* dot grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.025, zIndex: 0,
            backgroundImage: "radial-gradient(circle, #00E5FF 1px, transparent 1px)",
            backgroundSize: "10px 10px",
          }} />

          {/* circuit canvas overlay */}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>

            {/* ══ status bar ═══════════════════════════ */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.6rem 1.2rem",
              borderBottom: "1px solid rgba(0,229,255,0.08)",
              background: "rgba(0,229,255,0.02)",
              fontFamily: "var(--font-geist-mono), monospace", fontSize: 9,
              letterSpacing: "0.1em",
              ...fadeIn(1),
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399", animation: "statusBlink 2s ease-in-out infinite" }} />
                <span style={{ color: "rgba(0,229,255,0.5)", textTransform: "uppercase" }}>CPS-0001</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>●</span>
                <span style={{ color: "rgba(52,211,153,0.6)" }}>ACTIVE</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>ED25519</span>
                <span style={{ color: "rgba(0,229,255,0.3)" }}>●</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>SHA-256</span>
                <span style={{ color: "rgba(0,229,255,0.3)" }}>●</span>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>LOCAL</span>
              </div>
            </div>

            {/* ══ terminal body ════════════════════════ */}
            <div style={{ padding: "clamp(1.2rem, 2.5vw, 2rem) clamp(1.2rem, 2.5vw, 2rem)" }}>

              {/* npm install */}
              <div style={{ marginBottom: 6, ...fadeIn(2) }}>
                <span style={{ color: "rgba(0,229,255,0.3)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.75rem, 1vw, 0.85rem)", marginRight: 8 }}>$</span>
                <span style={{ color: "rgba(0,229,255,0.6)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.75rem, 1vw, 0.85rem)" }}>
                  {npmText}
                  {phase >= 2 && phase < 3 && (
                    <span style={{ animation: "statusBlink 0.6s step-end infinite", color: "rgba(0,229,255,0.8)" }}>▊</span>
                  )}
                </span>
              </div>
              {phase >= 3 && (
                <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.68rem, 0.85vw, 0.75rem)", color: "rgba(255,255,255,0.18)", marginBottom: 16, paddingLeft: 14 }}>
                  added 1 package in 0.8s
                </div>
              )}
              {phase < 3 && <div style={{ marginBottom: 16 }} />}

              {/* verify command */}
              <div style={{ marginBottom: 14, ...fadeIn(4) }}>
                <span style={{ color: "rgba(0,229,255,0.3)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.75rem, 1vw, 0.85rem)", marginRight: 8 }}>$</span>
                <span style={{ color: "rgba(0,229,255,0.6)", fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.75rem, 1vw, 0.85rem)" }}>
                  {verifyText}
                  {phase >= 4 && phase < 5 && (
                    <span style={{ animation: "statusBlink 0.6s step-end infinite", color: "rgba(0,229,255,0.8)" }}>▊</span>
                  )}
                </span>
              </div>

              {/* ══ verification grid ══════════════════ */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: "clamp(0.4rem, 0.8vw, 0.6rem)",
                marginBottom: "clamp(0.8rem, 1.5vw, 1.2rem)",
              }}>
                {V_STAGES.map((stage, i) => {
                  const shown = i < stagesShown;
                  return (
                    <div
                      key={stage.id}
                      ref={(el) => { stageRefs.current[i] = el; }}
                      style={{
                        padding: "clamp(0.4rem, 0.7vw, 0.55rem) clamp(0.5rem, 0.9vw, 0.7rem)",
                        border: `1px solid ${shown ? "rgba(52,211,153,0.25)" : "rgba(0,229,255,0.05)"}`,
                        background: shown ? "rgba(52,211,153,0.05)" : SURFACE,
                        opacity: phase >= 5 ? 1 : 0,
                        transform: phase >= 5 ? "translateY(0)" : "translateY(6px)",
                        transition: "opacity 0.3s ease, transform 0.3s ease, border-color 0.25s ease, background 0.25s ease",
                        display: "flex", alignItems: "center", gap: 8,
                        animation: shown && phase >= 5 ? `tileActivate 1s ease-out` : "none",
                        position: "relative",
                      }}
                    >
                      <span style={{
                        fontSize: 9, fontFamily: "var(--font-geist-mono), monospace",
                        color: shown ? "#34D399" : "rgba(255,255,255,0.15)",
                        fontWeight: shown ? 600 : 400,
                        transition: "color 0.3s",
                        textShadow: shown ? "0 0 6px rgba(52,211,153,0.4)" : "none",
                      }}>
                        {shown ? "✓" : stage.id}
                      </span>
                      <span style={{
                        fontSize: "clamp(0.62rem, 0.75vw, 0.68rem)",
                        color: shown ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        transition: "color 0.3s",
                      }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ══ PASS line ═══════════════════════════ */}
              <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "clamp(0.78rem, 1vw, 0.9rem)", paddingLeft: 4, ...fadeIn(6) }}>
                <span style={{ color: "#34D399", animation: phase >= 6 ? "passFlash 0.6s ease-out" : "none", textShadow: phase >= 6 ? "0 0 10px rgba(52,211,153,0.4)" : "none" }}>
                  ✓ PASS
                </span>
                {" "}
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85em" }}>receipt generated</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTAs ────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
          marginTop: "clamp(1.2rem, 2vw, 1.8rem)",
          ...fadeIn(7),
        }}>
          {[
            { label: "Run Playground", href: "/lab/playground" },
            { label: "Install SDK", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },
            { label: "Read Protocol", href: "/research/notes/008-continuity-protocol-core" },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              padding: "8px 20px", border: "1px solid rgba(0,229,255,0.12)",
              color: "rgba(0,229,255,0.5)", fontSize: 11,
              fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em",
              textDecoration: "none", transition: "all 0.25s",
              background: SURFACE,
            }}
              onMouseEnter={(e) => {
                playTick(650, "sine", 0.08, 0.02);
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.45)";
                e.currentTarget.style.color = "rgba(0,229,255,0.9)";
                e.currentTarget.style.background = SURFACE_HOVER;
                e.currentTarget.style.boxShadow = "0 0 24px rgba(0,229,255,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.12)";
                e.currentTarget.style.color = "rgba(0,229,255,0.5)";
                e.currentTarget.style.background = SURFACE;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

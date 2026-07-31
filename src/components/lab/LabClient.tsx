"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import LatestUpdates from "@/components/latest-updates/LatestUpdates";
import LabLogo from "@/components/lab/LabLogo";

const SURFACE = "rgba(5,16,37,0.45)";
const CYAN = "rgba(0,229,255,";
const A = "rgba(0,229,255,0.8)";

/* ═══════════════════════════════════════════════════════
   SHARED: Section Header
   ═══════════════════════════════════════════════════════ */
function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "clamp(2rem, 3.5vw, 3rem)", textAlign: "center" }}>
      <div style={{
        fontSize: 10, color: "rgba(0,229,255,0.3)", textTransform: "uppercase",
        letterSpacing: "0.5em", marginBottom: 10,
        fontFamily: "var(--font-geist-mono), monospace",
      }}>{eyebrow}</div>
      <h2 style={{
        fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 200,
        letterSpacing: "-0.02em", color: "#fff", margin: 0,
      }}>{title}</h2>
      {subtitle && <p style={{
        fontSize: "clamp(0.8rem, 1.2vw, 0.9rem)", fontWeight: 300,
        color: "rgba(255,255,255,0.4)", marginTop: "0.6rem", lineHeight: 1.6,
      }}>{subtitle}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED: Scroll Reveal Wrapper
   ═══════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.4) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.intersectionRatio > threshold) { setVisible(true); obs.disconnect(); } },
      { threshold: [0, 0.3, 0.5, 0.7] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════
   1. LAB HERO — Molecular Chamber
   ═══════════════════════════════════════════════════════ */
function LabHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const N = 55;
    const mols: { x: number; y: number; vx: number; vy: number; r: number; ph: number }[] = [];

    const init = (W: number, H: number) => {
      mols.length = 0;
      for (let i = 0; i < N; i++) mols.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 2, ph: Math.random() * Math.PI * 2,
      });
    };

    const draw = () => {
      const parent = c.parentElement;
      if (!parent) return;
      const W = c.width = parent.clientWidth;
      const H = c.height = parent.clientHeight;
      if (mols.length === 0) init(W, H);
      ctx.clearRect(0, 0, W, H);
      const t = performance.now() / 1000;

      for (let i = 0; i < mols.length; i++) {
        for (let j = i + 1; j < mols.length; j++) {
          const dx = mols[i].x - mols[j].x, dy = mols[i].y - mols[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath(); ctx.moveTo(mols[i].x, mols[i].y); ctx.lineTo(mols[j].x, mols[j].y);
            ctx.strokeStyle = `${CYAN}${0.025 * (1 - dist / 110)})`; ctx.lineWidth = 0.3; ctx.stroke();
          }
        }
      }
      for (const m of mols) {
        m.x += m.vx; m.y += m.vy;
        if (m.x < 0) m.x = W; if (m.x > W) m.x = 0;
        if (m.y < 0) m.y = H; if (m.y > H) m.y = 0;
        const pulse = 1 + Math.sin(t * 1.2 + m.ph) * 0.35;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${CYAN}${0.12 + pulse * 0.18})`; ctx.fill();
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * pulse * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `${CYAN}${0.015 + pulse * 0.025})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => {
      const parent = c.parentElement;
      if (parent) init(parent.clientWidth, parent.clientHeight);
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <header style={{ position: "relative", textAlign: "center", padding: "clamp(48px,8vw,80px) 24px clamp(32px,6vw,56px)", maxWidth: 720, margin: "0 auto" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, width: "100%", height: "100%" }} />
      <style>{`
        @keyframes sigilFloat { 0%,100%{transform:translateY(0);filter:drop-shadow(0 0 8px rgba(0,229,255,0.12))} 50%{transform:translateY(-6px);filter:drop-shadow(0 0 22px rgba(0,229,255,0.28))} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ position: "relative", zIndex: 1, marginBottom: 24 }}>
        <div style={{ display: "inline-block", position: "relative", animation: "sigilFloat 4s ease-in-out infinite" }}>
          <LabLogo />
          <div style={{ position: "absolute", inset: -20, zIndex: 0, background: "radial-gradient(ellipse at center, rgba(0,229,255,0.06) 0%, transparent 70%)", filter: "blur(20px)" }} />
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: "clamp(1rem,1.8vw,1.25rem)", fontWeight: 300, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", margin: "0 0 12px", animation: "fadeUp 0.8s ease-out 0.2s both" }}>
          What is continuity — and can it be made a verifiable property of digital existence?
        </h1>
        <p style={{ fontSize: 12, color: "rgba(0,229,255,0.4)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 14px", animation: "fadeUp 0.8s ease-out 0.5s both" }}>
          Not a product. Not a company. Not a token. A research question.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", animation: "fadeUp 0.8s ease-out 0.8s both" }}>
          {["GitHub","X","HuggingFace","npm","Discord"].map((l) => (
            <a key={l} href="#" onMouseEnter={(e) => { playTick(500, "sine", 0.05, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)"; e.currentTarget.style.color = "rgba(0,229,255,0.6)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.06)"; e.currentTarget.style.color = "rgba(0,229,255,0.3)"; }} style={{ color: "rgba(0,229,255,0.3)", textDecoration: "none", padding: "2px 8px", border: "1px solid rgba(0,229,255,0.06)", borderRadius: 4, transition: "all 0.25s", cursor: "pointer" }}>{l}</a>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   2. STATS — Laboratory Instrument Panel
   ═══════════════════════════════════════════════════════ */
const STATS = [
  { n: "576", label: "Experiments", unit: "runs" },
  { n: "1", label: "Protocol", unit: "CPS" },
  { n: "2", label: "RFCs", unit: "specs" },
  { n: "7", label: "Research Notes", unit: "papers" },
  { n: "192", label: "Tests", unit: "cases" },
];

function LabStats() {
  const { ref, visible } = useScrollReveal(0.3);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let progress = 0;
    const start = performance.now();

    const draw = () => {
      const parent = c.parentElement;
      if (!parent) return;
      const W = c.width = parent.clientWidth;
      const H = c.height = parent.clientHeight;
      ctx.clearRect(0, 0, W, H);
      progress = Math.min(1, (performance.now() - start) / 1500);

      // Horizontal scanning line
      const scanY = H * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(W * progress, scanY);
      ctx.strokeStyle = "rgba(0,229,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tick marks along the scan line
      const gap = W / (STATS.length + 1);
      for (let i = 0; i < STATS.length; i++) {
        const x = gap * (i + 1);
        if (x / W <= progress) {
          ctx.beginPath();
          ctx.moveTo(x, scanY - 6); ctx.lineTo(x, scanY + 6);
          ctx.strokeStyle = "rgba(0,229,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, scanY, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,229,255,0.5)"; ctx.fill();
        }
      }

      if (progress < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <section ref={ref} style={{ padding: "clamp(3rem,6vw,5rem) 24px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease-out, transform 0.7s ease-out" }}>
      <SectionHeader eyebrow="Dashboard" title={<>Research <span style={{ color: A }}>Telemetry</span></>} subtitle="Live metrics from the Continuity Lab" />

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto", padding: "clamp(1rem,2vw,2rem) 0" }}>
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 0, width: "100%", height: "100%" }} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATS.length}, 1fr)`, gap: "clamp(6px,1vw,12px)", position: "relative", zIndex: 1 }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "clamp(12px,2vw,20px) clamp(6px,1vw,10px)",
              border: "1px solid rgba(0,229,255,0.08)", background: SURFACE, borderRadius: 10,
              cursor: "default",
              transition: "all 0.4s", opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
            }}
              onMouseEnter={(e) => { playTick(500 + i * 80, "sine", 0.06, 0.02); e.currentTarget.style.borderColor = "rgba(0,229,255,0.3)"; e.currentTarget.style.background = "rgba(0,229,255,0.04)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(0,229,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,229,255,0.08)"; e.currentTarget.style.background = SURFACE; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: "clamp(22px,3.5vw,32px)", fontWeight: 200, color: "#fff", fontFamily: "var(--font-geist-mono), monospace", lineHeight: 1, marginBottom: 4 }}>
                {s.n}
              </div>
              <div style={{ fontSize: 10, color: "rgba(0,229,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-geist-mono), monospace" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginTop: 2, fontFamily: "var(--font-geist-mono), monospace" }}>
                {s.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   3. CTAs — Dual Workbench
   ═══════════════════════════════════════════════════════ */
const CTAS = [
  { label: "Discovery Survey", sub: "5 minutes · Help us map the continuity landscape", href: "/lab/discovery-survey", color: "rgba(212,175,55,", icon: "🔬" },
  { label: "Protocol Playground", sub: "Live verification · No install · Verify receipts", href: "/lab/playground", color: "rgba(52,211,153,", icon: "🧪" },
];

function LabCTAs() {
  const { ref, visible } = useScrollReveal(0.3);
  return (
    <section ref={ref} style={{ padding: "0 24px clamp(3rem,5vw,4rem)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease-out, transform 0.7s ease-out" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(12px,2vw,20px)" }}>
        {CTAS.map((cta, i) => (
          <Link key={cta.label} href={cta.href} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "clamp(14px,2vw,20px) clamp(14px,2vw,20px)",
            border: `1px solid ${cta.color}0.2)`, background: SURFACE, borderRadius: 12,
            textDecoration: "none", transition: "all 0.35s",
          }}
            onMouseEnter={(e) => { playTick(600, "sine", 0.07, 0.02); e.currentTarget.style.borderColor = `${cta.color}0.5)`; e.currentTarget.style.background = "rgba(0,229,255,0.04)"; e.currentTarget.style.boxShadow = `0 0 32px ${cta.color}0.08)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${cta.color}0.2)`; e.currentTarget.style.background = SURFACE; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span style={{ fontSize: "clamp(24px,3vw,30px)", flexShrink: 0 }}>{cta.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "clamp(12px,1.5vw,14px)", color: `${cta.color}0.85)`, fontWeight: 500, marginBottom: 3 }}>{cta.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{cta.sub}</div>
            </div>
            <span style={{ fontSize: 10, color: `${cta.color}0.6)`, fontWeight: 600, letterSpacing: "0.08em", flexShrink: 0 }}>Open →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   4. RESEARCH ARCHIVE — Three Column Catalog
   ═══════════════════════════════════════════════════════ */
const COLUMNS = [
  {
    title: "Core Research", color: "rgba(0,229,255,0.7)",
    items: [
      { p: "CPS-0001", t: "Continuity Protocol Core", h: "/research/notes/008-continuity-protocol-core" },
      { p: "EE-001", t: "Presence Entropy Score", h: "/research/fusion" },
      { p: "EE-002", t: "Cross-Modal Causal Coupling", h: "/research/causal-coupling" },
      { p: "EE-003", t: "Challenge-Response Engine", h: "/research/challenge-response" },
      { p: "VS-001", t: "Verification Pipeline · 93%", h: "/research/protocol-verify" },
    ],
  },
  {
    title: "For Developers", color: "rgba(52,211,153,0.7)",
    items: [
      { t: "npm install @thecontinuitylab/myshape", h: "https://www.npmjs.com/package/@thecontinuitylab/myshape", ext: true },
      { t: "npx @thecontinuitylab/myshape demo", h: "https://www.npmjs.com/package/@thecontinuitylab/myshape", ext: true },
      { t: "Contribute Data", h: "/lab/contribute" },
      { t: "Discovery Survey", h: "/lab/discovery-survey" },
    ],
  },
  {
    title: "Research Notes", color: "rgba(212,175,55,0.7)",
    items: [
      { p: "RN-003", t: "Cross-Modal Binding · 477 runs", h: "/research/notes/003-cross-modal-binding" },
      { p: "RN-002", t: "PES Benchmark v0.2", h: "/research/notes/002-pes-benchmark" },
      { p: "RN-001", t: "The Continuity Problem", h: "/research/notes/001-the-continuity-problem" },
      { p: "FD-001", t: "Frame Rate Hypothesis (failed)", h: "/research/notes/005-failure-report-10fps" },
      { p: "DL-001", t: "Direction Asymmetry in EE-003", h: "/research/notes/007-ee003-direction-asymmetry" },
    ],
  },
];

function LabArchive() {
  const { ref, visible } = useScrollReveal(0.25);
  return (
    <section ref={ref} style={{ padding: "clamp(2rem,5vw,4rem) 24px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease-out, transform 0.7s ease-out" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "clamp(16px,2.5vw,28px)" }}>
          {COLUMNS.map((col, ci) => (
            <div key={col.title}>
              {/* Column header — like a drawer label */}
              <div style={{
                fontSize: 9, color: col.color, textTransform: "uppercase",
                letterSpacing: "0.2em", marginBottom: 12,
                fontFamily: "var(--font-geist-mono), monospace",
                padding: "6px 10px", border: `1px solid ${col.color.replace("0.7", "0.12")}`,
                borderRadius: 6, background: SURFACE, display: "inline-block",
              }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {col.items.map((item, ii) => {
                  const isExt = "ext" in item && (item as any).ext;
                  const prefix = "p" in item ? (item as any).p : null;
                  return (
                    <a key={item.t || prefix} href={item.h} target={isExt ? "_blank" : undefined} rel={isExt ? "noopener noreferrer" : undefined}
                      onMouseEnter={(e) => { playTick(500 + ii * 60, "sine", 0.04, 0.02); e.currentTarget.style.background = "rgba(0,229,255,0.03)"; e.currentTarget.style.paddingLeft = "8px"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.paddingLeft = "0px"; }}
                      style={{
                        display: "flex", gap: 8, alignItems: "baseline",
                        padding: "6px 0", borderBottom: "1px solid rgba(0,229,255,0.04)",
                        fontSize: "clamp(10px,1.1vw,11px)", textDecoration: "none",
                        transition: "all 0.2s", color: "#A7B4C6",
                      }}>
                      {prefix && <span style={{ color: col.color, fontSize: 10, fontWeight: 500, minWidth: 52, fontFamily: "var(--font-geist-mono), monospace" }}>{prefix}</span>}
                      <span style={{ color: "#A7B4C6" }}>{item.t}</span>
                      {isExt && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 8, marginLeft: "auto" }}>↗</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   5. MANIFESTO — Lab Oath Wall
   ═══════════════════════════════════════════════════════ */
const OATH = [
  "We test hypotheses. We do not defend them.",
  "We publish limitations before we publish claims.",
  "We publish failures alongside successes.",
  "Evidence precedes belief.",
];

function LabManifesto() {
  const { ref, visible } = useScrollReveal(0.4);
  return (
    <section ref={ref} style={{
      padding: "clamp(3rem,6vw,5rem) 24px",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
    }}>
      <style>{`
        @keyframes oathLine { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
      <div style={{
        maxWidth: 560, margin: "0 auto",
        border: "1px solid rgba(0,229,255,0.1)", background: SURFACE,
        padding: "clamp(24px,4vw,40px) clamp(20px,3vw,32px)",
        borderRadius: 14, position: "relative",
      }}>
        {/* Corner brackets */}
        {["tl","tr","bl","br"].map((pos) => (
          <span key={pos} style={{
            position: "absolute",
            top: pos.startsWith("t") ? -1 : undefined, bottom: pos.startsWith("b") ? -1 : undefined,
            left: pos.endsWith("l") ? -1 : undefined, right: pos.endsWith("r") ? -1 : undefined,
            width: pos.startsWith("t") || pos.startsWith("b") ? 16 : 1,
            height: pos.startsWith("t") || pos.startsWith("b") ? 1 : 16,
            background: "rgba(0,229,255,0.25)",
          }} />
        ))}

        <SectionHeader eyebrow="Manifesto" title={<>The <span style={{ color: A }}>Lab Oath</span></>} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {OATH.map((line, i) => (
            <div key={i} style={{
              fontSize: "clamp(13px,1.5vw,15px)", color: "rgba(255,255,255,0.5)", fontWeight: 300,
              lineHeight: 1.7, textAlign: "center",
              animation: visible ? `oathLine 0.6s ease-out ${1 + i * 0.25}s both` : "none",
              padding: "4px 0",
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   6. SPECS — Blueprint Table
   ═══════════════════════════════════════════════════════ */
const SPECS = [
  { p: "CPS-0001", t: "Continuity Protocol Core · v1.0-RC", h: "/research/notes/008-continuity-protocol-core" },
  { p: "RFC-0001", t: "Motion Signature Format", h: "/research/notes/004-motion-signature-rfc" },
  { p: "RFC-0002", t: "Continuity Proof Format", h: "/research/notes/006-continuity-proof-rfc" },
];

function LabSpecs() {
  const { ref, visible } = useScrollReveal(0.4);
  return (
    <section ref={ref} style={{
      padding: "0 24px clamp(3rem,5vw,4rem)",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          border: "1px solid rgba(0,229,255,0.12)", background: SURFACE,
          borderRadius: 12, overflow: "hidden", position: "relative",
        }}>
          {/* Blueprint grid overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.015, zIndex: 0,
            backgroundImage: `
              linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }} />

          {/* Header */}
          <div style={{
            padding: "clamp(10px,1.5vw,14px) clamp(14px,2vw,20px)",
            borderBottom: "1px solid rgba(0,229,255,0.06)",
            background: "rgba(0,229,255,0.02)",
            position: "relative", zIndex: 1,
          }}>
            <span style={{ fontSize: 10, color: "rgba(0,229,255,0.35)", fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.2em" }}>
              Specifications & RFCs
            </span>
          </div>

          {SPECS.map((spec, i) => (
            <a key={spec.p} href={spec.h} style={{
              display: "flex", gap: 12, alignItems: "center",
              padding: "clamp(10px,1.5vw,14px) clamp(14px,2vw,20px)",
              borderBottom: i < SPECS.length - 1 ? "1px solid rgba(0,229,255,0.04)" : "none",
              textDecoration: "none", position: "relative", zIndex: 1,
              transition: "all 0.25s",
            }}
              onMouseEnter={(e) => { playTick(550, "sine", 0.05, 0.02); e.currentTarget.style.background = "rgba(0,229,255,0.03)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 10, color: "rgba(0,229,255,0.5)", fontWeight: 500, minWidth: 70, fontFamily: "var(--font-geist-mono), monospace" }}>{spec.p}</span>
              <span style={{ fontSize: "clamp(10px,1.1vw,12px)", color: "#A7B4C6", fontWeight: 300 }}>{spec.t}</span>
              <span style={{ marginLeft: "auto", color: "rgba(0,229,255,0.2)", fontSize: 11 }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   LAB CLIENT — Main Export
   ═══════════════════════════════════════════════════════ */
export default function LabClient() {
  return (
    <div style={{
      minHeight: "100vh", background: "#051025", color: "#E6EDF7",
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      <LabHero />
      <LabStats />
      <LabCTAs />
      <LabArchive />
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
        <LatestUpdates />
      </section>
      <LabManifesto />
      <LabSpecs />

      {/* Footer */}
      <footer style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "clamp(28px,4vw,40px) 24px", borderTop: "1px solid rgba(0,229,255,0.06)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em" }}>
        <a href="https://www.myshape.com" style={{ color: "rgba(0,229,255,0.25)", textDecoration: "none" }}
          onMouseEnter={(e) => { playTick(500, "sine", 0.04, 0.02); e.currentTarget.style.color = "rgba(0,229,255,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(0,229,255,0.25)"; }}
        >MyShape Protocol</a>
        <span style={{ margin: "0 10px" }}>·</span>
        The Continuity Lab, 2026
      </footer>
    </div>
  );
}

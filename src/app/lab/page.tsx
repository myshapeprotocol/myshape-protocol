"use client";

import { useState, useEffect } from "react";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import LatestUpdates from "@/components/latest-updates/LatestUpdates";

const C = { bg: "#060B14", surface: "#0B1220", border: "#1E293B", blue: "#60A5FA", blueMuted: "rgba(96,165,250,0.55)", gold: "rgba(212,175,55,0.5)", text: "#E6EDF7", muted: "#64748B", faint: "rgba(255,255,255,0.30)", hover: "rgba(96,165,250,0.04)" };

interface Star { left: string; top: string; size: number; duration: string; delay: string; }

function generateStars(n: number): Star[] {
  return Array.from({ length: n }).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 1 + Math.random() * 2,
    duration: `${2 + Math.random() * 5}s`,
    delay: `${Math.random() * 4}s`,
  }));
}

export default function LabPage() {
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => { setStars(generateStars(80)); }, []);
  return (
    <>
    <style>{`
      @keyframes textFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.10; }
        50% { opacity: 0.50; }
      }
      .fi { animation: textFadeIn 0.8s ease-out forwards; opacity: 0; }
      .fi1 { animation-delay: 0.2s; }
      .fi2 { animation-delay: 0.4s; }
      .fi3 { animation-delay: 0.6s; }
      .card { transition: border-color 0.25s, background 0.25s; }
      .card:hover { border-color: rgba(96,165,250,0.25) !important; background: #0E1624 !important; }
      .social-link { transition: color 0.2s; }
      .social-link:hover { color: #90c8ff !important; }
    `}</style>
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Starfield — client-only to avoid hydration mismatch */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {stars.map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            left: s.left, top: s.top,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "#90c8ff",
            animation: `twinkle ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }} />
        ))}
      </div>
      <BackgroundParticles />

      {/* ═══════════════ HERO ═══════════════ */}
      <header style={{ textAlign: "center", padding: "72px 24px 40px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
          <img src="/lab-sigil.png" alt="The Continuity Lab"
            style={{ maxWidth: "min(100%, 380px)", height: "auto", display: "block" }} />
        </div>
        <h1 className="fi fi2" style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)", fontWeight: 300, lineHeight: 1.5, margin: "0 0 16px", color: C.text }}>
          What is continuity — and can it be made a verifiable property of digital existence?
        </h1>
        <p className="fi fi3" style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, maxWidth: 500, margin: "0 auto 28px" }}>
          Identity tells us who you claim to be. Continuity tells us whether you remained you.
          The internet has protocols for identity, for data, and for value —
          but no protocol for proving that a digital subject is the same entity across time.
        </p>
        <p className="fi fi3" style={{ fontSize: 12, color: C.blueMuted, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 20px" }}>
          Not a product. Not a company. Not a token. A research question.
        </p>

        {/* Social row */}
        <div className="fi fi3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", alignItems: "center", fontSize: 11 }}>
          <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(96,165,250,0.45)", textDecoration: "none" }}>GitHub</a>
          <a href="https://x.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(96,165,250,0.45)", textDecoration: "none" }}>X</a>
          <a href="https://bsky.app/profile/myshapeprotocol.bsky.social" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(96,165,250,0.45)", textDecoration: "none" }}>Bluesky</a>
          <a href="https://discord.gg/zr8Tczard" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(96,165,250,0.45)", textDecoration: "none" }}>Discord</a>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a href="https://huggingface.co/TheContinuityLab" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(212,175,55,0.4)", textDecoration: "none" }}>HuggingFace</a>
          <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" target="_blank" rel="noopener noreferrer" className="social-link" style={{ color: "rgba(212,175,55,0.4)", textDecoration: "none" }}>npm</a>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <a href="mailto:hello@thecontinuitylab.org" className="social-link" style={{ color: C.faint, textDecoration: "none" }}>hello@thecontinuitylab.org</a>
        </div>
      </header>

      {/* ═══════════════ STATS ═══════════════ */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 48 }}>
          {[{ n: "576", label: "Experiments" },{ n: "1", label: "Protocol (CPS)" },{ n: "2", label: "RFCs" },{ n: "7", label: "Research Notes" },{ n: "192", label: "Tests" }].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "18px 10px", border: `1px solid ${C.border}`, background: C.surface }}>
              <div style={{ fontSize: 26, fontWeight: 300, color: C.blue, marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ═══════════════ SURVEY CTA ═══════════════ */}
        <a href="/lab/discovery-survey" className="card" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
          padding: "16px 24px", marginBottom: 16,
          border: `1px solid rgba(212,175,55,0.2)`, background: C.surface,
          textDecoration: "none", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 22 }}>🔬</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "rgba(212,175,55,0.8)", fontWeight: 500, marginBottom: 2 }}>Discovery Survey</div>
            <div style={{ fontSize: 11, color: C.muted }}>5 minutes · Help us understand what the world needs from continuity verification</div>
          </div>
          <span style={{ fontSize: 11, color: "rgba(212,175,55,0.6)", fontWeight: 600, letterSpacing: "0.1em" }}>Take survey →</span>
        </a>

        {/* ═══════════════ PLAYGROUND CTA ═══════════════ */}
        <a href="/lab/playground" className="card" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
          padding: "20px 24px", marginBottom: 36,
          border: `1px solid rgba(52,211,153,0.25)`, background: C.surface,
          textDecoration: "none", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 28 }}>🧪</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, color: "#34D399", fontWeight: 500, marginBottom: 4 }}>Protocol Playground</div>
            <div style={{ fontSize: 11, color: C.muted }}>Experiment with live verification · Verify receipts · No install</div>
          </div>
          <span style={{ fontSize: 11, color: "#34D399", fontWeight: 600, letterSpacing: "0.1em" }}>Open →</span>
        </a>

        {/* ═══════════════ THREE COLUMNS ═══════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 48 }}>

          {/* Column 1 — Core Research */}
          <div>
            <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 14 }}>Core Research</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { p: "CPS-0001", t: "Continuity Protocol Core", h: "/research/notes/008-continuity-protocol-core" },
                { p: "EE-001", t: "Presence Entropy Score", h: "/research/fusion" },
                { p: "EE-002", t: "Cross-Modal Causal Coupling", h: "/research/causal-coupling" },
                { p: "EE-003", t: "Challenge-Response", h: "/research/challenge-response" },
                { p: "VS-001", t: "Verification Pipeline · 93%", h: "/research/protocol-verify" },
              ].map(({ p, t, h }) => (
                <a key={p} href={h} className="card" style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, textDecoration: "none" }}>
                  <span style={{ color: C.blue, fontSize: 10, fontWeight: 500, minWidth: 52 }}>{p}</span>
                  <span style={{ color: "#A7B4C6" }}>{t}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — For Developers */}
          <div>
            <div style={{ fontSize: 10, color: "#34D399", textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 14 }}>For Developers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { t: "npm install @thecontinuitylab/myshape", h: "https://www.npmjs.com/package/@thecontinuitylab/myshape", c: "rgba(100,255,180,0.7)" },
                { t: "npx @thecontinuitylab/myshape demo", h: "https://www.npmjs.com/package/@thecontinuitylab/myshape", c: "rgba(100,255,180,0.5)" },
                { t: "Contribute Data", h: "/lab/contribute", c: "rgba(100,255,180,0.5)" },
                { t: "Discovery Survey", h: "/lab/discovery-survey", c: "rgba(100,255,180,0.5)" },
              ].map(({ t, h, c }) => {
                const ext = h.startsWith("http");
                return (
                  <a key={t} href={h} target={ext ? "_blank" : undefined} rel={ext ? "noopener noreferrer" : undefined} className="card" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, textDecoration: "none" }}>
                    <span style={{ color: c || "#A7B4C6" }}>{t}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 3 — Research Notes */}
          <div>
            <div style={{ fontSize: 10, color: C.gold, textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 14 }}>Research Notes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                { p: "RN-003", t: "Cross-Modal Binding · 477 runs", h: "/research/notes/003-cross-modal-binding" },
                { p: "RN-002", t: "PES Benchmark v0.2", h: "/research/notes/002-pes-benchmark" },
                { p: "RN-001", t: "The Continuity Problem", h: "/research/notes/001-the-continuity-problem" },
                { p: "FD-001", t: "Frame Rate Hypothesis (failed)", h: "/research/notes/005-failure-report-10fps" },
                { p: "DL-001", t: "Direction Asymmetry in EE-003", h: "/research/notes/007-ee003-direction-asymmetry" },
              ].map(({ p, t, h }) => (
                <a key={p} href={h} className="card" style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11, textDecoration: "none" }}>
                  <span style={{ color: C.gold, fontSize: 10, fontWeight: 500, minWidth: 52 }}>{p}</span>
                  <span style={{ color: "#A7B4C6" }}>{t}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════ TIMELINE ═══════════════ */}
        <LatestUpdates />

        {/* ═══════════════ MANIFESTO ═══════════════ */}
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 2.4, margin: "48px 0 40px", textAlign: "center" }}>
          <p style={{ margin: 0 }}>We test hypotheses. We do not defend them.</p>
          <p style={{ margin: 0 }}>We publish limitations before we publish claims.</p>
          <p style={{ margin: 0 }}>We publish failures alongside successes.</p>
          <p style={{ margin: 0 }}>Evidence precedes belief.</p>
        </div>

        {/* ═══════════════ SPECS ═══════════════ */}
        <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.25em", marginBottom: 12 }}>Specifications & RFCs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1 }}>
          {[
            { p: "CPS-0001", t: "Continuity Protocol Core · v1.0-RC", h: "/research/notes/008-continuity-protocol-core" },
            { p: "RFC-0001", t: "Motion Signature Format", h: "/research/notes/004-motion-signature-rfc" },
            { p: "RFC-0002", t: "Continuity Proof Format", h: "/research/notes/006-continuity-proof-rfc" },
          ].map(({ p, t, h }) => (
            <a key={p} href={h} className="card" style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 10px", border: `1px solid ${C.border}`, background: C.surface, fontSize: 11, textDecoration: "none" }}>
              <span style={{ color: C.blue, fontSize: 10, fontWeight: 500 }}>{p}</span>
              <span style={{ color: "#A7B4C6" }}>{t}</span>
            </a>
          ))}
        </div>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <div style={{ fontSize: 11, color: C.faint, letterSpacing: "0.08em", textAlign: "center", marginTop: 48, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <a href="https://www.myshape.com" style={{ color: "rgba(96,165,250,0.3)", textDecoration: "none" }}>MyShape Protocol</a>
          <span style={{ margin: "0 10px" }}>·</span>
          <span>The Continuity Lab, 2026</span>
        </div>
      </section>
    </div>
    </>
  );
}

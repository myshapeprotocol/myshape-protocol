"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";

const PRINCIPLES = [
  {
    label: "Research First",
    summary: "We are not a startup. We are a research program. Our primary output is not features — it is questions, experiments, evidence, and open problems.",
  },
  {
    label: "Publish Limitations First",
    summary: "Every paper we write includes a section on what we got wrong. Every experiment publishes failure conditions alongside success rates.",
  },
  {
    label: "Evidence Before Belief",
    summary: "We test hypotheses. We do not defend them. When the data contradicts our assumptions, the assumptions change — not the data.",
  },
  {
    label: "Open by Default",
    summary: "All specifications are public. All code is open source (Apache 2.0). Our dataset is published on HuggingFace. Anyone can implement it.",
  },
  {
    label: "Continuity, Not Identity",
    summary: "We do not identify people. We investigate one narrow question: has the same entity been continuously present?",
  },
  {
    label: "Not a Token",
    summary: "MyShape has no token. No ICO. No airdrop. Financial incentives would corrupt the research incentives.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#02040a", color: "#E6EDF7", fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
        .f1 { animation-delay: 0.1s; }
        .f2 { animation-delay: 0.25s; }
        .f3 { animation-delay: 0.4s; }
        .f4 { animation-delay: 0.55s; }
      `}</style>

      <ProtocolHeader />
      <BackgroundParticles />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up f1" style={{ fontSize: 11, color: "rgba(96,165,250,0.5)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>
          About
        </div>

        <h1 className="fade-up f2" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#fff", margin: "0 0 20px" }}>
          We are investigating<br />
          <span style={{ color: "rgba(144,200,255,0.8)" }}>one question.</span>
        </h1>

        <p className="fade-up f3" style={{ fontSize: "clamp(1.05rem, 2vw, 1.2rem)", fontWeight: 300, color: "rgba(144,200,255,0.7)", lineHeight: 1.6, maxWidth: 560, marginBottom: 32 }}>
          Can continuity be made a verifiable property of digital existence?
        </p>

        <p className="fade-up f3" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 560, marginBottom: 48 }}>
          AI can generate faces, clone voices, and produce realistic video in real time. Every system we built to verify identity assumes that seeing is believing. That assumption is now broken.
        </p>

        {/* What MyShape Is */}
        <div className="fade-up f3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 36 }}>
          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 20 }}>
            MyShape is the first protocol implementation of an open research framework called <a href="https://thecontinuitylab.org" style={{ color: "rgba(96,165,250,0.5)", textDecoration: "underline" }}>The Continuity Lab</a>.
          </p>
          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 20 }}>
            We are not a company. We are not selling a product. We are not launching a token. We are a small research team investigating whether &quot;continuity&quot; — the property that the same entity has been here the whole time — can be measured, verified, and shared across independent systems.
          </p>
          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
            Our first output is an <a href="/research/notes/008-continuity-protocol-core" style={{ color: "rgba(96,165,250,0.5)", textDecoration: "underline" }}>open protocol for continuity receipts (CPS-0001)</a>. It defines how evidence gets produced, signed, and chained — independently of any specific engine or sensor. It is not something you buy. It is something anyone can implement.
          </p>
        </div>

        {/* Non-Goals */}
        <div className="fade-up f3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 20 }}>
            Non-Goals
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              "We do not identify people.",
              "We do not store physical or visual identity data.",
              "We do not replace passwords, biometrics, or existing identity systems.",
              "We do not require any specific hardware, blockchain, or platform.",
              "We do not issue credentials, verifiable or otherwise.",
              "We do not have a token.",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, paddingLeft: 16, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Principles */}
        <div className="fade-up f4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>
            Principles
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {PRINCIPLES.map((p) => (
              <div key={p.label}>
                <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(144,200,255,0.6)", marginBottom: 6, letterSpacing: "0.04em" }}>
                  {p.label}
                </div>
                <div style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
                  {p.summary}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        <ProtocolFooter />
      </div>
    </div>
  );
}

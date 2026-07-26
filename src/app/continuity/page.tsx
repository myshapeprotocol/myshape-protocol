"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";

export default function ContinuityPage() {
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
        .f5 { animation-delay: 0.7s; }
        .f6 { animation-delay: 0.85s; }
        .link-cta {
          padding: 10px 20px; border: 1px solid rgba(144,200,255,0.15);
          font-size: 12px; color: rgba(144,200,255,0.6);
          text-decoration: none; transition: all 0.2s;
        }
        .link-cta:hover { border-color: rgba(144,200,255,0.4); color: rgba(144,200,255,0.85); }
        .link-ghost {
          padding: 10px 20px; border: 1px solid rgba(255,255,255,0.08);
          font-size: 12px; color: rgba(255,255,255,0.35);
          text-decoration: none; transition: all 0.2s;
        }
        .link-ghost:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.55); }
      `}</style>

      <ProtocolHeader />
      <BackgroundParticles />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 720, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up f1" style={{ fontSize: 11, color: "rgba(96,165,250,0.5)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>
          The Continuity Problem
        </div>

        <h1 className="fade-up f2" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.15, color: "#fff", margin: "0 0 20px" }}>
          AI didn&apos;t break identity.<br />
          <span style={{ color: "rgba(144,200,255,0.8)" }}>It broke continuity.</span>
        </h1>

        <p className="fade-up f3" style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", fontWeight: 300, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
          Identity tells you who someone claims to be. Continuity asks whether the same entity is still here.
          The internet has protocols for identity, for encryption, for data — but no protocol for proving that a digital subject has been continuously present.
        </p>

        {/* Observation */}
        <div className="fade-up f3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>
            Observation
          </div>

          <p style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)", fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 20 }}>
            Twenty years ago, seeing a face on screen meant someone was probably there. Today, it doesn&apos;t.
          </p>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 8 }}>
            AI can generate a face in seconds. Clone a voice in milliseconds. Produce video that looks indistinguishable from a real person sitting in front of a camera.
          </p>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
            Every security system still asks: <em>&quot;Who are you?&quot;</em> Almost none asks: <em>&quot;Are you continuously there?&quot;</em>
          </p>
        </div>

        {/* Question */}
        <div className="fade-up f3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>
            Question
          </div>

          <p style={{ fontSize: "clamp(1.05rem, 2vw, 1.2rem)", fontWeight: 300, color: "rgba(144,200,255,0.8)", lineHeight: 1.6, marginBottom: 20 }}>
            Can continuity be made a verifiable property of digital existence — as measurable, provable, and exchangeable as a cryptographic signature?
          </p>

          <p style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
            Not identity. Not &quot;who are you.&quot; Continuity: has the same entity been here the whole time?
          </p>
        </div>

        {/* Experiments */}
        <div className="fade-up f4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>
            Experiments
          </div>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20 }}>
            We&apos;ve run 576 experiments across four independent evidence engines.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <div style={{ padding: "16px 20px", border: "1px solid rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.015)" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                Can we tell biological entropy from synthetic smoothness?
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>4-dimensional entropy patterns. Subtle, inconsistent across time — and difficult to maintain convincingly under continuous observation.</div>
            </div>
            <div style={{ padding: "16px 20px", border: "1px solid rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.015)" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                If two sensors observe the same event, do their signals agree?
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Cross-modal temporal alignment: 100% across 316 trials.</div>
            </div>
            <div style={{ padding: "16px 20px", border: "1px solid rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.015)" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                Can randomized gyroscope challenges defeat replay attacks?
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Jittered timing. Unexpected directions. Pass rate: 59% across 200 attempts.</div>
            </div>
            <div style={{ padding: "16px 20px", border: "1px solid rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.015)" }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                Can we chain passive and active checks into a single session?
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>Dual-engine pipeline: 93% pass rate across 60 sessions.</div>
            </div>
          </div>

          <p style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
            We also published the experiments that <em>failed</em> — because negative results are results.
          </p>
        </div>

        {/* Evidence */}
        <div className="fade-up f5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>
            Evidence
          </div>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20 }}>
            We asked: what if verification didn&apos;t return &quot;yes&quot; or &quot;no&quot; — but <em>evidence</em>? Signed, timestamped, hash-chained receipts that you can hold, verify, and link together into a proof of continuous presence.
          </p>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 20 }}>
            This became <strong style={{ fontWeight: 400, color: "rgba(144,200,255,0.7)" }}>CPS-0001</strong> — an open protocol for continuity receipts. Engine-independent, self-verifying, and designed to be implementable by anyone.
          </p>

          <p style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, marginBottom: 20, padding: "12px 16px", borderLeft: "1px solid rgba(144,200,255,0.15)", background: "rgba(144,200,255,0.015)" }}>
            MyShape does not rely on a single unforgeable signal. It combines multiple sources of evidence to measure continuity across time, modalities, and interactions — increasing the cost of maintaining a convincing forged presence over time.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <a href="/research/notes/008-continuity-protocol-core" className="link-cta">Read CPS-0001 →</a>
            <a href="/verify-receipt" className="link-ghost">Verify a Receipt →</a>
          </div>
        </div>

        {/* Open Problems */}
        <div className="fade-up f6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 40, marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>
            Open Problems
          </div>

          <p style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 8 }}>
            What we still don&apos;t know:
          </p>

          <ul style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.35)", lineHeight: 2, paddingLeft: 20, marginBottom: 20 }}>
            <li>Can two independent sensors agree on the same physical event — reliably enough for production?</li>
            <li>What happens when an adversary deliberately tries to break each engine?</li>
            <li>Can continuity proofs be made as compact and verifiable as a cryptographic signature?</li>
            <li>What would a standard for continuity receipts look like — across protocols, across implementations?</li>
          </ul>

          <p style={{ fontSize: "clamp(0.9rem, 1.5vw, 1rem)", fontWeight: 300, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
            These are not rhetorical questions. They define our research agenda. If any of them interests you, we&apos;d welcome your contribution.
          </p>
        </div>

      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        <ProtocolFooter />
      </div>
    </div>
  );
}

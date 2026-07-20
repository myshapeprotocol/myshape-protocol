"use client";

export default function LabPage() {
  return (
    <>
    <style>{`
      @keyframes coreBreathe {
        0%,100% { transform: scale(0.5); opacity: 0.4; }
        40%     { transform: scale(1.8); opacity: 1; }
        70%     { transform: scale(0.9); opacity: 0.7; }
      }
      @keyframes haloBreathe {
        0%,100% { transform: scale(0.9); opacity: 0.06; }
        50%     { transform: scale(1.2); opacity: 0.16; }
      }
      @keyframes ringBreathe {
        0%,100% { transform: scale(1); opacity: 0.10; }
        35%     { transform: scale(1.4); opacity: 0.25; }
        70%     { transform: scale(0.9); opacity: 0.14; }
      }
      @keyframes shimmer {
        0%,100% { transform: rotate(0deg); opacity: 0.3; }
        50%     { transform: rotate(180deg); opacity: 0.6; }
      }
    `}</style>
    <div style={{ minHeight: "100vh", background: "#02040a", color: "#f8feff", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 32px", maxWidth: 640, margin: "0 auto" }}>

        {/* Continuity Signal */}
        <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 72, height: 72, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 30%, transparent 70%)",
            filter: "blur(8px)", animation: "haloBreathe 5s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 32, height: 32, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(144,200,255,0.16) 0%, rgba(34,211,238,0.04) 50%, transparent 100%)",
            animation: "ringBreathe 4s ease-in-out infinite" }} />
          <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(144,200,255,0.22) 0%, rgba(34,211,238,0.10) 40%, transparent 100%)",
            animation: "shimmer 4s ease-in-out infinite" }} />
          <div style={{ position: "relative", width: 3, height: 3, borderRadius: "50%",
            background: "#e8f4ff",
            boxShadow: "0 0 6px rgba(144,200,255,0.9), 0 0 14px rgba(34,211,238,0.5), 0 0 28px rgba(144,200,255,0.2)",
            animation: "coreBreathe 3s ease-in-out infinite" }} />
        </div>

        <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2rem)", fontWeight: 300, letterSpacing: "0.03em", color: "#fff", margin: "0 0 10px" }}>The Continuity Lab™</h1>
        <p style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)", color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
          Researching continuity<br />
          as a verifiable property<br />
          of the digital world.
        </p>

        {/* Narrative hook */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 36px" }}>
          Today's internet can verify identity. It cannot verify continuity — the property that a digital subject is the same physically embodied entity across time. The Continuity Lab explores whether continuity can become a measurable property rather than an assumption.
        </p>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://github.com/myshapeprotocol" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>GitHub</a>
          <a href="https://huggingface.co/ContinuityLab-Org" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>HuggingFace</a>
          <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>npm</a>
          <a href="https://www.myshape.com/research" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>Research Hub</a>
        </div>
      </div>

      {/* Evidence Grid + Narrative */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 56px" }}>

        {/* By the Numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 8 }}>
          {[
            { n: "576", label: "Experiments" },
            { n: "2", label: "RFCs" },
            { n: "7", label: "Research Notes" },
            { n: "121", label: "Tests" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "20px 12px", border: "1px solid rgba(144,200,255,0.08)", background: "rgba(144,200,255,0.015)" }}>
              <div style={{ fontSize: 28, fontWeight: 300, color: "#90c8ff", marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.12)", marginBottom: 48 }}>Last updated 2026-07-20</div>

        {/* Specifications */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Specifications</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 36 }}>
          {[
            { prefix: "RFC-0001", title: "Motion Signature Format", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
            { prefix: "RFC-0002", title: "Continuity Proof Format", href: "https://www.myshape.com/research/notes/006-continuity-proof-rfc" },
          ].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(144,200,255,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div>
                <span style={{ color: "rgba(144,200,255,0.55)", fontWeight: 500, marginRight: 12, fontSize: 10 }}>{p.prefix}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.title}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Research Notes */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Research Notes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 36 }}>
          {[
            { prefix: "RN-003", title: "Cross-Modal Binding — 576-run validation", href: "https://www.myshape.com/research/notes/003-cross-modal-binding" },
            { prefix: "RN-002", title: "PES Benchmark v0.2", href: "https://www.myshape.com/research/notes/002-pes-benchmark" },
            { prefix: "RN-001", title: "The Continuity Problem", href: "https://www.myshape.com/research/notes/001-the-continuity-problem" },
          ].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(144,200,255,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div>
                <span style={{ color: "rgba(144,200,255,0.55)", fontWeight: 500, marginRight: 12, fontSize: 10 }}>{p.prefix}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.title}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Research Records */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Research Records</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 48 }}>
          {[
            { prefix: "FD-001", title: "Frame Rate Hypothesis — failed experiment", href: "https://www.myshape.com/research/notes/005-failure-report-10fps" },
            { prefix: "DL-001", title: "Direction Asymmetry in EE-003", href: "https://www.myshape.com/research/notes/007-ee003-direction-asymmetry" },
          ].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(144,200,255,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div>
                <span style={{ color: "rgba(144,200,255,0.55)", fontWeight: 500, marginRight: 12, fontSize: 10 }}>{p.prefix}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.title}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Evidence Engines */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Evidence Engines</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 48 }}>
          {[
            { name: "Presence Detection", engine: "EE-001", rate: "100% floor", href: "https://www.myshape.com/research/fusion" },
            { name: "Causal Coupling", engine: "EE-002", rate: "58% · N=316", href: "https://www.myshape.com/research/causal-coupling" },
            { name: "Gyroscope Challenge", engine: "EE-003", rate: "59% · N=200", href: "https://www.myshape.com/research/challenge-response" },
            { name: "Dual-Engine Pipeline", engine: "VS-001", rate: "93% · N=60", href: "https://www.myshape.com/research/protocol-verify" },
          ].map((e) => (
            <a key={e.engine} href={e.href} style={{ display: "block", padding: "16px 14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", fontSize: 12, textDecoration: "none", transition: "border-color 0.2s, background 0.2s" }}
              onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; ev.currentTarget.style.background = "rgba(144,200,255,0.03)"; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; ev.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}>
              <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 400, marginBottom: 6 }}>{e.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ color: "rgba(144,200,255,0.4)", fontSize: 10, fontWeight: 500 }}>{e.engine}</span>
                <span style={{ color: "rgba(63,185,80,0.6)", fontSize: 11 }}>{e.rate}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Open Source */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Open Source</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
          {[
            { label: "npm install @thecontinuitylab/myshape", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },
            { label: "v0.1.1", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },
            { label: "MIT License", href: "https://github.com/myshapeprotocol/myshape-protocol" },
            { label: "121 tests", href: "https://github.com/myshapeprotocol/myshape-protocol/tree/master/src/lib/evidence" },
            { label: "RFC-driven", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
          ].map((t) => (
            <a key={t.label} href={t.href} style={{ padding: "6px 14px", border: "1px solid rgba(144,200,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.35)", borderRadius: 2, textDecoration: "none", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; e.currentTarget.style.color = "rgba(144,200,255,0.7)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
              {t.label}
            </a>
          ))}
        </div>

        {/* Principles */}
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.22)", lineHeight: 2.4, marginBottom: 48, textAlign: "center" }}>
          <p style={{ margin: 0 }}>We test hypotheses. We do not defend them.</p>
          <p style={{ margin: 0 }}>We publish limitations before we publish claims.</p>
          <p style={{ margin: 0 }}>We publish failures alongside successes.</p>
          <p style={{ margin: 0 }}>Evidence precedes belief.</p>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textAlign: "center", paddingBottom: 48 }}>
          <a href="https://www.myshape.com" style={{ color: "rgba(144,200,255,0.25)", textDecoration: "none" }}>MyShape Protocol™</a>
          <span style={{ margin: "0 10px" }}>·</span>
          <span>The Continuity Lab™, 2026</span>
        </div>
      </div>
    </div>
    </>
  );
}

"use client";

export default function LabPage() {
  const linkStyle = (color = "rgba(144,200,255,0.12)") => ({
    display: "block", padding: "12px 16px", border: `1px solid ${color}`,
    color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 13,
    letterSpacing: "0.03em", background: "rgba(144,200,255,0.015)",
  });

  return (
    <>
    <style>{`@keyframes breathe{0%,100%{opacity:0.7;transform:scale(0.8);box-shadow:0 0 10px #90c8ff,0 0 28px rgba(144,200,255,0.5),0 0 56px rgba(144,200,255,0.25)}25%{opacity:1;transform:scale(1.1);box-shadow:0 0 12px #a3d3ff,0 0 36px rgba(144,200,255,0.7),0 0 72px rgba(144,200,255,0.4)}50%{opacity:1;transform:scale(1.6);box-shadow:0 0 14px #b8e0ff,0 0 44px rgba(144,200,255,0.8),0 0 88px rgba(144,200,255,0.5)}75%{opacity:0.8;transform:scale(1);box-shadow:0 0 10px #90c8ff,0 0 30px rgba(144,200,255,0.5),0 0 60px rgba(144,200,255,0.3)}}@keyframes ringPulse{0%,100%{transform:scale(1);opacity:0.25}50%{transform:scale(1.4);opacity:0.5}}`}</style>
    <div style={{ minHeight: "100vh", background: "#02040a", color: "#f8feff", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 48px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle, rgba(144,200,255,0.2) 0%, rgba(144,200,255,0.04) 60%, transparent 100%)", margin: "0 auto 40px", display: "flex", alignItems: "center", justifyContent: "center", animation: "ringPulse 5s ease-in-out infinite" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#d0e8ff", boxShadow: "0 0 10px #90c8ff, 0 0 28px rgba(144,200,255,0.5), 0 0 56px rgba(144,200,255,0.25)", animation: "breathe 4s ease-in-out infinite" }} />
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2rem)", fontWeight: 300, letterSpacing: "0.03em", color: "#fff", margin: "0 0 12px" }}>The Continuity Lab</h1>
        <p style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)", color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 32px" }}>
          Researching continuity as a verifiable property of the digital world.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://github.com/myshapeprotocol" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>GitHub</a>
          <a href="https://huggingface.co/TheContinuityLab" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>HuggingFace</a>
          <a href="https://www.npmjs.com/package/myshape" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>npm</a>
          <a href="https://www.myshape.com/research" style={{ fontSize: 12, color: "rgba(144,200,255,0.5)", textDecoration: "none", letterSpacing: "0.06em" }}>Research Hub</a>
        </div>
      </div>

      {/* By the Numbers */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 56 }}>
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

        {/* Published Research */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 16 }}>Published Research</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 40 }}>
          {[
            { id: "RFC-0001", title: "Motion Signature Format", type: "Specification", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
            { id: "RFC-0002", title: "Continuity Proof Format", type: "Specification", href: "https://www.myshape.com/research/notes/006-continuity-proof-rfc" },
            { id: "RN-003", title: "Cross-Modal Binding — 576-run validation", type: "Research Note", href: "https://www.myshape.com/research/notes/003-cross-modal-binding" },
            { id: "RN-002", title: "PES Benchmark v0.2", type: "Research Note", href: "https://www.myshape.com/research/notes/002-pes-benchmark" },
            { id: "RN-001", title: "The Continuity Problem", type: "Research Note", href: "https://www.myshape.com/research/notes/001-the-continuity-problem" },
            { id: "FD-001", title: "Frame Rate Hypothesis (failed experiment)", type: "Failure Report", href: "https://www.myshape.com/research/notes/005-failure-report-10fps" },
            { id: "DL-001", title: "Direction Asymmetry in EE-003", type: "Decision Log", href: "https://www.myshape.com/research/notes/007-ee003-direction-asymmetry" },
          ].map((p) => (
            <a key={p.id} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(144,200,255,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <span style={{ color: "rgba(144,200,255,0.55)", fontWeight: 500, marginRight: 12 }}>{p.id}</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.title}</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{p.type}</span>
            </a>
          ))}
        </div>

        {/* Evidence Engines */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 16 }}>Evidence Engines</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, marginBottom: 56 }}>
          {[
            { engine: "EE-001", name: "Presence Detection", rate: "100% floor", href: "https://www.myshape.com/research/fusion" },
            { engine: "EE-002", name: "Causal Coupling", rate: "58% · N=316", href: "https://www.myshape.com/research/causal-coupling" },
            { engine: "EE-003", name: "Gyroscope Challenge", rate: "59% · N=200", href: "https://www.myshape.com/research/challenge-response" },
            { engine: "VS-001", name: "Dual-Engine Pipeline", rate: "93% · N=60", href: "https://www.myshape.com/research/protocol-verify" },
          ].map((e) => (
            <a key={e.engine} href={e.href} style={{ display: "block", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", fontSize: 11, textDecoration: "none", transition: "border-color 0.2s, background 0.2s" }}
              onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; ev.currentTarget.style.background = "rgba(144,200,255,0.03)"; }}
              onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; ev.currentTarget.style.background = "rgba(255,255,255,0.01)"; }}
            >
              <div style={{ color: "rgba(144,200,255,0.5)", fontWeight: 500, marginBottom: 4 }}>{e.engine}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{e.name}</div>
              <div style={{ color: "rgba(63,185,80,0.6)", fontSize: 10 }}>{e.rate}</div>
            </a>
          ))}
        </div>

        {/* Open Source */}
        <div style={{ fontSize: 10, color: "rgba(144,200,255,0.4)", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 16 }}>Open Source</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 56 }}>
          {[
            { label: "npm install myshape", href: "https://www.npmjs.com/package/myshape" },
            { label: "MIT License", href: "https://github.com/myshapeprotocol/myshape-protocol/blob/master/LICENSE" },
            { label: "121 tests", href: "https://github.com/myshapeprotocol/myshape-protocol/tree/master/src/lib/evidence" },
            { label: "Research-first", href: "https://www.myshape.com/research" },
            { label: "RFC-driven", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
          ].map((t) => (
            <a key={t.label} href={t.href} style={{ padding: "6px 14px", border: "1px solid rgba(144,200,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.35)", borderRadius: 2, textDecoration: "none", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; e.currentTarget.style.color = "rgba(144,200,255,0.7)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >{t.label}</a>
          ))}
        </div>

        {/* Principles */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 2.2, marginBottom: 56 }}>
          <p style={{ margin: 0 }}>We test hypotheses. We do not defend them.</p>
          <p style={{ margin: 0 }}>We publish limitations before we publish claims.</p>
          <p style={{ margin: 0 }}>We publish failures alongside successes.</p>
          <p style={{ margin: 0 }}>Evidence precedes belief.</p>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: "0.08em", textAlign: "center", paddingBottom: 48 }}>
          <a href="https://www.myshape.com" style={{ color: "rgba(144,200,255,0.25)", textDecoration: "none" }}>MyShape Protocol</a>
          <span style={{ margin: "0 10px" }}>·</span>
          <span>The Continuity Lab, 2026</span>
        </div>
      </div>
    </div>
    </>
  );
}

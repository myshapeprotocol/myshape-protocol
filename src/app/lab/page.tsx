"use client";

export default function LabPage() {
  return (
    <>
    <style>{`
      @keyframes haloSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes haloBreathe {
        0%,100% { opacity: 0.18; filter: blur(1.5px); }
        50%     { opacity: 0.40; filter: blur(0.5px); }
      }
      @keyframes corePulse {
        0%,100% { opacity: 0.4; transform: scale(0.7); }
        45%     { opacity: 1;   transform: scale(1.5); }
        70%     { opacity: 0.6; transform: scale(0.9); }
      }
      @keyframes scanLine {
        0%   { stroke-dashoffset: 188; }
        50%  { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -188; }
      }
      @keyframes textFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .fade-in { animation: textFadeIn 0.8s ease-out forwards; opacity: 0; }
      .fade-in-1 { animation-delay: 0.3s; }
      .fade-in-2 { animation-delay: 0.5s; }
      .fade-in-3 { animation-delay: 0.7s; }
    `}</style>
    <div style={{ minHeight: "100vh", background: "#060B14", color: "#E6EDF7", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 32px", maxWidth: 720, margin: "0 auto" }}>

        {/* Logo image — includes title, subtitle, and icon */}
        <div style={{ margin: "0 auto 36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/lab-sigil.png" alt="The Continuity Lab · Continuity · Evidence · Trust"
            style={{ maxWidth: "min(100%, 420px)", height: "auto", objectFit: "contain" }} />
        </div>

        {/* Tagline */}
        <p className="fade-in fade-in-2"
          style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)", color: "#94A3B8", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 28px" }}>
          Researching continuity<br />
          as a verifiable property<br />
          of the digital world.
        </p>

        {/* Narrative hook */}
        <p className="fade-in fade-in-3"
          style={{ fontSize: 13, color: "#64748B", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 36px" }}>
          Today's internet can verify identity. It cannot verify continuity — the property that a digital subject is the same physically embodied entity across time. The Continuity Lab explores whether continuity can become a measurable property rather than an assumption.
        </p>

        <p className="fade-in fade-in-3"
          style={{ fontSize: 12, color: "rgba(96,165,250,0.45)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
          The Continuity Lab is the research organization behind the <a href="https://www.myshape.com/research/notes/008-continuity-protocol-core" style={{ color: "rgba(96,165,250,0.55)", textDecoration: "underline" }}>Continuity Protocol (CPS-0001)</a>. MyShape is the first protocol implementation, maintained separately.
        </p>

        {/* Nav links */}
        <div className="fade-in fade-in-3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://github.com/myshapeprotocol" style={{ fontSize: 12, color: "rgba(96,165,250,0.6)", textDecoration: "none", letterSpacing: "0.06em" }}>GitHub</a>
          <a href="https://huggingface.co/ContinuityLab-Org" style={{ fontSize: 12, color: "rgba(96,165,250,0.6)", textDecoration: "none", letterSpacing: "0.06em" }}>HuggingFace</a>
          <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" style={{ fontSize: 12, color: "rgba(96,165,250,0.6)", textDecoration: "none", letterSpacing: "0.06em" }}>npm</a>
          <a href="https://www.myshape.com/research" style={{ fontSize: 12, color: "rgba(96,165,250,0.6)", textDecoration: "none", letterSpacing: "0.06em" }}>Research Hub</a>
          <a href="/lab/playground" style={{ fontSize: 12, color: "rgba(34,211,238,0.55)", textDecoration: "none", letterSpacing: "0.06em" }}>Playground ▸</a>
          <a href="/lab/discovery-survey" style={{ fontSize: 12, color: "rgba(212,175,55,0.6)", textDecoration: "none", letterSpacing: "0.06em" }}>Discovery Survey ▸</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 8 }}>
          {[{ n: "576", label: "Experiments" },{ n: "1", label: "CPS" },{ n: "2", label: "RFCs" },{ n: "7", label: "Notes" },{ n: "192", label: "Tests" }].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "20px 12px", border: "1px solid #1E293B", background: "#0B1220" }}>
              <div style={{ fontSize: 28, fontWeight: 300, color: "#60A5FA", marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.30)", marginBottom: 48 }}>Last updated 2026-07-22</div>

        <div style={{ fontSize: 11, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Specifications</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 36 }}>
          {[{ prefix: "CPS-0001", title: "Continuity Protocol Core · v1.0-RC", href: "https://www.myshape.com/research/notes/008-continuity-protocol-core" },{ prefix: "RFC-0001", title: "Motion Signature Format", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },{ prefix: "RFC-0002", title: "Continuity Proof Format", href: "https://www.myshape.com/research/notes/006-continuity-proof-rfc" }].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1E293B", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div><span style={{ color: "#60A5FA", fontWeight: 500, marginRight: 12, fontSize: 11 }}>{p.prefix}</span><span style={{ color: "#A7B4C6" }}>{p.title}</span></div>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Research Notes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 36 }}>
          {[{ prefix: "RN-003", title: "Cross-Modal Binding — 576-run validation", href: "https://www.myshape.com/research/notes/003-cross-modal-binding" },{ prefix: "RN-002", title: "PES Benchmark v0.2", href: "https://www.myshape.com/research/notes/002-pes-benchmark" },{ prefix: "RN-001", title: "The Continuity Problem", href: "https://www.myshape.com/research/notes/001-the-continuity-problem" }].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1E293B", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div><span style={{ color: "#60A5FA", fontWeight: 500, marginRight: 12, fontSize: 11 }}>{p.prefix}</span><span style={{ color: "#A7B4C6" }}>{p.title}</span></div>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Research Records</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 48 }}>
          {[{ prefix: "FD-001", title: "Frame Rate Hypothesis — failed experiment", href: "https://www.myshape.com/research/notes/005-failure-report-10fps" },{ prefix: "DL-001", title: "Direction Asymmetry in EE-003", href: "https://www.myshape.com/research/notes/007-ee003-direction-asymmetry" }].map((p) => (
            <a key={p.prefix} href={p.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1E293B", fontSize: 12, textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.04)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div><span style={{ color: "#60A5FA", fontWeight: 500, marginRight: 12, fontSize: 11 }}>{p.prefix}</span><span style={{ color: "#A7B4C6" }}>{p.title}</span></div>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Evidence Engines</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 48 }}>
          {[{ name: "Presence Detection", engine: "EE-001", rate: "100% floor", href: "https://www.myshape.com/research/fusion" },{ name: "Causal Coupling", engine: "EE-002", rate: "58% · N=316", href: "https://www.myshape.com/research/causal-coupling" },{ name: "Gyroscope Challenge", engine: "EE-003", rate: "59% · N=200", href: "https://www.myshape.com/research/challenge-response" },{ name: "Dual-Engine Pipeline", engine: "VS-001", rate: "93% · N=60", href: "https://www.myshape.com/research/protocol-verify" }].map((e) => (
            <a key={e.engine} href={e.href} style={{ display: "block", padding: "16px 14px", border: "1px solid #1E293B", background: "#0B1220", fontSize: 12, textDecoration: "none", transition: "border-color 0.2s, background 0.2s" }}
              onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = "rgba(96,165,250,0.3)"; ev.currentTarget.style.background = "#0E1624"; }} onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = "#1E293B"; ev.currentTarget.style.background = "#0B1220"; }}>
              <div style={{ color: "#A7B4C6", fontWeight: 400, marginBottom: 6 }}>{e.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ color: "#60A5FA", fontSize: 11, fontWeight: 500 }}>{e.engine}</span><span style={{ color: "rgba(96,165,250,0.7)", fontSize: 11 }}>{e.rate}</span></div>
            </a>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "#60A5FA", textTransform: "uppercase", letterSpacing: "0.3em", marginBottom: 12 }}>Open Source</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
          {[{ label: "npm install @thecontinuitylab/myshape", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },{ label: "v0.2.0", href: "https://www.npmjs.com/package/@thecontinuitylab/myshape" },{ label: "Apache 2.0", href: "https://github.com/myshapeprotocol/myshape-protocol" },{ label: "192 tests", href: "https://github.com/myshapeprotocol/myshape-protocol/tree/master/src/lib/evidence" },{ label: "RFC-driven", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" }].map((t) => (
            <a key={t.label} href={t.href} style={{ padding: "6px 14px", border: "1px solid #1E293B", fontSize: 11, color: "#64748B", borderRadius: 2, textDecoration: "none", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(96,165,250,0.4)"; e.currentTarget.style.color = "#94A3B8"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E293B"; e.currentTarget.style.color = "#64748B"; }}>{t.label}</a>
          ))}
        </div>

        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 2.4, marginBottom: 48, textAlign: "center" }}>
          <p style={{ margin: 0 }}>We test hypotheses. We do not defend them.</p>
          <p style={{ margin: 0 }}>We publish limitations before we publish claims.</p>
          <p style={{ margin: 0 }}>We publish failures alongside successes.</p>
          <p style={{ margin: 0 }}>Evidence precedes belief.</p>
        </div>

        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", letterSpacing: "0.08em", textAlign: "center", paddingBottom: 48 }}>
          <a href="https://www.myshape.com" style={{ color: "rgba(96,165,250,0.3)", textDecoration: "none" }}>MyShape Protocol</a>
          <span style={{ margin: "0 10px" }}>·</span>
          <span>The Continuity Lab, 2026</span>
        </div>
      </div>
    </div>
    </>
  );
}

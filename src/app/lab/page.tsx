import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Continuity Lab",
  description: "Researching continuity as a verifiable property of the digital world.",
  openGraph: {
    title: "The Continuity Lab",
    description: "Researching continuity as a verifiable property of the digital world.",
    url: "https://thecontinuitylab.org",
    siteName: "The Continuity Lab",
    type: "website",
  },
};

export default function LabPage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#02040a" />
        <link rel="icon" href="/identity-sigil.jpg" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#02040a", color: "#f8feff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>

          {/* Sigil */}
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle, rgba(144,200,255,0.3) 0%, rgba(144,200,255,0.05) 70%, transparent 100%)", marginBottom: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#90c8ff", boxShadow: "0 0 16px #90c8ff, 0 0 32px rgba(144,200,255,0.5)" }} />
          </div>

          {/* Tagline */}
          <h1 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)", fontWeight: 300, letterSpacing: "0.03em", color: "#fff", lineHeight: 1.35, margin: "0 0 16px" }}>
            The Continuity Lab
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 480, margin: "0 0 56px", fontWeight: 300 }}>
            Researching continuity<br />
            as a verifiable property<br />
            of the digital world.
          </p>

          {/* Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360, marginBottom: 56 }}>
            {[
              { label: "Research Notes", href: "https://www.myshape.com/research" },
              { label: "RFC-0001 · Motion Signature Format", href: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
              { label: "RFC-0002 · Continuity Proof Format", href: "https://www.myshape.com/research/notes/006-continuity-proof-rfc" },
              { label: "Benchmarks", href: "https://www.myshape.com/research/benchmarks" },
              { label: "Active Prototypes", href: "https://www.myshape.com/research#prototypes" },
              { label: "Research Agenda", href: "https://www.myshape.com/research/agenda" },
            ].map((l) => (
              <a key={l.label} href={l.href}
                style={{
                  display: "block", padding: "14px 20px", border: "1px solid rgba(144,200,255,0.12)",
                  color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 14,
                  letterSpacing: "0.04em", transition: "all 0.3s",
                  background: "rgba(144,200,255,0.02)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; e.currentTarget.style.color = "#90c8ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Principles */}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 2, marginBottom: 56 }}>
            <p style={{ margin: 0 }}>We test hypotheses. We do not defend them.</p>
            <p style={{ margin: 0 }}>We publish limitations before we publish claims.</p>
            <p style={{ margin: 0 }}>We publish failures alongside successes.</p>
            <p style={{ margin: 0 }}>Evidence precedes belief.</p>
          </div>

          {/* Footer */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
            <a href="https://www.myshape.com" style={{ color: "rgba(144,200,255,0.3)", textDecoration: "none" }}>MyShape Protocol</a>
            <span style={{ margin: "0 12px" }}>·</span>
            <a href="https://github.com/myshapeprotocol" style={{ color: "rgba(144,200,255,0.3)", textDecoration: "none" }}>GitHub</a>
            <span style={{ margin: "0 12px" }}>·</span>
            <span>The Continuity Lab, 2026</span>
          </div>

        </main>
      </body>
    </html>
  );
}

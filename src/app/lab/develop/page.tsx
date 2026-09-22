import Link from "next/link";

export const metadata = {
  title: "Develop — Continuity Lab",
  description: "SDK, playground, and developer resources for building with continuity.",
};

export default function DevelopPage() {
  const linkStyle: React.CSSProperties = {
    color: "rgba(0,229,255,0.78)",
    textDecoration: "none",
    border: "1px solid rgba(0,229,255,0.22)",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 11,
    letterSpacing: "0.08em",
    fontFamily: "var(--font-geist-mono), monospace",
    textTransform: "uppercase",
    transition: "all 0.25s",
  };
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 20px", fontFamily: "var(--font-geist-mono), monospace" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#90c8ff" }}>Develop</h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
        SDK, playground, and developer resources for building with continuity.
      </p>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(0,229,255,0.1)" }}>
        Developer documentation and tools are in progress.
      </p>
      <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
        <Link href="/lab/playground" style={linkStyle}>Lab Playground</Link>
        <Link
          href="https://www.myshape.com/developers"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          MyShape Developer Docs
        </Link>
      </div>
    </main>
  );
}

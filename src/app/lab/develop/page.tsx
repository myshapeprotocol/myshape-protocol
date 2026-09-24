import type { Metadata } from "next";
import Link from "next/link";

// The CPS-0001 developer surface. Deliberately NOT SDK-first: the protocol is
// engine-independent, so the reproduction path is
// specification → test vectors → reference verifier → cps-verify → reproduce.
// The npm SDK is one optional consumer of that path, never the only one.
//
// Canonical is the LAB public URL: src/proxy.ts rewrites
// thecontinuitylab.org/develop → /lab/develop (LAB_CANONICAL_REWRITES).
export const metadata: Metadata = {
  title: "Develop — The Continuity Lab",
  description:
    "Reproduce CPS-0001 yourself: specification, frozen test vectors, reference verifier, cps-verify CLI, and the reproduction guide. Engine-independent — the SDK is not the only verification path.",
  alternates: { canonical: "https://thecontinuitylab.org/develop" },
};

const REPO = "https://github.com/myshapeprotocol/myshape-protocol";

const JOURNEY: { step: string; label: string; desc: string; href: string; ext: boolean }[] = [
  {
    step: "01",
    label: "Specification",
    desc: "CPS-0001 Continuity Protocol Core v1.0-RC1 — normative serialization plus the V₁–V₇ verification rules.",
    href: "/lab/protocols/cps-0001",
    ext: false,
  },
  {
    step: "02",
    label: "Test vectors",
    desc: "Frozen reference receipts (valid and invalid) with recorded SHA-256 hashes. The file bytes are normative.",
    href: `${REPO}/tree/master/continuity-protocol/test-vectors`,
    ext: true,
  },
  {
    step: "03",
    label: "Reference verifier",
    desc: "Build and verify a receipt in the browser, or read the engine-independent reference implementation (no engine imports).",
    href: "/lab/research/protocol-verify",
    ext: false,
  },
  {
    step: "04",
    label: "cps-verify",
    desc: "Standalone CLI reference verifier. Current CLI scope is V₁–V₆ — it has no V₇ chain traversal, so chain integrity needs the reference helper.",
    href: `${REPO}/tree/master/continuity-protocol/cli`,
    ext: true,
  },
  {
    step: "05",
    label: "Reproduce",
    desc: "Create a receipt from any evidence engine, verify it, and run the frozen conformance suite. No MyShape required.",
    href: `${REPO}/blob/master/continuity-protocol/QUICKSTART.md`,
    ext: true,
  },
];

const BOUNDARIES: string[] = [
  "SDK 0.3.0 — evaluation only. It predates the Batch-2D hardening; for hardened verification use the repository reference verifier / cps-verify.",
  "The SDK is not the only verification path. CPS-0001 is engine-independent: any conforming verifier can validate a receipt.",
  "CPS-0001 verifies receipt integrity and continuity assertions. It does not prove a subject is a specific human, guarantee identity, or attest to issuer trustworthiness.",
];

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
  const cardStyle: React.CSSProperties = {
    display: "block",
    padding: "16px 18px",
    textDecoration: "none",
    border: "1px solid rgba(0,229,255,0.12)",
    borderRadius: 10,
    background: "rgba(0,229,255,0.02)",
    transition: "border-color 0.2s",
  };
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 20px", fontFamily: "var(--font-geist-mono), monospace" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: "#90c8ff" }}>Develop</h1>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
        Reproduce CPS-0001 without trusting the issuer — or MyShape. The protocol is
        engine-independent; this is the order in which to reproduce it.
      </p>

      {/* Reproduction path — specification → test vectors → verifier → cps-verify → reproduce */}
      <ol style={{ listStyle: "none", padding: 0, margin: "36px 0 0", display: "grid", gap: 12 }}>
        {JOURNEY.map((j) => {
          const card = (
            <>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, color: "rgba(0,229,255,0.5)", minWidth: 20 }}>{j.step}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f8feff" }}>{j.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(0,229,255,0.35)" }}>
                  {j.ext ? "↗" : "→"}
                </span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: "6px 0 0 32px" }}>
                {j.desc}
              </p>
            </>
          );
          return (
            <li key={j.step}>
              {j.ext ? (
                <a href={j.href} target="_blank" rel="noopener noreferrer" style={cardStyle}>{card}</a>
              ) : (
                <Link href={j.href} style={cardStyle}>{card}</Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Boundaries — what this path does NOT establish */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(0,229,255,0.1)" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,229,255,0.4)", margin: "0 0 12px" }}>
          Boundaries
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
          {BOUNDARIES.map((b) => (
            <li key={b} style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>{b}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
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
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "20px 0 0" }}>
        Repository:{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(0,229,255,0.6)", textDecoration: "none" }}>
          github.com/myshapeprotocol/myshape-protocol
        </a>
      </p>
    </main>
  );
}

"use client";

import React from "react";
import Link from "next/link";

const HERO_BADGES: { t: string; c: string; b: string }[] = [
  { t: "CPS-0002", c: "#90c8ff", b: "rgba(144,200,255,0.3)" },
  { t: "cps-hsa-0.1-draft", c: "rgba(255,255,255,0.45)", b: "rgba(255,255,255,0.15)" },
  { t: "PROTOCOL CORE: FROZEN AS PROTOTYPE DRAFT ARTIFACT", c: "rgba(52,211,153,0.85)", b: "rgba(52,211,153,0.3)" },
  { t: "TRUST FRAMEWORK: NOT FROZEN", c: "rgba(212,175,55,0.85)", b: "rgba(212,175,55,0.3)" },
];

const CHAIN_STEPS: { k: string; d: string }[] = [
  { k: "CPS-0001", d: "Defines the Continuity Receipt — a signed, engine-independent statement of continuity over a bounded interval." },
  { k: "Continuity Receipt", d: "The receipt object that CPS-0002 assertions cryptographically reference by hash, id, and subject." },
  { k: "CPS-0002", d: "An attester-signed assertion bound to that receipt, to a subject, to an evidence payload digest, and to a validity period." },
  { k: "Cryptographic Verification", d: "A conforming verifier checks structure, Ed25519 signature, payload digest, receipt binding, and expiry." },
  { k: "VALID / INVALID", d: "The cryptographic verdict. VALID means the assertion verifies; it does not grant trust." },
  { k: "Trust Policy", d: "The deployment layer that maps a VALID assertion to a trust decision (which attesters, which keys, which policy)." },
  { k: "TRUSTED / UNKNOWN / NOT TRUSTED", d: "The policy outcome. A VALID assertion may still be UNKNOWN or NOT TRUSTED in a given deployment." },
  { k: "Application Decision", d: "The relying application decides whether to accept the assertion for its specific purpose." },
];

const VALID_MEANS: string[] = [
  "Structurally conformant with the CPS-0002 assertion schema (unknown root properties are rejected)",
  "Cryptographically valid — the Ed25519 signature verifies against the 12-field canonical payload",
  "Internally consistent — the evidence payload digest recomputes to the signed value",
  "Correctly bound to the referenced Continuity Receipt (receipt hash, receipt id, subject id)",
  "Within its assertion validity period",
];

const VALID_NOT: string[] = [
  "Attester authorization or trust",
  "Evidence truth",
  "Human presence",
  "Biological humanity",
  "Liveness",
  "Single-use",
  "Universal replay protection",
  "Application acceptance",
];

const STATUS_ROWS: { k: string; v: string; n: string }[] = [
  { k: "Protocol Core", v: "FROZEN AS PROTOTYPE DRAFT ARTIFACT", n: "frozen as cps-hsa-0.1-draft; spec prose DRAFT / NOT FROZEN" },
  { k: "Protocol type", v: "cps-hsa-0.1-draft", n: "assertion protocolType" },
  { k: "Trust Framework", v: "NOT FROZEN / OUT OF SCOPE", n: "trust policy, registry, revocation, aggregation remain outside the core" },
  { k: "Freeze commit", v: "d06b907", n: "CPS-0002: freeze protocol core" },
  { k: "Freeze tag", v: "cps-hsa-0.1-draft", n: "annotated tag" },
];

const ARTIFACTS: { k: string; h: string; s: string }[] = [
  { k: "Concept", h: "continuity-protocol/CPS-0002_CONCEPT.md", s: "Problem boundary, why CPS-0002 exists" },
  { k: "Verifier Contract", h: "continuity-protocol/CPS-0002-VERIFIER-CONTRACT.md", s: "Normative verification algorithm and VALID semantics" },
  { k: "Trust Policy", h: "continuity-protocol/CPS-0002-TRUST-POLICY.md", s: "Attester / deployment / application boundaries" },
  { k: "Threat Model", h: "continuity-protocol/CPS-0002-THREAT-MODEL.md", s: "Security boundary and residual risks" },
  { k: "Trust Audit", h: "continuity-protocol/CPS-0002-TRUST-AUDIT.md", s: "What VALID does and does not establish" },
  { k: "Interoperability Audit", h: "continuity-protocol/CPS-0002-INTEROPERABILITY-AUDIT.md", s: "Cross-implementation findings" },
  { k: "Assertion Schema", h: "continuity-protocol/cps-0002-assertion.schema.json", s: "JSON Schema (required fields, root closure)" },
  { k: "Reference Verifier", h: "continuity-protocol/cps-0002-toy-attester/verifier.ts", s: "Reference implementation" },
  { k: "Independent Second Verifier", h: "continuity-protocol/cps-0002-second-verifier/verifier.ts", s: "Independent implementation, interop proof" },
  { k: "Conformance Suite", h: "continuity-protocol/conformance/cps0002-conformance.test.ts", s: "52 conformance tests" },
  { k: "Interoperability Suite", h: "continuity-protocol/conformance/cps0002-interop.test.ts", s: "39 cross-verifier tests" },
  { k: "Release Notes", h: "continuity-protocol/RELEASE-cps0002-0.1-draft.md", s: "0.1-draft release documentation" },
];

const GITHUB_BLOB = "https://github.com/myshapeprotocol/myshape-protocol/blob/master/";

export default function CPS0002Client() {
  return (
    <div className="lab-page">
      <main className="lab-main">
        {/* ── Hero ── */}
        <section className="lab-hero" style={{ paddingTop: "clamp(3rem,7vw,6rem)", paddingBottom: "clamp(2rem,5vw,4rem)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 18 }}>
            {HERO_BADGES.map((b) => (
              <span key={b.t} style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, letterSpacing: "0.18em", color: b.c, border: `1px solid ${b.b}`, padding: "4px 10px", borderRadius: 4 }}>{b.t}</span>
            ))}
          </div>
          <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 700, color: "#f8feff", margin: 0, letterSpacing: "-0.02em" }}>CPS-0002 — Human Signal Assertion</h1>
          <p className="lab-subtitle" style={{ maxWidth: 680 }}>
            An attestation layer built on the CPS-0001 Continuity Receipt. CPS-0002 defines how an
            attester-signed assertion can{" "}
            <strong style={{ color: "rgba(0,229,255,0.85)" }}>cryptographically bind</strong> to a
            receipt and be{" "}
            <strong style={{ color: "rgba(0,229,255,0.85)" }}>independently verified</strong>.
          </p>
        </section>
{/* ── Status ── */}
        <section className="lab-section">
          <h2>Status</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {STATUS_ROWS.map((s) => (
              <div key={s.k} style={{ display: "flex", gap: 12, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, background: "rgba(11,18,32,0.4)", alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "rgba(52,211,153,0.7)", minWidth: 130, flexShrink: 0 }}>{s.k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(248,254,255,0.9)" }}>{s.v}</span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>{s.n}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.5)", border: "1px solid rgba(212,175,55,0.25)", background: "rgba(212,175,55,0.04)", borderRadius: 8, padding: "12px 14px" }}>
            <strong style={{ color: "rgba(212,175,55,0.9)" }}>CPS-0002 Protocol Core is frozen as{" "}
            <code style={{ color: "#f8feff" }}>cps-hsa-0.1-draft</code>.</strong> The Trust Framework
            remains outside the frozen core and is not yet frozen. Frozen here means the protocol-core
            semantics (payload, signature, verification, VALID meaning) are fixed; it does not mean the
            broader trust system is complete.
          </p>
        </section>

        {/* ── Relationship to CPS-0001 ── */}
        <section className="lab-section">
          <h2>Relationship to CPS-0001</h2>
          <p>
            CPS-0001 establishes the <em>Continuity Receipt</em> — an engine-independent, signed
            statement that an observer collected sufficient evidence supporting the continuity of a
            subject over a bounded interval.
          </p>
          <p>
            CPS-0002 defines a <em>Human Signal Assertion</em> on top of that receipt: an
            attester-signed statement that cryptographically references the receipt, the subject, the
            attester, the evidence payload digest, and the validity period. Any conforming verifier can
            check the assertion independently — without trusting the underlying evidence as true.
          </p>
        </section>

        {/* ── The Chain ── */}
        <section className="lab-section">
          <h2>The Protocol Chain</h2>
          <div style={{ display: "grid", gap: 1, overflow: "hidden", borderRadius: 10, border: "1px solid rgba(0,229,255,0.12)" }}>
            {CHAIN_STEPS.map((s, i) => (
              <div key={s.k} style={{ display: "flex", gap: 14, padding: "14px 18px", background: i % 2 ? "rgba(0,229,255,0.02)" : "rgba(5,16,37,0.6)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "rgba(0,229,255,0.7)", minWidth: 150, flexShrink: 0 }}>{s.k}</span>
                <div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

{/* ── What VALID means ── */}
        <section className="lab-section">
          <h2>What VALID Means</h2>
          <p>
            A CPS-0002 assertion is <code style={{ color: "rgba(0,229,255,0.9)" }}>VALID</code> when
            a conforming verifier confirms it is:
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {VALID_MEANS.map((li) => (
              <li key={li} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: "rgba(0,229,255,0.7)", flexShrink: 0 }}>▸</span>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── What VALID does NOT mean ── */}
        <section className="lab-section">
          <h2>What VALID Does Not Mean</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
            <code style={{ color: "rgba(0,229,255,0.9)" }}>VALID</code> is a cryptographic verdict,
            not a trust verdict. It does NOT establish:
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {VALID_NOT.map((li) => (
              <li key={li} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: "rgba(244,114,182,0.7)", flexShrink: 0 }}>✕</span>
                <span>{li}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.04)", borderRadius: 8, padding: "12px 14px" }}>
            A <em>Human Signal Assertion</em> <strong style={{ color: "rgba(248,254,255,0.85)" }}>≠ Proof of Human</strong>.
            Whether a VALID assertion is trusted, accepted, or acted upon is a <em>trust policy and
            deployment</em> decision made by the relying application.
          </p>
        </section>

        {/* ── Technical Artifacts ── */}
        <section className="lab-section">
          <h2>Technical Artifacts</h2>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
            Source artifacts are published in the repository under <code>continuity-protocol/</code>.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {ARTIFACTS.map((a) => (
              <a key={a.h} href={`${GITHUB_BLOB}${a.h}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 16px", border: "1px solid rgba(0,229,255,0.1)", borderRadius: 8, background: "rgba(0,229,255,0.02)", textDecoration: "none", alignItems: "baseline", transition: "all 0.2s" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(248,254,255,0.85)" }}>{a.k}</span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>{a.s}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Back to index ── */}
        <section className="lab-section">
          <Link href="/protocols" style={{ fontSize: 12.5, color: "rgba(0,229,255,0.85)", textDecoration: "underline", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ← All Protocols
          </Link>
        </section>
      </main>
    </div>
  );
}
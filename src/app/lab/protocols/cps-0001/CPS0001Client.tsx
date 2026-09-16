"use client";

import React from "react";
import Link from "next/link";
import LabHeader from "@/components/lab/LabHeader";

const V_STEPS: { id: string; check: string; failure: string }[] = [
  { id: "V₁", check: "Schema validity. The receipt MUST conform to the schema defined in §6.1. All REQUIRED fields must be present. Field types must match. interval.coverageMs MUST equal end − start.", failure: "INVALID_SCHEMA" },
  { id: "V₂", check: "Signature validity. The cryptographic signature MUST verify against the issuer's public key. The signature covers all receipt fields except signature itself, serialized in lexicographic key order (§6.4).", failure: "INVALID_SIGNATURE" },
  { id: "V₃", check: "Assertion consistency. The three assertions (§1.1) MUST be internally consistent: if continuityMaintained.value is true, then observationOccurred.value MUST also be true.", failure: "INCONSISTENT_ASSERTIONS" },
  { id: "V₄", check: "Temporal consistency. interval.start MUST be strictly before interval.end. signature.signedAt MUST be ≥ interval.end. expiresAt, if present, MUST be after signature.signedAt.", failure: "TEMPORAL_INCONSISTENCY" },
  { id: "V₅", check: "Evidence reference integrity. For each evidence[i], payloadDigest MUST equal SHA-256(payload). The verifier does not need to inspect payload itself.", failure: "EVIDENCE_TAMPERED" },
  { id: "V₆", check: "Freshness. If expiresAt is present, the current time MUST be before expiresAt. Expired receipts remain verifiable (V₁–V₅) but SHOULD NOT be accepted for live authorization.", failure: "EXPIRED" },
  { id: "V₇", check: "Predecessor reference. If previousReceiptHash is non-null, the verifier MAY traverse the chain to verify longitudinal continuity (§5.1).", failure: "CHAIN_BROKEN" },
];

const NON_GOALS: string[] = [
  "Evidence content validity. V₅ checks that payloadDigest matches payload, but does not check whether the evidence means what the issuer claims it means.",
  "Issuer trustworthiness. The contract verifies that the issuer signed the receipt (V₂). It does not verify whether the issuer should be trusted.",
  "Subject identity. The contract verifies the subject reference is stable within a chain (§5.1). It does not map the subject to a real-world identity.",
  "Revocation status. V₁–V₇ verify the receipt itself. Revocation checking (§4.4) consults an external revocation list.",
];

const FLOW_STEPS: { k: string; d: string }[] = [
  { k: "Human signal", d: "Raw physical motion / sensor signal from a subject during a bounded interval." },
  { k: "Verification", d: "An evidence engine (EE-001, EE-002, EE-003) collects evidence and computes an evidence digest." },
  { k: "Evidence", d: "Evidence payloads are embedded as references in the receipt via payloadDigest (SHA-256)." },
  { k: "Continuity Receipt", d: "A signed object asserting continuity was maintained within confidence bounds." },
  { k: "Cryptographic verification", d: "A conforming verifier runs V₁–V₇ to validate the receipt without trusting the issuer." },
];

const SPEC_ROWS: { k: string; v: string; n: string }[] = [
  { k: "Version", v: "v1.0-RC1", n: "protocolVersion field = \"1.0\"" },
  { k: "Signature payload", v: "13 fields", n: "lexicographic key order → SHA-256 → Ed25519" },
  { k: "Conformance suite", v: "FROZEN", n: "23 assertions · 10 scenarios" },
  { k: "Test vectors", v: "FROZEN", n: "5 reference receipts + invalid cases" },
  { k: "Verification", v: "V₁–V₇", n: "Schema · Signature · Assertion · Temporal · Evidence · Freshness · Chain" },
];

const RESEARCH_LINKS: { k: string; h: string; s: string }[] = [
  { k: "Two-Stage Continuity Verification", h: "/lab/research/notes/009-two-stage-continuity-verification", s: "EE-001 + EE-003" },
  { k: "Direction Asymmetry in EE-003", h: "/lab/research/notes/007-ee003-direction-asymmetry", s: "DL-001" },
  { k: "PES Benchmark", h: "/lab/research/benchmarks", s: "Dashboard" },
  { k: "Dataset", h: "/lab/research/dataset", s: "Open Continuity Dataset" },
  { k: "Causal Coupling (EE-002)", h: "/lab/research/causal-coupling", s: "Experiment" },
  { k: "Challenge-Response (EE-003)", h: "/lab/research/challenge-response", s: "Experiment" },
];

const STATUS_ROWS: { k: string; v: string }[] = [
  { k: "Version", v: "v1.0-RC1" },
  { k: "Spec", v: "FROZEN" },
  { k: "Vectors", v: "FROZEN (5 reference receipts + invalid cases)" },
  { k: "Conformance", v: "FROZEN (23 assertions, 10 scenarios)" },
  { k: "Next", v: "30-day community review → v1.0 final" },
];

const LIMITATIONS: string[] = [
  "Dev-mode CSP temporarily allows unsafe-inline for debugging (disabled in production).",
  "The published npm package @thecontinuitylab/myshape@0.3.0 predates the Batch-2D hardening; the registry version does not yet carry the non-extractable key regime.",
  "Historical receipts signed with the old hex-key format cannot be verified under the new non-extractable key regime.",
  "CPS-0001 verifies receipt integrity and continuity assertions — it does not prove a subject is a specific human, guarantee identity, or attest to issuer trustworthiness.",
];

const HERO_BADGES: { t: string; c: string; b: string }[] = [
  { t: "CPS-0001", c: "#90c8ff", b: "rgba(144,200,255,0.3)" },
  { t: "v1.0-RC1", c: "rgba(255,255,255,0.45)", b: "rgba(255,255,255,0.15)" },
  { t: "SPEC: FROZEN", c: "rgba(52,211,153,0.85)", b: "rgba(52,211,153,0.3)" },
];
export default function CPS0001Client() {
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
          <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 700, color: "#f8feff", margin: 0, letterSpacing: "-0.02em" }}>Continuity Proof Protocol</h1>
          <p className="lab-subtitle" style={{ maxWidth: 640 }}>
            The Continuity Protocol Core — how continuity assertions are{" "}
            <strong style={{ color: "rgba(0,229,255,0.85)" }}>represented</strong>,{" "}
            <strong style={{ color: "rgba(0,229,255,0.85)" }}>exchanged</strong>, and{" "}
            <strong style={{ color: "rgba(0,229,255,0.85)" }}>verified</strong>.
          </p>
        </section>

        {/* ── Normative definition ── */}
        <section className="lab-section">
          <div style={{ border: "1px solid rgba(144,200,255,0.2)", background: "rgba(144,200,255,0.04)", borderRadius: 10, padding: "clamp(18px,3vw,28px)" }}>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, letterSpacing: "0.14em", color: "#90c8ff", margin: "0 0 10px", textTransform: "uppercase" }}>Normative Definition</p>
            <p style={{ fontSize: "clamp(15px,2vw,18px)", lineHeight: 1.7, color: "rgba(248,254,255,0.92)", margin: 0 }}>
              A <em>Continuity Receipt</em> is a cryptographically verifiable statement that an
              observer collected sufficient evidence supporting the continuity of a subject over a
              bounded interval of time.
            </p>
          </div>
        </section>

        {/* ── Protocol Overview ── */}
        <section className="lab-section">
          <h2>Protocol Overview</h2>
          <p>
            A Continuity Protocol does not standardize <em>how</em> continuity is measured — it
            standardizes <em>how continuity assertions are represented, exchanged, and verified</em>.
            This specification is implementation-independent: it does not reference specific
            sensors, algorithms, or evidence engines. Those are defined in subordinate
            specifications (RFC-0001, RFC-0002) and engine-specific documents (EE-001, EE-002, EE-003).
          </p>
          <p>
            The receipt does not claim {"\u201c"}this is Alice.{"\u201d"} It claims only that the subject
            at time <code>t₁</code> is the same subject as at time <code>t₀</code> — within the
            confidence bounds of the observing evidence engines. Identity binding is a separate
            concern, outside the protocol. A system can verify continuity without knowing — or
            storing — the subject's identity.
          </p>
        </section>

        {/* ── Protocol Flow ── */}
        <section className="lab-section">
          <h2>Protocol Flow</h2>
          <div style={{ display: "grid", gap: 1, overflow: "hidden", borderRadius: 10, border: "1px solid rgba(0,229,255,0.12)" }}>
            {FLOW_STEPS.map((s, i) => (
              <div key={s.k} style={{ display: "flex", gap: 14, padding: "14px 18px", background: i % 2 ? "rgba(0,229,255,0.02)" : "rgba(5,16,37,0.6)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "rgba(0,229,255,0.7)", minWidth: 24, flexShrink: 0 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(248,254,255,0.9)" }}>{s.k}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.5)" }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
{/* ── The Receipt ── */}
        <section className="lab-section">
          <h2>The Continuity Receipt</h2>
          <p>
            Every field in the schema, every rule in the trust model, and every composability
            constraint exists to make the normative definition machine-verifiable. A receipt is a
            self-contained object carrying assertions about observation, continuity, and confidence
            — with a cryptographic signature over the canonical serialization of those fields.
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {[
              "Assertions: observation occurred, continuity maintained, confidence bounds — internally consistent (V₃).",
              "Temporal model: a bounded interval [start, end] with signedAt ≥ end (V₄).",
              "Evidence references: payloadDigest = SHA-256(payload) per evidence item (V₅).",
              "Composability: receipts link into a chain via previousReceiptHash (V₇).",
            ].map((li) => (
              <li key={li} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: "rgba(0,229,255,0.7)", flexShrink: 0 }}>▸</span>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Cryptographic Integrity ── */}
        <section className="lab-section">
          <h2>Cryptographic Integrity</h2>
          <p>
            Receipts are serialized in canonical JSON (RFC 8259). The signing payload covers all
            receipt fields except <code>signature</code> itself, serialized in lexicographic key
            order, then hashed with SHA-256, then signed with the issuer's private key. The
            RECOMMENDED signature algorithm is <code>Ed25519</code>.
          </p>
          <p>
            Since v1.0-RC1 the private key is a non-extractable WebCrypto <code>CryptoKey</code>{' '}
            stored in IndexedDB (never readable from JavaScript), and{' '}
            <code>interval.coverageMs</code> is part of the signing payload — preventing receipt
            tampering without invalidating the signature.
          </p>
          <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,0.6)", background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 18px", overflowX: "auto" }}>
            <pre style={{ margin: 0, whiteSpace: "pre" }}>{`canonical fields (lexicographic key order)
  → SHA-256
  → sign with Ed25519 private key
  → signature field (excluded from payload)`}</pre>
          </div>
        </section>

        {/* ── Verification ── */}
        <section className="lab-section">
          <h2>Verification Contract</h2>
          <p>
            A conforming verifier validates a receipt against seven checks, producing either{" "}
            <code>VALID</code> or <code>INVALID</code> with a failure code. Passing these checks
            means the receipt is authentic, internally consistent, temporally sound, and its
            evidence references are intact — it does not, by itself, attest to the meaning of the
            evidence or the trustworthiness of the issuer.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, lineHeight: 1.6 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}>Step</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}>Check</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}>Failure</th>
                </tr>
              </thead>
              <tbody>
                {V_STEPS.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap", fontFamily: "var(--font-geist-mono), monospace", color: "#90c8ff" }}>{v.id}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>{v.check}</td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap", fontFamily: "var(--font-geist-mono), monospace", color: "rgba(244,114,182,0.8)", fontSize: 11 }}>{v.failure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginTop: 28 }}>What verification does NOT check</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {NON_GOALS.map((li, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: "rgba(244,114,182,0.7)", flexShrink: 0 }}>▸</span>
                <span>{li}</span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 14, fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
            V₁–V₇ define the <strong style={{ color: "rgba(248,254,255,0.85)" }}>abstraction boundary</strong>{' '}
            between the protocol and its implementations: a verifier that passes V₁–V₅ is
            conforming — it can process any receipt, from any evidence engine, without knowing how
            the engine works.
          </p>
        </section>
{/* ── Specification ── */}
        <section className="lab-section">
          <h2>Protocol Specification</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {SPEC_ROWS.map((r) => (
              <div key={r.k} style={{ display: "flex", gap: 12, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "rgba(11,18,32,0.5)", alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "rgba(0,229,255,0.7)", minWidth: 150, flexShrink: 0 }}>{r.k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(248,254,255,0.9)" }}>{r.v}</span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>{r.n}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
            Authoritative specification (unchanged canonical source):{" "}
            <Link href="/research/notes/008-continuity-protocol-core" style={{ color: "rgba(0,229,255,0.85)", textDecoration: "underline" }}>
              Continuity Protocol Core — /research/notes/008
            </Link>
            . Release notes:{" "}
            <Link href="https://github.com/myshapeprotocol/myshape-protocol/blob/master/continuity-protocol/RELEASE-v1.0-RC1.md" style={{ color: "rgba(0,229,255,0.85)", textDecoration: "underline" }}>
              RELEASE-v1.0-RC1
            </Link>{" "}
            (external GitHub).
          </p>
        </section>

        {/* ── Research Evidence ── */}
        <section className="lab-section">
          <h2>Research Evidence</h2>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)" }}>
            The following are research artifacts — empirical and experimental evidence that informs
            and examines the protocol. They are labeled as research evidence, not protocol
            guarantees.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {RESEARCH_LINKS.map((e) => (
              <Link key={e.k} href={e.h} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", border: "1px solid rgba(0,229,255,0.1)", borderRadius: 8, background: "rgba(0,229,255,0.02)", textDecoration: "none", alignItems: "baseline", transition: "all 0.2s" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(248,254,255,0.85)" }}>{e.k}</span>
                <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", textAlign: "right" }}>{e.s}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Limitations ── */}
        <section className="lab-section">
          <h2>Limitations</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            {LIMITATIONS.map((li) => (
              <li key={li} style={{ display: "flex", gap: 10, fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                <span style={{ color: "rgba(212,175,55,0.8)", flexShrink: 0 }}>▸</span>
                <span>{li}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Status ── */}
        <section className="lab-section">
          <h2>Status</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {STATUS_ROWS.map((s) => (
              <div key={s.k} style={{ display: "flex", gap: 12, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, background: "rgba(11,18,32,0.4)", alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: "rgba(52,211,153,0.7)", minWidth: 110, flexShrink: 0 }}>{s.k}</span>
                <span style={{ fontSize: 13, color: "rgba(248,254,255,0.85)" }}>{s.v}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
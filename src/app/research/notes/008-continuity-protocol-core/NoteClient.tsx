"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";

const TOC = [
  { id: "abstract", label: "Abstract" },
  { id: "architecture", label: "Protocol Architecture" },
  { id: "semantics", label: "§1 Semantics" },
  { id: "non-goals", label: "§2 Non-Goals" },
  { id: "trust", label: "§3 Trust Model" },
  { id: "temporal", label: "§4 Temporal Model" },
  { id: "composability", label: "§5 Composability" },
  { id: "serialization", label: "§6 Serialization" },
  { id: "verification", label: "§7 Verification Contract" },
  { id: "references", label: " References" },
];

export default function NoteClient() {
  const [active, setActive] = useState("abstract");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const t of TOC) {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <div className="note-layout">
          <nav className="note-toc" aria-label="Table of Contents">
            <div className="note-toc-title">Contents</div>
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`note-toc-item ${active === t.id ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t.label}
              </a>
            ))}
          </nav>

          <article className="note-article">
            <div className="note-meta">
              <ResearchMeta
                artifactId="CPS-0001"
                type="Core Protocol Specification"
                status="Draft"
                published="2026.07.21"
              />
            </div>
            <h1 className="note-title">Continuity Protocol Core</h1>
            <p className="note-subtitle">
              A Continuity Protocol does not standardize how continuity is measured.<br />
              It standardizes how continuity assertions are represented, exchanged, and verified.
            </p>

            {/* ── Abstract ── */}
            <section className="note-section" id="abstract">
              <h2>Abstract</h2>

              <p>
                This document defines the <strong>Continuity Protocol Core</strong> — the
                protocol object, its semantics, trust model, temporal model, composability
                rules, and serialization format. It is the foundational specification for all
                MyShape protocols.
              </p>

              <div className="my-6 p-5 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.03] rounded-lg">
                <p className="text-[#90c8ff]/80 text-[13px] leading-relaxed m-0">
                  <strong>Normative Definition.</strong> A <em>Continuity Receipt</em> is a
                  cryptographically verifiable statement that an observer collected sufficient
                  evidence supporting the continuity of a subject over a bounded interval of
                  time.
                </p>
              </div>

              <p>
                Everything below this sentence is an elaboration of the above. Every field in
                the schema, every rule in the trust model, and every composability constraint
                exists to make this single sentence machine-verifiable.
              </p>

              <p>
                This document is <strong>implementation-independent</strong>. It does not
                reference specific sensors, algorithms, or evidence engines. Those are defined
                in subordinate specifications (RFC-0001, RFC-0002) and engine-specific documents
                (EE-001, EE-002, EE-003). A third party SHOULD be able to build a completely
                different evidence engine — using different sensors, different algorithms,
                different hardware — and produce a valid Continuity Receipt that any conforming
                verifier can process.
              </p>
            </section>

            {/* ── Protocol Architecture ── */}
            <section className="note-section" id="architecture">
              <h2>Protocol Architecture</h2>

              <p>
                The Continuity Protocol defines a layered architecture. This specification
                (CPS-0001) occupies the top layer — the Protocol Object. All other layers
                are subordinate.
              </p>

              <div className="my-6 p-5 border border-white/[0.06] bg-white/[0.01] rounded-lg font-mono text-[12px] leading-relaxed">
                <div className="text-[#90c8ff]/70 mb-2">Continuity Protocol</div>
                <div className="ml-4 text-white/50">
                  │<br />
                  ├── <span className="text-[#d4af37]/80">Protocol Object</span>{" "}
                  <span className="text-white/25">(CPS-0001 — this document)</span><br />
                  │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Receipt structure, semantics, trust, lifecycle<br />
                  │<br />
                  ├── Evidence Engines<br />
                  │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;EE-001 · EE-002 · EE-003 · future engines<br />
                  │<br />
                  ├── Evidence Formats<br />
                  │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Motion Signature{" "}
                  <span className="text-white/25">(RFC-0001)</span><br />
                  │<br />
                  ├── Proof Construction<br />
                  │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chain · Hash · Window · Signature<br />
                  │&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Continuity Proof Format{" "}
                  <span className="text-white/25">(RFC-0002)</span><br />
                  │<br />
                  └── Verification Rules<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Policy evaluation · CFC catalog · Thresholds<br />
                </div>
              </div>

              <p>
                <strong>Relationship to existing RFCs.</strong>{" "}
                <Link
                  href="/research/notes/004-motion-signature-rfc"
                  className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline"
                >
                  RFC-0001 (Motion Signature Format)
                </Link>{" "}
                defines one evidence format — how IMU observations are structured.{" "}
                <Link
                  href="/research/notes/006-continuity-proof-rfc"
                  className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline"
                >
                  RFC-0002 (Continuity Proof Format)
                </Link>{" "}
                defines one proof construction method — how receipts are linked into ordered
                predecessor chains and how
                CFCs are cataloged. Both are <strong>subordinate</strong> to this document.
                CPS-0001 defines the object they produce and consume.
              </p>
            </section>

            {/* ── §1 Semantics ── */}
            <section className="note-section" id="semantics">
              <h2>§1 Semantics</h2>

              <h3>1.1 What a Continuity Receipt Asserts</h3>

              <p>A Continuity Receipt makes exactly <strong>three</strong> assertions:</p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Assertion</th>
                    <th>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>A₁</td>
                    <td><strong>Observation Occurred</strong></td>
                    <td>
                      An observer collected evidence from a subject during the stated interval.
                      The evidence is real sensor data, not synthetic.
                    </td>
                  </tr>
                  <tr>
                    <td>A₂</td>
                    <td><strong>Continuity Maintained</strong></td>
                    <td>
                      Within the stated confidence bounds, the subject observed at the end of the
                      interval is the same subject observed at the beginning.
                    </td>
                  </tr>
                  <tr>
                    <td>A₃</td>
                    <td><strong>Receipt Integrity</strong></td>
                    <td>
                      The receipt has not been modified since issuance. Its contents —
                      evidence digest, interval, confidence, chain link — are exactly as
                      the issuer produced them.
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                These three assertions are <strong>closed</strong>. A Continuity Receipt makes no
                other claims. In particular, it does not make any of the assertions listed in §2.
              </p>

              <h3>1.2 The Continuity Property</h3>

              <p>
                <strong>Continuity</strong> — the property a Receipt asserts — is defined as:
              </p>

              <div className="my-6 p-5 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.03] rounded-lg">
                <p className="text-white/70 text-[13px] leading-relaxed m-0">
                  For a subject S observed at times t₀ and t₁ (t₀ &lt; t₁), <strong>continuity
                  holds</strong> if there exists no detectable discontinuity — substitution,
                  interruption, or synthetic injection — between t₀ and t₁ within the stated
                  confidence bounds of the observing evidence engines.
                </p>
              </div>

              <p>
                Continuity is <strong>not</strong> identity. It does not answer "who is this?"
                It answers "is this the same subject as before?" The distinction is fundamental.
                A system can verify continuity without knowing — or storing — the subject's identity.
              </p>
            </section>

            {/* ── §2 Non-Goals ── */}
            <section className="note-section" id="non-goals">
              <h2>§2 Non-Goals</h2>

              <h3>2.1 What a Continuity Receipt Does NOT Assert</h3>

              <p>
                This section is normative. Any system that displays, interprets, or relies on a
                Continuity Receipt MUST NOT attribute any of the following assertions to it:
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Non-Assertion</th>
                    <th>Why It Is Excluded</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Identity</strong></td>
                    <td>
                      The receipt does not claim "this is Alice." It claims only that the subject
                      at t₁ is the same subject as at t₀. Identity binding is a separate,
                      higher-level concern.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Humanity</strong></td>
                    <td>
                      The receipt does not claim the subject is human. A robot, a drone, a vehicle,
                      or an AI agent could all be subjects of continuity verification — and the
                      protocol is designed to accommodate them.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Liveness</strong></td>
                    <td>
                      The receipt does not claim the subject is "alive" or "real" in a biological
                      sense. It claims sensor evidence was collected from a physically embodied
                      subject. The difference between "embodied" and "alive" is outside the
                      protocol's scope.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Uniqueness (Sybil Resistance)</strong></td>
                    <td>
                      The receipt does not claim this subject is distinct from all other subjects
                      in a population. Two different entities could each produce a valid receipt.
                      Sybil resistance requires additional protocol layers (global registry,
                      reputation, stake) beyond this specification.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Location</strong></td>
                    <td>
                      The receipt does not assert where the subject is. Geolocation may be included
                      in engine evidence at the subject's discretion, but it is not a required
                      assertion of the protocol object.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Intent or Consent</strong></td>
                    <td>
                      The receipt does not assert that the subject intended any particular action,
                      or consented to any terms. It records that continuity was observed —
                      nothing more.
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3>2.2 Why Non-Goals Matter</h3>

              <p>
                Every protocol object accumulates implicit assumptions over time. If a Continuity
                Receipt is perceived to assert "this is a real human," then every application that
                needs to verify a drone's continuity will either misuse the receipt or build a
                competing format. By explicitly excluding these assertions at the protocol level,
                we ensure the receipt remains <strong>application-agnostic</strong>.
              </p>

              <p>
                Applications MAY layer additional assertions on top of a Continuity Receipt
                (e.g., "this receipt + this identity binding = Alice was continuously present").
                But those are <strong>application-level claims</strong>, not protocol-level claims.
              </p>
            </section>

            {/* ── §3 Trust Model ── */}
            <section className="note-section" id="trust">
              <h2>§3 Trust Model</h2>

              <h3>3.1 Actors</h3>

              <p>The Continuity Protocol recognizes three actor roles:</p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th>Must Be Trusted?</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Subject</strong></td>
                    <td>
                      The entity whose continuity is being verified. May be human, machine,
                      or agent.
                    </td>
                    <td>No — the subject may be adversarial</td>
                  </tr>
                  <tr>
                    <td><strong>Issuer</strong></td>
                    <td>
                      The entity that collects evidence, evaluates it, and produces the receipt.
                      Controls one or more evidence engines.
                    </td>
                    <td>
                      <strong>Partially.</strong> The verifier must trust that the issuer's
                      evidence engines were running and collecting real sensor data. The verifier
                      does <em>not</em> need to trust the issuer's verdict — it can re-evaluate
                      evidence under its own policy.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Verifier</strong></td>
                    <td>
                      The entity that receives a receipt and determines whether to accept its
                      assertions. May apply its own verification policy.
                    </td>
                    <td>N/A — the verifier is the trust root</td>
                  </tr>
                </tbody>
              </table>

              <h3>3.2 Issuance Models</h3>

              <p>The protocol supports three issuance models, ordered by trust decentralization:</p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Issuer</th>
                    <th>Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Self-Issued</strong></td>
                    <td>The subject is its own issuer</td>
                    <td>
                      Local device verification. The subject proves continuity to itself or
                      to applications running on the same device. Trust is local.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Delegated Issuance</strong></td>
                    <td>A third-party service collects evidence on behalf of the subject</td>
                    <td>
                      Server-side verification. A web service embeds a verification widget;
                      the service's infrastructure issues the receipt. Trust is delegated
                      to the service operator.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Attested Issuance</strong></td>
                    <td>
                      Multiple independent issuers observe the same subject interval and
                      co-sign a receipt
                    </td>
                    <td>
                      High-assurance scenarios. Requires ≥ threshold of issuers to agree.
                      Trust is distributed across the attestation set.
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3>3.3 Verifier Trust Calculus</h3>

              <p>
                A verifier's decision to accept a receipt depends on three independent factors:
              </p>

              <ol>
                <li>
                  <strong>Issuer trust.</strong> Does the verifier believe the issuer collected
                  genuine sensor data? This is a social/economic question — the protocol provides
                  the cryptographic signature to prove <em>who</em> issued, but not whether they
                  issued honestly.
                </li>
                <li>
                  <strong>Evidence sufficiency.</strong> Does the evidence meet the verifier's
                  policy threshold? The protocol enables verifiers to apply their own policy
                  independently of the issuer's verdict.
                </li>
                <li>
                  <strong>Chain integrity.</strong> If this receipt links to prior receipts,
                  does the chain verify? The protocol provides the predecessor reference;
                  the verifier checks it.
                </li>
              </ol>
            </section>

            {/* ── §4 Temporal Model ── */}
            <section className="note-section" id="temporal">
              <h2>§4 Temporal Model</h2>

              <h3>4.1 Interval Primacy</h3>

              <p>
                Continuity is a <strong>property of an interval, not a point</strong>. A
                Continuity Receipt does not assert "the subject was continuous at time T."
                It asserts "the subject was continuous across the entire interval [t₀, t₁]."
                This is the single most important semantic property of the protocol.
              </p>

              <p>
                The <strong>coverage duration</strong> — Δt = t₁ − t₀ — is the primary
                temporal metric. A receipt covering Δt = 300s is a stronger continuity
                claim than one covering Δt = 8s, all else equal. Applications SHOULD
                surface coverage duration to users and MAY set minimum coverage requirements.
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>interval.start</code></td>
                    <td>ISO 8601 datetime</td>
                    <td>When evidence collection began</td>
                  </tr>
                  <tr>
                    <td><code>interval.end</code></td>
                    <td>ISO 8601 datetime</td>
                    <td>When evidence collection ended</td>
                  </tr>
                  <tr>
                    <td><code>interval.coverageMs</code></td>
                    <td>integer</td>
                    <td>
                      <strong>Coverage duration.</strong> Δt = end − start in milliseconds.
                      This is the primary temporal datum. MUST equal end − start.
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                The interval is <strong>not</strong> a claim about what happened before t₀ or
                after t₁. A receipt for [09:00:00, 09:00:30] says nothing about whether the
                subject was continuous at 08:59:59 or 09:00:31. Continuity is <strong>not
                transitive across gaps</strong> — two non-overlapping receipts from the same
                subject do not, by themselves, prove continuity across the gap between them.
                That requires explicit chain verification (§5.1).
              </p>

              <h3>4.2 Receipt Lifecycle</h3>

              <p>A Continuity Receipt progresses through a defined lifecycle:</p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Meaning</th>
                    <th>Transition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>ISSUED</code></td>
                    <td>Receipt has been produced and signed by the issuer</td>
                    <td>→ <code>EXPIRED</code> (time) or <code>REVOKED</code> (explicit)</td>
                  </tr>
                  <tr>
                    <td><code>EXPIRED</code></td>
                    <td>
                      The receipt's validity window has closed. It remains cryptographically
                      verifiable but SHOULD NOT be accepted for live authorization.
                    </td>
                    <td>Terminal</td>
                  </tr>
                  <tr>
                    <td><code>REVOKED</code></td>
                    <td>
                      The issuer has explicitly withdrawn the receipt before expiry.
                      Verifiers MUST check revocation status for high-assurance applications.
                    </td>
                    <td>Terminal</td>
                  </tr>
                </tbody>
              </table>

              <h3>4.3 Expiry</h3>

              <p>
                Every receipt carries an <code>expiresAt</code> field. After expiry:
              </p>

              <ul>
                <li>The receipt remains <strong>cryptographically verifiable</strong> — the signature and predecessor references are still cryptographically verifiable.</li>
                <li>The receipt SHOULD NOT be accepted as proof of <strong>current</strong> continuity for live authorization decisions.</li>
                <li>The receipt MAY be accepted as <strong>historical</strong> proof — "this subject was continuous during this past interval."</li>
              </ul>

              <p>
                Expiry exists because continuity is not permanent. A subject observed at 09:00
                may not be the same subject at 09:05. Expiry bounds the period during which
                the continuity assertion is considered fresh.
              </p>

              <h3>4.4 Revocation</h3>

              <p>
                An issuer MAY revoke a receipt before its expiry. Reasons include:
                detected compromise, evidence tampering discovered post-issuance, or subject
                request. The protocol defines a revocation list format; verifiers in
                high-assurance contexts SHOULD consult it.
              </p>
            </section>

            {/* ── §5 Composability ── */}
            <section className="note-section" id="composability">
              <h2>§5 Composability</h2>

              <h3>5.1 Ordered Predecessor Reference</h3>

              <p>
                A Continuity Receipt MAY reference a predecessor receipt, establishing an
                <strong>ordered reference relationship</strong> between two observations of
                the same subject. A sequence of such references forms a
                <strong>Continuity Chain</strong>:
              </p>

              <div className="my-6 p-4 border border-white/[0.06] bg-white/[0.01] rounded-lg font-mono text-[12px] text-white/50 text-center">
                R₁ → ref(R₁) → R₂ → ref(R₂) → R₃ → ref(R₃) → …
              </div>

              <p>
                The <strong>backing implementation</strong> of the predecessor reference is
                RECOMMENDED to be SHA-256 hashing (as specified in RFC-0002), but the protocol
                does not require a specific hash function. The only requirement is that the
                reference MUST be <strong>cryptographically binding</strong> — given receipt
                Rᵢ, an adversary cannot produce Rⱼ such that ref(Rⱼ) = ref(Rᵢ) without
                possessing Rᵢ.
              </p>

              <p>
                Future implementations MAY use alternative backing constructions:
              </p>

              <ul>
                <li><strong>Hash chain</strong> — SHA-256 of the predecessor (RFC-0002, current default)</li>
                <li><strong>Merkle accumulator</strong> — efficient inclusion proofs for chains with many receipts</li>
                <li><strong>DAG reference</strong> — multiple predecessors for branching continuity histories</li>
                <li><strong>ZK-aggregated reference</strong> — zero-knowledge proof that a valid predecessor exists without revealing it</li>
              </ul>

              <p>
                The protocol specifies the <strong>relationship</strong> (ordered, binding,
                verifiable). Implementations choose the <strong>construction</strong>.
              </p>

              <p>Predecessor verification rules:</p>

              <ol>
                <li>The genesis receipt (R₁) MUST have <code>previousReceiptHash: null</code>.</li>
                <li>For all i &gt; 1: the predecessor reference MUST be cryptographically binding to Rᵢ₋₁.</li>
                <li>Continuity Link Score: CLS = valid_links / total_links. CLS = 1.0 indicates unbroken continuity.</li>
              </ol>

              <p>
                A chain proves <strong>longitudinal continuity</strong> — that the same subject
                was observed across multiple sessions. The chain is the protocol's answer to:
                "Is this the same subject that was verified three days ago?"
              </p>

              <h3>5.2 Receipt Aggregation</h3>

              <p>
                Multiple receipts covering <strong>overlapping intervals</strong> MAY be
                aggregated into a <strong>Continuity Bundle</strong>. A bundle proves that
                multiple independent issuers observed the same subject during the same time
                window. This is the foundation of attested issuance (§3.2).
              </p>

              <p>
                Aggregation rules are defined in a companion specification (forthcoming).
                This document reserves the <code>bundle</code> top-level field for future use.
              </p>

              <h3>5.3 Cross-Receipt Reference</h3>

              <p>
                A receipt MAY reference another receipt that is not its immediate predecessor.
                This enables:
              </p>

              <ul>
                <li><strong>Branching chains:</strong> A subject verified on multiple devices in parallel can produce independent chains that reference a common genesis receipt.</li>
                <li><strong>Gap resolution:</strong> If a chain is broken (CIS &lt; 1.0), a later receipt can reference the last known-good receipt across the gap.</li>
              </ul>

              <p>
                Cross-receipt references use the <code>references</code> field — an array of
                receipt hashes that this receipt explicitly acknowledges. This is distinct from
                <code>previousReceiptHash</code>, which defines the primary chain.
              </p>
            </section>

            {/* ── §6 Serialization ── */}
            <section className="note-section" id="serialization">
              <h2>§6 Serialization</h2>

              <h3>6.1 The Continuity Receipt Schema</h3>

              <p>
                The following schema is <strong>normative</strong>. Fields are organized into
                four conceptual groups:
              </p>

              <div className="my-6 p-5 border border-white/[0.06] bg-white/[0.01] rounded-lg font-mono text-[12px] leading-relaxed">
                <div className="text-white/40">
                  ContinuityReceipt<br />
                  <span className="ml-4 text-white/25">│</span><br />
                  <span className="ml-4 text-white/25">├──</span> <span className="text-[#d4af37]/70">Assertion</span>{" "}
                  <span className="text-white/20">— what is claimed</span><br />
                  <span className="ml-4 text-white/25">├──</span> <span className="text-[#60A5FA]/70">Evidence</span>{" "}
                  <span className="text-white/20">— why it is believed</span><br />
                  <span className="ml-4 text-white/25">├──</span> <span className="text-[#34D399]/70">Context</span>{" "}
                  <span className="text-white/20">— when / where / subject</span><br />
                  <span className="ml-4 text-white/25">└──</span> <span className="text-[#a78bfa]/70">Signature</span>{" "}
                  <span className="text-white/20">— who claims it</span>
                </div>
              </div>

              <p>
                This grouping is <strong>not</strong> a JSON nesting requirement — all fields are
                at the top level of the receipt object. The groups are a <strong>semantic
                categorization</strong> for implementers. Evidence ≠ Claim. This distinction is
                cryptographically fundamental.
              </p>

              <h4>Assertion — what is claimed</h4>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Req</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>protocolVersion</code></td>
                    <td>string</td>
                    <td>✓</td>
                    <td>Protocol version identifier. Current: <code>"1.0"</code></td>
                  </tr>
                  <tr>
                    <td><code>assertions</code></td>
                    <td>AssertionSet</td>
                    <td>✓</td>
                    <td>The three normative assertions (§1.1): observation occurred, continuity maintained, receipt integrity. Each with a confidence value [0,1].</td>
                  </tr>
                  <tr>
                    <td><code>verdict</code></td>
                    <td>Verdict</td>
                    <td></td>
                    <td>
                      Issuer's policy decision. OPTIONAL — verifiers MAY ignore and apply
                      their own policy. This is the issuer's <em>interpretation</em> of the
                      evidence, not part of the claim itself.
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4>Evidence — why it is believed</h4>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Req</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>evidence</code></td>
                    <td>Evidence[]</td>
                    <td>✓</td>
                    <td>Array of evidence blocks produced by evidence engines. See 6.3.</td>
                  </tr>
                </tbody>
              </table>

              <h4>Context — when / where / subject</h4>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Req</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>receiptId</code></td>
                    <td>string (UUIDv7)</td>
                    <td>✓</td>
                    <td>Unique receipt identifier. UUIDv7 for time-sortable IDs.</td>
                  </tr>
                  <tr>
                    <td><code>interval</code></td>
                    <td>Interval (§4.1)</td>
                    <td>✓</td>
                    <td>The bounded time interval this receipt covers. The primary temporal datum.</td>
                  </tr>
                  <tr>
                    <td><code>subject</code></td>
                    <td>SubjectRef</td>
                    <td>✓</td>
                    <td>Opaque reference to the subject. MUST be stable within a chain. See 6.2.</td>
                  </tr>
                  <tr>
                    <td><code>expiresAt</code></td>
                    <td>ISO 8601 datetime</td>
                    <td></td>
                    <td>When this receipt's freshness expires (§4.3).</td>
                  </tr>
                </tbody>
              </table>

              <h4>Composability — links to other receipts</h4>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Req</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>previousReceiptHash</code></td>
                    <td>string | null</td>
                    <td>✓</td>
                    <td>
                      Cryptographic reference to the immediate predecessor receipt
                      (null for genesis). RECOMMENDED: SHA-256 of the predecessor.
                    </td>
                  </tr>
                  <tr>
                    <td><code>references</code></td>
                    <td>string[]</td>
                    <td></td>
                    <td>Hashes of receipts this receipt cross-references (§5.3).</td>
                  </tr>
                </tbody>
              </table>

              <h4>Signature — who claims it</h4>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Req</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>issuer</code></td>
                    <td>IssuerIdentity</td>
                    <td>✓</td>
                    <td>Identity of the issuing entity. See 6.4.</td>
                  </tr>
                  <tr>
                    <td><code>signature</code></td>
                    <td>Signature</td>
                    <td>✓</td>
                    <td>Cryptographic signature over the assertion + evidence + context. See 6.4.</td>
                  </tr>
                </tbody>
              </table>

              <h3>6.2 Subject Reference</h3>

              <p>
                The <code>subject</code> field identifies the entity being observed — without
                revealing its identity. It is an <strong>opaque, stable pseudonym</strong>:
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>subject.id</code></td>
                    <td>string</td>
                    <td>
                      Opaque subject identifier. MUST be stable within a continuity chain.
                      RECOMMENDED: SHA-256 of a device-stable secret + subject public key.
                    </td>
                  </tr>
                  <tr>
                    <td><code>subject.type</code></td>
                    <td>string</td>
                    <td>
                      OPTIONAL hint about subject category. Values are not normative.
                      Examples: <code>"embodied"</code>, <code>"device"</code>, <code>"agent"</code>.
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                The subject identifier binds receipts within a chain to the same subject without
                revealing who or what the subject is. This is the privacy-preserving property
                that distinguishes continuity verification from identity verification.
              </p>

              <h3>6.3 Evidence Block</h3>

              <p>
                Evidence is <strong>engine-specific</strong>. This specification defines only the
                envelope. The content is owned by the evidence engine that produced it.
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>engineId</code></td>
                    <td>string</td>
                    <td>Identifier of the evidence engine (e.g., <code>"EE-001"</code>).</td>
                  </tr>
                  <tr>
                    <td><code>engineVersion</code></td>
                    <td>string</td>
                    <td>Semver of the engine that produced this evidence.</td>
                  </tr>
                  <tr>
                    <td><code>confidence</code></td>
                    <td>float [0, 1]</td>
                    <td>Engine-specific confidence score.</td>
                  </tr>
                  <tr>
                    <td><code>payload</code></td>
                    <td>object</td>
                    <td>
                      Engine-specific evidence payload. Opaque to the protocol.
                      Schema defined by the engine's own specification.
                    </td>
                  </tr>
                  <tr>
                    <td><code>payloadDigest</code></td>
                    <td>string (SHA-256 hex)</td>
                    <td>Hash of <code>payload</code> for integrity verification.</td>
                  </tr>
                </tbody>
              </table>

              <p>
                <strong>Protocol boundary.</strong> The protocol does not interpret
                <code>payload</code>. A verifier that understands engine <code>"EE-001"</code>
                MAY inspect its payload; a verifier that does not MUST treat it as opaque and
                rely on the issuer's confidence score (or ignore this evidence block entirely).
                This is the mechanism by which the protocol remains
                <strong>implementation-independent</strong>: new evidence engines can be added
                without changing the protocol object.
              </p>

              <h3>6.4 Issuer Identity and Signature</h3>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>issuer.id</code></td>
                    <td>string</td>
                    <td>Opaque issuer identifier. RECOMMENDED: SHA-256 of issuer public key.</td>
                  </tr>
                  <tr>
                    <td><code>issuer.publicKey</code></td>
                    <td>string (base64url)</td>
                    <td>Public key for signature verification. Algorithm is indicated by the key format.</td>
                  </tr>
                  <tr>
                    <td><code>signature.algorithm</code></td>
                    <td>string</td>
                    <td>Signature algorithm. RECOMMENDED: <code>"Ed25519"</code>.</td>
                  </tr>
                  <tr>
                    <td><code>signature.value</code></td>
                    <td>string (base64url)</td>
                    <td>Signature over the receipt (excluding the signature field itself).</td>
                  </tr>
                  <tr>
                    <td><code>signature.signedAt</code></td>
                    <td>ISO 8601 datetime</td>
                    <td>When the signature was produced.</td>
                  </tr>
                </tbody>
              </table>

              <p>
                <strong>Signature computation.</strong> The signature covers all receipt fields
                <em>except</em> <code>signature</code> itself. Fields are serialized in
                lexicographic key order, then hashed with SHA-256, then signed. This ensures
                deterministic verification regardless of JSON key ordering.
              </p>

              <h3>6.5 Wire Format</h3>

              <p>
                The canonical wire format is <strong>JSON</strong> (RFC 8259). Implementations
                SHOULD support JSON. Alternative encodings (CBOR, Protobuf) MAY be defined in
                companion specifications. The semantic model defined in this document is
                encoding-independent.
              </p>

              <h3>6.6 Compact Representation</h3>

              <p>
                For bandwidth-constrained environments, a receipt MAY be encoded as a
                <strong>base64url-encoded</strong> JSON string, suitable for use in HTTP headers,
                URL parameters, or query strings:
              </p>

              <div className="my-6 p-4 border border-white/[0.06] bg-white/[0.01] rounded-lg font-mono text-[11px] text-white/40 text-center break-all">
                eyJwcm90b2NvbFZlcnNpb24iOiIxLjAiLCJyZWNlaXB0SWQiOiIwMTkzYTYyZS0...
              </div>

              <p>
                This is the format used when passing a receipt as a bearer token or when embedding
                it in a URL. It is NOT a new semantic model — it is JSON → base64url. Any conforming
                implementation can decode it to the full receipt structure.
              </p>

              <h3>6.7 Minimal Example</h3>

              <p>
                The following is a minimal, valid Continuity Receipt. It demonstrates the
                distinction between assertion (what is claimed), evidence (why), context
                (when/subject), and signature (who). The <code>evidence.payload</code> is
                engine-specific and opaque — it could contain IMU data, UWB readings,
                millimeter-wave signatures, or any future sensing modality.
              </p>

              <div className="my-6 p-5 border border-[#90c8ff]/15 bg-[#0B1220] rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto">
                <pre className="text-white/60 m-0" style={{ whiteSpace: "pre" }}>{`{
  <span className="text-white/25">// ── Assertion: what is claimed ──</span>
  "protocolVersion": "1.0",
  "assertions": {
    "observationOccurred":    { "value": true,  "confidence": 0.95 },
    "continuityMaintained":   { "value": true,  "confidence": 0.83 },
    "receiptIntegrity":       { "value": true,  "confidence": 1.0  }
  },

  <span className="text-white/25">// ── Evidence: why it is believed ──</span>
  "evidence": [
    {
      "engineId": "EE-001",
      "engineVersion": "1.2.0",
      "confidence": 0.85,
      "payload": {
        <span className="text-white/20">/* engine-specific — opaque to the protocol */</span>
        "entropyScore": 0.72,
        "sensorProfile": "stable"
      },
      "payloadDigest": "sha256:a1b2c3d4e5f6..."
    }
  ],

  <span className="text-white/25">// ── Context: when / where / subject ──</span>
  "receiptId": "0193a62e-7b11-74a8-9c3d-f1e2a3b4c5d6",
  "interval": {
    "start":      "2026-07-21T14:30:00.000Z",
    "end":        "2026-07-21T14:30:08.000Z",
    "coverageMs": 8000
  },
  "subject": {
    "id": "sha256:d4e5f6a7b8c9...",
    "type": "embodied"
  },
  "expiresAt": "2026-07-21T14:35:00.000Z",

  <span className="text-white/25">// ── Composability ──</span>
  "previousReceiptHash": "sha256:0102abcd...0304efab...",
  "references": [],

  <span className="text-white/25">// ── Issuer's interpretation ──</span>
  "verdict": "PASS",

  <span className="text-white/25">// ── Signature: who claims it ──</span>
  "issuer": {
    "id": "sha256:7a8b9c0d1e2f...",
    "publicKey": "MCowBQYDK2VwAyEA..."
  },
  "signature": {
    "algorithm": "Ed25519",
    "value": "iGy9Pq3Klx...zW0n8TqLm...",
    "signedAt": "2026-07-21T14:30:00.100Z"
  }
}`}</pre>
              </div>

              <p>
                <strong>What to observe:</strong>
              </p>

              <ul>
                <li><strong>No sensor-specific fields</strong> at the receipt level. The IMU data lives inside <code>evidence[0].payload</code> — visible only to engines that understand EE-001.</li>
                <li><strong>Assertion ≠ Evidence.</strong> The assertion block says <em>what</em> is claimed. The evidence block says <em>why</em>. These are separate cryptographic concerns.</li>
                <li><strong>Interval is primary.</strong> <code>coverageMs: 8000</code> — not "issued at 14:30:00." The temporal datum is the coverage duration.</li>
                <li><strong>Opaque subject.</strong> <code>subject.id</code> is a SHA-256 pseudonym. The verifier can confirm continuity without knowing who.</li>
                <li><strong>Verdict is separable.</strong> The issuer says PASS. A verifier can ignore this, re-evaluate the evidence, and reach its own conclusion.</li>
                <li><strong>Predecessor reference.</strong> This receipt links to a previous one, forming a continuity chain. The reference is a SHA-256 hash, but could be a Merkle proof or ZK attestation in future implementations.</li>
              </ul>

              <p>
                This example is <strong>normative</strong>. A conforming implementation
                MUST be able to produce and verify a receipt structurally equivalent to
                this one. The specific values in <code>evidence.payload</code> are
                illustrative, not normative.
              </p>
            </section>

            {/* ── §7 Verification Contract ── */}
            <section className="note-section" id="verification">
              <h2>§7 Verification Contract</h2>

              <p>
                The preceding sections define the Continuity Receipt as a data object.
                This section defines the <strong>minimum contract</strong> that any
                conforming verifier MUST satisfy. It does <strong>not</strong> specify
                how evidence engines produce evidence — only what a verifier must check
                before accepting a receipt's assertions.
              </p>

              <div className="my-6 p-5 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.03] rounded-lg">
                <p className="text-[#90c8ff]/80 text-[13px] leading-relaxed m-0">
                  <strong>Principle.</strong> The verification contract is
                  <strong>engine-independent</strong>. A verifier can conform to this
                  specification without understanding any specific evidence engine.
                  Engine-specific evidence inspection is an extension, not a requirement.
                </p>
              </div>

              <h3>7.1 Required Verification Steps</h3>

              <p>
                A conforming verifier MUST perform the following checks, in order.
                If any check fails, verification terminates and the receipt is rejected.
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Check</th>
                    <th>Failure</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>V₁</strong></td>
                    <td><strong>Schema validity.</strong> The receipt MUST conform to the schema defined in §6.1. All REQUIRED fields must be present. Field types must match. <code>interval.coverageMs</code> MUST equal <code>end − start</code>.</td>
                    <td><code>INVALID_SCHEMA</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₂</strong></td>
                    <td><strong>Signature validity.</strong> The cryptographic signature MUST verify against the issuer's public key. The signature covers all receipt fields except <code>signature</code> itself, serialized in lexicographic key order (§6.4).</td>
                    <td><code>INVALID_SIGNATURE</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₃</strong></td>
                    <td><strong>Assertion consistency.</strong> The three assertions (§1.1) MUST be internally consistent: if <code>continuityMaintained.value</code> is <code>true</code>, then <code>observationOccurred.value</code> MUST also be <code>true</code>. An assertion of continuity without observation is incoherent.</td>
                    <td><code>INCONSISTENT_ASSERTIONS</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₄</strong></td>
                    <td><strong>Temporal consistency.</strong> <code>interval.start</code> MUST be strictly before <code>interval.end</code>. <code>signature.signedAt</code> MUST be ≥ <code>interval.end</code> (you cannot sign before evidence collection completes). <code>expiresAt</code>, if present, MUST be after <code>signature.signedAt</code>.</td>
                    <td><code>TEMPORAL_INCONSISTENCY</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₅</strong></td>
                    <td><strong>Evidence reference integrity.</strong> For each <code>evidence[i]</code>, <code>payloadDigest</code> MUST equal SHA-256(<code>payload</code>). This ensures the evidence has not been modified since the receipt was signed. The verifier does <strong>not</strong> need to inspect <code>payload</code> itself.</td>
                    <td><code>EVIDENCE_TAMPERED</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₆</strong></td>
                    <td><strong>Freshness.</strong> If <code>expiresAt</code> is present, the current time MUST be before <code>expiresAt</code>. An expired receipt remains cryptographically verifiable (V₁–V₅) but SHOULD NOT be accepted for live authorization.</td>
                    <td><code>EXPIRED</code></td>
                  </tr>
                  <tr>
                    <td><strong>V₇</strong></td>
                    <td><strong>Predecessor reference.</strong> If <code>previousReceiptHash</code> is non-null, the verifier MAY traverse the chain to verify longitudinal continuity. If the verifier possesses the predecessor receipt, it MUST verify that the predecessor reference is cryptographically binding (§5.1).</td>
                    <td><code>CHAIN_BROKEN</code></td>
                  </tr>
                </tbody>
              </table>

              <h3>7.2 Verifier Interface</h3>

              <p>
                A conforming verifier exposes the following logical interface.
                The implementation language, transport, and error format are outside
                the scope of this specification.
              </p>

              <div className="my-6 p-5 border border-white/[0.06] bg-[#0B1220] rounded-lg font-mono text-[12px] leading-relaxed overflow-x-auto">
                <pre className="text-white/55 m-0" style={{ whiteSpace: "pre" }}>{`// Verification result — every check produces one of these
type VerificationResult =
  | {"{"} status: "VALID" {"}"}
  | {"{"} status: "INVALID"; reason: FailureCode; detail: string {"}"}

type FailureCode =
  | "INVALID_SCHEMA"
  | "INVALID_SIGNATURE"
  | "INCONSISTENT_ASSERTIONS"
  | "TEMPORAL_INCONSISTENCY"
  | "EVIDENCE_TAMPERED"
  | "EXPIRED"
  | "CHAIN_BROKEN"

// Core verification function
function verifyReceipt(receipt: ContinuityReceipt): VerificationResult

// Verification with chain context
function verifyReceiptChain(
  receipt: ContinuityReceipt,
  predecessor?: ContinuityReceipt
): VerificationResult`}</pre>
              </div>

              <h3>7.3 What Verification Does NOT Check</h3>

              <p>
                The verification contract is deliberately <strong>minimal</strong>.
                The following are NOT part of the contract:
              </p>

              <ul>
                <li>
                  <strong>Evidence content validity.</strong> V₅ checks that
                  <code>payloadDigest</code> matches <code>payload</code>, but does
                  not check whether the evidence <em>means</em> what the issuer claims
                  it means. That is a policy decision, and verifiers MAY extend the
                  contract with engine-specific evidence inspection.
                </li>
                <li>
                  <strong>Issuer trustworthiness.</strong> The contract verifies
                  <em>that</em> the issuer signed the receipt (V₂). It does not verify
                  <em>whether</em> the issuer should be trusted. Trust is established
                  through external mechanisms — reputation, attestation, stake.
                </li>
                <li>
                  <strong>Subject identity.</strong> The contract verifies that the
                  subject reference is stable within a chain (§5.1). It does not map
                  the subject to a real-world identity. That is outside the protocol.
                </li>
                <li>
                  <strong>Revocation status.</strong> V₁–V₇ verify the receipt itself.
                  Revocation checking (§4.4) is a separate step that consults an
                  external revocation list.
                </li>
              </ul>

              <h3>7.4 The Abstraction Boundary</h3>

              <p>
                V₁–V₇ define the <strong>abstraction boundary</strong> between the
                protocol and its implementations. A verifier that passes V₁–V₅ is
                conforming — it can process any receipt, from any evidence engine,
                without knowing how the engine works.
              </p>

              <p>
                This is the property that makes the Continuity Protocol a
                <strong>protocol</strong> rather than an implementation:
              </p>

              <div className="my-6 p-5 border border-[#d4af37]/15 bg-[#d4af37]/[0.03] rounded-lg">
                <p className="text-[13px] leading-relaxed m-0" style={{ color: "rgba(212,175,55,0.8)" }}>
                  A conforming verifier can accept a Continuity Receipt without knowing
                  which evidence engine produced it, what sensors were used, or what
                  algorithms were applied. It needs only the protocol object and the
                  issuer's public key.
                </p>
              </div>

              <h3>7.5 The Three Questions</h3>

              <p>
                The verification contract is designed so that three questions can be
                answered affirmatively — not as marketing claims, but as
                <strong>testable properties</strong> of any conforming implementation:
              </p>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Test</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Q₁</td>
                    <td>Can another team implement CPS-0001 without using MyShape?</td>
                    <td>
                      Give a team only this document. If they can produce a valid
                      receipt using a novel evidence engine, and a conforming
                      verifier accepts it — <strong>PASS</strong>.
                    </td>
                  </tr>
                  <tr>
                    <td>Q₂</td>
                    <td>Can two different engines produce interoperable receipts?</td>
                    <td>
                      Run EE-001 and a third-party engine against the same subject
                      interval. If both produce receipts that pass V₁–V₇ in the
                      same verifier — <strong>PASS</strong>.
                    </td>
                  </tr>
                  <tr>
                    <td>Q₃</td>
                    <td>Can an application consume a receipt without knowing how evidence was generated?</td>
                    <td>
                      Build an application that accepts a receipt, runs V₁–V₆,
                      and grants access — without importing any MyShape engine code.
                      If it works — <strong>PASS</strong>.
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                These three tests are the <strong>protocol's definition of success</strong>.
                They are not yet passed. They are the standard against which future
                implementations should be measured.
              </p>
            </section>

            {/* ── References ── */}
            <section className="note-section" id="references">
              <h2> References</h2>

              <h3>Normative References</h3>

              <table className="note-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Link
                        href="/research/notes/004-motion-signature-rfc"
                        className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline"
                      >
                        RFC-0001 — Motion Signature Format
                      </Link>
                    </td>
                    <td>Defines one evidence format consumable by this protocol</td>
                  </tr>
                  <tr>
                    <td>
                      <Link
                        href="/research/notes/006-continuity-proof-rfc"
                        className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline"
                      >
                        RFC-0002 — Continuity Proof Format
                      </Link>
                    </td>
                    <td>Defines predecessor chaining (hash-based) and CFC catalog for this protocol</td>
                  </tr>
                  <tr>
                    <td>CPS-0001 (this document)</td>
                    <td>Defines the protocol object — the foundation</td>
                  </tr>
                </tbody>
              </table>

              <h3>Design Principles</h3>

              <p>The following principles guided this specification:</p>

              <ol>
                <li>
                  <strong>Standardize the object, not the engine.</strong> The protocol defines
                  what a Continuity Receipt <em>is</em>, not how it is <em>produced</em>.
                  Evidence engines are implementation details. A third-party engine that produces
                  a conforming receipt is a success, not a threat.
                </li>
                <li>
                  <strong>Implementation independence.</strong> No sensor type, algorithm, or
                  hardware requirement appears in this specification. The protocol is designed
                  to survive changes in sensing technology — from IMUs to UWB to millimeter wave
                  to technologies that do not yet exist.
                </li>
                <li>
                  <strong>Closed assertions.</strong> A receipt asserts exactly three things
                  (§1.1) and explicitly disclaims six (§2.1). This is deliberate. Protocol
                  objects that over-claim become unusable outside their original context.
                </li>
                <li>
                  <strong>Privacy by architecture.</strong> The subject identifier is an opaque
                  pseudonym. Evidence is opaque to the protocol. Verdict is separable from
                  evidence. A verifier can confirm continuity without learning who the subject
                  is or what sensors were used.
                </li>
                <li>
                  <strong>Composability.</strong> Receipts chain, aggregate, and cross-reference.
                  The protocol is designed to be combined — into sessions, into bundles, into
                  attestation sets — without changing the base object.
                </li>
              </ol>

              <h3>Status of This Document</h3>

              <p>
                CPS-0001 is a <strong>Draft</strong> Core Protocol Specification. It defines
                the normative protocol object for the MyShape ecosystem. All future protocol
                documents (RFCs, engine specifications, verification policies) SHOULD reference
                this document as their foundation.
              </p>

              <p>
                The protocol object defined here is <strong>not yet final</strong>. Field names,
                structures, and wire formats may change based on implementation experience and
                community feedback. However, the <strong>semantic model</strong> — what a
                receipt asserts, what it disclaims, and how it composes — is intended to be
                stable across revisions.
              </p>
            </section>

            <RelatedResearch
              supportedBy={[
                { id: "VS-001", label: "Verification Session", href: "/research/protocol-verify" },
                { id: "PE-001", label: "Causal Coupling", href: "/research/causal-coupling" },
                { id: "EE-003", label: "Challenge Response", href: "/research/challenge-response" },
              ]}
              relatedNotes={[
                { id: "RFC-0001", label: "Motion Signature Format", href: "/research/notes/004-motion-signature-rfc" },
                { id: "RFC-0002", label: "Continuity Proof Format", href: "/research/notes/006-continuity-proof-rfc" },
                { id: "RN-001", label: "The Continuity Problem", href: "/research/notes/001-the-continuity-problem" },
                { id: "RN-003", label: "Cross-Modal Binding", href: "/research/notes/003-cross-modal-binding" },
              ]}
            />

            <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
              <Link
                href="/research"
                className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors"
              >
                ← Research Hub
              </Link>
            </div>
          </article>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}

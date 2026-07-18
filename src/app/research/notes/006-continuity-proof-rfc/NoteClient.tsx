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
  { id: "intro", label: "1. Introduction" },
  { id: "receipt", label: "2. Evidence Receipt" },
  { id: "chain", label: "3. Receipt Chaining" },
  { id: "cfc", label: "4. Continuity Failure Conditions" },
  { id: "cross", label: "5. Cross-Device Binding" },
  { id: "policy", label: "6. Verification Policy" },
  { id: "validation", label: "7. Experimental Validation" },
  { id: "reference", label: "8. Reference Implementation" },
];

export default function NoteClient() {
  const [active, setActive] = useState("abstract");
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActive(e.target.id); } },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const t of TOC) { const el = document.getElementById(t.id); if (el) obs.observe(el); }
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
              <a key={t.id} href={`#${t.id}`} className={`note-toc-item ${active === t.id ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth" }); }}>
                {t.label}
              </a>
            ))}
          </nav>

          <article className="note-article">
            <div className="note-meta">
              <ResearchMeta artifactId="RFC-0002" type="Request for Comments" status="Draft" published="2026.07.18" />
            </div>
            <h1 className="note-title">Continuity Proof Format</h1>
            <p className="note-subtitle">
              How to prove that two temporally separated observations describe the same physically embodied entity.
            </p>

            {/* Abstract */}
            <section className="note-section" id="abstract">
              <h2>Abstract</h2>
              <p>
                This document defines the <strong>MyShape Continuity Proof</strong> — a cryptographic chain of
                evidence receipts that proves an entity has maintained unbroken physical continuity across
                observation sessions. A Continuity Proof answers: "Is the entity observed at time T₂ the same
                entity observed at time T₁?"
              </p>
              <p>
                The specification covers: evidence receipt format, hash-based receipt chaining,
                Continuity Failure Conditions (CFC) catalog, cross-device binding, and the
                verification policy that maps evidence to verdicts.
              </p>
              <p>
                This document is normative and builds on <Link href="/research/notes/004-motion-signature-rfc" className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline">RFC-0001 (Motion Signature Format)</Link>.
              </p>
            </section>

            {/* 1. Introduction */}
            <section className="note-section" id="intro">
              <h2>1. Introduction</h2>
              <h3>1.1 The Continuity Problem</h3>
              <p>
                A digital system observes an entity at time T₁ and produces evidence E₁. At time T₂,
                it observes again and produces E₂. The <strong>Continuity Problem</strong> asks:
                do E₁ and E₂ describe the same entity?
              </p>
              <p>
                This is distinct from <strong>identity verification</strong> (who is this?) and
                <strong>presence verification</strong> (is this entity physically present right now?).
                Continuity is the <strong>temporal connective tissue</strong> between verification events.
              </p>

              <h3>1.2 Design Goals</h3>
              <ul>
                <li><strong>Non-identifying.</strong> A Continuity Proof does not reveal the entity's identity — only that the same entity was observed at both times.</li>
                <li><strong>Hash-chained.</strong> Each receipt links to its predecessor, creating a verifiable temporal chain.</li>
                <li><strong>Failure-aware.</strong> The proof explicitly documents which continuity failure conditions were checked and whether any were triggered.</li>
                <li><strong>Policy-independent.</strong> Evidence is separated from verdict — the same evidence can be evaluated under different policies.</li>
              </ul>
            </section>

            {/* 2. Evidence Receipt */}
            <section className="note-section" id="receipt">
              <h2>2. Evidence Receipt</h2>
              <h3>2.1 Format</h3>
              <p>An EvidenceReceipt is a JSON-serializable object:</p>
              <table className="note-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>sessionId</code></td><td>string (UUIDv4)</td><td>Unique session identifier</td></tr>
                  <tr><td><code>timestamp</code></td><td>string (ISO 8601)</td><td>Session start time</td></tr>
                  <tr><td><code>verdict</code></td><td>PASS | FAIL | INSUFFICIENT_EVIDENCE</td><td>Policy decision</td></tr>
                  <tr><td><code>confidence</code></td><td>float [0, 1]</td><td>Aggregate confidence score</td></tr>
                  <tr><td><code>engineEvidence</code></td><td>EngineEvidence[]</td><td>Per-engine component scores + diagnostics</td></tr>
                  <tr><td><code>evidenceDigest</code></td><td>string (SHA-256 hex)</td><td>Hash of engineEvidence for integrity verification</td></tr>
                  <tr><td><code>previousReceiptHash</code></td><td>string | null</td><td>SHA-256 of prior receipt (null for first session)</td></tr>
                  <tr><td><code>cfcResults</code></td><td>CFCResult[]</td><td>Continuity Failure Condition check results</td></tr>
                </tbody>
              </table>

              <h3>2.2 Digest Computation</h3>
              <p>
                <code>evidenceDigest = SHA-256(JSON.stringify(engineEvidence, sortedKeys))</code>
              </p>
              <p>
                The digest enables external parties to verify that the evidence has not been altered
                without revealing the evidence itself. A verifier can recompute the digest from the
                evidence data and compare it to the stored digest.
              </p>
            </section>

            {/* 3. Receipt Chaining */}
            <section className="note-section" id="chain">
              <h2>3. Receipt Chaining</h2>
              <h3>3.1 Hash Chain Construction</h3>
              <p>
                Each EvidenceReceipt (except the first) contains <code>previousReceiptHash</code> —
                the SHA-256 of the entire prior receipt. This forms a hash chain:
              </p>
              <p>
                R₁ → H(R₁) → R₂ → H(R₂) → R₃ → H(R₃) → ...
              </p>
              <p>
                To verify a Continuity Proof of length N:
              </p>
              <ol>
                <li>Verify R₁: check that previousReceiptHash is null</li>
                <li>For each subsequent Rᵢ: check that previousReceiptHash equals SHA-256(Rᵢ₋₁)</li>
                <li>Verify each Rᵢ's evidenceDigest against its engineEvidence</li>
                <li>Verify each Rᵢ's verdict against the declared policy</li>
              </ol>

              <h3>3.2 Chain Properties</h3>
              <ul>
                <li><strong>Tamper-evident:</strong> Any modification to any receipt in the chain invalidates all subsequent hashes.</li>
                <li><strong>Append-only:</strong> New receipts link to the head. The chain cannot be rewritten without detection.</li>
                <li><strong>Verifiable without full chain:</strong> To verify R₅, a verifier needs only R₄ and R₅ — not the entire chain.</li>
              </ul>

              <h3>3.3 Chain Integrity Score</h3>
              <p>
                CIS = (valid links / total links). A CIS of 1.0 indicates an unbroken continuity chain.
                A CIS below 1.0 indicates gaps — periods where continuity could not be verified.
                Implementations SHOULD report CIS alongside the current receipt.
              </p>
            </section>

            {/* 4. CFC */}
            <section className="note-section" id="cfc">
              <h2>4. Continuity Failure Conditions</h2>
              <h3>4.1 Catalog</h3>
              <p>
                A <strong>Continuity Failure Condition (CFC)</strong> is a specific, measurable
                condition that, if triggered, reduces confidence in continuity. Each CFC has a
                unique identifier, a detection algorithm, and a severity level.
              </p>
              <table className="note-table">
                <thead><tr><th>ID</th><th>Name</th><th>Severity</th><th>Detection</th></tr></thead>
                <tbody>
                  <tr><td>CFC-001</td><td>Entropy Drop</td><td>HIGH</td><td>PES drops &gt;50% between consecutive sessions</td></tr>
                  <tr><td>CFC-002</td><td>Sensor Fingerprint Change</td><td>HIGH</td><td>IMU noise profile changes beyond calibrated variance</td></tr>
                  <tr><td>CFC-003</td><td>Temporal Gap</td><td>MEDIUM</td><td>Inter-session interval exceeds configured maximum</td></tr>
                  <tr><td>CFC-004</td><td>Location Discontinuity</td><td>MEDIUM</td><td>Session locations are physically impossible to traverse in elapsed time</td></tr>
                  <tr><td>CFC-005</td><td>Causal Inversion</td><td>HIGH</td><td>Camera direction change precedes IMU jerk by &gt;250ms</td></tr>
                  <tr><td>CFC-006</td><td>Challenge Non-Response</td><td>HIGH</td><td>Entity fails to respond to gyroscope challenge within window</td></tr>
                  <tr><td>CFC-007</td><td>Challenge Mismatch</td><td>HIGH</td><td>0/3 rounds match challenge direction</td></tr>
                  <tr><td>CFC-008</td><td>Predictability</td><td>MEDIUM</td><td>Motion too consistent — angle/magnitude variance below threshold</td></tr>
                </tbody>
              </table>

              <h3>4.2 CFC Result Format</h3>
              <p>Each CFC check produces a structured result:</p>
              <table className="note-table">
                <thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>cfcId</code></td><td>string</td><td>CFC identifier (e.g., "CFC-005")</td></tr>
                  <tr><td><code>triggered</code></td><td>boolean</td><td>Whether the condition was detected</td></tr>
                  <tr><td><code>severity</code></td><td>HIGH | MEDIUM | LOW</td><td>Impact on continuity confidence</td></tr>
                  <tr><td><code>detail</code></td><td>string</td><td>Human-readable diagnostic</td></tr>
                  <tr><td><code>values</code></td><td>object</td><td>Measured values (e.g., {"{"} leadTime: 372, threshold: 250 {"}"})</td></tr>
                </tbody>
              </table>

              <h3>4.3 CFC-005 Experimental Confirmation</h3>
              <p>
                CFC-005 (Causal Inversion) provides the strongest experimental validation of the CFC framework.
                Across 276 independent-device runs, CFC-005 activated 13 times (4.7%) — and <strong>0 times</strong>
                in 50 single-device runs. The condition is not a parameter artifact: it activates only when
                devices are physically separated, confirming that it measures genuine temporal causality
                rather than sensor noise.
              </p>
            </section>

            {/* 5. Cross-Device Binding */}
            <section className="note-section" id="cross">
              <h2>5. Cross-Device Binding</h2>
              <h3>5.1 Definition</h3>
              <p>
                <strong>Cross-Device Binding</strong> extends continuity verification to the case where
                two observations come from <em>different devices</em> held by the same entity.
                If Device A and Device B are held together and moved as a unit, their IMU streams
                should exhibit high cross-correlation.
              </p>

              <h3>5.2 Cross-Correlation Metric</h3>
              <p>Given two IMU streams D₁ and D₂ of equal duration:</p>
              <ol>
                <li>Bin both streams into 200ms windows</li>
                <li>Compute acceleration magnitude sum per window</li>
                <li>Compute Pearson correlation coefficient r ∈ [-1, 1] across window pairs</li>
                <li><strong>r &gt; 0.5:</strong> Strong cross-device continuity<br/>
                    <strong>0.2 &lt; r ≤ 0.5:</strong> Moderate — partial coupling<br/>
                    <strong>r ≤ 0.2:</strong> Weak — devices likely describe different events</li>
              </ol>

              <h3>5.3 Current Status</h3>
              <p>
                Cross-device binding is currently in prototype (API exists at <code>/api/pe001/cross</code>).
                Multi-device experiments are planned. The cross-correlation metric and thresholds are
                provisional and will be calibrated when experimental data is available.
              </p>
            </section>

            {/* 6. Verification Policy */}
            <section className="note-section" id="policy">
              <h2>6. Verification Policy</h2>
              <h3>6.1 Policy Structure</h3>
              <p>A VerificationPolicy separates evidence collection from verdict computation:</p>
              <table className="note-table">
                <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>policyId</code></td><td>"default"</td><td>Unique policy identifier</td></tr>
                  <tr><td><code>acceptThreshold</code></td><td>0.70</td><td>Confidence ≥ threshold → PASS</td></tr>
                  <tr><td><code>rejectThreshold</code></td><td>0.35</td><td>Confidence ≤ threshold → FAIL</td></tr>
                  <tr><td><code>escalationEngines</code></td><td>["EE-003"]</td><td>Engines to invoke in escalation</td></tr>
                  <tr><td><code>requiredEngines</code></td><td>["EE-001"]</td><td>Engines that must produce evidence</td></tr>
                  <tr><td><code>cfcSeverityThreshold</code></td><td>"HIGH"</td><td>CFCs at or above this severity auto-fail</td></tr>
                </tbody>
              </table>

              <h3>6.2 Policy Evaluation</h3>
              <p>
                <code>evaluatePolicy(policy, confidence) → Verdict</code>
              </p>
              <p>
                The policy is a pure function of confidence and CFC results. The same evidence
                can produce different verdicts under different policies — a low-security application
                may accept at 0.50 while a high-security application requires 0.85 and auto-fails
                on any HIGH-severity CFC.
              </p>
            </section>

            {/* 7. Experimental Validation */}
            <section className="note-section" id="validation">
              <h2>7. Experimental Validation</h2>
              <table className="note-table">
                <thead><tr><th>Engine</th><th>N</th><th>Pass Rate</th></tr></thead>
                <tbody>
                  <tr><td>EE-003</td><td>101</td><td>58%</td></tr>
                  <tr><td>PE-001 single-device</td><td>50</td><td>93%</td></tr>
                  <tr><td>PE-001 independent (3 trackers)</td><td>266</td><td>58%</td></tr>
                  <tr><td>VS-001</td><td>60</td><td>93%</td></tr>
                  <tr><td><strong>Total</strong></td><td><strong>477</strong></td><td>—</td></tr>
                </tbody>
              </table>
              <p>
                CFC-005 validated as a genuine security primitive: 13/266 independent-device runs vs. 0/50 single-device.
                Temporal alignment 100% across independent devices.
              </p>
            </section>

            {/* 8. Reference Implementation */}
            <section className="note-section" id="reference">
              <h2>8. Reference Implementation</h2>
              <table className="note-table">
                <thead><tr><th>Module</th><th>Tests</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>src/lib/evidence/types.ts</code></td><td>29</td><td>EvidenceReceipt, VerificationPolicy, hashEvidence, evaluatePolicy</td></tr>
                  <tr><td><code>src/lib/evidence/session.test.ts</code></td><td>19</td><td>Session lifecycle, escalation, receipt chaining</td></tr>
                  <tr><td><code>src/lib/evidence/attack-simulation.test.ts</code></td><td>18</td><td>CFC adversarial validation</td></tr>
                </tbody>
              </table>
              <p>Run: <code>npx vitest run src/lib/evidence/</code></p>
            </section>

            <RelatedResearch
              supportedBy={[
                { id: "VS-001", label: "Verification Session", href: "/research/protocol-verify" },
                { id: "PE-001", label: "Causal Coupling", href: "/research/causal-coupling" },
              ]}
              relatedNotes={[
                { id: "RFC-0001", label: "Motion Signature Format", href: "/research/notes/004-motion-signature-rfc" },
                { id: "RN-003", label: "Cross-Modal Binding", href: "/research/notes/003-cross-modal-binding" },
                { id: "FD-001", label: "Frame Rate Hypothesis", href: "/research/notes/005-failure-report-10fps" },
              ]}
            />

            <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
              <Link href="/research" className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors">
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

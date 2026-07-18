"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import "./rfc.css";

const TOC = [
  { id: "abstract", label: "Abstract" },
  { id: "status", label: "Status of This Document" },
  { id: "intro", label: "1. Introduction" },
  { id: "pes", label: "2. Presence Entropy Score (PES)" },
  { id: "jerk", label: "3. Jerk Peak Detection" },
  { id: "matching", label: "4. Cross-Modal Temporal Matching" },
  { id: "challenge", label: "5. Challenge-Response Extension" },
  { id: "session", label: "6. Verification Session Protocol" },
  { id: "validation", label: "7. Experimental Validation" },
  { id: "reference", label: "8. Reference Implementation" },
  { id: "open", label: "9. Open Questions" },
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
              <ResearchMeta artifactId="RFC-0001" type="Request for Comments" status="Draft" published="2026.07.18" />
            </div>
            <h1 className="note-title">Motion Signature Format</h1>
            <p className="note-subtitle">
              A formal, implementable specification. Any team should be able to build a compatible verifier from this document alone.
            </p>

            {/* Abstract */}
            <section className="note-section" id="abstract">
              <h2>Abstract</h2>
              <p>
                This document defines the <strong>MyShape Motion Signature</strong> — a multi-dimensional descriptor
                extracted from consumer-grade inertial measurement unit (IMU) data and camera observations. The Motion
                Signature enables verifiable continuity: the property that two temporally separated observations
                originate from the same physically embodied entity.
              </p>
              <p>
                The specification covers four layers: (1) the Presence Entropy Score for liveness quantification,
                (2) jerk peak detection for event extraction from IMU streams, (3) cross-modal temporal matching
                for binding independent sensor observations to a shared physical cause, and (4) challenge-response
                extensions for active adversary resistance.
              </p>
              <p>
                This document is normative. Implementations that conform to this specification produce
                <strong>MyShape-compatible verification receipts</strong> — cryptographically hashable evidence
                objects that can be verified by any conforming verifier.
              </p>
            </section>

            {/* Status */}
            <section className="note-section" id="status">
              <h2>Status of This Document</h2>
              <p>
                <strong>RFC-0001 · Draft · 2026-07-18.</strong> Published by The Continuity Lab.
                This is a living document. Comments, corrections, and proposed amendments should be submitted
                as GitHub issues against the MyShape Protocol repository.
              </p>
              <p>
                All algorithms described herein have been validated across <strong>477 independent experimental runs</strong>
                spanning four evidence engines (EE-001 through EE-003, VS-001) on consumer iPhone hardware.
                Parameter values are empirical and calibrated against real human motion data.
              </p>
            </section>

            {/* 1. Introduction */}
            <section className="note-section" id="intro">
              <h2>1. Introduction</h2>
              <h3>1.1 What is a Motion Signature?</h3>
              <p>
                A <strong>Motion Signature</strong> is a 128-dimensional vector extracted from IMU and camera
                observations of a physically embodied entity in motion. It captures four independent feature groups:
              </p>
              <ol>
                <li><strong>Kinematics</strong> — raw acceleration, rotation rate, and derived velocity vectors</li>
                <li><strong>Jerk</strong> — the third derivative of position (derivative of acceleration), detecting force onsets</li>
                <li><strong>Jerk Spectrum</strong> — frequency-domain entropy of the jerk signal, quantifying biological unpredictability</li>
                <li><strong>Cross-Modal Binding</strong> — temporal alignment between IMU events and camera-observed trajectory changes</li>
              </ol>
              <p>
                Unlike static identifiers (passwords, tokens, enrollment templates), the Motion Signature
                is <strong>not an identity signal</strong>. It does not answer "who are you?" — it answers
                "are you physically present and continuously embodied?"
              </p>

              <h3>1.2 Design Principles</h3>
              <ul>
                <li><strong>Sensor-agnostic.</strong> Any IMU (accelerometer + gyroscope) and any camera (RGB, depth, IR) can produce compatible input.</li>
                <li><strong>Device-independent.</strong> The same entity should produce correlating signatures across different devices held simultaneously.</li>
                <li><strong>No enrollment.</strong> No prior template, calibration, or training data is required for a given entity.</li>
                <li><strong>Non-identifying.</strong> A Motion Signature alone cannot be used to re-identify an individual across sessions.</li>
                <li><strong>Falsifiable.</strong> Every detection is accompanied by per-component evidence with explicit thresholds and diagnostic explanations.</li>
              </ul>

              <h3>1.3 Terminology</h3>
              <table className="note-table">
                <thead><tr><th>Term</th><th>Definition</th></tr></thead>
                <tbody>
                  <tr><td>Entity</td><td>The physically embodied subject being observed</td></tr>
                  <tr><td>Presence</td><td>The property of being a living, physically embodied entity — not a simulation or replay</td></tr>
                  <tr><td>Continuity</td><td>The property that two observations describe the same entity</td></tr>
                  <tr><td>Evidence Engine</td><td>A module that produces structured evidence from sensor data</td></tr>
                  <tr><td>Verification Session</td><td>A complete flow: evidence collection → policy evaluation → receipt</td></tr>
                </tbody>
              </table>
            </section>

            {/* 2. PES */}
            <section className="note-section" id="pes">
              <h2>2. Presence Entropy Score (PES)</h2>
              <h3>2.1 Definition</h3>
              <p>
                The <strong>Presence Entropy Score</strong> is a scalar value PES ∈ [0, 1] that quantifies the
                depth of biological entropy in an IMU sample stream. Higher scores indicate stronger evidence
                of a living, non-deterministic entity.
              </p>
              <p>
                PES is computed from four sub-components over an 8-second observation window:
              </p>
              <ol>
                <li>
                  <strong>Micro-timing variance (MTV)</strong> — the coefficient of variation of inter-sample intervals.
                  Biological motion exhibits natural timing jitter; mechanical replays produce near-constant intervals.
                  Real human data: CV ∈ [0.08, 0.35]. Replay data: CV &lt; 0.03.
                </li>
                <li>
                  <strong>Noise residual (NR)</strong> — the RMS of the residual after subtracting a 5th-order polynomial
                  fit from the acceleration magnitude. Biological motion contains high-frequency micro-tremor
                  (8–12 Hz) that polynomial fits cannot capture.
                </li>
                <li>
                  <strong>Frequency entropy (FE)</strong> — Shannon entropy of the FFT power spectrum (0–25 Hz)
                  of the acceleration magnitude, normalized to [0, 1]. Deterministic signals concentrate energy
                  in narrow bands; biological signals spread energy broadly.
                </li>
                <li>
                  <strong>Biological perturbation (BP)</strong> — the count of jerk peaks exceeding the noise floor
                  by 2× or more. This captures the "start-stop" irregularity characteristic of human motor actuation.
                </li>
              </ol>

              <h3>2.2 Computation</h3>
              <p>
                PES = min(1, w₁·MTV + w₂·NR + w₃·FE + w₄·BP)
              </p>
              <p>
                Current weights (v0.3): w₁ = 0.25, w₂ = 0.25, w₃ = 0.30, w₄ = 0.20.
                These weights are empirical and may be recalibrated as more data is collected.
                Implementations MUST document the weight vector used.
              </p>

              <h3>2.3 Thresholds</h3>
              <table className="note-table">
                <thead><tr><th>PES Range</th><th>Interpretation</th></tr></thead>
                <tbody>
                  <tr><td>PES ≥ 0.30</td><td>Sufficient presence — entity passes passive check</td></tr>
                  <tr><td>0.15 ≤ PES &lt; 0.30</td><td>Borderline — additional evidence required</td></tr>
                  <tr><td>PES &lt; 0.15</td><td>Insufficient — likely mechanical or synthetic</td></tr>
                </tbody>
              </table>
            </section>

            {/* 3. Jerk Peak Detection */}
            <section className="note-section" id="jerk">
              <h2>3. Jerk Peak Detection</h2>
              <h3>3.1 Derivation</h3>
              <p>
                Jerk <strong>j(t)</strong> is the time derivative of acceleration: <strong>j = da/dt</strong>.
                It measures the rate of change of force — a physically meaningful quantity because Newton's
                Second Law (F = ma) implies dj/dt = (1/m)·dF/dt. Jerk peaks therefore correspond to
                <strong>onsets of force changes</strong> initiated by motor actuation.
              </p>

              <h3>3.2 Detection Algorithm</h3>
              <p>Given an IMU sample stream S = {"{s₁, s₂, ..., sₙ}"} where each sᵢ = (tᵢ, axᵢ, ayᵢ, azᵢ):</p>
              <ol>
                <li>Compute acceleration magnitude: <strong>|a|ᵢ = sqrt(axᵢ² + ayᵢ² + azᵢ²)</strong></li>
                <li>Compute jerk magnitude: <strong>|j|ᵢ = |a|ᵢ₊₁ − |a|ᵢ</strong> (discrete differentiation)</li>
                <li>Compute dynamic threshold: <strong>τ = median(|j|) + 2 × MAD(|j|)</strong>, with floor <strong>τ_min = 0.15 m/s³</strong></li>
                <li>Detect peaks: a jerk event occurs at index i when <strong>|j|ᵢ &gt; τ</strong> and <strong>|j|ᵢ &gt; |j|ᵢ₋₁</strong> and <strong>|j|ᵢ &gt; |j|ᵢ₊₁</strong></li>
                <li>Apply refractory period of <strong>150ms</strong> — ignore peaks within 150ms of a prior peak</li>
              </ol>

              <h3>3.3 Parameters (v0.3)</h3>
              <table className="note-table">
                <thead><tr><th>Parameter</th><th>Value</th><th>Rationale</th></tr></thead>
                <tbody>
                  <tr><td>JERK_MIN_THRESHOLD</td><td>0.15 m/s³</td><td>Floor below which biological signal is indistinguishable from sensor noise</td></tr>
                  <tr><td>MAD multiplier</td><td>2×</td><td>Reduced from 3× (v0.2) to increase sensitivity on iPhone IMU</td></tr>
                  <tr><td>Refractory period</td><td>150ms</td><td>Prevents double-counting a single force onset</td></tr>
                  <tr><td>MATCH_WINDOW_MS</td><td>±500ms</td><td>Widened from 200ms — consumer hardware temporal precision is limited</td></tr>
                </tbody>
              </table>
            </section>

            {/* 4. Cross-Modal Temporal Matching */}
            <section className="note-section" id="matching">
              <h2>4. Cross-Modal Temporal Matching</h2>
              <h3>4.1 The Binding Problem</h3>
              <p>
                When two independent sensors (IMU + camera) observe the same physical event, their observations
                MUST be causally ordered: the force onset (IMU jerk) precedes the visible trajectory change
                (camera direction change). If the camera shows a direction change <em>before</em> the IMU
                registers corresponding force, the two streams cannot describe the same physical event.
              </p>

              <h3>4.2 Event-Level Matching</h3>
              <p>
                Rather than estimating acceleration from low-framerate video (which amplifies noise),
                we compare <strong>events</strong> across modalities:
              </p>
              <ol>
                <li><strong>IMU events:</strong> Jerk peaks detected via the algorithm in Section 3</li>
                <li><strong>Camera events:</strong> Trajectory turning points — consecutive velocity vectors
                    that differ in direction by ≥ 45° and exceed a minimum speed threshold of 0.2 units/frame</li>
                <li><strong>Match:</strong> Pair each IMU event with the nearest camera event within ±500ms.
                    If multiple candidates exist, select the pair with smallest Δt.</li>
                <li><strong>Direction check:</strong> For each matched pair, verify that the IMU force vector
                    and camera displacement vector agree within 90° tolerance.</li>
              </ol>

              <h3>4.3 Causal Evidence Score</h3>
              <p>Four components aggregate into a Causal Evidence metric:</p>
              <table className="note-table">
                <thead><tr><th>Component</th><th>Threshold</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td>Event Density</td><td>0.20 events/s</td><td>Sufficient events in both channels for meaningful analysis</td></tr>
                  <tr><td>Temporal Alignment</td><td>0.25</td><td>Fraction of events matched across modalities within window</td></tr>
                  <tr><td>Direction Agreement</td><td>0.50</td><td>Fraction of matched pairs with consistent direction</td></tr>
                  <tr><td>Causal Evidence</td><td>0.30</td><td>Aggregate score — weighted combination of above</td></tr>
                </tbody>
              </table>

              <h3>4.4 CFC-005: Causal Inversion</h3>
              <p>
                A <strong>Causal Inversion</strong> occurs when a camera direction change precedes its
                matched IMU jerk by more than 250ms. Under Newtonian mechanics, the force must precede
                the visible effect. CFC-005 detection indicates that the two streams cannot share a
                physical cause under the current timing model.
              </p>
              <p>
                CFC-005 is <strong>not a definitive forgery detector</strong>. It is an evidence component
                that contributes to the aggregate confidence score. A single CFC-005 event does not
                reject a session; repeated CFC-005 events across multiple evidence engines raise the
                probability that streams are causally decoupled.
              </p>
            </section>

            {/* 5. Challenge-Response */}
            <section className="note-section" id="challenge">
              <h2>5. Challenge-Response Extension</h2>
              <h3>5.1 Purpose</h3>
              <p>
                Passive evidence (IMU presence + cross-modal coupling) can be defeated by synchronized
                replay attacks. The Challenge-Response extension (EE-003) mitigates this by introducing
                <strong>unpredictable, time-jittered directional challenges</strong> that a mechanical
                replay cannot anticipate.
              </p>

              <h3>5.2 Protocol</h3>
              <ol>
                <li>System randomly selects a direction d ∈ {"{←, →, ↑, ↓}"} and a jitter J ∈ [0, 1000] ms</li>
                <li>System displays direction arrow and waits 2000 + J ms (countdown with jitter)</li>
                <li>Entity rotates the device in the indicated direction during a 2000ms capture window</li>
                <li>Gyroscope data is analyzed: direction match (peak rotation aligns with challenge) and magnitude check (rotation rate ≥ threshold)</li>
                <li>Repeat for 3 rounds with independent random directions and jitter values</li>
              </ol>

              <h3>5.3 Round Analysis</h3>
              <p>For each round with gyroscope samples r(t) = (rx, ry, rz) at time t:</p>
              <ul>
                <li><strong>Direction match:</strong> Peak rotation rate axis matches challenge direction within 60°</li>
                <li><strong>Magnitude check:</strong> Peak rotation rate ≥ 100°/s for yaw, ≥ 50°/s for pitch</li>
                <li><strong>CFC-008 (Predictability):</strong> If angle variance across rounds &lt; 50° AND magnitude variance &lt; 0.05, flag as potentially mechanical</li>
              </ul>

              <h3>5.4 Verdict</h3>
              <p>
                Evidence is sufficient when ≥ 2 of 3 rounds pass direction match.
                At 101 experimental runs, the challenge-response pass rate is 58%.
                The challenge is effective as <strong>additional evidence</strong> in an escalation
                pipeline but should not serve as a standalone verifier.
              </p>
            </section>

            {/* 6. Verification Session */}
            <section className="note-section" id="session">
              <h2>6. Verification Session Protocol</h2>
              <h3>6.1 Session Lifecycle</h3>
              <ol>
                <li><strong>Init:</strong> Generate session ID, set policy (accept/reject thresholds, escalation rules)</li>
                <li><strong>Passive Evidence:</strong> Collect EE-001 (IMU presence) for 8 seconds of free motion</li>
                <li><strong>Decision Gate:</strong> confidence &lt; 0.35 → REJECT; confidence ≥ 0.70 → ACCEPT; 0.35–0.70 → ESCALATE</li>
                <li><strong>Additional Evidence:</strong> If escalated, collect EE-003 (gyroscope challenge, 3 rounds)</li>
                <li><strong>Aggregate:</strong> Compute final confidence across all collected evidence</li>
                <li><strong>Receipt:</strong> Emit EvidenceReceipt with session ID, verdict, component scores, and hash chain</li>
              </ol>

              <h3>6.2 Policy Configuration</h3>
              <table className="note-table">
                <thead><tr><th>Parameter</th><th>Default</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td>acceptThreshold</td><td>0.70</td><td>Minimum confidence for PASS verdict</td></tr>
                  <tr><td>rejectThreshold</td><td>0.35</td><td>Maximum confidence for FAIL verdict</td></tr>
                  <tr><td>IMU_ONLY_CAP</td><td>0.65</td><td>IMU evidence alone cannot trigger auto-accept</td></tr>
                  <tr><td>escalationEngines</td><td>["EE-003"]</td><td>Engines to invoke on escalation</td></tr>
                </tbody>
              </table>

              <h3>6.3 Evidence Receipt Format</h3>
              <p>
                Every verification session produces an <strong>EvidenceReceipt</strong> — a JSON-serializable
                object containing:
              </p>
              <ul>
                <li><strong>sessionId:</strong> UUIDv4</li>
                <li><strong>timestamp:</strong> ISO 8601</li>
                <li><strong>verdict:</strong> PASS | FAIL | INSUFFICIENT_EVIDENCE</li>
                <li><strong>confidence:</strong> float ∈ [0, 1]</li>
                <li><strong>engineEvidence:</strong> Array of {"{ engineId, components[], diagnostics[], evidenceDigest }"}</li>
                <li><strong>previousReceiptHash:</strong> SHA-256 of prior receipt (for chain continuity)</li>
              </ul>
            </section>

            {/* 7. Experimental Validation */}
            <section className="note-section" id="validation">
              <h2>7. Experimental Validation</h2>
              <p>
                All algorithms and thresholds have been validated across <strong>477 independent experimental runs</strong>
                on consumer iPhone hardware over three days (2026-07-15 to 2026-07-17).
              </p>
              <table className="note-table">
                <thead><tr><th>Engine</th><th>N</th><th>Pass Rate</th><th>Key Signal</th></tr></thead>
                <tbody>
                  <tr><td>EE-003 (gyro challenge)</td><td>101</td><td>58%</td><td>2/3 rounds sufficient 84% of PASS cases</td></tr>
                  <tr><td>PE-001 single-device</td><td>50</td><td>93%</td><td>Temporal alignment 100%</td></tr>
                  <tr><td>PE-001 independent (3 trackers)</td><td>266</td><td>58%</td><td>Temporal alignment 100%, tracker-limited</td></tr>
                  <tr><td>VS-001 (dual-engine)</td><td>60</td><td>93%</td><td>Passive stage 100%, escalation reliable</td></tr>
                </tbody>
              </table>
              <p>
                <strong>Temporal alignment of 100% across 276 independent-device runs</strong> is the central
                experimental result. Cross-modal binding survives the transition from single-device to
                independent-device deployment with zero degradation in temporal signal integrity.
              </p>
              <p>
                Detailed experimental methodology, per-engine diagnostics, and failure analysis are documented
                in <Link href="/research/notes/003-cross-modal-binding" className="text-[#90c8ff]/70 hover:text-[#90c8ff] underline">RN-003 — Cross-Modal Binding</Link>.
              </p>
            </section>

            {/* 8. Reference Implementation */}
            <section className="note-section" id="reference">
              <h2>8. Reference Implementation</h2>
              <p>
                A reference implementation of this specification exists in the MyShape Protocol monorepo:
              </p>
              <table className="note-table">
                <thead><tr><th>Module</th><th>Path</th><th>Tests</th></tr></thead>
                <tbody>
                  <tr><td>Evidence types + policy</td><td><code>src/lib/evidence/types.ts</code></td><td>29</td></tr>
                  <tr><td>Causal coupling (EE-002)</td><td><code>src/lib/evidence/causal-coupling.ts</code></td><td>38</td></tr>
                  <tr><td>Gyroscope challenge (EE-003)</td><td><code>src/lib/evidence/gyro-challenge.ts</code></td><td>25</td></tr>
                  <tr><td>Verification session</td><td><code>src/lib/evidence/session.test.ts</code></td><td>19</td></tr>
                  <tr><td>Attack simulation</td><td><code>src/lib/evidence/attack-simulation.test.ts</code></td><td>18</td></tr>
                </tbody>
              </table>
              <p>
                Run all tests: <code>npx vitest run src/lib/evidence/</code>
              </p>
              <p>
                An npm package providing a single-entry-point <code>verifyContinuity()</code> function
                is forthcoming. See the GitHub repository for current status.
              </p>
            </section>

            {/* 9. Open Questions */}
            <section className="note-section" id="open">
              <h2>9. Open Questions</h2>
              <ol>
                <li><strong>Cross-device calibration.</strong> Current PES weights are calibrated on a single iPhone model. Do different IMU chips require per-device normalization?</li>
                <li><strong>Minimum window duration.</strong> The 8-second passive window is empirical. Formal power analysis needed to determine the shortest window with adequate sensitivity.</li>
                <li><strong>Multi-entity tracking.</strong> Can the cross-modal matching algorithm be extended to N {">"} 1 entities in the same camera frame?</li>
                <li><strong>Adversarial synthesis.</strong> Can a causally self-consistent fake sensor stream be generated that passes both PES and cross-modal checks?</li>
                <li><strong>Privacy-preserving verification.</strong> Can an EvidenceReceipt be verified in zero-knowledge, proving a PASS verdict without revealing the underlying motion data?</li>
              </ol>
            </section>

            <RelatedResearch
              supportedBy={[
                { id: "PE-001", label: "Causal Coupling", href: "/research/causal-coupling" },
                { id: "VS-001", label: "Verification Session", href: "/research/protocol-verify" },
                { id: "EE-003", label: "Gyroscope Challenge", href: "/research/challenge-response" },
              ]}
              relatedNotes={[
                { id: "RN-003", label: "Cross-Modal Binding", href: "/research/notes/003-cross-modal-binding" },
                { id: "RN-002", label: "PES Benchmark v0.2", href: "/research/notes/002-pes-benchmark" },
                { id: "RN-001", label: "The Continuity Problem", href: "/research/notes/001-the-continuity-problem" },
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

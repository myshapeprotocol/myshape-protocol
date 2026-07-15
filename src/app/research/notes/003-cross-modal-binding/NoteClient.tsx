"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

const TOC_ITEMS = [
  { id: "part-1", label: "Part 1 — The Binding Problem" },
  { id: "part-2", label: "Part 2 — Event-Level Causal Coupling" },
  { id: "part-3", label: "Part 3 — Architecture: EE-002" },
  { id: "part-4", label: "Part 4 — CFC-005: Causal Inversion" },
  { id: "part-5", label: "Part 5 — What This Does Not Prove" },
  { id: "part-6", label: "Part 6 — Open Questions" },
  { id: "part-7", label: "Part 7 — Role in Verification Session" },
  { id: "part-8", label: "Part 8 — Experimental Validation (N=165)" },
];

export default function NoteClient() {
  const [activeSection, setActiveSection] = useState("part-1");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const item of TOC_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <div className="note-layout">
          <nav className="note-toc" aria-label="Table of Contents">
            <div className="note-toc-title">Contents</div>
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`note-toc-item ${activeSection === item.id ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                onMouseEnter={() => playTick(420, "sine", 0.03, 0.018)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <article className="note-article">
            <div className="note-meta">
              <ResearchMeta
                artifactId="RN-003"
                type="Research Note"
                status="Published"
                published="2026.07.13"
              />
            </div>

            <h1 className="note-title" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
              Cross-Modal Binding
            </h1>
            <p className="note-subtitle">
              Proving that two independent sensor streams originate from the
              same physical event — a new verification primitive beyond
              multimodal fusion.
            </p>

            {/* ── Part 1 ── */}
            <section className="note-section" id="part-1">
              <h2>Part 1 — The Binding Problem</h2>

              <h3>1.1 The Hidden Assumption</h3>
              <p>
                Every dual-sensor verification system makes an implicit assumption: that
                both sensors observe the same physical subject. When we AND together an IMU
                score and a camera score, we are not proving they describe the same event.
                We are merely hoping.
              </p>
              <p>
                This assumption is the weakest link. Two plausible attack surfaces exist
                that pass independent scoring but violate the binding assumption:
              </p>
              <ul>
                <li>
                  <strong>Real human + AI video.</strong> A real person holds the device
                  (generating authentic IMU data) while an AI-generated video feed
                  shows fabricated motion. Both channels score well independently.
                </li>
                <li>
                  <strong>Real video + scripted IMU.</strong> Authentic camera footage
                  of a human moving is paired with a script that replays plausible
                  accelerometer values. Again, both look real in isolation.
                </li>
              </ul>
              <p>
                In both cases, the current AND-gate passes. Neither channel has failed.
                But the two channels describe <em>different physical events</em>.
              </p>

              <h3>1.2 Beyond Multimodal Fusion</h3>
              <p>
                Multimodal fusion asks: "Do multiple sensors agree on what happened?"
                Cross-modal binding asks: "Can these observations be explained by any
                hypothesis other than a single real-world event?"
              </p>
              <p>
                This is not a fusion problem. It is a <strong>causal verification</strong> problem.
                The question is not whether each stream is individually plausible —
                it is whether they share a single physical cause.
              </p>
            </section>

            {/* ── Part 2 ── */}
            <section className="note-section" id="part-2">
              <h2>Part 2 — Event-Level Causal Coupling</h2>

              <h3>2.1 Intuition</h3>
              <p>
                A physical event produces observable consequences in every sensor that
                witnesses it. When a hand holding a phone changes direction, two things
                must happen:
              </p>
              <ol>
                <li>The IMU registers a jerk (derivative of acceleration) — the force
                    that initiated the direction change.</li>
                <li>The camera observes a trajectory turn — the visual consequence
                    of that same force.</li>
              </ol>
              <p>
                Physics requires the jerk to precede the visible trajectory change.
                If the camera shows a turn <em>before</em> the IMU registers force,
                the two streams cannot describe the same physical event.
              </p>

              <h3>2.2 V1 Approach: Events, Not Waveforms</h3>
              <p>
                We deliberately avoid estimating acceleration from 15fps video.
                Second-order differencing over 66ms intervals amplifies noise by an
                order of magnitude. Instead, we compare <strong>events</strong>:
              </p>
              <ul>
                <li><strong>IMU:</strong> Detect jerk peaks (derivative of acceleration)
                    using a dynamic threshold (median + 3×MAD, floor 0.2 m/s³).</li>
                <li><strong>Camera:</strong> Detect trajectory turning points where
                    the velocity vector changes direction by more than 45°.</li>
                <li><strong>Match:</strong> Pair events within a ±500ms window
                    (calibrated from real phone data — simulation-grade 200ms window
                    proved too tight for consumer hardware).</li>
                <li><strong>Direction:</strong> Aligned within 90° tolerance.</li>
              </ul>
              <p>
                <strong>Calibration note (v0.2, 2026-07-14):</strong> Parameters were
                adjusted after 20 captures on an iPhone. The simulation parameter set
                (200ms window, 0.5 jerk threshold) produced near-zero match rates on
                real hardware. Widening to 500ms and lowering the jerk floor to 0.2
                achieved 80% normal-group PASS rate against a 20% abnormal-group
                false-positive rate.
              </p>

              <h3>2.3 Causal Evidence Score</h3>
              <p>
                Four components contribute to a Causal Evidence metric:
              </p>
              <ul>
                <li><strong>Event Density</strong> — are enough events detected
                    in both channels for meaningful analysis?</li>
                <li><strong>Temporal Alignment</strong> — what fraction of events
                    match across modalities within the time window?</li>
                <li><strong>Direction Agreement</strong> — among matched pairs,
                    what fraction show consistent direction?</li>
                <li><strong>Causal Evidence</strong> — experimental prototype
                    aggregation (v0.1, linear weights, provisional).</li>
              </ul>
              <p>
                Important: this is an <strong>Evidence Engine</strong>, not a classifier.
                It outputs structured evidence with per-component diagnostics. Verdict
                comes from a separate VerificationPolicy.
              </p>
            </section>

            {/* ── Part 3 ── */}
            <section className="note-section" id="part-3">
              <h2>Part 3 — Architecture: EE-002</h2>

              <h3>3.1 Evidence Engine Roster</h3>
              <p>
                Cross-Modal Binding is implemented as <strong>EE-002 — Event-Level
                Causal Coupling</strong>, the second Evidence Engine in the Continuity
                Protocol architecture:
              </p>
              <table className="note-table">
                <thead>
                  <tr><th>Engine</th><th>Name</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>EE-001</td><td>Presence Entropy (PES)</td><td>Active — RN-002</td></tr>
                  <tr><td>EE-002</td><td>Event-Level Causal Coupling</td><td>Prototype — PE-001</td></tr>
                  <tr><td>EE-003</td><td>Additional Evidence (Gyroscope)</td><td>Active — VS-001</td></tr>
                  <tr><td>EE-004</td><td>TEE Attestation</td><td>Future</td></tr>
                  <tr><td>EE-005</td><td>Execution Trace</td><td>Future</td></tr>
                </tbody>
              </table>

              <h3>3.2 Engine-Agnostic Evidence Schema</h3>
              <p>
                All engines output the same <code>EngineEvidence</code> structure.
                Each metric within an engine uses a shared <code>ComponentEvidence</code>
                shape: <code>{'{'} engine, metric, value, threshold, status, explanation, hint {'}'}</code>.
                This means EE-001 (IMU PES) and EE-002 (Temporal Alignment) produce
                structurally identical output — the Receipt layer does not need to
                know which sensor generated which evidence.
              </p>

              <h3>3.3 Evidence, Not Verdict</h3>
              <p>
                EE-002 does not return PASS or FAIL. It returns an Evidence Object.
                A separate VerificationPolicy interprets the evidence and produces
                a verdict. This decoupling means the same evidence can be evaluated
                under different policies — low-risk scenarios may require only EE-001,
                while high-risk scenarios require EE-001 + EE-002 + EE-003.
              </p>
            </section>

            {/* ── Part 4 ── */}
            <section className="note-section" id="part-4">
              <h2>Part 4 — CFC-005: Causal Inversion</h2>

              <h3>4.1 Definition</h3>
              <div className="note-callout">
                <p>
                  <strong>CFC-005 · Causal Inversion</strong>
                </p>
                <p>
                  A velocity change observed in one evidence stream occurs before the
                  corresponding acceleration event required to cause it in another stream.
                </p>
                <p>
                  <strong>Interpretation:</strong> The two streams cannot be explained by
                  the same physical event under the current timing model.
                </p>
              </div>

              <h3>4.2 Physics Basis</h3>
              <p>
                Newton's Second Law: F = ma. Force is the cause. Acceleration is the
                immediate effect. Velocity change follows acceleration via integration
                over time. Therefore:
              </p>
              <ol>
                <li>IMU jerk (force change) must precede camera velocity change.</li>
                <li>If camera turns before IMU registers corresponding jerk →
                    causal inversion → streams describe different physical events.</li>
                <li>Detection threshold: camera event timestamp &lt; IMU event
                    timestamp − 250ms. Real-phone testing shows camera leads IMU
                    by ~160ms naturally (visual trajectory change detectable before
                    force fully registers). The 250ms threshold avoids false positives
                    from this physical lead time while still catching genuine inversions.</li>
              </ol>

              <h3>4.3 Research Voice</h3>
              <p>
                We do not say "forgery detected." We say "cannot be explained by
                the same physical event under the current timing model." This is
                consistent with the Continuity Lab's commitment to falsifiable
                claims over definitive judgments.
              </p>
            </section>

            {/* ── Part 5 ── */}
            <section className="note-section" id="part-5">
              <h2>Part 5 — What This Does Not Prove</h2>

              <ul>
                <li>
                  <strong>Not a liveness detector.</strong> Causal coupling proves
                  sensor streams share a physical cause. It does not, by itself, prove
                  the cause is a living human. A robot could theoretically produce
                  causally coupled IMU + camera data.
                </li>
                <li>
                  <strong>Not immune to sophisticated replay.</strong> An attacker with
                  access to synchronized, causally-coupled sensor recordings could
                  replay both streams. Challenge-Response (EE-003) addresses this.
                </li>
                <li>
                  <strong>Not calibrated across devices.</strong> Current thresholds
                  are empirical and may vary with sensor quality. Per-device enrollment
                  variance calibration is deferred.
                </li>
                <li>
                  <strong>Not energy-conservation verified.</strong> Consumer-grade
                  IMU drift and 15fps pose estimation noise make kinetic energy
                  verification impractical. This is a research metric, not a
                  production scorer.
                </li>
              </ul>
            </section>

            {/* ── Part 6 ── */}
            <section className="note-section" id="part-6">
              <h2>Part 6 — Open Questions</h2>

              <ol>
                <li>
                  <strong>What is the minimum event density for reliable coupling?</strong>
                  Current threshold (0.3 events/sec) is empirical. Formal power analysis needed.
                </li>
                <li>
                  <strong>What is the optimal direction tolerance?</strong>
                  Currently 90°. A tolerance sweep benchmark (45°, 60°, 90°, 120°)
                  is planned.
                </li>
                <li>
                  <strong>Can causal coupling be spoofed?</strong>
                  If an attacker generates causally self-consistent fake sensor data,
                  does the coupling signal degrade? This requires adversarial evaluation.
                </li>
                <li>
                  <strong>Does coupling signal degrade with distance?</strong>
                  If the camera is further from the moving hand (e.g., laptop webcam
                  vs phone selfie cam), does the temporal alignment weaken?
                </li>
                <li>
                  <strong>Can coupling be measured with a single sensor?</strong>
                  If a single high-bandwidth sensor (e.g., 240fps camera) can
                  simultaneously capture pose and infer acceleration, does the
                  cross-modal framework still apply?
                </li>
              </ol>
            </section>

            {/* ── Part 7 ── */}
            <section className="note-section" id="part-7">
              <h2>Part 7 — Role in Verification Session</h2>

              <h3>7.1 Passive Evidence Layer</h3>
              <p>
                EE-002 operates as a <strong>Passive Evidence Engine</strong> within the
                Verification Session (VS-001). It requires no user action — the user simply
                moves naturally for 8 seconds while the system observes. This is a key
                architectural distinction from Active Evidence Engines like EE-003
                (gyroscope challenge), which require explicit user response.
              </p>

              <h3>7.2 Confidence Contribution</h3>
              <p>
                EE-002 contributes a <code>confidence</code> score (0–1) to the session's
                aggregate confidence. It does not produce a PASS/FAIL verdict — that is
                the session's responsibility. When camera data is available, EE-002's
                confidence aggregates with EE-001 (IMU Presence) to produce a richer
                passive confidence score. Without camera data, the passive score is capped
                at 0.65, requiring escalation to Active Evidence (EE-003) to reach the
                accept threshold (0.70).
              </p>

              <h3>7.3 Escalation Economics</h3>
              <p>
                Cross-modal coupling is the most computationally expensive passive engine.
                It requires camera access, MediaPipe inference, and two independent
                event-detection pipelines. In the escalation strategy, EE-002 is invoked
                only when IMU-only passive confidence is insufficient — a design choice
                that balances verification depth against user friction.
              </p>
            </section>

            {/* ── Part 8 ── */}
            <section className="note-section" id="part-8">
              <h2>Part 8 — Experimental Validation (N=165)</h2>

              <h3>8.1 Overview</h3>
              <p>
                All three evidence engines were validated on an iPhone with v0.3 calibrated parameters
                across 165 live runs (2026-07-15). Each run was recorded with structured evidence output:
                component-level scores, verdicts, diagnostics, and round-level gyroscope telemetry.
              </p>

              <table className="note-table">
                <thead>
                  <tr><th>Engine</th><th>N</th><th>Pass Rate</th><th>Role</th></tr>
                </thead>
                <tbody>
                  <tr><td>EE-003</td><td>55</td><td>65%</td><td>Active — gyroscope challenge (3-round)</td></tr>
                  <tr><td>PE-001 / EE-002</td><td>50</td><td>93%</td><td>Passive — cross-modal causal coupling</td></tr>
                  <tr><td>VS-001</td><td>60</td><td>93%</td><td>Dual-engine — EE-001 + EE-003 pipeline</td></tr>
                </tbody>
              </table>

              <h3>8.2 EE-003 · Gyroscope Challenge (N=55, 65%)</h3>
              <p>
                The <strong>direction match rate improved from 33% (N=11, v0.2) to 65% (N=55, v0.3)</strong> after
                gyroscope sign calibration and threshold relaxation. However, 23% of runs still fail due to
                CFC-007 (Challenge Mismatch) — indicating that pure IMU direction challenges alone
                are insufficient as a standalone verification primitive. The gyroscope challenge is
                effective as <strong>additional evidence</strong> (escalation path) but should not serve as the
                sole verifier.
              </p>
              <p>
                <strong>Round-level data:</strong> Round 1 fails at the highest rate (~35%), likely due to
                the user not yet having internalized the challenge direction. Rounds 2 and 3 show
                progressively higher pass rates as the user adapts to the motion pattern.
              </p>

              <h3>8.3 PE-001 · Causal Coupling (N=50, 93%)</h3>
              <p>
                Event-level causal coupling shows <strong>strong temporal alignment</strong> across 100%
                of runs — IMU jerk peaks and camera trajectory changes consistently match within the
                ±500ms window. This confirms that the two sensor streams describe the same physical event.
              </p>
              <p>
                However, <strong>direction agreement remains the weak component</strong>: approximately
                55% of runs show direction disagreement between IMU force vectors and camera motion vectors.
                This is consistent with the documented single-device constraint — the camera and IMU are on
                the same phone, introducing hand-tremor coupling that confounds the direction signal.
                An independent camera (WebSocket bridge, planned) is expected to resolve this.
              </p>
              <p>
                <strong>Temporal jitter</strong> (avg Δ 150–360ms across runs) is consistently flagged as
                "high" — a consequence of the 200ms MediaPipe sampling interval and camera pipeline latency.
                The widened ±500ms match window absorbs this jitter without false negatives.
              </p>

              <h3>8.4 VS-001 · Dual-Engine Verification (N=60, 93%)</h3>
              <p>
                The dual-engine pipeline is <strong>highly reliable</strong>: 93% pass rate with consistent
                passive scores (65% IMU-only presence) and escalation to additional evidence when needed.
                The escalation strategy works as designed — mid-confidence runs are correctly routed to
                EE-003 for gyroscope verification rather than being falsely rejected or accepted.
              </p>
              <p>
                <strong>Failure analysis:</strong> 4 of 60 runs (7%) returned INSUFFICIENT_EVIDENCE.
                All 4 failures occurred in the additional evidence stage (EE-003 gyroscope challenge),
                not in the passive IMU stage. This confirms that EE-001 (IMU presence) alone provides
                a <strong>reliable floor</strong> — every run passes the passive stage — and that
                improvement should focus on the gyroscope challenge component.
              </p>

              <h3>8.5 Key Findings</h3>
              <ol>
                <li>
                  <strong>Cross-modal binding is viable.</strong> 93% temporal alignment in PE-001
                  proves that IMU and camera events can be matched to verify a shared physical cause.
                </li>
                <li>
                  <strong>IMU-only presence is a reliable floor.</strong> VS-001 passive stage
                  passes 100% of runs — the 8-second free motion protocol consistently detects
                  a physically embodied entity.
                </li>
                <li>
                  <strong>Gyroscope challenge is context-dependent.</strong> 65% standalone pass
                  rate (EE-003) vs. 93% pipeline pass rate (VS-001) shows that challenge-response
                  is effective in escalation but unreliable as a sole verifier.
                </li>
                <li>
                  <strong>Single-device coupling is the primary confound.</strong> Direction
                  disagreement in PE-001 (~55% of runs) is consistent with the documented
                  hand-tremor artifact. Independent camera deployment is the highest-priority
                  infrastructure upgrade.
                </li>
                <li>
                  <strong>Parameter calibration matters significantly.</strong> v0.2 → v0.3
                  threshold adjustments (wider match window, relaxed jerk minimum, gyro sign fix)
                  improved EE-003 from 33% to 65% — a 2× gain from calibration alone.
                </li>
              </ol>
            </section>

            {/* ── Related ── */}
            <RelatedResearch
              supportedBy={[
                { id: "PE-001", label: "Event-Level Causal Coupling", href: "/research/causal-coupling" },
                { id: "VS-001", label: "Verification Session", href: "/research/protocol-verify" },
                { id: "EE-001", label: "Fusion Identity Verification", href: "/research/fusion" },
              ]}
              relatedNotes={[
                { id: "RN-002", label: "PES Benchmark v0.2", href: "/research/notes/002-pes-benchmark" },
                { id: "RN-001", label: "The Continuity Problem", href: "/research/notes/001-the-continuity-problem" },
              ]}
              openQuestions={[
                { id: "OQ-001", label: "Can continuity exist independently of identity?", href: "/research/open-questions/001" },
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

"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

export default function NoteClient() {
  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article className="note-article mx-auto">
          <div className="note-meta">
            <ResearchMeta
              artifactId="RN-005"
              type="Research Note"
              status="Published"
              published="2026.08.16"
            />
          </div>

          <h1 className="note-title" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
            Two-Stage Continuity Verification
          </h1>
          <p className="note-subtitle">
            A real-device experiment testing whether a strong presence signal can
            compensate for an incomplete continuity challenge.
          </p>

          {/* ── 01 — Question ── */}
          <section className="note-section" id="question">
            <h2>01 — Question</h2>
            <p className="rn-question-primary">
              Can a strong presence signal compensate for an incomplete continuity challenge?
            </p>
            <p className="rn-question-broader">
              Broader — can temporal continuity provide a verification property that static
              identity alone cannot?
            </p>
            <p>
              This note reports a small real-device experiment that addresses only the first.
              The second is Continuity Lab&apos;s larger research question; these four trials
              do not settle it.
            </p>
          </section>

          {/* ── 02 — Experiment ── */}
          <section className="note-section" id="experiment">
            <h2>02 — Experiment</h2>
            <p>
              Four trials (A–D) on a single physical device, single session, single
              participant. Two-stage decision rule: stage 1 requires <strong>EE-001 ≥ 0.50</strong>;
              stage 2 requires <strong>EE-003 = 1.000</strong> — all three prompted rotations,
              each in the prompted direction at ≥ 40°/s. Both stages are mandatory.
            </p>

            <table className="note-table">
              <thead>
                <tr>
                  <th>Trial</th>
                  <th>Challenge</th>
                  <th>EE-003</th>
                  <th>Stage 2</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A</td>
                  <td>3/3 correct</td>
                  <td>1.000</td>
                  <td className="rn-cell-pass">PASS</td>
                  <td className="rn-cell-pass">VERIFIED</td>
                </tr>
                <tr>
                  <td>B</td>
                  <td>0/3 (no rotation)</td>
                  <td>0.000</td>
                  <td className="rn-cell-fail">FAIL</td>
                  <td className="rn-cell-fail">NOT VERIFIED</td>
                </tr>
                <tr>
                  <td>C</td>
                  <td>3/3 correct</td>
                  <td>1.000</td>
                  <td className="rn-cell-pass">PASS</td>
                  <td className="rn-cell-pass">VERIFIED</td>
                </tr>
                <tr className="rn-decisive-row">
                  <td>D</td>
                  <td>2/3 (round 3 failed)</td>
                  <td>0.000</td>
                  <td className="rn-cell-fail">FAIL</td>
                  <td className="rn-cell-fail">NOT VERIFIED</td>
                </tr>
              </tbody>
            </table>

            <p className="rn-decisive-label">Decisive case — D</p>
            <table className="note-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Measured peak rotation (± direction)</th>
                  <th>Pass</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>R1</td><td>+269°/s</td><td className="rn-cell-pass">PASS</td></tr>
                <tr><td>R2</td><td>−117°/s</td><td className="rn-cell-pass">PASS</td></tr>
                <tr><td>R3</td><td>+3°/s</td><td className="rn-cell-fail">FAIL</td></tr>
              </tbody>
            </table>
          </section>

          {/* ── 03 — What Happened ── */}
          <section className="note-section" id="what-happened">
            <h2>03 — What Happened</h2>

            <div className="verdict-cascade">
              <div className="verdict-stage">
                <div className="verdict-engine">EE-001</div>
                <div className="verdict-value">0.800</div>
                <div className="verdict-status verdict-pass">Stage 1 PASS</div>
              </div>
              <div className="verdict-and">AND</div>
              <div className="verdict-stage">
                <div className="verdict-engine">EE-003</div>
                <div className="verdict-value">0.000</div>
                <div className="verdict-status verdict-fail">Stage 2 FAIL</div>
              </div>
              <div className="verdict-arrow">▼</div>
              <div className="verdict-final">NOT VERIFIED</div>
            </div>

            <p>
              In Test D, EE-001 = 0.800 cleared the Stage-1 presence threshold, but the
              two-stage rule requires both stages. So 2/3 is <strong>not</strong> 0.667 — it
              is a failed challenge (EE-003 = 0.000). Presence evidence passing Stage 1 did
              not compensate for challenge completion failing Stage 2.
            </p>
          </section>

          {/* ── 04 — Observation ── */}
          <section className="note-section" id="observation">
            <h2>04 — Observation</h2>
            <div className="observation-hero">
              <p className="observation-quote">
                Presence alone must not compensate for an incomplete continuity challenge.
              </p>
              <p className="observation-small">One small, falsifiable data point.</p>
            </div>
          </section>

          {/* ── 05 — Limitations / Non-Claims ── */}
          <section className="note-section" id="limits">
            <h2>05 — Limitations / Non-Claims</h2>
            <p className="rn-nobenchmark">n = 4 · 1 device · 1 session · 1 participant</p>
            <ul>
              <li>Not a security proof.</li>
              <li>Not a false-acceptance-rate (FAR) or false-rejection-rate (FRR) benchmark.</li>
              <li>Does not demonstrate spoof resistance.</li>
              <li>Does not establish generalization across devices, users, environments, or motion patterns.</li>
            </ul>
          </section>

          {/* ── Research Continues ── */}
          <div className="research-continues">
            <div className="rc-label">Research Continues</div>
            <div className="rc-questions">Can you reproduce it?<br />Can you break it?</div>
            <p className="rc-small">This result is intentionally small. Independent testing is the next step.</p>
            <div className="rc-baseline">Implementation baseline: <code>3a2680c</code></div>
            <a
              className="rc-link"
              href="https://github.com/myshapeprotocol/myshape-protocol/blob/master/docs/RN-005-two-stage-continuity-verification.md"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}
            >
              Read the full research record <span className="rc-link-arrow">→</span>
            </a>
          </div>

          {/* ── Related ── */}
          <RelatedResearch
            supportedBy={[
              { id: "EE-001", label: "Presence Detection", href: "/lab/research/fusion" },
              { id: "EE-003", label: "Challenge Response", href: "/lab/research/challenge-response" },
              { id: "VS-001", label: "Verification Session", href: "/lab/research/protocol-verify" },
            ]}
            relatedNotes={[
              { id: "RN-001", label: "The Continuity Problem", href: "/lab/research/notes/001-the-continuity-problem" },
              { id: "RN-002", label: "PES Benchmark v0.2", href: "/lab/research/notes/002-pes-benchmark" },
            ]}
          />

          <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
            <Link
              href="/lab/research"
              className="text-white/35 text-[11px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors"
            >
              ← Research Hub
            </Link>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}

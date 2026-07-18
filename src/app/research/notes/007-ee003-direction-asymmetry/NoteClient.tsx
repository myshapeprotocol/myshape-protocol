"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import ResearchMeta from "@/components/research/ResearchMeta";

export default function NoteClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article className="note-article">
          <div className="note-meta">
            <ResearchMeta artifactId="DL-001" type="Decision Log" status="Published" published="2026.07.18" />
          </div>
          <h1 className="note-title">Direction Asymmetry in Gyroscope Challenge</h1>
          <p className="note-subtitle">
            An operator empirically observed that up/down (pitch) challenges pass more reliably than left/right (yaw) challenges in EE-003. This note records the observation, proposes a mechanism, and recommends data collection for formal analysis.
          </p>

          <section className="note-section">
            <h2>Observation</h2>
            <p>
              After 150 EE-003 runs, the operator reported that ← and → challenges appear to fail more often than ↑ and ↓ challenges. In particular, → (rightward yaw) was noted as "almost always failing."
            </p>
            <p>
              This has <strong>not yet been quantified</strong> — the EE-003 copy output includes per-round pass/fail status but does not aggregate by direction. A retrospective analysis of the 150-run dataset is needed to confirm or refute the observation.
            </p>
          </section>

          <section className="note-section">
            <h2>Proposed Mechanism</h2>
            <ol>
              <li><strong>Biomechanics.</strong> Wrist radial/ulnar deviation (yaw axis) has less range of motion than wrist flexion/extension (pitch axis). The average human wrist rotates approximately ±25° in yaw vs. ±60° in pitch. A 60° direction tolerance may be too tight for yaw given the smaller motion envelope.</li>
              <li><strong>Gyroscope sensitivity.</strong> iPhone gyroscope noise characteristics differ across axes. Yaw (rotation around Z) is computed from sensor fusion of yaw-rate and magnetometer data, which is inherently noisier than pitch/roll computed from gravity vectors.</li>
              <li><strong>Operator posture.</strong> When holding a phone naturally, the wrist is already partially pronated, reducing available yaw range in one direction while the other direction remains within range. The specific failing direction depends on hand dominance and grip.</li>
            </ol>
          </section>

          <section className="note-section">
            <h2>Decision</h2>
            <p>
              <strong>Action:</strong> No parameter changes at this time. This observation is recorded for future calibration.
            </p>
            <p>
              <strong>Next step:</strong> When the EE-003 dataset contains per-direction pass/fail counters, run a direction-stratified analysis. If asymmetry is confirmed, consider:
            </p>
            <ul>
              <li>Per-direction angle tolerances (e.g., 60° for yaw, 45° for pitch)</li>
              <li>Per-direction gyroscope thresholds (e.g., lower peak rate requirement for yaw)</li>
              <li>Operator-specific calibration profiles</li>
            </ul>
            <p>
              None of these mitigations should be implemented without data confirming the asymmetry exists.
            </p>
          </section>

          <div className="mt-16 pt-8 border-t border-white/[0.04] text-center">
            <Link href="/research" className="text-white/35 text-[10px] tracking-[0.2em] uppercase hover:text-white/55 transition-colors">
              ← Research Hub
            </Link>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}

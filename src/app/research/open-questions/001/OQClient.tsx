"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

export default function OQClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-28 pb-16">
        <article className="note-article">

          {/* ── Meta ── */}
          <div className="note-meta">
            <ResearchMeta
              artifactId="OQ-001"
              type="Open Question"
              status="Active"
              published="2026.07.10"
            />
          </div>

          {/* ── Title ── */}
          <h1 className="note-title" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
            Can continuity exist independently of identity?
          </h1>

          {/* ── Status ── */}
          <div className="flex items-center gap-3 my-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37]/30 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#d4af37]/60">
              Active Research
            </span>
          </div>

          {/* ── Background ── */}
          <section className="note-section">
            <h2>Background</h2>

            <p>
              Identity has traditionally been treated as the prerequisite for continuity.
              To verify that a subject has maintained continuous existence, we first ask
              <strong> who the subject is</strong> — a wallet address, a DID, a stored
              template. Continuity, in this view, is a property that identity <em>enables</em>.
            </p>

            <p>
              The Continuity Lab explores the inverse hypothesis:
            </p>

            <div className="note-blockquote">
              Continuity can become the primary primitive. Identity would then emerge
              as a higher-level interpretation — a label we assign to a trajectory
              that has maintained unbroken sovereignty across time.
            </div>

            <p>
              If this hypothesis holds, it would invert the current relationship between
              identity and continuity. Today, identity is the gatekeeper and continuity is
              an optional extension — checked only when something goes wrong. Under the
              inverse model, continuity is the substrate: every digital subject continuously
              proves its existence, and identity labels are applied post-hoc to trajectories
              that meet certain criteria.
            </p>
          </section>

          {/* ── Why It Matters ── */}
          <section className="note-section">
            <h2>Why It Matters</h2>

            <p>
              If continuity can be verified without relying on persistent identifiers,
              three consequences follow:
            </p>

            <p>
              <strong>1. Humans and AI agents share a common verification substrate.</strong>
              {" "}A human proving continuous presence and an AI agent proving continuous
              operation use the same primitive — continuity proofs. The distinction between
              "human identity" and "agent identity" becomes a policy layer on top of a
              shared cryptographic foundation, not two separate protocols.
            </p>

            <p>
              <strong>2. Identity becomes revocable without breaking continuity.</strong>
              {" "}Today, if you lose your private key or your DID is compromised, your
              continuity is also lost — because your identity was the anchor. Under a
              continuity-first model, you could rotate your identity credentials while
              maintaining the same continuity trajectory. The trajectory is the permanent
              record; the identity labels are replaceable.
            </p>

            <p>
              <strong>3. Digital twins and hybrid entities become tractable.</strong>
              {" "}A human delegates a task to their AI agent. The agent operates for
              two weeks, then returns. Under the identity model, we ask: "Is this the
              same agent?" Under the continuity model, we ask: "Has the trajectory been
              unbroken, and can we trace the delegation chain?" The second question is
              both more precise and more general.
            </p>
          </section>

          {/* ── Current Evidence ── */}
          <section className="note-section">
            <h2>Current Evidence</h2>

            <p>
              Conceptual only. No empirical validation yet.
            </p>

            <p>
              The PES Benchmark (BM-001) demonstrates that human presence can be
              distinguished from synthetic motion with high confidence (Cohen&apos;s
              d = 2.1, AUC = 0.94). However, this establishes <em>presence detection</em>,
              not <em>continuity verification</em>. The gap between "this is a human
              right now" and "this human has continuously existed across the interval"
              is the central open question.
            </p>

            <p>
              RN-001 (The Continuity Problem) frames the theoretical case: identity
              succeeds and continuity fails in four specific attack scenarios. But
              a theoretical case is not an experimental result. The next step is to
              move from "here is why this matters" to "here is how we test it."
            </p>
          </section>

          {/* ── Next Milestone ── */}
          <section className="note-section">
            <h2>Next Milestone</h2>

            <p>
              Define a <strong>formal Continuity Model</strong> — a mathematical
              specification of what it means for a digital trajectory to be continuous.
              This model must:
            </p>

            <p>
              1. Define the minimum sampling frequency required to establish continuity
              across a time interval.
            </p>

            <p>
              2. Specify the conditions under which a gap in the trajectory constitutes
              a continuity violation (versus a benign network interruption).
            </p>

            <p>
              3. Provide a formal definition of "sovereign existence" — what properties
              must be preserved across the trajectory for continuity to hold.
            </p>

            <p>
              4. Be falsifiable: there must exist an experimental setup that could
              demonstrate the model is incorrect or incomplete.
            </p>
          </section>

          {/* ── Related ── */}
          <RelatedResearch
            supportedBy={[
              { id: "BM-001", label: "PES Benchmark v0.2", href: "/research/benchmarks" },
            ]}
            referencedDecisions={[
              { id: "DL-001", label: "PES threshold set at 0.40", href: "/research" },
              { id: "DL-003", label: "Adopt artifact ID system", href: "/research" },
            ]}
            relatedNotes={[
              { id: "RN-001", label: "The Continuity Problem", href: "/research/notes/001-the-continuity-problem" },
            ]}
          />

          {/* ── Footer ── */}
          <div className="note-footer">
            <p className="note-footer-text">
              The Continuity Lab · July 2026{" · "}
              <Link href="/research" onMouseEnter={() => playTick(420, "sine", 0.03, 0.018)}>← Research Hub</Link>
            </p>
            <p className="text-white/10 text-[9px] tracking-[0.1em] italic mt-4" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
              Every benchmark is temporary. Every question is permanent.
            </p>
          </div>
        </article>
      </div>
      <ProtocolFooter />
    </div>
  );
}

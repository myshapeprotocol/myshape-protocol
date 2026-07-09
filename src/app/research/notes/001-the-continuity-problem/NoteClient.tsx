"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

const TOC_ITEMS = [
  { id: "part-1", label: "Part 1 — The World Has Solved Identity" },
  { id: "part-2", label: "Part 2 — The AI Era Creates a New Problem" },
  { id: "part-3", label: "Part 3 — A Hypothesis" },
  { id: "part-4", label: "Part 4 — Research Roadmap" },
];

export default function NoteClient() {
  const [activeSection, setActiveSection] = useState("part-1");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
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
          {/* ── TOC Sidebar ── */}
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

          {/* ── Article ── */}
          <article className="note-article">
          <div className="note-meta note-print-stage note-print-delay-1">
            <span>Research Note #001</span>
            <span className="note-meta-sep" />
            <span>2026.07.09</span>
            <span className="note-print-cursor" />
          </div>

          <h1 className="note-title note-print-stage note-print-delay-2" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>The Continuity Problem</h1>
          <p className="note-subtitle note-print-stage note-print-delay-3">
            Why proving &ldquo;I am still me&rdquo; may become the missing
            cryptographic primitive of the AI era.
          </p>

          {/* ── Part 1 ── */}
          <section id="part-1" className="note-section note-print-stage note-print-delay-4">
            <h2>Part 1 — The World Has Solved Identity</h2>

            <p>
              For the last fifty years, digital identity has answered a single
              question: <strong>who are you?</strong>
            </p>

            <p>
              Passports verify citizenship. FaceID matches a face to a stored
              template. Decentralized Identifiers (DIDs) bind a public key to a
              subject. Verifiable Credentials attest to claims made about you.
              Zero-knowledge passports prove you are over eighteen without
              revealing your name.
            </p>

            <p>
              Each of these systems is a <strong>snapshot</strong>. At moment
              t₀, we confirm that entity E possesses attribute A. The
              cryptographic binding is point-in-time, not temporal. It answers
              &ldquo;who are you right now?&rdquo; — and it does so with
              increasing precision, privacy, and decentralization.
            </p>

            <p>
              Identity, in the sense of static attribute verification, is a
              solved problem. The remaining work is engineering: better UX,
              broader interoperability, regulatory alignment. The fundamental
              cryptographic primitive — binding an attribute to a subject at a
              moment — is well understood.
            </p>

            <div className="note-blockquote">
              Identity is a snapshot. A snapshot can be verified. But a snapshot
              cannot tell you whether the subject behind it has continued to
              exist.
            </div>
          </section>

          {/* ── Part 2 ── */}
          <section id="part-2" className="note-section note-print-stage note-print-delay-5">
            <h2>Part 2 — The AI Era Creates a New Problem</h2>

            <p>
              Sometime in the next decade, millions of autonomous AI agents will
              negotiate, trade, write code, and make decisions on behalf of
              humans. These agents will operate across platforms, protocols, and
              time — unsupervised, for days or weeks.
            </p>

            <p>
              When an agent returns from a two-week deployment, how do we know
              it is <strong>still the same agent</strong> that was deployed?
              Not &ldquo;does it have the right API key?&rdquo; — that is
              identity. Not &ldquo;was its code updated?&rdquo; — that is
              provenance.
            </p>

            <p>
              The question is deeper: <strong>has this entity maintained
              continuous sovereign existence across the interval?</strong>
            </p>

            <p>
              This is not an identity problem. An API key can be stolen. A
              wallet can be imported. A credential can be replayed. None of
              these attacks violate identity — the credential is still valid.
              But they all violate something that identity protocols cannot
              detect: <strong>a break in continuity</strong>.
            </p>

            <p>
              Consider four scenarios that have no answer in today&apos;s
              identity stack:
            </p>

            <p>
              <strong>Agent replacement.</strong> An automated trading agent
              runs for six months. One day, its behavior shifts — because a
              different agent replaced it, using the same credentials. No
              identity check catches this. There is no &ldquo;wrong identity&rdquo;
              — only a wrong trajectory.
            </p>

            <p>
              <strong>Session hijacking.</strong> A human logs in with FaceID
              in the morning. By afternoon, an AI-generated video feed is
              operating the same session. The identity checkpoint passed. But
              the subject behind it changed.
            </p>

            <p>
              <strong>Credential replay.</strong> A zero-knowledge proof of
              personhood is generated, then captured and replayed by a
              synthetic entity. The proof verifies perfectly. The subject behind
              it is absent.
            </p>

            <p>
              <strong>Digital twin drift.</strong> A user&apos;s behavioral
              profile is learned, cloned, and replayed by an agent that passes
              every statistical authenticity check — except one: it was never
              continuously present.
            </p>

            <div className="note-blockquote">
              All of these attacks succeed against identity. All of them fail
              against continuity — if continuity is verifiable.
            </div>
          </section>

          {/* ── Part 3 ── */}
          <section id="part-3" className="note-section note-print-stage note-print-delay-6">
            <h2>Part 3 — A Hypothesis</h2>

            <p>
              We hypothesize that <strong>continuity can be anchored by
              measurable presence signals</strong> — physical, temporal, and
              cryptographic — that form an unbroken chain from moment to moment.
            </p>

            <p>
              When that chain is intact, continuity is verified. When it breaks,
              continuity is violated. The chain does not prove who you are. It
              proves you have <strong>continued to be you</strong>.
            </p>

            <p>
              This hypothesis is currently under experimental evaluation. We do
              not claim to have proven it. We claim it is the right question —
              and that answering it is the work of The Continuity Lab.
            </p>

            <div className="note-blockquote">
              We are not building a better identity protocol. We are asking
              whether continuity can be made a verifiable property of digital
              existence. If the answer is yes, it becomes a new primitive —
              alongside identity, alongside encryption, alongside consensus.
            </div>
          </section>

          {/* ── Part 4 ── */}
          <section id="part-4" className="note-section note-print-stage note-print-delay-7">
            <h2>Part 4 — Research Roadmap</h2>

            <p>
              This is a research program, not a product launch. Each note
              addresses one open question. Taken together, they form an
              investigation into whether continuity can be operationalized as a
              cryptographic primitive.
            </p>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #001</span>
              <span className="note-roadmap-label">The Continuity Problem</span>
            </div>
            <div className="note-roadmap-arrow">↓</div>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #002</span>
              <span className="note-roadmap-label">Presence Entropy Benchmark — Dataset, Cohen&apos;s d, precision/recall, threats to validity</span>
            </div>
            <div className="note-roadmap-arrow">↓</div>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #003</span>
              <span className="note-roadmap-label">Replay Attack Analysis — Can continuity proofs be replayed? Under what conditions?</span>
            </div>
            <div className="note-roadmap-arrow">↓</div>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #004</span>
              <span className="note-roadmap-label">Challenge-Response — Can continuity be verified interactively without storing motion data?</span>
            </div>
            <div className="note-roadmap-arrow">↓</div>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #005</span>
              <span className="note-roadmap-label">The Continuity Receipt — A proposed format for portable, verifiable continuity proofs</span>
            </div>
            <div className="note-roadmap-arrow">↓</div>

            <div className="note-roadmap-item" onMouseEnter={() => playTick(380, "sine", 0.03, 0.018)}>
              <span className="note-roadmap-num">RN #006</span>
              <span className="note-roadmap-label">Agent Continuity — Can continuity be transferred between a human and their AI agent?</span>
            </div>
          </section>

          <div className="note-footer note-print-stage note-print-delay-8">
            <p className="note-footer-text">
              The Continuity Lab · July 2026{" · "}
              <Link href="/research" onMouseEnter={() => playTick(420, "sine", 0.03, 0.018)}>← Research Hub</Link>
              {" · "}
              <Link href="/research/notes/002-pes-benchmark" onMouseEnter={() => playTick(480, "sine", 0.03, 0.018)}>Next: PES Benchmark →</Link>
            </p>
          </div>
        </article>
        </div>{/* closes note-layout */}
      </div>
      <ProtocolFooter />
    </div>
  );
}

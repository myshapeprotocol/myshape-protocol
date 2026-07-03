"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  {
    id: "opening",
    heading: "The Age of the Agent",
    content: `We are living in the age of the agent. Digital entities are no longer just passive user profiles; they are autonomous, proactive, and increasingly fragmented.

As we deploy more AI agents to represent us — trading agents, governance agents, curation agents, social agents — a fundamental crisis is emerging beneath the surface.

It is the crisis of continuity.

Imagine your trading agent just executed a $50K DeFi transaction while your governance agent voted on a DAO proposal. Were they both you? Right now, there is no cryptographic way to prove it. Each agent operates as an isolated island of identity, disconnected from every other representation of the same human subject.`,
  },
  {
    id: "snapshot-trap",
    heading: 'The "Snapshot" Trap',
    content: `Current digital identity infrastructure — DID, SSI, and even traditional Web2 authentication — is built on a foundation of snapshots. They answer a single question: "Who are you at this moment?"

A DID is a verification of a singular claim. A wallet address is a snapshot of ownership. An OAuth token is a snapshot of delegated authority. These systems function like digital passports: they freeze a subject in time to grant access.

But agents do not live in snapshots. They live in trajectories.

An agent's intent at time t₁ is a transformation of its intent at time t₀. Its decisions are linked across time in a causal chain. If we continue to rely on static identity snapshots, we lose the verifiable history of this evolution. We lose continuity.`,
  },
  {
    id: "continuity",
    heading: "Continuity as a Trajectory",
    content: `In the agent age, an entity is not static. It evolves. It learns. It makes decisions that cascade into further decisions.

When you have a swarm of 100+ agents operating on your behalf across decentralized networks, a new question emerges: how do you prove that they all originate from the same subject? How do you ensure that the subjectivity of the entity remains unbroken across time, across agents, and across networks?

This is not a question of authentication. It is a question of continuity.

Current protocols can verify that Agent A has a valid credential. But they cannot verify that Agent A at time t₁ is the same entity as Agent A at time t₀. The credential may be the same — but the entity behind it may have been compromised, replaced, or simulated in between.

Continuity is not about checking a credential. It is about verifying an unbroken chain of becoming.`,
  },
  {
    id: "missing-layer",
    heading: "The Missing Protocol Layer: Verifiable Subject Evolution",
    content: `Identity is not enough. Identity proves existence — but only trajectory proves continuity.

We need a protocol that moves beyond the identity snapshot. We need a framework for Verifiable Digital Continuity. This involves three primitives:

Presence Receipts
Notarized, privacy-preserving slices of an entity's "becoming." Each receipt is a proof that a specific entity was present at a specific moment — not through a static credential, but through a verifiable physical signature. Presence Receipts are generated through motion-signature verification, capturing the irreducible entropy of human movement. They cannot be replayed. They cannot be forged by AI.

Entropy Transformation
Mapping how an agent's state evolves without exposing raw biographical data. The entropy of human presence — the micro-timing variance, the noise residual, the frequency distribution — provides a mathematical fingerprint of continuity. When an agent acts, its action carries the entropy signature of the human who authorized it. This signature propagates forward, linking each action to its origin.

State-Chain Evolution
Linking the disparate actions of an agent swarm into a verifiable sequence that preserves the sovereignty of the underlying human subject. Each state transition is cryptographically linked to the previous one, forming a chain of continuity that can be verified without revealing the underlying identity data. This is not a blockchain — it is a presence chain.`,
  },
  {
    id: "way-forward",
    heading: "The Way Forward",
    content: `We are not building another identity layer to store your data. The world has enough databases.

We are building a protocol to prove that the "you" in one digital space is the same "you" in another — across time, across agents, and across networks. Not through a password. Not through a biometric scan. Not through a government ID.

Through presence. Through continuity. Through physics.

Identity is a snapshot. Continuity is a trajectory. It is time our protocols reflected that.`,
  },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />

      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          {/* Header */}
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase">
              <span>GENESIS 001</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.02</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">
              Why Identity<br />
              <span className="text-[#90c8ff]">Is Not Enough</span>
            </h1>
            <p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">
              Identity proves existence. Continuity proves evolution.
              In the age of autonomous agents, we need protocols that verify
              the trajectory of a subject — not just its snapshot.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-[#90c8ff]/30" />
                  {section.heading}
                </h2>
                <div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />

          {/* Internal link cluster */}
          <div className="space-y-4 mb-16">
            <p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">
              Continue Reading
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                href="/blog/what-is-proof-of-continuity"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/50 text-[10px] tracking-[0.1em]">
                  What Is Proof of Continuity?
                </p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                  The missing primitive →
                </p>
              </Link>
              <Link
                href="/blog/what-is-decentralized-identity-2026"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/50 text-[10px] tracking-[0.1em]">
                  What Is Decentralized Identity?
                </p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                  2026 guide to DID, SSI →
                </p>
              </Link>
              <Link
                href="/glossary"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/50 text-[10px] tracking-[0.1em]">
                  Protocol Glossary
                </p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                  30+ defined terms →
                </p>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">
              Genesis 100 Cohort — Now Curating
            </p>
            <p className="text-white/25 text-[10px] leading-relaxed max-w-md mx-auto">
              We are onboarding the first 100 human nodes to calibrate the motion-signature engine.
              The motion demo is live. Your presence is the proof.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all"
              >
                Motion Demo →
              </Link>
              <Link
                href="/genesis"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all"
              >
                Genesis →
              </Link>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors"
            >
              ← Protocol Log
            </Link>
          </div>
        </div>
      </main>

      <ProtocolFooter />
    </div>
  );
}

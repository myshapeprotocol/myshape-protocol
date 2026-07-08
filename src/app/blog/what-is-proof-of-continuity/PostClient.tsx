"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";

const SECTIONS = [
  {
    id: "the-problem",
    heading: "The Problem Identity Cannot Solve",
    content: `Every digital identity system in production today — from OAuth to DIDs to verifiable credentials — answers a single question: "Who are you?"

They verify a snapshot. A passport. A wallet address. A static-feature hash. These are all point-in-time assertions: at moment t₀, we confirm that entity E possesses attribute A.

This was sufficient for Web2. It is catastrophically insufficient for the Agent Economy.

Consider a scenario that will be commonplace by 2027: your trading agent has been running for six months, executing thousands of transactions across eight protocols. It has learned your risk preferences, adapted to market regimes, and accumulated a reputation score. One morning, it makes a trade that deviates sharply from its learned behavior.

The question is not "is the agent's API key valid?" The question is "is this the same agent — the same continuous subject — that has been operating for six months?"

Identity protocols cannot answer this. They can verify that a credential is valid. They cannot verify that a trajectory is unbroken.`,
  },
  {
    id: "what-is-continuity",
    heading: "What Proof of Continuity Actually Verifies",
    content: `A Proof of Continuity is a cryptographic attestation that a digital subject has maintained unbroken sovereignty across a defined time interval.

It has three components:

1. Presence Receipts
Notarized, privacy-preserving assertions that a specific entity was present at a specific moment. Unlike a credential, a Presence Receipt is not based on a secret (what you know) or a static-feature (what you are). It is based on physics — the irreducible entropy of human motion captured as a 128-dimensional vector that AI cannot simulate.

2. Entropy Transformation Chain
A verifiable sequence linking each Presence Receipt to its predecessor. The entropy signature of each receipt propagates forward cryptographically. If a gap appears — if an agent acts without a valid Presence Receipt — the chain breaks. The continuity is proven to be violated.

3. State-Chain Verification
The cryptographic binding of agent actions to the entropy chain. Each state transition is linked to its predecessor and to a specific Presence Receipt, forming a verifiable graph of "who authorized what, when, and under what continuity guarantees."

Together, these three primitives answer the question that identity cannot: not just "who are you?" but "have you been you this entire time?"`,
  },
  {
    id: "why-now",
    heading: "Why 2026 Is the Inflection Point",
    content: `Three forces converge to make Proof of Continuity the most urgent unsolved problem in digital identity:

1. Agent Proliferation
By 2027, the average crypto-native user will operate 50+ autonomous agents. Each agent needs to prove not just that it was deployed by a specific address, but that it continues to operate under the same sovereign control. Without continuity proofs, agent swarms are indistinguishable from compromised swarms.

2. AI Impersonation
Generative AI can now produce your face, your voice, and your typing patterns. Static identity verification — a selfie, a voice sample, a document scan — is trivially defeated. Continuity provides temporal depth: it's not one snapshot but an unbroken chain that makes forgery exponentially harder.

3. Platform Sovereignty
As digital life fragments across chains, protocols, and platforms, users need a portable proof of continuity that is not owned by any single platform. Your continuity should be verifiable whether you're on Ethereum, Solana, or a private enterprise network.

MyShape Protocol is the first system to implement Proof of Continuity as a protocol primitive. The Genesis Cohort — limited to 100 founding nodes — is onboarding now.`,
  },
  {
    id: "vs-existing",
    heading: "How Proof of Continuity Differs from Existing Approaches",
    content: `Proof of Personhood (Worldcoin, BrightID, Gitcoin Passport): Verifies that you are a unique human. Once. It does not verify that the entity using the credential today is the same entity that enrolled. Continuity fills this gap.

Verifiable Credentials (W3C VC, SpruceID, Polygon ID): Verifies claims about you — age, KYC status, membership. Claims are static. A verified claim from January 2026 says nothing about whether the subject has maintained continuous sovereign control through July 2026.

Session Tokens and JWTs: These provide continuity within a single session or domain. They are not portable across platforms and do not provide cryptographic guarantees of unbroken subject evolution.

Proof of Continuity is not a replacement for any of these. It is the missing layer that sits beneath them — the temporal substrate that makes all other identity claims more meaningful by anchoring them in verifiable, continuous presence.`,
  },
  {
    id: "future",
    heading: "The Continuity-First Architecture",
    content: `The next generation of digital identity will be continuity-first. Identity is a snapshot. Continuity is a trajectory. In a world where AI can generate snapshots at will, only trajectory matters.

MyShape is building that architecture. The motion-signature engine, the entropy transformation chain, and the state-chain verification protocol are the first implementation of continuity-first identity.

The Genesis Cohort is not just early access. It is the root entropy source for an entire protocol — the cryptographic trust anchor from which all future continuity proofs will derive their statistical significance. One hundred founding nodes. One hundred root entropy sources. Never offered again.

This is what Proof of Continuity looks like. Not a better password. Not a more secure static-feature. A fundamentally new primitive for a fundamentally new era of digital existence.`,
  },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />

      <main className="flex-1 relative">
        <BackgroundParticles />
        <div
          className="relative z-10 max-w-3xl mx-auto px-4 md:px-6"
          style={{ paddingTop: "8rem", paddingBottom: "6rem" }}
        >
          {/* Header */}
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase">
              <span>GENESIS 004</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">
              What Is<br />
              <span className="text-[#90c8ff]">Proof of Continuity?</span>
            </h1>
            <p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">
              The missing cryptographic primitive for the Agent Economy.
              Why identity is not enough — and what comes next.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="blog-section-heading">
                  <span className="blog-section-accent" />
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

          {/* CTA */}
          <div className="blog-cta space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">
              Proof of Continuity Is Live — Genesis Cohort Curating
            </p>
            <p className="text-white/25 text-[10px] leading-relaxed max-w-md mx-auto">
              The first 100 human nodes form the root entropy source of the MyShape Protocol. Your presence is the proof. Your continuity is the anchor.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href="/genesis" className="blog-cta-btn" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Begin Genesis →</Link>
              <Link href="/compare" className="blog-cta-btn blog-cta-btn-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>See Comparison →</Link>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link href="/blog" className="blog-back-link">← Protocol Log</Link>
          </div>
        </div>
      </main>

      <ProtocolFooter />
    </div>
  );
}

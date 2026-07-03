"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  {
    id: "what-is-did",
    heading: "Decentralized Identity: Beyond the Username",
    content: `Decentralized identity (DID) is the idea that individuals — not platforms, not governments, not corporations — should own and control their digital identities.

In the Web2 model, your identity is a row in someone else's database. Your Google account is Google's property. Your Twitter handle is Twitter's property. If the platform bans you, deplatforms you, or gets acquired, your identity evaporates. You are a tenant in a digital feudalism where platforms are the landlords.

Decentralized identity inverts this relationship. You generate your identity locally. You control which attributes to share. You prove claims about yourself without relying on a centralized authority to vouch for you. The identity is portable — it travels with you across platforms, protocols, and contexts.

The W3C standard for this is the Decentralized Identifier (DID): a globally unique, resolvable identifier that you create and control, anchored to a distributed ledger or decentralized network rather than a centralized registry.`,
  },
  {
    id: "ssi",
    heading: "Self-Sovereign Identity (SSI): The Principles",
    content: `Self-Sovereign Identity (SSI) is the philosophical and architectural framework within which DIDs operate. Coined by Christopher Allen in 2016, SSI rests on ten principles:

1. Existence — Users must have an independent existence in the digital world
2. Control — Users must control their own identities
3. Access — Users must have access to their own data
4. Transparency — Systems and algorithms must be transparent
5. Persistence — Identities must be long-lived
6. Portability — Information and services about identity must be transportable
7. Interoperability — Identities should be as widely usable as possible
8. Consent — Users must agree to the use of their identity
9. Minimization — Disclosure of claims must be minimized
10. Protection — The rights of users must be protected

These principles have driven a decade of innovation in verifiable credentials, zero-knowledge proofs, and blockchain-anchored identity. But there is a gap in these principles that has only become apparent with the rise of autonomous AI agents: none of them address continuity.`,
  },
  {
    id: "key-players",
    heading: "The 2026 Landscape: Key Protocols and Projects",
    content: `The decentralized identity ecosystem in 2026 spans multiple approaches:

Verifiable Credentials (VCs)
Led by the W3C Verifiable Credentials standard, this approach focuses on cryptographically signed claims. Projects like SpruceID, Walt.id, and Cheqd provide infrastructure for issuing, holding, and verifying credentials. A VC is essentially a digital version of a physical credential — a driver's license, a diploma, a membership card — that can be verified without contacting the issuer.

Proof of Personhood (PoP)
Projects like Worldcoin (now World), BrightID, and Gitcoin Passport tackle a specific problem: proving that you are a unique human without revealing who you are. Worldcoin uses iris biometrics via a custom hardware Orb. BrightID uses a social graph verification party system. Gitcoin Passport aggregates multiple stamps (biometric, social, financial) into a single personhood score.

Zero-Knowledge Identity
Polygon ID (now Billions Network), Iden3, and zkSync's identity stack use zero-knowledge proofs to enable selective disclosure. You can prove "I am over 18" without revealing your birth date. You can prove "I am a citizen of this country" without revealing which country. ZK identity is privacy-preserving by construction.

Continuity Protocols (Emerging)
MyShape Protocol and TRIP Protocol represent a new category: continuity-first identity. Rather than verifying a static claim or a one-time biometric, these protocols verify the trajectory of a subject across time. MyShape uses motion-signature as the continuity primitive; TRIP uses attestation-based session chaining. This is the frontier.`,
  },
  {
    id: "the-gap",
    heading: "The Gap in Every Approach: Continuity",
    content: `Every approach listed above — VCs, PoP, ZK identity — operates on snapshots. A VC is a snapshot of a claim at issuance time. A PoP is a snapshot of unique personhood at enrollment time. A ZK proof is a snapshot of attribute possession at verification time.

None of them answer: "Is the entity presenting this credential the same entity that has been continuously operating this identity for the past six months?"

This gap is invisible in the Web2 world because platforms provide implicit continuity — your session cookie, your login history, your activity pattern. But in a decentralized world where you control your identity across many platforms, there is no equivalent. How does a DeFi protocol know that the wallet executing a governance vote is the same sovereign entity that has been providing liquidity for three months?

MyShape's answer is Proof of Continuity: a cryptographic attestation that a subject has maintained unbroken sovereignty across a defined time interval, anchored not in a static credential but in the irreducible entropy of human motion — a signal that AI cannot forge and that cannot be replayed.

This is the next evolution of decentralized identity. Not a better DID method. Not a more efficient ZK circuit. A new primitive entirely — one that the SSI principles didn't anticipate because they were written before the Agent Economy existed.`,
  },
  {
    id: "getting-started",
    heading: "Getting Started with Decentralized Identity in 2026",
    content: `If you are new to decentralized identity, here is a practical path:

1. Understand the primitives: DIDs, VCs, ZK proofs, and proof of continuity are the four pillars of modern decentralized identity. Each serves a different purpose.

2. Get a wallet that supports DIDs: MetaMask, Rainbow, and Phantom all support basic DID resolution. For advanced SSI features, explore SpruceID's Kepler wallet or the Polygon ID wallet.

3. Claim your first verifiable credential: Gitcoin Passport is the easiest entry point. Connect your wallet, verify your identity across multiple stamps, and build a personhood score.

4. Explore zero-knowledge identity: Try the Polygon ID demo to see how ZK proofs enable selective disclosure — proving attributes without revealing data.

5. Experience proof of continuity: The MyShape Motion Demo lets you generate a real motion-signature proof of presence using your webcam. No data is stored. No biometric is captured. It is a zero-knowledge verification that you are human — performed entirely on-device.

The decentralized identity stack is maturing rapidly. But the most important evolution is happening now: the shift from verifying snapshots to verifying trajectories. Identity is a snapshot. Continuity is a trajectory. The future belongs to protocols that verify both.`,
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
              <span>GENESIS 006</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">
              What Is<br />
              <span className="text-[#90c8ff]">Decentralized Identity?</span>
            </h1>
            <p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">
              The 2026 guide to DIDs, self-sovereign identity, verifiable
              credentials, proof of personhood — and why proof of continuity
              is the next evolution.
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

          {/* Internal link cluster */}
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />

          <div className="space-y-4">
            <p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">
              Continue Reading
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/blog/what-is-proof-of-continuity"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/50 text-[10px] tracking-[0.1em]">
                  What Is Proof of Continuity?
                </p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                  The missing primitive for the Agent Economy →
                </p>
              </Link>
              <Link
                href="/compare"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/50 text-[10px] tracking-[0.1em]">
                  Protocol Comparison Matrix
                </p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                  MyShape vs Worldcoin vs Civic vs TRIP →
                </p>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">
              Experience Decentralized Continuity
            </p>
            <p className="text-white/25 text-[10px] leading-relaxed max-w-md mx-auto">
              The MyShape Motion Demo is the first public implementation of
              proof of continuity. See your motion become a cryptographic proof
              — no data stored, no biometric captured, pure zero-knowledge.
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

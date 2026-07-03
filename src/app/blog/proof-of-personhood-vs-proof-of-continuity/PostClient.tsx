"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  {
    id: "two-problems",
    heading: "Two Problems, Often Confused",
    content: `The decentralized identity space has a taxonomy problem. We use the word "identity" to mean at least four different things:

1. Authentication — "Prove you control this private key"
2. Identification — "Prove you are this specific person"
3. Personhood — "Prove you are a unique human (one person, one account)"
4. Continuity — "Prove you are the same entity across time"

Most protocols solve #1 and #2. Worldcoin, BrightID, and Gitcoin Passport tackle #3 — Proof of Personhood (PoP). MyShape Protocol tackles #4 — Proof of Continuity (PoC).

These are not competing solutions. They solve different problems at different layers of the identity stack. Confusing them leads to bad architectural decisions and worse security models.`,
  },
  {
    id: "what-is-pop",
    heading: "What Proof of Personhood Actually Does",
    content: `Proof of Personhood answers one question: "Is there a unique human behind this account?"

This is the Sybil resistance problem. In a world where creating a thousand bot accounts costs pennies, how do you ensure one-person-one-vote, one-person-one-airdrop, one-person-one-UBI-payment?

The leading PoP approaches in 2026:

Worldcoin (now World)
Uses iris biometrics captured by a custom hardware Orb. The iris hash is stored on-chain. A zero-knowledge proof can later assert "this person has a valid World ID" without revealing who they are. 18M+ verified humans. Weakness: requires specialized hardware; iris is static and irreplaceable.

BrightID
Uses social graph analysis — you verify your uniqueness by building a web of verified connections with real humans who vouch for you. No biometrics, no hardware. Weakness: social graph attacks; requires active community participation.

Gitcoin Passport
Aggregates multiple "stamps" — biometric (World ID), social (BrightID, Twitter), financial (Holonym, Coinbase verification) — into a single personhood score. The more stamps, the stronger the proof. Weakness: stamp quality varies; Sybil resistance is probabilistic, not cryptographic.

All three approaches verify uniqueness at a point in time. None verify continuity across time.`,
  },
  {
    id: "what-is-poc",
    heading: "What Proof of Continuity Adds",
    content: `Proof of Continuity answers a different question: "Is the entity operating this identity now the same entity that has been operating it continuously?"

This is the trajectory verification problem. A World ID proves you were a unique human at enrollment time. But does it prove that you — the same continuous subject — are the one using that World ID right now to sign a $500K transaction?

Consider the attack vector: Alice enrolls in Worldcoin. Alice sells her World ID credentials to Bob. Bob now presents Alice's World ID to vote in a DAO, claim an airdrop, or access a service. The PoP is valid — Bob is a unique human — but the continuity between enrollment and usage is broken. Alice and Bob are different humans.

Proof of Continuity closes this gap. By anchoring identity in a signal that:
- Cannot be transferred (motion is biologically bound to a specific body)
- Cannot be replayed (each verification is temporally unique)
- Cannot be forged by AI (the entropy gap is mathematically provable)

...PoC ensures that the entity enrolling is the same entity verifying — not just at one moment, but across an unbroken chain of presence receipts.

PoP without PoC = "This human is unique." PoC without PoP = "This trajectory is unbroken." Together = "This unique human has maintained continuous sovereign control."`,
  },
  {
    id: "complementary",
    heading: "Why They Are Complementary, Not Competitive",
    content: `The identity stack of 2027 will have multiple layers:

Layer 1 — Authentication: "You control this key" (cryptographic signatures)
Layer 2 — Personhood: "You are a unique human" (World ID, BrightID, Passport)
Layer 3 — Continuity: "You are still you" (MyShape Protocol)
Layer 4 — Reputation: "You have behaved honestly over time" (on-chain history)

PoP and PoC are not competitors for the same slot. They occupy different layers. A DeFi protocol might require:
- Layer 1 to authorize a transaction (sign with private key)
- Layer 2 to prove the signer is a unique human (World ID ZK proof)
- Layer 3 to prove this human has continuously operated this wallet for 6 months (MyShape continuity proof)

The combination is stronger than either alone. PoP without PoC is a snapshot — vulnerable to credential transfer. PoC without PoP is a trajectory — vulnerable to Sybil attack (one person creating multiple trajectories). Together, they provide both uniqueness and continuity.`,
  },
  {
    id: "the-future",
    heading: "The Protocol Stack of 2027",
    content: `The next 18 months will see the standardization of the identity stack:

- W3C DID + Verifiable Credentials for Layer 1 (authentication and claims)
- World ID + Gitcoin Passport for Layer 2 (personhood)
- MyShape Protocol for Layer 3 (continuity)
- On-chain reputation protocols for Layer 4 (behavior)

The most important insight is that no single protocol can solve all four layers. The architecture is inherently compositional. The protocols that succeed will be those that compose well with others — accepting proofs from lower layers and feeding verified assertions to higher layers.

MyShape is designed for this composability. A continuity proof can bind to any DID. A personhood stamp can anchor to any continuity chain. The protocol is not a walled garden — it is a primitive that makes every other identity layer stronger.`,
  },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase">
              <span>GENESIS 008</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">
              Proof of Personhood<br />
              <span className="text-[#90c8ff]">vs Proof of Continuity</span>
            </h1>
            <p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">
              Two different problems. Two different protocols. Why the Agent
              Economy needs both — and why confusing them leads to broken
              security models.
            </p>
          </div>
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-[#90c8ff]/30" />
                  {section.heading}
                </h2>
                <div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">{section.content}</div>
              </section>
            ))}
          </div>
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4">
            <p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">Continue Reading</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/blog/what-is-proof-of-continuity" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/50 text-[10px] tracking-[0.1em]">What Is Proof of Continuity?</p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">The missing primitive →</p>
              </Link>
              <Link href="/compare" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/50 text-[10px] tracking-[0.1em]">Protocol Comparison</p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">MyShape vs Worldcoin vs Civic →</p>
              </Link>
              <Link href="/glossary" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all">
                <p className="text-white/50 text-[10px] tracking-[0.1em]">Protocol Glossary</p>
                <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">30+ defined terms →</p>
              </Link>
            </div>
          </div>
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">Experience Proof of Continuity</p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href="/genesis" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">Genesis →</Link>
              <Link href="/motion-demo" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">Motion Demo →</Link>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/blog" className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors">← Protocol Log</Link>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

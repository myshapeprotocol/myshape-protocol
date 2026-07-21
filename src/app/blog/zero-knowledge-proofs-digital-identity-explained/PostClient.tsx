"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  {
    id: "what-is-zk",
    heading: "What Is a Zero-Knowledge Proof?",
    content: `A zero-knowledge proof (ZKP) is a cryptographic method by which one party (the prover) can prove to another party (the verifier) that a statement is true — without revealing any information beyond the validity of the statement itself.

The classic analogy is the Ali Baba cave: Peggy wants to prove to Victor that she knows the secret password to open a door deep inside a circular cave, but she doesn't want to reveal the password. Victor waits outside while Peggy enters the cave and takes one of two paths (A or B). Victor then shouts which path he wants her to return from. If Peggy knows the password, she can always return from the requested path — whether she went in through A or B — because she can open the door from either side. If she doesn't know the password, she has a 50% chance of guessing correctly each round. After 20 rounds, the probability that she is guessing is 1 in 2^20 — less than one in a million.

Victor is convinced that Peggy knows the password, but he has learned nothing about the password itself. That is a zero-knowledge proof.

In cryptographic terms, a ZKP must satisfy three properties:
1. Completeness — If the statement is true, an honest prover can convince an honest verifier
2. Soundness — If the statement is false, no cheating prover can convince an honest verifier
3. Zero-Knowledge — The verifier learns nothing beyond the validity of the statement`,
  },
  {
    id: "zk-types",
    heading: "ZK-SNARKs, ZK-STARKs, and the ZK Landscape in 2026",
    content: `The two dominant ZK proof systems in 2026 are ZK-SNARKs and ZK-STARKs.

ZK-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge)
- Small proof sizes (~200 bytes)
- Fast verification (~10ms)
- Requires a trusted setup ceremony
- Used by: zkSync, Polygon zkEVM, Mina Protocol, Worldcoin

ZK-STARKs (Zero-Knowledge Scalable Transparent Argument of Knowledge)
- Larger proof sizes (~50-200KB)
- Slower verification but no trusted setup
- Post-quantum secure
- Used by: StarkNet, StarkEx, Polygon Miden

For identity applications, the choice between SNARKs and STARKs involves tradeoffs:
- SNARKs: better for mobile/on-device proving (small proofs, fast)
- STARKs: better for high-security, post-quantum, no-trust-setup scenarios

MyShape uses a recursive SNARK composition scheme: the Motion-Signature extraction and PES scoring happen on-device, then a SNARK proves "the PES exceeds threshold" without revealing the motion data, the raw PES value, or any biometric information. The proof is ~250 bytes and verifies in under 10ms.`,
  },
  {
    id: "zk-identity",
    heading: "How ZK Transforms Digital Identity",
    content: `Traditional identity verification follows a "present everything, verify one thing" model. When you show your driver's license at a bar, the bouncer sees your name, address, date of birth, license number, and photo — when all they need to verify is "are you over 21?" That is a privacy failure.

ZK identity inverts this to "present nothing, verify one thing":

Selective Disclosure
Prove "I am over 21" without revealing your birth date. Prove "I am a citizen" without revealing which country. Prove "I have a valid credential" without revealing the credential's contents or issuer.

Unlinkable Verification
Each ZK proof is generated fresh. A verifier cannot link two proofs to the same person — even if the same credential is used both times. This prevents tracking and profiling across services.

No Central Database
The verifier never stores raw identity data because they never receive it. They receive only a proof. If the verifier's database is breached, there is nothing to leak — because there was never anything stored.

This model is not theoretical. Billions Network (formerly Polygon ID) enables ZK age verification for Deutsche Bank. Worldcoin uses ZK to prove unique personhood without storing iris data. MyShape extends ZK to the physical layer: proving that a human is physically present and generating authentic motion — without ever seeing their face, body, or movement data.`,
  },
  {
    id: "zk-presence",
    heading: "Continuity: Proving You Are Human Without Surveillance",
    content: `Continuity is MyShape's application of continuity receipts to physical presence verification. The problem it solves is: how do you prove that a human is physically generating motion at this moment, without creating a surveillance system?

The answer is a two-stage ZK architecture:

Stage 1 — On-Device Motion Analysis
Your camera captures your motion. MediaPipe extracts 33 body landmarks. The SST reduces these to 18 geometric points. The PES engine computes four entropy sub-scores. All of this happens on-device. No data leaves your device.

Stage 2 — ZK Proof Generation
A ZK circuit takes the PES result as a private input and proves: "PES > threshold AND motion was captured within the last 5 seconds AND the motion exhibits biological entropy characteristics." The proof is ~250 bytes. The verifier receives only this proof — not the PES value, not the motion data, not your face, not your identity.

What the verifier learns: "A human was physically present at time T."
What the verifier does NOT learn: who that human is, what they look like, or any raw motion data.

This is the categorical difference between Continuity and biometric verification. Biometrics say: "show us your body, and we'll verify you." Continuity says: "prove you can move like a human, without ever showing us who you are."`,
  },
  {
    id: "why-matters",
    heading: "Why ZK Identity Matters Now",
    content: `Three forces make ZK identity the most important cryptographic technology of 2026:

1. AI Impersonation
Generative AI can now produce convincing fake video, voice, and behavior. Static identity verification — a selfie, a document scan, a voice sample — is trivially defeated. ZK proofs add a layer that AI cannot bypass: the proof is generated locally from a physical signal that AI cannot forge. If the proof verifies, the signal was authentic — regardless of what the camera feed looked like.

2. Regulatory Privacy
GDPR, CCPA, and emerging AI regulations increasingly restrict the collection and storage of biometric data. ZK identity enables compliance by design: if you never collect the data, you cannot violate data protection laws. Continuity is GDPR-compliant by construction.

3. Cross-Platform Sovereignty
As digital life fragments across chains and platforms, users need identity that is both verifiable and private. A ZK proof generated on your phone should be verifiable on Ethereum, on Solana, on a private enterprise network — without any platform learning who you are. ZK enables universal verifiability with zero data leakage.

The ZK identity stack is the privacy layer that Web3 promised and Web2 never delivered.`,
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
            <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase">
              <span>GENESIS 007</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/40">The Continuity Lab</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
              Zero-Knowledge<br />
              <span className="text-[#90c8ff]">Proofs Explained</span>
            </h1>
            <p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">
              What ZK means for digital identity in 2026. How zero-knowledge
              proofs enable verification without surveillance — and why
              Continuity is the future of privacy-first identity.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-[#90c8ff]/30" />
                  {section.heading}
                </h2>
                <div className="text-white/55 text-[15px] sm:text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Internal links */}
          <PostNavigation slug="/blog/zero-knowledge-proofs-digital-identity-explained" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4">
            <p className="text-white/38 text-[11px] tracking-[0.2em] uppercase text-center">
              Continue Reading
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link
                href="/blog/what-is-decentralized-identity-2026"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/55 text-[12px] tracking-[0.08em]">
                  What Is Decentralized Identity?
                </p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">
                  2026 guide to DID, SSI, VCs →
                </p>
              </Link>
              <Link
                href="/blog/what-is-proof-of-continuity"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/55 text-[12px] tracking-[0.08em]">
                  What Is Proof of Continuity?
                </p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">
                  The missing primitive →
                </p>
              </Link>
              <Link
                href="/glossary"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
              >
                <p className="text-white/55 text-[12px] tracking-[0.08em]">
                  Protocol Glossary
                </p>
                <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">
                  30+ defined terms →
                </p>
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/55 text-[13px] tracking-[0.1em] uppercase">
              Experience Continuity
            </p>
            <p className="text-white/45 text-[12px] leading-[1.7] max-w-md mx-auto">
              See zero-knowledge identity verification in action. The Motion Demo
              generates a real ZK proof of presence — entirely on-device.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/65 text-[11px] tracking-[0.18em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all"
              >
                Motion Demo →
              </Link>
              <Link
                href="/protocol/zk"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/50 text-[11px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all"
              >
                ZK Architecture →
              </Link>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors"
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

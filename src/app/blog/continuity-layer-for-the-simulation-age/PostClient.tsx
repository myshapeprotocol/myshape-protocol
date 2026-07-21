"use client";

import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const TOC_ITEMS = [
  { id: "crisis", label: "The Simulation Age Crisis" },
  { id: "paradigm", label: "Identity vs. Continuity" },
  { id: "motion", label: "Why Motion Is Unforgeable" },
  { id: "consensus", label: "From Protocol to Consensus Layer" },
  { id: "pipeline", label: "The Proof of Continuity Pipeline" },
  { id: "engine", label: "Continuity as an Economic Engine" },
  { id: "competition", label: "What We Compete With" },
  { id: "question", label: "The Ultimate Question" },
];

const SECTIONS = [
  {
    id: "crisis",
    heading: "The Simulation Age Crisis",
    content: `The digital world spent three decades answering one question: Who are you?

Passwords, identity credentials, OAuth, DID, Web3 wallets — every identity system ever built is a variation on the same theme. Prove you hold a credential. Prove you control a key. Prove you are the person in the database.

This question is now obsolete.

In the Simulation Age, generative AI can simulate your visual identity, your voice, your writing style, your behavioral patterns — any static credential, any stored identity record, any "proof of identity" that relies on a snapshot. Everything that can be stored can be copied. Everything that can be copied can be forged.

We are also entering a world where every person will deploy a fleet of AI agents: a financial agent that executes trades, a creative agent that produces content under your name, a governance agent that votes in DAOs on your behalf. The critical question is not whether these agents are "human." It is whether they continuously represent the same sovereign subject.

When your financial agent requests a $10M wire transfer, the counterparty does not need to know your name. They need to know: Is this agent still backed by the same entity that authorized it? Has the subject behind this agent changed in the last 30 seconds?

Current identity systems cannot answer this. They can only verify credentials at a point in time. They are snapshot verifiers in a world that demands continuous verification.`,
  },
  {
    id: "paradigm",
    heading: "Identity vs. Continuity — A Paradigm Shift",
    content: `Identity is a product of the information age. It answers: I claim to be X. Here is my proof.

Continuity is a requirement of the simulation age. It answers: I was X at T₀. I am still X at Tₙ. Nothing replaced me in between.

Identity verifies a credential at time T. Continuity verifies an unbroken chain from T₀ to Tₙ. Identity is a snapshot. Continuity is a trajectory. Identity can be stolen, copied, forged. Continuity cannot be separated from the living subject.

The passport model versus the soul model.

Every identity system ever built — from passwords to identity credentials to continuity receipts — operates in the left column. They verify a claim. They do not verify a trajectory.

MyShape operates in the right column. It verifies that the entity generating this proof is the same entity that generated the last one, and the one before that, in an unbroken chain of physical presence.

This is not a marginal improvement on identity. It is a different primitive.`,
  },
  {
    id: "motion",
    heading: "Why Motion-Signature Is the Only Unforgeable Anchor",
    content: `If everything digital can be copied, what remains?

The answer lies in physics, not cryptography.

A living entity generates a continuous stream of micro-motion — the way weight shifts, the way joints compensate, the way balance corrects. This stream is not a single data point. It is a time-monotonic trajectory: each moment's motion depends on the entity's state at the previous moment, which depends on the moment before that.

This gives motion-signature a property that no stored credential possesses:

A single motion snapshot can be learned and reproduced by AI. A continuous motion trajectory cannot — because each step's micro-entropy depends on real biological state evolution that no generative model can predict.

The unforgeability does not come from "how you move." It comes from the fact that your motion history forms an unbroken causal chain rooted in your data-body — the irreducible physical substrate of a sovereign entity. AI can generate a plausible next frame. It cannot generate a causally valid next micro-state without access to that substrate.

This is the cryptographic foundation of Proof of Continuity. It is not pattern matching. It is trajectory integrity verification.`,
  },
  {
    id: "consensus",
    heading: "From Protocol to Consensus Layer",
    content: `Most blockchain projects build products. A product solves "what can I do?"

A consensus layer solves something different: "What do we collectively agree is true?"

TCP/IP is not a product. It is a consensus layer for how data moves. DNS is not a product. It is a consensus layer for how names resolve. TLS is not a product. It is a consensus layer for how connections are trusted.

MyShape targets the same elevation — but for a different primitive.

It does not verify "who this server is." It verifies whether this digital subject has maintained unbroken continuity.

If the entire AI agent ecosystem adopts a single Continuity Proof format — a shared language for verifying that an agent remains backed by its original sovereign subject — then MyShape is not a product competing in a market. It is infrastructure that the market is built on top of.

This is the end state: The Continuity Layer for the Simulation Age.`,
  },
  {
    id: "pipeline",
    heading: "The Proof of Continuity Pipeline",
    content: `The protocol is already operational. It is not a whitepaper describing a future system. It is a working pipeline:

Capture → Encoding → Identity Vector → Continuity Proof → Agent Verification

Capture. MediaPipe Pose extracts 120-dimensional landmark data from a live video stream. No identity capture. No visual recognition. Pure skeletal geometry.

Encoding. A Rust/WASM engine normalizes the landmark stream into a calibrated feature matrix, applying PCA projection and z-score standardization against a population baseline.

Identity Vector. The encoded stream compresses into a compact, privacy-preserving vector — not "who you are" but "the mathematical signature of how your data-body continuously occupies space."

Continuity Proof. The vector, combined with temporal integrity checks and zero-knowledge wrapping, produces a proof that can be verified by any third party without revealing the underlying motion data.

Agent Verification. Any AI agent, smart contract, or protocol can consume this proof and answer the only question that matters: Is this agent still backed by the same persistent digital subject?`,
  },
  {
    id: "engine",
    heading: "Continuity as an Economic Engine",
    content: `Continuity is not only a defense against AI forgery. It is the enabling infrastructure for the Agent Economy.

Consider the transactions that cannot happen without continuity verification:

High-value DeFi. Your financial agent requests a $5M withdrawal. The protocol needs proof that the sovereign subject behind the agent has not changed since the deposit was made — not just at the moment of request, but continuously across the entire custody period.

Creative provenance. Your creative agent mints an NFT series under your name. The marketplace needs proof that the same subject authored the entire series — not that someone held a key, but that an unbroken creative trajectory exists.

DAO governance integrity. Your voting agent casts a decision on a protocol upgrade. The DAO needs proof that the voter's digital subject maintained continuity throughout the voting period — no substitution, no agent takeover, no session hijacking.

In every case, the Continuity Proof is not a lock keeping bad actors out. It is a passport enabling high-value operations to occur at all.

This aligns with MyShape's strategic positioning: not mass-market identity for a billion users, but the signature layer for high-value operations — analogous to what Fireblocks and Anchorage provide for institutional crypto custody, but generalized to any operation where "who continues to be you" is the binding constraint.`,
  },
  {
    id: "competition",
    heading: "What We Compete With",
    content: `MyShape does not compete with World, DID protocols, or identity wallets.

World asks: Is this a unique human? MyShape asks: Is this the same sovereign subject as before?

World solves the bot problem. MyShape solves the continuity problem. These are different layers of the stack.

The real competitive landscape is every future infrastructure project that will attempt to solve Human-Agent Continuity. This category does not yet have a name, but it will — because every AI agent network, every DeFi protocol handling serious value, and every autonomous system will eventually discover that they need it.

MyShape's advantage is being first to define the category, first to build the pipeline, and first to articulate why continuity — not identity — is the right primitive for the Simulation Age.`,
  },
  {
    id: "question",
    heading: "The Ultimate Question",
    content: `In a world of infinite copies and infinite agents, one question cuts through the noise:

What proves that you continue to exist?

Not your passport. Not your private key. Not your visual identity. Not your voice. All of these are data. All data can be generated.

The only thing that cannot be generated is the unbroken causal trajectory of your data-body in motion. Your motion-signature is not a credential you hold. It is a property you are.

MyShape translates that property into a verifiable proof — and in doing so, gives the Simulation Age its first Continuity Layer.

Two sentences to carry forward:

MyShape made digital continuity verifiable. Not "MyShape built an identity protocol." Not "128-dimensional vectors." Not "Entropy Score." They made digital continuity verifiable. That is the sentence that should survive when everything else is forgotten.

And the sentence that should open every conversation: The Continuity Layer for the Simulation Age.`,
  },
];

export default function PostClient() {
  const [active, setActive] = useState("crisis");
  const [tocShow, setTocShow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TOC_ITEMS[i].id);
        if (el && el.offsetTop <= scrollY) { setActive(TOC_ITEMS[i].id); break; }
      }
      const footer = document.querySelector("footer");
      if (footer) setTocShow(footer.getBoundingClientRect().top > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    playTick(600, "sine", 0.06, 0.015);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 flex flex-col md:flex-row gap-12 md:gap-24">
        {/* Spacer */}
        <div className="md:w-56 shrink-0 hidden md:block" />
        {/* TOC sidebar */}
        <aside className="hidden md:block" style={{
          position: "fixed", top: "128px", width: "224px",
          left: "max(24px, calc((100vw - 1024px) / 2 + 24px))",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.5em] uppercase mb-8 font-mono font-bold">ARCHIVE_INDEX</div>
          <ul className="space-y-6 border-l" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
            {TOC_ITEMS.map(s => {
              const isActive = s.id === active;
              return (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="block text-left w-full transition-all duration-300"
                    style={{
                      borderLeft: isActive ? "2px solid rgba(144,200,255,0.8)" : "2px solid transparent",
                      marginLeft: "-1px",
                      paddingLeft: "20px",
                      background: isActive ? "linear-gradient(90deg, rgba(144,200,255,0.06), transparent)" : "transparent",
                    }}>
                    <span className="flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.6)] scale-100" : "bg-transparent scale-0"}`} />
                      <span className="text-[12px] tracking-[0.2em] uppercase transition-all duration-300"
                        style={{
                          color: isActive ? "rgba(144,200,255,0.95)" : "rgba(255,255,255,0.2)",
                          textShadow: isActive ? "0 0 12px rgba(144,200,255,0.4)" : "none",
                        }}>
                        {s.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="flex-1 min-w-0" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        <div className="mb-16">
          <div className="text-[#90c8ff]/50 text-[11px] tracking-[0.4em] uppercase mb-4">PROTOCOL_ESSAY // 002</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.04em] text-white leading-tight mb-6"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.15)" }}>
            The Continuity Layer for the Simulation Age
          </h1>
          <p className="text-white/35 text-[13px] leading-relaxed">
            Identity tells us who you claim to be. Continuity tells us that you are still you. Why the Simulation Age needs a new primitive.
          </p>
          <div className="flex items-center gap-3 mt-4 text-[11px]">
            <span className="text-white/40">The Continuity Lab</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">June 29, 2026</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">10 min read</span>
          </div>
        </div>

        {/* Visual Hook — Paradigm Diagram */}
        <div className="my-16 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-6 md:p-8 font-mono transition-all duration-300 hover:border-[#90c8ff]/35"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.25em] uppercase mb-4 text-center">SYSTEM_SCHEMA: CONTINUITY LAYER</div>
          <pre className="text-[#90c8ff]/40 text-[11px] leading-[2.2] tracking-[0.08em] whitespace-pre overflow-x-auto text-center">
{`IDENTITY                              CONTINUITY
  Who are you?                           Who continues to be you?
  Verifies a credential at time T        Verifies an unbroken chain T₀ → Tₙ
  Snapshot                               Trajectory
  Can be stolen, copied, forged          Cannot be separated from the living subject
  The passport model                     The soul model

  ◄─────────── The Continuity Layer bridges this gap ──────────►
         Motion-Signature → Continuity Proof → Agent Verification`}
          </pre>
          <div className="mt-4 flex justify-center gap-4 text-[11px]">
            <span className="text-[#90c8ff]/25">◈ Pipeline: Capture → Encoding → Vector → Proof → Agent</span>
            <span className="text-white/10">|</span>
            <span className="text-[#90c8ff]/25">◈ Engine: Rust → WASM</span>
            <span className="text-white/10">|</span>
            <span className="text-[#90c8ff]/25">◈ A Continuity Protocol for Persistent Digital Subjects</span>
          </div>
        </div>

        <div className="space-y-20">
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 id={s.id} className="text-white/70 text-[18px] md:text-[20px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-[#90c8ff] scroll-mt-28"
                onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>
                {s.heading}
              </h2>
              <div className="space-y-5">
                {s.content.split("\n\n").map((para, j) => (
                  <p key={j} className="text-white/50 text-[18px] leading-[1.85] font-light">
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 p-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]">
          <p className="text-white/30 text-[11px] leading-relaxed mb-4">
            <strong className="text-white/50">The Continuity Layer is operational.</strong> The Capture → Encoding → Identity Vector → Continuity Proof pipeline is running. Genesis Cohort is validating the first persistent digital subjects. The protocol is open for inspection.
          </p>
          <p className="text-white/30 text-[11px]">
            Repository: github.com/myshapeprotocol &middot; Live Demo: myshape.com/motion-demo &middot; Vision: myshape.com/vision &middot; Genesis: myshape.com/genesis
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-white/[0.05] text-center space-y-4">
          <p className="text-white/20 text-[11px]">Discuss this essay on HN or GitHub.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              View on GitHub →
            </a>
            <Link href="/vision"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              Vision →
            </Link>
            <Link href="/blog"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              All Essays →
            </Link>
          </div>
        </div>

        <PostNavigation slug="/blog/continuity-layer-for-the-simulation-age" />

        {/* Internal link cluster */}
        <div className="mt-16 pt-12 border-t border-[#90c8ff]/5 space-y-4">
          <p className="text-white/38 text-[11px] tracking-[0.2em] uppercase text-center">
            Continue Reading
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              href="/blog/zero-knowledge-proofs-digital-identity-explained"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
              className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
            >
              <p className="text-white/55 text-[12px] tracking-[0.08em]">
                Continuity Verification Explained
              </p>
              <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">
                ZK for digital identity →
              </p>
            </Link>
            <Link
              href="/compare"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
              className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
            >
              <p className="text-white/55 text-[12px] tracking-[0.08em]">
                Protocol Comparison
              </p>
              <p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">
                MyShape vs competitors →
              </p>
            </Link>
          </div>
        </div>
        </article>
      </div>

      <ProtocolFooter />
    </div>
  );
}

"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "principles", heading: "Privacy by Design — Core Principles",
    content: `Privacy-preserving identity is not a feature. It is an architectural property. You cannot bolt privacy onto an identity system after the fact — it must be designed in from the first line of code.\n\nSix principles govern privacy-preserving identity engineering:\n\n1. Data minimization: collect only what you need. If your identity system stores birth dates "just in case," you have already failed. Every stored attribute is a liability.\n\n2. Selective disclosure: the user decides what to reveal. A verifier asking "are you over 18?" does not need your birth date. Your identity system must support partial revelation — preferably via zero-knowledge proofs.\n\n3. User-held credentials: the credential lives in the user's wallet, not your database. Your system should never be a honeypot of user identity data. Verifiable Credentials (W3C VC 2.0) make this possible.\n\n4. Ephemeral identifiers: no long-lived global identifiers. Every interaction uses a pairwise DID. No cross-site tracking. No correlation without user consent.\n\n5. Consent-driven: every data share requires explicit, informed consent. Not a checkbox buried in a 40-page terms document. Real, granular, per-attribute consent.\n\n6. Auditability without surveillance: the system must be provably correct — verifiable by third parties — without logging every user action. Zero-knowledge proofs and verifiable data registries make this possible.` },
  { id: "architecture", heading: "The Stack — Architecture Decisions",
    content: `A privacy-preserving identity system has four layers. Each layer requires specific technology choices:\n\nLayer 1 — Identifiers: DIDs (Decentralized Identifiers). Use did:key for simple cases, did:web for organizational identity, did:ethr for Ethereum anchoring. Never use email addresses or phone numbers as primary identifiers — they are global correlators.\n\nLayer 2 — Credentials: W3C Verifiable Credentials with BBS+ or CL signatures. These support zero-knowledge selective disclosure — the holder can prove "age > 18" without revealing the birth date. Standard ECDSA VCs do NOT support this; choose the signature scheme deliberately.\n\nLayer 3 — Presentation: Verifiable Presentations with ZK proofs. The holder aggregates multiple VCs into a single presentation and reveals only the minimum necessary attributes. Use the W3C Verifiable Presentation data model.\n\nLayer 4 — Verification: The verifier checks the presentation against the issuer's DID, validates the ZK proof, and confirms the attributes satisfy their policy. No call to the issuer. No central database query. The math is the authority.\n\nCritical implementation detail: never store raw VCs on a server. The holder's wallet is the only place VCs live. Your system issues them and forgets them. This eliminates the "database breach → all credentials leaked" failure mode.` },
  { id: "zkp", heading: "Zero-Knowledge Proofs — The Privacy Engine",
    content: `Zero-knowledge proofs are the cryptographic primitive that makes privacy-preserving identity possible. A ZK proof allows a prover to convince a verifier that a statement is true without revealing why it is true.\n\nFor identity, this means:\n- "I am over 21" — without revealing age\n- "I am a citizen of this country" — without revealing which country\n- "I have not been blacklisted" — without revealing transaction history\n\nThree ZK proof systems matter for identity in 2026:\n\n1. BBS+ Signatures: The W3C standard for ZK-friendly VCs. Allows the holder to derive a new signature that reveals only a subset of the originally signed attributes. Mature, standardized, production-deployed.\n\n2. Circom + Groth16: For custom ZK circuits. Maximum flexibility, maximum performance. Used when you need to prove arbitrary statements about identity attributes. Requires circuit design expertise.\n\n3. Noir: A Rust-like DSL for writing ZK circuits. Emerging standard supported by Aztec. Lower barrier to entry than Circom. Compiles to multiple proving backends.\n\nThe key insight: ZK moves identity verification from "trust me, here's all my data" to "verify this proof — I reveal nothing else." That is the architectural shift that privacy-preserving identity demands.` },
];

const RELATED_POSTS = [
  { href: "/blog/zero-knowledge-proofs-digital-identity-explained", title: "ZK Proofs Explained", desc: "How ZK works for identity →" },
  { href: "/blog/what-is-verifiable-credential", title: "What Is a VC?", desc: "Verifiable Credentials →" },
  { href: "/blog/self-sovereign-identity-explained-2026", title: "Sovereign Identity", desc: "SSI explained →" },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 023</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>How to Build<br /><span className="text-[#90c8ff]">Privacy-Preserving Identity</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">A 2026 engineering guide. ZK proofs, selective disclosure, sovereign architecture — and the six principles you cannot skip.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/how-to-build-privacy-preserving-identity" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RELATED_POSTS.map(p => (
              <Link key={p.href} href={p.href} onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">{p.title}</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">{p.desc}</p></Link>
            ))}
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

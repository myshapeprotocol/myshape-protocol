"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "what-is-ssi", heading: "The Promise: You Own Your Identity",
    content: `Self-Sovereign Identity (SSI) is the idea that individuals — not platforms, governments, or corporations — should own and control their digital identities. Coined by Christopher Allen in 2016, SSI rests on ten principles: Existence, Control, Access, Transparency, Persistence, Portability, Interoperability, Consent, Minimization, and Protection.\n\nIn practice, SSI means: you generate your identity locally (a DID — Decentralized Identifier). You receive Verifiable Credentials (VCs) from issuers — a university issuing a degree, a government issuing an ID, a bank verifying KYC. You present these credentials to verifiers, proving claims about yourself without contacting the issuer each time.\n\nThe key insight: the credential holder (you) is at the center. Issuers and verifiers communicate through you, not around you. This inverts the Web2 model where platforms mediate every identity transaction.` },
  { id: "what-works", heading: "What SSI Gets Right in 2026",
    content: `A decade after Allen's principles, SSI has delivered real infrastructure:\n\nDIDs are standardized. The W3C DID Core specification is stable. Decentralized identifiers are resolvable across networks — did:ethr on Ethereum, did:indy on Hyperledger Indy, did:key for lightweight use cases. You can generate a DID today and use it across compliant wallets.\n\nVerifiable Credentials work. The W3C VC Data Model v2.0 enables cryptographically signed claims that are privacy-preserving by default. Selective disclosure — proving "I am over 21" without revealing your birth date — is production-ready with BBS+ and CL signatures.\n\nEnterprise adoption is real. The EU's eIDAS 2.0 regulation mandates SSI-compatible digital identity wallets for all 450 million EU citizens by 2027. Deutsche Bank uses Polygon ID (now Billions) for ZK-based age verification. The IATA Travel Pass uses VCs for COVID-era health credentials.\n\nSSI is not a theoretical vision anymore. It is deployed infrastructure.` },
  { id: "whats-broken", heading: "What SSI Still Gets Wrong",
    content: `For all its achievements, SSI has a structural blind spot that no amount of credential infrastructure can fix:\n\nSSI verifies claims. It does not verify continuity.\n\nA Verifiable Credential proves: "at issuance time, this attribute was true about this subject." It does not prove: "the subject presenting this credential now is the same continuous entity that received it."\n\nThis gap is invisible in the physical world because physical credentials are (mostly) non-transferable. Your passport photo matches your face. Your biometric ID card requires a fingerprint. But in the digital world, a VC is a data object — it can be copied, transferred, sold, or stolen without detection.\n\nIf Alice gets a KYC credential and sells it to Bob, the credential is still valid. The signature still verifies. The issuer has no way to know the credential changed hands. SSI's answer is "bind the credential to a biometric" — but as we've established, static biometrics are broken. Your face can be deepfaked. Your fingerprint can be replayed. Your iris hash can be stolen from a database.\n\nSSI solved the issuance problem. It did not solve the continuity problem.` },
  { id: "next-evolution", heading: "The Next Evolution: SSI + Continuity",
    content: `The missing layer in the SSI stack is proof of continuity — a cryptographic attestation that the entity presenting a credential is the same continuous subject that received it.\n\nThis is not a credential problem. It is a physics problem. The only identity signal that is both universal (every human has it) and non-transferable (cannot be separated from the living body) is motion. The way you move — your micro-timing variance, your physiological tremor, your motor unit recruitment patterns — is biologically unique and mathematically impossible for AI to forge.\n\nMyShape Protocol adds this missing layer to the SSI stack:\n\nDID + VC + Continuity Proof = Complete Sovereign Identity\n\nThe DID establishes the identifier. The VC establishes the claim. The Continuity Proof establishes that the same human has continuously controlled this identity across time — not through a static biometric, but through a dynamic motion-signature that AI cannot simulate and that cannot be transferred.\n\nThis is not a replacement for SSI. It is the completion of SSI. The ten principles were written before the Agent Economy existed. They did not anticipate a world where autonomous AI agents execute transactions on behalf of humans, where deepfakes defeat static biometrics, and where credentials can be bought and sold on darknet markets. Continuity is the 11th principle that SSI needs.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 010</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>Self-Sovereign<br /><span className="text-[#90c8ff]">Identity Explained</span></h1>
            <p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">What SSI actually means in 2026 — the promise, the reality, the gaps, and why proof of continuity is the next evolution.</p>
          </div>
          <div className="space-y-20">
            {SECTIONS.map(s => (<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}
          </div>
          <PostNavigation slug="/blog/self-sovereign-identity-explained-2026" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/blog/what-is-decentralized-identity-2026" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Decentralized Identity?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">2026 guide to DID, SSI →</p></Link>
              <Link href="/blog/what-is-proof-of-continuity" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Proof of Continuity?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">The missing primitive →</p></Link>
              <Link href="/glossary" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Glossary</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">30+ defined terms →</p></Link>
            </div>
          </div>
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4"><p className="text-white/55 text-[13px] tracking-[0.1em] uppercase">Experience Sovereign Continuity</p><div className="flex justify-center gap-4 pt-2"><Link href="/motion-demo" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/65 text-[10px] tracking-[0.18em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">Motion Demo →</Link><Link href="/genesis" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/50 text-[10px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">Genesis →</Link></div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  { id: "problem", heading: "The KYC Machine Is Broken",
    content: `KYC (Know Your Customer) was designed for banks in the 1970s. The model: you hand over your passport or driver's license. The institution photocopies it. Someone manually checks that the photo looks like you. Done.\n\nIn 2026, this model is collapsing under its own weight. The average KYC check costs $5-20 and takes 2-5 days. 15-30% of checks fail — not because the applicant is fraudulent, but because the document is expired, the photo is blurry, or the name doesn't match across systems. Identity document fraud is a $100B/year industry. And every KYC check creates another copy of your most sensitive documents stored in another database — each one a potential breach.\n\nThe regulatory environment is also shifting. The EU's eIDAS 2.0 mandates reusable digital identity wallets for 450 million citizens. The FATF is exploring decentralized identity for AML compliance. The era of "photocopy your passport and email it" is ending.` },
  { id: "ssi-solution", heading: "How Decentralized Identity Solves KYC",
    content: `Decentralized identity inverts the KYC model. Instead of sending your documents to every service, you get verified once by a trusted issuer and receive a Verifiable Credential. When a service needs to check your identity, you present the credential — a cryptographic proof that you were verified. The service never sees your raw documents.\n\nThis is not theoretical. The EU's eIDAS 2.0 mandates exactly this architecture. Deutsche Bank uses Polygon ID (now Billions) for ZK-based age verification — proving "I am over 18" without revealing any other document data. The IATA Travel Pass uses VCs for health credentials. The infrastructure is deployed.\n\nThe key insight: KYC is a verification of a claim, not a storage of documents. A claim ("this person passed KYC") can be verified without the underlying documents being shared. Zero-knowledge proofs make this privacy-preserving by default.\n\nMyShape adds the final layer: proof of continuity. A KYC credential proves you passed verification once. A continuity proof proves you are still the same human that passed KYC — not someone who bought a verified account on the darknet. KYC + SSI + continuity = the strongest identity verification stack available.` },
  { id: "landscape", heading: "The 2026 Regulatory Landscape",
    content: `eIDAS 2.0 (EU): mandates SSI-compatible digital wallets by 2027. FATF Guidance: exploring decentralized identity for AML. California BIPA: restricts biometric collection — driving interest in non-biometric verification like motion. India Supreme Court: Aadhaar cannot be mandatory — reinforcing the need for voluntary, user-controlled identity. The direction is clear: the future of KYC is reusable, privacy-preserving, and user-controlled — not document photocopies in email attachments.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase"><span>GENESIS 017</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">KYC vs<br /><span className="text-[#90c8ff]">Decentralized Identity</span></h1><p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">Why document verification fails at scale — and how SSI solves the problem.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/what-is-decentralized-identity-2026" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">Decentralized Identity Guide</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">DID, SSI, VC explained →</p></Link>
            <Link href="/compare" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">Protocol Comparison</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">MyShape vs competitors →</p></Link>
            <Link href="/glossary" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">Protocol Glossary</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">30+ terms →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

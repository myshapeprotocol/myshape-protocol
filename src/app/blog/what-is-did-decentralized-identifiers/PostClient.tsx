"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "what", heading: "What Is a Decentralized Identifier?",
    content: `A Decentralized Identifier (DID) is a globally unique identifier that you create and control — not issued by a government, a corporation, or any centralized authority. It is the "username" layer of Web3 identity.\n\nA DID looks like this: did:ethr:0x1234...abc (anchored on Ethereum) or did:key:z6MkhaX... (self-contained cryptographic identifier). The part after "did:" is the method — specifying which blockchain or network anchors the identifier.\n\nThe W3C DID Core specification (a global web standard since 2022) defines how DIDs are created, resolved, updated, and deactivated. Every DID resolves to a DID Document — a JSON file containing public keys, service endpoints, and verification methods.` },
  { id: "methods", heading: "DID Methods: The Different Flavors",
    content: `did:ethr — Anchored on Ethereum. Your DID Document is stored on-chain or on IPFS. Suitable for applications that need blockchain-level immutability.\n\ndid:key — Lightweight and self-contained. The DID itself encodes the public key. No blockchain, no registry. Ideal for ephemeral or low-stakes use cases.\n\ndid:indy — Privacy-preserving. Used by Hyperledger Indy. Supports continuity receipts and pairwise identifiers — each relationship gets a unique DID, preventing correlation.\n\ndid:web — Resolves via HTTPS. Your DID is hosted at a domain you control: did:web:example.com. Simple but requires domain ownership.\n\nMyShape Protocol uses did:key for lightweight identity binding. The continuity proof — a cryptographic attestation of unbroken human presence — can bind to any DID method, adding a physical verification layer to any decentralized identifier.` },
  { id: "why", heading: "Why DIDs Matter",
    content: `In Web2, your identifier is an email address or a username — owned by the platform, revocable at will. In Web3, your DID is yours. You hold the private key. No platform can take it away.\n\nDIDs enable: portable identity across platforms, verifiable credentials without centralized issuers, privacy-preserving authentication, and self-sovereign control over your digital existence.\n\nThe next step: binding a DID to a proof of continuity. A DID proves you control a key. A continuity proof proves you are a continuously present human. Together, they form the strongest identity primitive available in 2026.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase"><span>GENESIS 016</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/40">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>What Is<br /><span className="text-[#90c8ff]">a DID?</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">Decentralized Identifiers — the foundation of self-sovereign identity. How they work, the different methods, and why they matter.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[15px] sm:text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/what-is-did-decentralized-identifiers" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/38 text-[11px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/web3-identity-explained-blockchain" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Web3 Identity Explained</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">5-layer stack →</p></Link>
            <Link href="/blog/what-is-decentralized-identity-2026" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Decentralized Identity Guide</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">DID, SSI, VC explained →</p></Link>
            <Link href="/glossary" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Glossary</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">30+ terms →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

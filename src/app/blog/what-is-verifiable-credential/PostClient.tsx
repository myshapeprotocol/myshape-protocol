"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "what", heading: "What Is a Verifiable Credential?",
    content: `A Verifiable Credential (VC) is a cryptographically signed digital statement about a subject, issued by a trusted authority, that can be verified without contacting the issuer.\n\nThink of it as a digital version of a physical credential — a driver's license, a university degree, a membership card — but with three critical advantages:\n\n1. Cryptographic verification: anyone can verify the credential is authentic by checking the issuer's digital signature. No need to call the university to confirm the degree is real.\n\n2. Selective disclosure: you can prove "I am over 21" without revealing your birth date. You can prove "I graduated from this university" without revealing your GPA. Zero-knowledge proofs make this mathematically private.\n\n3. User-held: the credential lives in your digital wallet, not in the issuer's database. You decide when to present it and to whom. The issuer cannot revoke your access to your own credentials.\n\nThe W3C Verifiable Credentials Data Model 2.0 (Candidate Recommendation, 2026) is the global standard. A VC has three parties: Issuer (creates the credential), Holder (you — stores and presents it), Verifier (checks it's valid).` },
  { id: "how", heading: "How VCs Work — A Walkthrough",
    content: `Step 1: Issuance. A university issues a degree VC to a graduate. The university signs the credential with its private key. The signed VC is sent to the graduate's digital wallet.\n\nStep 2: Storage. The graduate holds the VC in their wallet — a mobile app, a browser extension, or a cloud agent. The VC is a JSON file with cryptographic proof. No central database stores it.\n\nStep 3: Presentation. A potential employer asks "do you have a degree?" The graduate presents the VC. The employer verifies the university's signature against the university's public DID — confirming the credential is authentic without contacting the university.\n\nStep 4: Selective Disclosure (optional). If the employer only needs to know "graduated after 2020," the graduate can use a zero-knowledge proof to reveal only that fact — hiding the exact graduation year, GPA, and major. The employer learns exactly what they need and nothing more.\n\nThis architecture eliminates the "call the issuer" bottleneck, protects privacy through selective disclosure, and puts the user in control of their own credentials.` },
  { id: "why", heading: "Why VCs Matter for the Future of Identity",
    content: `VCs are not a niche technology. They are the credential layer of the Web3 identity stack — the bridge between DIDs (identifiers) and real-world trust (claims).\n\nThe EU's eIDAS 2.0 mandates VC-compatible digital wallets for 450 million citizens by 2027. The IATA Travel Pass uses VCs for health credentials. Deutsche Bank uses VC-based identity for KYC. This is deployed infrastructure at continental scale.\n\nMyShape Protocol adds the missing dimension: continuity. A VC proves a claim was true at issuance. A continuity proof proves the same human still holds the VC. Together: DIDs identify, VCs credential, and continuity verifies — the complete sovereign identity stack.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 021</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>What Is a<br /><span className="text-[#90c8ff]">Verifiable Credential?</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">The building blocks of self-sovereign identity. How VCs work, the W3C standard, and why they matter.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/what-is-verifiable-credential" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/what-is-did-decentralized-identifiers" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is a DID?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Decentralized Identifiers →</p></Link>
            <Link href="/blog/web3-identity-explained-blockchain" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Web3 Identity Explained</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">5-layer stack →</p></Link>
            <Link href="/glossary" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Glossary</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">30+ terms →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const STANDARDS = [
  { org: "W3C", name: "DID Core 1.0", status: "Recommendation (2022)", desc: "Defines Decentralized Identifiers — globally unique, resolvable, user-controlled identifiers. The foundation of SSI." },
  { org: "W3C", name: "VC Data Model 2.0", status: "Candidate Recommendation", desc: "Verifiable Credentials — cryptographically signed claims. Enables selective disclosure and privacy-preserving verification." },
  { org: "ISO", name: "18013-5 (mDL)", status: "Published (2021)", desc: "Mobile Driver's License standard. ISO's entry into digital identity. Being adopted by US states and EU countries." },
  { org: "IETF", name: "SATP v1.0", status: "Draft", desc: "Sovereign Autonomous Trust Protocol — decentralized identity for autonomous machines and AI agents." },
  { org: "IETF", name: "SVTP v1.0", status: "Draft", desc: "Sovereign Verification & Trust Protocol — closely related to SATP, focused on verification." },
  { org: "EU", name: "eIDAS 2.0", status: "Enacted (2024)", desc: "Mandates SSI-compatible digital identity wallets for 450M EU citizens by 2027. The largest identity infrastructure deployment in history." },
  { org: "FATF", name: "Virtual Asset Guidance", status: "Updated (2025)", desc: "Exploring decentralized identity for AML/KYC compliance in crypto. Signals regulatory acceptance of SSI." },
  { org: "MyShape", name: "Motion-Signature Protocol", status: "Genesis (2026)", desc: "The first standard for Proof of Continuity — verifying not just who you are, but that you are continuously present." },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-12"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 020</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div><h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight">Digital Identity<br /><span className="text-[#90c8ff]">Standards 2026</span></h1><p className="text-white/35 text-[11px] tracking-[0.08em] leading-relaxed max-w-2xl">A complete map: W3C, ISO, IETF, eIDAS — how they fit together and what they mean for the future of identity.</p></div>
          <div className="overflow-x-auto mb-16"><table className="w-full text-[10px] tracking-[0.04em] border-collapse"><thead><tr className="border-b border-[#90c8ff]/10 text-left"><th className="py-3 px-3 text-[#90c8ff]/50 uppercase tracking-[0.12em] text-[10px]">Organization</th><th className="py-3 px-3 text-[#90c8ff]/50 uppercase tracking-[0.12em] text-[10px]">Standard</th><th className="py-3 px-3 text-[#90c8ff]/50 uppercase tracking-[0.12em] text-[10px]">Status</th><th className="py-3 px-3 text-[#90c8ff]/50 uppercase tracking-[0.12em] text-[10px]">Description</th></tr></thead><tbody>{STANDARDS.map(s=>(<tr key={s.name} className="border-b border-white/[0.03] hover:bg-white/[0.01]"><td className="py-3 px-3 text-[#90c8ff]/40 font-bold text-[9px]">{s.org}</td><td className="py-3 px-3 text-white/60 text-[10px]">{s.name}</td><td className="py-3 px-3 text-white/25 text-[9px]">{s.status}</td><td className="py-3 px-3 text-white/35 text-[10px] leading-relaxed">{s.desc}</td></tr>))}</tbody></table></div>
          <div className="text-white/45 text-[12px] leading-relaxed tracking-[0.05em] space-y-4 max-w-3xl"><p>These standards are not competing. They form a layered architecture: W3C DIDs provide the identifier layer. VC Data Model provides the credential layer. ISO 18013-5 bridges physical and digital credentials. IETF SATP/SVTP extend identity to autonomous machines. eIDAS 2.0 provides the regulatory framework for deployment at continental scale.</p><p>MyShape Protocol fits into this architecture as a new category: proof of continuity. No existing standard addresses the temporal dimension of identity — verifying that a subject has maintained unbroken sovereignty across time. As the standards landscape matures, continuity will become a recognized layer alongside identification, authentication, and credential verification.</p></div>
          <PostNavigation slug="/blog/digital-identity-standards-2026" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/what-is-did-decentralized-identifiers" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is a DID?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Decentralized Identifiers →</p></Link>
            <Link href="/blog/kyc-vs-decentralized-identity" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">KYC vs Decentralized Identity</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Why documents fail →</p></Link>
            <Link href="/glossary" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Glossary</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">30+ terms →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

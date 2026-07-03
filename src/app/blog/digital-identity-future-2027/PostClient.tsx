"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  { id: "trends", heading: "Five Trends Reshaping Digital Identity",
    content: `1. SSI Goes Mainstream\nThe EU's eIDAS 2.0 mandates SSI-compatible digital identity wallets for 450 million citizens by 2027. This is the single largest identity infrastructure deployment in history. SSI moves from crypto-native experiment to regulated infrastructure. Every identity startup will either be SSI-compatible or irrelevant.\n\n2. AI Agents Demand Identity\nBy mid-2027, autonomous AI agents will execute more on-chain transactions than humans. These agents need identity — not as legal entities, but as cryptographic primitives. Agent identity requires: provenance (who deployed this agent?), continuity (has it operated under unbroken sovereign control?), and binding (which human authorizes this agent's actions?).\n\n3. Biometrics Collapse\nEvery major biometric database has been breached at least once. Deepfakes defeat commercial liveness detection at >95% success rates. Insurers are beginning to exclude biometric breach liability. The post-biometric transition accelerates — organizations move to generative, physics-anchored verification signals that cannot be replayed if compromised.\n\n4. Continuity Becomes a First-Class Primitive\nIdentity proves who you are. Continuity proves you are still you. As credential transfer, agent impersonation, and deepfake fraud explode, the market demands the missing layer. Proof of Continuity moves from research concept to deployed infrastructure.\n\n5. Human-AI Coexistence Becomes Standard\nThe identity layer stops treating "human" and "AI" as separate categories and starts treating them as nodes in a shared identity mesh. Human nodes prove presence through motion-signature. AI nodes prove provenance through cryptographic declaration. Both coexist, interact, and verify each other in one protocol.` },
  { id: "winners", heading: "Who Wins in 2027",
    content: `The identity protocols that win in 2027 will not be the ones with the best credential format or the fastest ZK circuit. They will be the ones that solve the structural problem that no one solved before: continuity.\n\nSSI solved credential portability. ZK solved privacy-preserving verification. PoP solved unique personhood. The remaining unsolved problem — the one that will define the 2027 landscape — is proof of continuity.\n\nMyShape is building that layer. Not as a feature bolted onto an existing identity protocol. As a first-class primitive designed from first principles for the Agent Economy.\n\nThe Genesis Cohort — 100 founding nodes — is onboarding now. In 2027, those 100 nodes will be the root entropy source for a protocol that verifies not just who you are, but that you continue to be you. Permanent tier. Never offered again.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase"><span>GENESIS 012</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">Digital Identity<br /><span className="text-[#90c8ff]">Future 2027</span></h1><p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">Five trends reshaping the identity layer. Biometrics collapse. AI agents demand identity. Continuity becomes the new primitive.</p></div>
          <div className="space-y-20">{SECTIONS.map(s => (<section key={s.id} id={s.id}><h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/the-post-biometric-era-2026" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">The Post-Biometric Era</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">Why we stop scanning faces →</p></Link>
            <Link href="/blog/ai-agent-identity-how-autonomous-agents-prove-who-they-are" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">AI Agent Identity</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">How agents prove who they are →</p></Link>
            <Link href="/compare" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">Protocol Comparison</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">MyShape vs competitors →</p></Link>
          </div></div>
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4"><p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">The Future Is Being Built Now</p><div className="flex justify-center gap-4 pt-2"><Link href="/genesis" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">Genesis →</Link><Link href="/motion-demo" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">Motion Demo →</Link></div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors">← Protocol Log</Link></div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

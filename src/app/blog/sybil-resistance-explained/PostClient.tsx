"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "what-is-sybil", heading: "What Is a Sybil Attack?",
    content: `A Sybil attack is when one entity creates many fake identities to subvert a system that assumes each identity is a unique person. Named after the book "Sybil" about a woman with multiple personalities, the attack is as old as the internet — and remains the single hardest problem in online identity.\n\nExamples: one person creating 10,000 wallets to claim an airdrop meant for unique users. A competitor flooding a DAO with fake members to win governance votes. A bot farm generating fake reviews to manipulate a product's rating. A state actor creating millions of social media accounts to influence elections.\n\nThe core challenge: in a digital system, the marginal cost of creating a new identity is near zero. Without a way to tie digital identities to unique physical humans, every system that assumes "one identity = one person" is vulnerable.` },
  { id: "approaches", heading: "Every Sybil Resistance Approach, Ranked",
    content: `TIER 1 — WEAK\nCAPTCHA: AI solves at 96% accuracy. Cost to defeat: $0.0001/account.\nIP-based rate limiting: VPNs and proxies make this trivially bypassable.\nPhone verification: virtual numbers cost $0.05. SIM-swap attacks bypass SMS verification.\n\nTIER 2 — MODERATE\nEmail domain reputation: flags disposable email domains. Useful as a first filter, not sufficient alone.\nSocial graph analysis (BrightID): verifies uniqueness through mutual connections. Resistant to isolated bots, vulnerable to coordinated social graph attacks.\nStaking/Deposit: requires economic commitment ($10-100). Raises the cost of attack but does not prevent wealthy attackers.\n\nTIER 3 — STRONG\nBiometric Proof of Personhood (Worldcoin): iris scan via hardware Orb. 18M+ verified. Strongest deployed solution. Weakness: requires specialized hardware and iris is irreplaceable if compromised.\nMulti-stamp aggregation (Gitcoin Passport): combines biometric, social, financial, and behavioral stamps into a single personhood score. The more stamps required, the harder to Sybil.\n\nTIER 4 — EMERGING\nProof of Continuity (MyShape): instead of proving uniqueness at enrollment, proves continuous human presence across time. A Sybil attacker would need 10,000 unique human bodies performing motion-signature verifications daily — economically infeasible. Continuity makes Sybil attacks exponentially more expensive than any snapshot-based approach.\n\nThe most effective Sybil resistance in 2026 is layered: Proof of Personhood (uniqueness) + Proof of Continuity (persistence). Either alone is vulnerable. Together, they are the strongest anti-Sybil defense available.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 018</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>Sybil Resistance<br /><span className="text-[#90c8ff]">Explained</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">Why one person one vote is hard online. Every approach to preventing Sybil attacks, ranked from weakest to strongest.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/sybil-resistance-explained" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/proof-of-personhood-vs-proof-of-continuity" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">PoP vs PoC</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Two problems, two protocols →</p></Link>
            <Link href="/blog/how-to-verify-human-online-2026" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">How to Verify a Human Online</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Complete 2026 guide →</p></Link>
            <Link href="/compare" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Comparison</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">MyShape vs competitors →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

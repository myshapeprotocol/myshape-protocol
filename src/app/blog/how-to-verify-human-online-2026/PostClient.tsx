"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "the-problem", heading: "The Problem: Bots Are Winning",
    content: `In 2026, the cost to deploy a bot that can pass a CAPTCHA, create an account, post content, vote in a poll, and mimic human behavior is approximately $0.003 per bot per month. A motivated attacker can field 100,000 bots for $300.\n\nMeanwhile, the cost of a false positive — letting a bot pass as human — keeps rising. A Sybil attack on a DAO vote redirects millions in treasury funds. A bot farm claiming an airdrop dilutes real users to worthlessness. An AI agent executing trades without human continuity can drain a liquidity pool.\n\nVerifying that an online entity is human — not just "has a valid password," not just "passed a CAPTCHA," but "is a continuously present human" — is the single most important unsolved problem in digital infrastructure. This guide covers every method available in 2026, ranked from weakest to strongest.` },
  { id: "tier-list", heading: "The Verification Tier List",
    content: `TIER 1 — TRIVIALLY DEFEATED\n\nCAPTCHA / reCAPTCHA: AI solves CAPTCHAs faster and more accurately than humans. GPT-5 achieves 96% accuracy on reCAPTCHA v3. Cost to defeat: $0.0001/attempt.\n\nEmail Verification: proves access to an inbox, not humanity. Gmail accounts cost $0.10 on darknet markets.\n\nPhone Verification: SIM-swap attacks, virtual numbers, and SMS interception make phone verification a speed bump, not a security control.\n\nTIER 2 — MODERATELY RESISTANT\n\nKnowledge-Based Authentication (KBA): "What was your first pet's name?" — answers are scrapable from social media or purchasable from data brokers.\n\nSocial Graph Verification (BrightID): requires building a web of verified human connections. Resistant to isolated bots but vulnerable to coordinated social graph attacks.\n\nTIER 3 — STRONG BUT FLAWED\n\nBiometric Liveness Detection: checks for "liveness" in a face scan — blinking, head movement, texture analysis. Defeated by real-time deepfake video at >95% success rates. The fundamental flaw: it verifies that a face looks alive, not that the face belongs to the person operating the device.\n\nProof of Personhood (Worldcoin/World): verifies unique human iris via hardware Orb. Strong against Sybil attacks. Weakness: iris is static and irreplaceable if compromised; requires specialized hardware; does not verify continuity.\n\nTIER 4 — THE STRONGEST\n\nMotion-Signature Verification (MyShape): verifies the continuous presence of a human through real-time motion analysis. Each verification is a fresh performance, not a replayed biometric. The entropy characteristics of human motion are mathematically impossible for AI to forge. No hardware required. No biometric data stored. Pure zero-knowledge proof.\n\nProof of Continuity: not just "are you human?" but "are you still the same human?" The missing layer that makes every other verification method stronger.` },
  { id: "how-to-choose", heading: "How to Choose the Right Method",
    content: `The right verification method depends on your threat model:\n\nFor a blog comment section: email verification is sufficient. The cost of a false positive is a spam comment.\n\nFor a token airdrop: you need Proof of Personhood. Email verification alone will be Sybil-attacked if the airdrop value exceeds the cost of buying accounts (~$0.10/account).\n\nFor a DAO governance vote: you need Proof of Personhood + Proof of Continuity. Ensure (a) each vote is from a unique human and (b) each human has maintained continuous sovereign control of their identity — preventing credential transfer attacks.\n\nFor a DeFi protocol with autonomous agents: you need the full stack — DID for identification, VC for claims, PoP for uniqueness, and PoC for continuity. The combination of all four provides defense-in-depth against every known attack vector.\n\nThe tier list above is not static. AI capabilities improve monthly. A method that is "moderately resistant" today may be "trivially defeated" in six months. Choose methods whose security properties are rooted in physics, not heuristics. Motion is the only signal that meets this bar.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 014</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>How to Verify<br /><span className="text-[#90c8ff]">a Human Online</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">The complete 2026 guide. Every method ranked by security, privacy, and AI-resistance. For developers, founders, and security engineers.</p></div>
          <div className="space-y-20">{SECTIONS.map(s => (<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/how-to-verify-human-online-2026" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/proof-of-personhood-vs-proof-of-continuity" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">PoP vs PoC</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Two problems, two protocols →</p></Link>
            <Link href="/blog/what-is-decentralized-identity-2026" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Decentralized Identity?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">2026 guide to DID, SSI →</p></Link>
            <Link href="/compare" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Comparison</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">MyShape vs competitors →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

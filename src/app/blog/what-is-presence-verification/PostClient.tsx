"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  { id: "history", heading: "A 500-Year History of Presence Verification",
    content: `1500s: Wax seals. A physical imprint proved the sender was present when the document was sealed. Forgeable with sufficient skill.\n\n1800s: Handwritten signatures. A unique motor pattern, hard to replicate perfectly. Still used today, but AI can now forge signatures from a single sample.\n\n1960s: Passwords. Something you know. Proves knowledge, not presence. Stealable, guessable, phishable.\n\n1990s: Biometrics. Fingerprints, face scans, iris patterns. Something you are. Unforgeable for decades — until AI caught up. Now deepfakes defeat them at >95% success rates.\n\n2000s: CAPTCHAs. Completely Automated Public Turing test. Proves you can solve a puzzle. AI now solves them faster than humans.\n\n2010s: Hardware tokens (YubiKey), TOTP (Google Authenticator). Something you have. Proves possession, not presence. Lose the device, lose the proof.\n\n2020s: Liveness detection. Checks for blinking, head movement, texture. Proves a face is alive. But AI-generated real-time video passes these checks now.\n\n2026: Motion-signature verification. Proves a human is physically present and generating authentic motion — not through a snapshot, but through a continuous performance. The first presence verification method rooted in physics, not heuristics. AI cannot forge the entropy characteristics of biological motion.` },
  { id: "future", heading: "The Future: Continuous Presence",
    content: `The next evolution is not "prove you are present at login" but "prove you are continuously present." This is the shift from authentication to continuity.\n\nAuthentication verifies a moment. Continuity verifies a trajectory. An authenticated session tells you the user logged in at 9:00 AM. A continuity chain tells you the same human has been present continuously from 9:00 AM to 5:00 PM — through periodic motion-signature verifications that AI cannot forge and that cannot be replayed.\n\nMyShape Protocol is building this future. Not another CAPTCHA. Not another biometric. A primitive that verifies what actually matters: continuous, authentic human presence.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase"><span>GENESIS 019</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">What Is<br /><span className="text-[#90c8ff]">Presence Verification?</span></h1><p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">The 500-year history of proving someone is really there — and why 2026 changes everything.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/how-to-verify-human-online-2026" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">How to Verify a Human Online</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">Complete 2026 guide →</p></Link>
            <Link href="/blog/what-is-proof-of-continuity" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">What Is Proof of Continuity?</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">The missing primitive →</p></Link>
            <Link href="/motion-demo" onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/50 text-[10px] tracking-[0.1em]">Motion Demo</p><p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">Experience presence →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

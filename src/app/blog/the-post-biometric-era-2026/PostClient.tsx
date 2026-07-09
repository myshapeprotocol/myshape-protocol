"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "the-breach", heading: "The Largest Unchangeable Password Database in History",
    content: `A password can be changed. A private key can be rotated. A biometric cannot.\n\nYour face. Your fingerprint. Your iris pattern. These are static biological facts — permanent, irreplaceable, and increasingly compromised. We have built the largest unchangeable password database in history, and it is leaking.\n\nThe 2015 OPM breach: 5.6 million federal employee fingerprints stolen. The 2019 Suprema breach: 1 million+ fingerprint and facial recognition records exposed. The 2023 23andMe breach: genetic data of 6.9 million users accessed. The 2024 National Public Data breach: 2.9 billion records including biometric identifiers.\n\nEach breach is permanent. You cannot rotate your fingerprints. You cannot issue a new iris. You cannot "reset your face." Once a biometric is compromised, it is compromised forever — and every system that relies on that biometric is now vulnerable to replay attacks.\n\nWe are approaching the point where every major biometric database has been breached at least once. When that happens — and it will — biometric authentication becomes not just unreliable but actively dangerous. A compromised password can be changed. A compromised biometric means the victim can never use biometric authentication again.` },
  { id: "deepfake", heading: "Deepfakes Made Biometrics Obsolete",
    content: `Even if biometric databases were secure (they are not), generative AI has made static biometric verification trivially defeatable.\n\nIn 2024, researchers demonstrated real-time facial reenactment that defeats commercial liveness detection with >95% success rates. In 2025, voice cloning reached the point where 3 seconds of audio is sufficient to defeat voice authentication systems. In 2026, AI-generated video can produce a real-time, interactive deepfake that passes video KYC checks — the "selfie with ID document" verification used by banks, exchanges, and fintech platforms worldwide.\n\nThe arms race is over. AI won.\n\nBiometric liveness detection — the technology that tries to distinguish a real face from a photo or video — was designed to defeat Presentation Attacks: holding up a printed photo, playing a pre-recorded video, wearing a silicone mask. It was never designed to defeat a real-time AI-generated video stream that responds to challenge prompts, blinks on command, and turns its head when asked.\n\nEvery static biometric verification system deployed today is vulnerable to AI-generated impersonation. Not in theory. In practice. Right now.` },
  { id: "post-biometric", heading: "What Post-Biometric Identity Looks Like",
    content: `The post-biometric era does not mean "no more identity verification." It means identity verification that does not depend on static biological facts.\n\nThree characteristics define post-biometric identity:\n\n1. Generative, Not Static\nA post-biometric signal is different every time. It cannot be replayed because each verification is a fresh performance. Motion is the canonical example: your movement pattern today is measurably different from yesterday — subtly, irreducibly different — in ways that AI cannot predict.\n\n2. On-Device, Not In-Database\nThe signal is processed locally and never stored centrally. There is no "motion database" to breach because raw motion data never leaves the device. Only a cryptographic proof — a zero-knowledge attestation that the motion was authentically human — is transmitted.\n\n3. Physics-Anchored, Not Data-Anchored\nThe signal is rooted in the physics of a living body, not in a stored data record. The entropy of human motion — micro-timing variance, physiological tremor, motor unit recruitment stochasticity — is a physical phenomenon that cannot be simulated at the resolution required to pass verification. This is not a heuristic. It is a mathematical consequence of the entropy gap theorem.\n\nMyShape Protocol is the first complete implementation of post-biometric identity. The motion-signature engine runs on-device. The PES engine quantifies biological entropy. The ZK-Presence proof confirms humanity without revealing identity. No biometric data. No central database. No replayable signal.` },
  { id: "transition", heading: "The Transition Has Already Begun",
    content: `Three forces are driving the transition to post-biometric identity faster than most people realize:\n\nRegulatory pressure. The EU AI Act classifies biometric categorization as "high-risk" and restricts real-time biometric identification in public spaces. India's Supreme Court ruled that biometric identity (Aadhaar) cannot be mandatory for services. California's BIPA (Biometric Information Privacy Act) has generated billions in settlements. The legal environment for biometric collection is deteriorating rapidly.\n\nEconomic pressure. Biometric breaches are expensive. The average cost of a data breach involving biometric data is 40% higher than one involving passwords or tokens — because biometrics cannot be reset. Organizations that move to post-biometric verification eliminate this liability entirely.\n\nTechnology readiness. The pieces are in place: on-device ML (MediaPipe, CoreML), zero-knowledge proofs (ZK-SNARKs/STARKs), and motion analysis algorithms that can distinguish human from AI with >99% accuracy. The post-biometric era is not waiting for a breakthrough. It is waiting for adoption.\n\nThe question is not whether we will stop scanning faces. The question is which organizations will lead the transition — and which will be the last ones holding a database of irreplaceable, already-compromised biometric data when the music stops.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase"><span>GENESIS 011</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/25">The Continuity Lab</span></div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>The<br /><span className="text-[#90c8ff]">Post-Biometric Era</span></h1>
            <p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">Why 2026 is the year we stop scanning faces. Biometrics created the largest unchangeable password database in history. The post-biometric era begins now.</p>
          </div>
          <div className="space-y-20">
            {SECTIONS.map(s => (<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}
          </div>
          <PostNavigation slug="/blog/the-post-biometric-era-2026" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/38 text-[10px] tracking-[0.2em] uppercase text-center">Continue Reading</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Link href="/blog/motion-vs-biometrics-why-your-face-is-not-a-password" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Motion vs Biometrics</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">Why your face is not a password →</p></Link>
              <Link href="/blog/what-is-proof-of-continuity" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Proof of Continuity?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">The missing primitive →</p></Link>
              <Link href="/compare" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Comparison</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">MyShape vs competitors →</p></Link>
            </div>
          </div>
          <div className="mt-12 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4"><p className="text-white/55 text-[13px] tracking-[0.1em] uppercase">Experience Post-Biometric Identity</p><div className="flex justify-center gap-4 pt-2"><Link href="/motion-demo" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/65 text-[10px] tracking-[0.18em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">Motion Demo →</Link><Link href="/genesis" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/50 text-[10px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">Genesis →</Link></div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

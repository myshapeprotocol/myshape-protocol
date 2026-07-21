"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "problem", heading: "The Password Problem",
    content: `Passwords are the weakest link in digital security. 80% of all data breaches involve compromised or weak passwords (Verizon DBIR 2025). The average user manages 100+ passwords across services — an impossible cognitive load that leads to password reuse, weak credentials, and phishing susceptibility.\n\nFour structural flaws make passwords fundamentally broken:\n\n1. Shared secrets: the server stores a copy of your password (hashed or not). Every database becomes a target. If the server is breached, your password is exposed.\n\n2. Human memorability: strong passwords are hard to remember. Memorable passwords are weak. The tension between security and usability is unsolvable within the password model.\n\n3. Phishing surface: passwords are bearer tokens. Anyone who knows the string can impersonate you. A convincing fake login page extracts the secret directly.\n\n4. No cryptographic binding: a password proves you know a string, not that you are you. There is no binding between the credential and the human presenting it.\n\nThese are not implementation flaws. They are architectural flaws. Passwords cannot be fixed — they must be replaced.` },
  { id: "passkeys", heading: "The Rise of Passkeys — FIDO2 and WebAuthn",
    content: `Passkeys are the W3C/FIDO Alliance standard for passwordless authentication, built on public-key cryptography. Instead of a shared secret, a passkey generates a key pair: a private key that stays on your device (secured by biometrics or PIN), and a public key registered with the service.\n\nHow it works:\n\n1. Registration: your device creates a unique key pair for each service. The public key is sent to the service. The private key never leaves your device.\n\n2. Authentication: the service sends a challenge. Your device signs it with the private key (unlocked by your fingerprint, face, or PIN). The service verifies the signature against the stored public key.\n\n3. No shared secrets: the service never sees your private key. A breach of the service's database reveals only public keys — useless to an attacker.\n\n4. Phishing-resistant: the browser enforces origin binding. Your device will only sign a challenge from the real service domain. A fake login page cannot intercept the credential.\n\nMajor platforms — Apple, Google, Microsoft — now support passkeys natively. In 2026, passkey adoption has crossed 50% of consumer services and is the default authentication method for new applications.` },
  { id: "beyond", heading: "Beyond Passkeys — What Still Needs Solving",
    content: `Passkeys solve the credential problem. But authentication is only one layer of identity. Three gaps remain:\n\n1. Continuity: a passkey proves a device is present. It does not prove the same human is behind the device. Session hijacking, device sharing, and coercion remain unsolved.\n\n2. Recovery: losing all enrolled devices means losing access to all passkey-protected accounts. Recovery mechanisms (email codes, social recovery) reintroduce the weak-link problem passkeys aimed to eliminate.\n\n3. Portable identity: passkeys are per-service. Your identity at Service A has no connection to your identity at Service B. There is no cross-service reputation, no portable trust, no sovereign identity layer.\n\nMyShape Protocol addresses these gaps: motion-signature verification for continuity (proving the same human is present), continuity receipts for privacy-preserving verification, and a sovereign identity mesh that spans services without central authority. Passkeys authenticate the device. Motion-signature authenticates the human.` },
];

const RELATED_POSTS = [
  { href: "/blog/what-is-verifiable-credential", title: "What Is a VC?", desc: "Verifiable Credentials →" },
  { href: "/blog/what-is-did-decentralized-identifiers", title: "What Is a DID?", desc: "Decentralized Identifiers →" },
  { href: "/blog/web3-identity-explained-blockchain", title: "Web3 Identity", desc: "5-layer stack →" },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader /><main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{paddingTop:"8rem",paddingBottom:"6rem"}}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase"><span>GENESIS 022</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/40">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>Why Passwords<br /><span className="text-[#90c8ff]">Are Broken</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">The end of "something you know." Why passwords fail and what post-password authentication looks like in 2026.</p></div>
          <div className="space-y-20">{SECTIONS.map(s=>(<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[15px] sm:text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/why-passwords-are-broken" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" /><div className="space-y-4"><p className="text-white/38 text-[11px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RELATED_POSTS.map(p => (
              <Link key={p.href} href={p.href} onMouseEnter={()=>playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">{p.title}</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">{p.desc}</p></Link>
            ))}
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main><ProtocolFooter /></div>);}

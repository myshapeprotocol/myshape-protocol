"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import PostNavigation from "@/components/blog/PostNavigation";

const SECTIONS = [
  { id: "web2-vs-web3", heading: "Web2 Identity vs Web3 Identity",
    content: `Web2 identity is a row in someone else's database. Your Google account is Google's property. Your Twitter handle is Twitter's property. If the platform bans you, deplatforms you, or gets acquired, your identity evaporates.\n\nWeb3 identity inverts this relationship. You generate your identity locally (a cryptographic key pair). You control which attributes to share. You prove claims about yourself without a centralized authority. The identity is portable — it travels with you across chains, protocols, and platforms.\n\nThe difference is ownership. Web2 identity: you are a tenant. Web3 identity: you are the landlord.\n\nBut Web3 identity is not just "connect your wallet." That's authentication — proving you control a private key. Identity is richer: it includes reputation, credentials, memberships, verification status, and — critically — continuity. Your wallet address is a pseudonym, not an identity. Web3 identity infrastructure is building the layers that turn pseudonyms into sovereign identities.` },
  { id: "layers", heading: "The Web3 Identity Stack",
    content: `Web3 identity is not a single protocol. It is a stack of composable layers:\n\nLayer 1 — Key Management: your private key is the root of your digital identity. Wallets (MetaMask, Rainbow, Phantom) manage keys. MPC wallets (Fireblocks, Privy) enable social recovery. Passkeys (WebAuthn) bridge Web2 and Web3.\n\nLayer 2 — Decentralized Identifiers (DIDs): a globally unique, resolvable identifier that you create and control. did:ethr anchors to Ethereum. did:key is lightweight and self-contained. did:indy is privacy-preserving with continuity receipts. DIDs are the "username" layer of Web3.\n\nLayer 3 — Verifiable Credentials (VCs): cryptographically signed claims. A university issues a degree VC. A government issues an ID VC. You present these to verifiers without contacting the issuer. Selective disclosure proves "I am over 21" without revealing your birth date.\n\nLayer 4 — Proof of Personhood: verifies you are a unique human. Worldcoin uses iris biometrics. BrightID uses social graphs. Gitcoin Passport aggregates multiple stamps. Essential for Sybil resistance in airdrops, DAOs, and quadratic funding.\n\nLayer 5 — Proof of Continuity (emerging): verifies you are still the same human. MyShape Protocol anchors identity in motion-signature — a signal that AI cannot forge and that cannot be transferred. The missing layer that makes the entire stack stronger.\n\nEach layer builds on the one below it. A DID without a VC is a username without credentials. A VC without PoP is a credential that could belong to a bot. PoP without PoC is a personhood proof that could be transferred. The full stack provides defense-in-depth.` },
  { id: "why-matters", heading: "Why Web3 Identity Matters Now",
    content: `Three forces make Web3 identity the most important infrastructure build of 2026:\n\neIDAS 2.0: the EU mandates SSI-compatible digital identity wallets for 450 million citizens by 2027. Web3 identity infrastructure is being deployed at continental scale.\n\nAgent Economy: autonomous AI agents executing transactions on behalf of humans need cryptographic identity — provenance, continuity, and binding. Web2 identity (OAuth, SAML) was not designed for non-human actors.\n\nAI Impersonation: generative AI defeats static identity verification. The Web3 stack — with ZK proofs and motion-signature — provides defense against AI impersonation that Web2 identity cannot match.\n\nWeb3 identity is not a niche crypto experiment. It is the identity infrastructure for the next billion digital subjects — human and AI alike.` },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative"><BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-16"><div className="flex items-center gap-4 text-[#90c8ff]/50 text-[11px] tracking-[0.3em] uppercase"><span>GENESIS 015</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026.07.03</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/40">The Continuity Lab</span></div><h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>Web3 Identity<br /><span className="text-[#90c8ff]">Explained</span></h1><p className="text-white/50 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">What blockchain changes about who you are online. Sovereign, portable, verifiable — without intermediaries.</p></div>
          <div className="space-y-20">{SECTIONS.map(s => (<section key={s.id} id={s.id}><h2 className="text-white/65 text-[12px] tracking-[0.2em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />{s.heading}</h2><div className="text-white/55 text-[15px] sm:text-[17px] leading-[1.85] tracking-[0.03em] space-y-5 whitespace-pre-line">{s.content}</div></section>))}</div>
          <PostNavigation slug="/blog/web3-identity-explained-blockchain" />

          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />
          <div className="space-y-4"><p className="text-white/38 text-[11px] tracking-[0.2em] uppercase text-center">Continue Reading</p><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/blog/what-is-decentralized-identity-2026" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">What Is Decentralized Identity?</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">2026 guide to DID, SSI →</p></Link>
            <Link href="/blog/self-sovereign-identity-explained-2026" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Self-Sovereign Identity Explained</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">What SSI delivers in 2026 →</p></Link>
            <Link href="/glossary" onMouseEnter={() => playTick(700,"sine",0.08,0.02)} className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"><p className="text-white/55 text-[12px] tracking-[0.08em]">Protocol Glossary</p><p className="text-white/38 text-[11px] tracking-[0.06em] mt-1">30+ defined terms →</p></Link>
          </div></div>
          <div className="mt-12 text-center"><Link href="/blog" className="text-white/30 text-[11px] tracking-[0.18em] uppercase hover:text-white/55 transition-colors">← Protocol Log</Link></div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";
import "./compare.css";

interface ComparisonRow { dimension: string; myShape: string; worldcoin: string; civic: string; trip: string; }

const COMPARISON_DATA: ComparisonRow[] = [
  { dimension: "Verification Method", myShape: "Dynamic motion-signature (128-dim vector)", worldcoin: "Static iris static-recognition (Orb hardware)", civic: "Document/credential verification", trip: "Motion-based post-static-recognition attestation" },
  { dimension: "Hardware Required", myShape: "Standard RGB camera (webcam/phone)", worldcoin: "Custom Orb device ($5K+)", civic: "None (document upload)", trip: "Standard RGB camera" },
  { dimension: "Data Storage", myShape: "Zero-knowledge — raw data never leaves device", worldcoin: "Iris hash stored on-chain", civic: "Encrypted PII with third-party verifiers", trip: "Device-local with remote attestation" },
  { dimension: "Irreplaceability", myShape: "Motion is generative — infinite fresh proofs", worldcoin: "Iris is static — cannot be replaced if compromised", civic: "Documents can be reissued", trip: "Motion is generative — similar to MyShape" },
  { dimension: "AI Forgery Resistance", myShape: "Proven via Entropy Gap Theorem (4D analysis)", worldcoin: "Hardware-level (Orb) + liveness detection", civic: "Depends on document issuer security", trip: "Theoretical framework; limited published benchmarks" },
  { dimension: "Privacy Model", myShape: "Continuity — verify human without identifying who", worldcoin: "ZK identity — verify uniqueness without revealing iris", civic: "Selective disclosure of credentials", trip: "ZK attestation with reputation scoring" },
  { dimension: "Agent Identity Support", myShape: "Native Agent Declaration protocol (human + AI coexistence)", worldcoin: "Human-only (proof of personhood)", civic: "Human-only (credential-based)", trip: "Human-focused with agent interaction model" },
  { dimension: "Protocol Maturity", myShape: "Genesis phase — 100-node cohort ongoing", worldcoin: "Production — 18M+ verified users", civic: "Production — enterprise KYC/AML", trip: "IETF draft stage — pre-production" },
  { dimension: "Open Source", myShape: "Core protocol open; WASM engine source available", worldcoin: "Orb hardware proprietary; SDK open", civic: "Partial — verification layer open", trip: "Specification open; implementation partial" },
  { dimension: "Token / Incentive", myShape: "None — protocol-native identity only", worldcoin: "WLD token + UBI distribution", civic: "CVC token (governance + settlement)", trip: "None — protocol only" },
  { dimension: "Decentralization", myShape: "Fully sovereign — user owns Data-Body", worldcoin: "Foundation-governed; Orb operators centralized", civic: "Federated — verifier network with centralized governance", trip: "Specification-level decentralization; implementation TBD" },
  { dimension: "Continuity Model", myShape: "Core primitive — verifies trajectory across time", worldcoin: "One-time proof of unique personhood", civic: "Per-transaction credential verification", trip: "Session-based continuity with reputation chaining" },
];

const CATEGORIES = [
  { title: "The Core Difference", paragraphs: ["MyShape Protocol is a continuity layer, not an identity layer. While Worldcoin, Civic, and SpruceID answer 'who are you?', MyShape answers 'are you still you?' — a fundamentally different question that becomes critical in the age of AI agents.", "Worldcoin proves you are a unique human (once). Civic proves you possess a valid credential (per-transaction). MyShape proves your trajectory is continuous and unforgeable (continuously). This distinction is not semantic — it is the difference between a passport photo and a live heartbeat."] },
  { title: "Why Motion Over Static Recognition", paragraphs: ["Static recognition techniques (iris, fingerprint, face) are fundamentally limited: once compromised, they cannot be replaced. Your iris is your iris forever. Motion is generative — each verification produces a fresh, non-replayable cryptographic proof. Even if one motion-signature is intercepted, it cannot be replayed because the protocol enforces temporal uniqueness.", "Furthermore, motion encodes intent. A face scan proves a face was present. A motion-signature proves a specific intentional movement was executed. This intentionality gap is what separates MyShape from all static-recognition approaches."] },
  { title: "The Agent Economy Is Coming", paragraphs: ["Worldcoin, Civic, and most identity protocols are designed for a world where the primary digital actor is human. But the Agent Economy is already here — autonomous AI agents executing transactions, voting in DAOs, and managing digital assets on behalf of humans.", "MyShape is the only protocol in this comparison that natively supports both human presence verification AND AI agent identity declaration in a unified identity mesh. Human agents and AI agents coexist, interact, and verify each other through the same protocol — with the irreducible entropy gap ensuring that AI cannot impersonate human presence."] },
];

export default function CompareClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[11px] tracking-[0.3em] uppercase"><span>PROTOCOL ANALYSIS</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>2026</span></div>
            <h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight">Identity Protocol<br /><span className="text-[#90c8ff]">Comparison Matrix</span></h1>
            <p className="text-white/35 text-[11px] tracking-[0.08em] leading-relaxed max-w-2xl">A principled comparison of MyShape Protocol with the leading identity verification systems. Not which protocol claims more — but which protocol protects what matters: your sovereignty, your privacy, and your irreplaceable continuity.</p>
          </div>

          <div className="space-y-16 mb-20">
            {CATEGORIES.map((cat) => (
              <section key={cat.title}>
                <h2 className="cmp-section-title"><span className="cmp-section-accent" />{cat.title}</h2>
                {cat.paragraphs.map((p, i) => (<p key={i} className="cmp-narrative-text">{p}</p>))}
              </section>
            ))}
          </div>

          <section>
            <h2 className="cmp-section-title"><span className="cmp-section-accent" />Detailed Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="cmp-table">
                <thead><tr className="border-b border-[#90c8ff]/10"><th className="cmp-th w-[18%]">Dimension</th><th className="cmp-th cmp-th-myshape w-[20%]">MyShape</th><th className="cmp-th cmp-th-other w-[20%]">Worldcoin</th><th className="cmp-th cmp-th-other w-[20%]">Civic</th><th className="cmp-th cmp-th-other w-[22%]">TRIP Protocol</th></tr></thead>
                <tbody>
                  {COMPARISON_DATA.map((row) => (
                    <tr key={row.dimension} className="cmp-row">
                      <td className="p-3 cmp-dim">{row.dimension}</td>
                      <td className="p-3 cmp-myshape">{row.myShape}</td>
                      <td className="p-3 cmp-other">{row.worldcoin}</td>
                      <td className="p-3 cmp-other">{row.civic}</td>
                      <td className="p-3 cmp-other">{row.trip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-20 cmp-cta space-y-4">
            <p className="text-white/40 text-[11px] tracking-[0.15em] uppercase">The Only Continuity Layer in This Comparison</p>
            <p className="text-white/25 text-[11px] leading-relaxed max-w-lg mx-auto">All four protocols verify identity. Only MyShape verifies continuity. In the Agent Economy, continuity is the primitive that matters. The Genesis Cohort is onboarding now.</p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href="/genesis" className="cmp-cta-btn" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Begin Genesis →</Link>
              <Link href="/whitepaper" className="cmp-cta-btn cmp-cta-btn-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Read Whitepaper →</Link>
            </div>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

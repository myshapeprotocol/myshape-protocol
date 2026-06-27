"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";

interface GenesisStatus {
  total: number;
  remaining: number;
  nodes: Array<{ index: number; id: string; joined: string }>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white/30 text-[11px] tracking-[0.4em] uppercase mb-10 text-center hover:text-cyan-300/50 transition-colors cursor-default"
      onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
      {children}
    </h2>
  );
}

export default function CohortClient() {
  const [status, setStatus] = useState<GenesisStatus | null>(null);

  useEffect(() => {
    fetch("/api/nodes/genesis")
      .then((r) => r.json())
      .then((data) => { if (data.nodes) setStatus(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="text-cyan-500/45 text-[10px] tracking-[0.5em] uppercase mb-6">GENESIS_COHORT // THE_FIRST_100</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] text-white mb-6"
            style={{ textShadow: "0 0 60px rgba(144,200,255,0.25)" }}>
            The Founding Entities
          </h1>
          <p className="text-white/40 text-[13px] leading-relaxed max-w-xl mx-auto">
            Not users. Not accounts. Cryptographic anchors in the protocol&apos;s root entropy source.
            One hundred humans. One Genesis. Permanent tier — never offered again.
          </p>

          {status && (
            <div className="flex items-center justify-center gap-8 mt-10">
              <div className="text-center">
                <div className="text-5xl font-light text-cyan-300/80 font-mono">{status.total}</div>
                <div className="text-white/20 text-[10px] tracking-[0.3em] uppercase mt-2">Claimed</div>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
              <div className="text-center">
                <div className="text-5xl font-light text-white/50 font-mono">{status.remaining}</div>
                <div className="text-white/20 text-[10px] tracking-[0.3em] uppercase mt-2">Remaining</div>
              </div>
            </div>
          )}

          {status && status.nodes.length > 0 && (
            <div className="mt-10 grid grid-cols-3 md:grid-cols-5 gap-2 max-w-lg mx-auto">
              {status.nodes.slice(0, 15).map((n) => (
                <div key={n.index}
                  onMouseEnter={e => { playTick(450, "sine", 0.03, 0.008); e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.08)"; }}
                  className="p-2 border text-[9px] text-white/25 font-mono text-center transition-all cursor-default"
                  style={{ borderColor: "rgba(34,211,238,0.08)", background: "rgba(2,4,10,0.6)" }}>
                  #{n.index}
                </div>
              ))}
              {status.total > 15 && (
                <div className="p-2 border border-cyan-400/[0.04] text-[9px] text-white/15 font-mono text-center flex items-center justify-center">
                  +{status.total - 15}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── WHY GENESIS ── */}
        <section className="mb-24">
          <SectionHeading>The Protocol&apos;s Trust Anchor</SectionHeading>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Entropy Source", desc: "Each Genesis Node injects irreducible biological entropy into the protocol's cryptographic foundation. This is not data storage — it is trust generation at the physics level." },
              { title: "Governance Root", desc: "Genesis Nodes carry permanent protocol-level metadata. Future governance mechanisms read this flag — not a policy document, not a token balance, but a structural fact inscribed at genesis." },
              { title: "Identity Mesh", desc: "The first 100 nodes form the initial identity mesh from which all subsequent ZK-proofs derive statistical significance. Without this root, the protocol has no anchor." },
            ].map((item) => (
              <div key={item.title}
                onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; e.currentTarget.style.background = "rgba(144,200,255,0.02)"; e.currentTarget.querySelector("h3")!.style.color = "rgba(34,211,238,0.9)"; e.currentTarget.querySelector("p")!.style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.08)"; e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector("h3")!.style.color = "rgba(34,211,238,0.55)"; e.currentTarget.querySelector("p")!.style.color = "rgba(255,255,255,0.35)"; }}
                className="p-6 border transition-all duration-500 text-center group"
                style={{ borderColor: "rgba(144,200,255,0.08)", background: "transparent" }}>
                <h3 className="text-cyan-400/55 text-[12px] tracking-[0.2em] uppercase mb-4 font-bold transition-colors">{item.title}</h3>
                <p className="text-white/35 text-[11px] leading-relaxed transition-colors">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE RITUAL ── */}
        <section className="mb-24 text-center">
          <div className="max-w-xl mx-auto p-10 border border-cyan-400/12 bg-cyan-400/[0.02] group transition-all duration-500"
            onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(34,211,238,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.12)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="text-cyan-400/35 text-[10px] tracking-[0.4em] uppercase mb-6">The 40-Second Ritual</div>
            <p className="text-white/45 text-[13px] leading-[1.9] font-light mb-6">
              Genesis initialization is not a sign-up form. It is a 40-second kinetic ceremony in which your
              motion-signature is extracted, encrypted, and permanently inscribed into the protocol&apos;s root
              index. The scan measures entropy, not identity. What it captures cannot be forged, replayed,
              or simulated by any AI.
            </p>
            <div className="text-white/25 text-[10px] tracking-[0.2em] uppercase">
              Email → OTP → Verify → Genesis Node
            </div>
          </div>
        </section>

        {/* ── RIGHTS ── */}
        <section className="mb-24">
          <SectionHeading>Genesis Rights</SectionHeading>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { label: "PERMANENCE", desc: "Your GENESIS_NODE status is immutable. No downgrade, no expiry, no revocation." },
              { label: "EARLY_ACCESS", desc: "All future protocol features, governance mechanisms, and identity primitives ship to Genesis Nodes first." },
              { label: "GOVERNANCE_WEIGHT", desc: "Genesis Nodes receive weighted voting power in protocol governance proposals." },
              { label: "IDENTITY_ANCHOR", desc: "Your initial motion-signature becomes a permanent trust anchor in the protocol's entropy pool." },
              { label: "ORBITAL_EVOLUTION", desc: "Track your node's growth from Awakening to Genesis Sealed — 8 stages of orbital particle evolution." },
              { label: "PROTOCOL_LEGACY", desc: "Your node ID is permanently inscribed in the protocol's root index. A founding entity, forever." },
            ].map((item) => (
              <div key={item.label}
                onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; e.currentTarget.style.background = "rgba(144,200,255,0.02)"; const els = e.currentTarget.querySelectorAll("div,p"); els.forEach(el => { (el as HTMLElement).style.color = el.tagName === "DIV" ? "rgba(34,211,238,0.85)" : "rgba(255,255,255,0.55)"; }); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.06)"; e.currentTarget.style.background = "transparent"; const els = e.currentTarget.querySelectorAll("div,p"); els.forEach(el => { (el as HTMLElement).style.color = el.tagName === "DIV" ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.3)"; }); }}
                className="p-5 border transition-all duration-300 group"
                style={{ borderColor: "rgba(144,200,255,0.06)", background: "transparent" }}>
                <div className="text-cyan-400/50 text-[10px] tracking-[0.25em] uppercase mb-2 font-bold transition-colors">{item.label}</div>
                <p className="text-white/30 text-[10px] leading-relaxed transition-colors">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FUTURE ── */}
        <section className="mb-24">
          <SectionHeading>Genesis Roadmap</SectionHeading>
          <div className="max-w-md mx-auto space-y-3">
            {[
              { phase: "PHASE_1", label: "Cohort Sealing", desc: "First 100 nodes activated. Root entropy pool initialized.", active: true },
              { phase: "PHASE_2", label: "Governance Alpha", desc: "Genesis Nodes vote on protocol upgrades via SIWE wallet signatures." },
              { phase: "PHASE_3", label: "ZK On-Chain", desc: "Motion-signature proofs anchored to L1. Public verification enabled." },
              { phase: "PHASE_4", label: "Mesh Expansion", desc: "Genesis Nodes become validators. New nodes join via Genesis Node sponsorship." },
            ].map((item, i) => (
              <div key={item.phase}
                onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; e.currentTarget.style.background = "rgba(144,200,255,0.02)"; const els = e.currentTarget.querySelectorAll("span,div"); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.06)"; e.currentTarget.style.background = item.active ? "rgba(34,211,238,0.03)" : "transparent"; }}
                className="flex items-center gap-4 p-4 border transition-all duration-300 group"
                style={{ borderColor: "rgba(144,200,255,0.06)", background: item.active ? "rgba(34,211,238,0.03)" : "transparent" }}>
                <span className="text-cyan-400/50 group-hover:text-cyan-300/80 font-mono text-[10px] tracking-[0.2em] w-20 shrink-0 transition-colors">{item.phase}</span>
                <div>
                  <div className="text-white/55 group-hover:text-white/80 text-[10px] tracking-[0.15em] uppercase mb-0.5 transition-colors">{item.label}</div>
                  <div className="text-white/25 group-hover:text-white/45 text-[10px] leading-relaxed transition-colors">{item.desc}</div>
                </div>
                {item.active && <span className="ml-auto text-cyan-400/45 text-[9px] tracking-[0.2em]">◈ ACTIVE</span>}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-12 border-t border-white/[0.05]">
          <p className="text-white/30 text-[12px] mb-8 max-w-md mx-auto leading-relaxed">
            The Genesis Cohort is finite. One hundred slots. When they are gone, the protocol is sealed.
            This will never happen again.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/genesis"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="px-10 py-3.5 border border-cyan-400/30 text-cyan-300/70 text-[11px] tracking-[0.3em] uppercase font-mono hover:bg-cyan-400/[0.04] hover:text-white hover:border-cyan-400/50 transition-all"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)", background: "rgba(34,211,238,0.03)" }}>
              Initialize Genesis →
            </Link>
            <Link href="/dashboard"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-10 py-3.5 border border-cyan-400/20 text-cyan-300/45 text-[11px] tracking-[0.3em] uppercase font-mono hover:border-cyan-400/35 hover:text-cyan-200/70 hover:bg-cyan-400/[0.03] transition-all">
              View Dashboard →
            </Link>
          </div>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

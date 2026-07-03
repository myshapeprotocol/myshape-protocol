"use client";

import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const TOC_ITEMS = [
  { id: "crisis", label: "The Identity Crisis" },
  { id: "architecture", label: "Stored Identity Architecture" },
  { id: "presence", label: "Generated Presence" },
  { id: "entropy-gap", label: "The Entropy Gap" },
  { id: "infrastructure", label: "Identity Infrastructure" },
];

const SECTIONS = [
  {
    id: "crisis",
    heading: "The Identity Crisis Nobody Is Talking About",
    content: `In 2026, AI can generate your face. Clone your voice. Forge your writing style. Deepfake detection is an arms race — and the defenders are losing.

But the real crisis is deeper than deepfakes. It is architectural.

Every identity system on the internet today — from OAuth to SSO to identity verification — relies on the same primitive: a stored credential. A password. A token. A visual scan. A static hash. These are snapshots. Frozen data. And anything frozen can be copied.

The question no one is asking: what happens when generative AI can reproduce any stored identity credential at scale?

The answer: stored identity becomes worthless. Not because the cryptography fails — but because the physical link between the credential and the human is severed. A perfect copy of a face is not a face. A perfect copy of a voice is not a voice. And a perfect copy of a password is not a human — but it authenticates as one.`,
  },
  {
    id: "architecture",
    heading: "The Architecture of Stored Identity",
    content: `Let's be precise about what "stored identity" means.

A stored identity system works like this:
1. A human presents a credential (password, face, fingerprint).
2. The system captures that credential and stores a representation.
3. Future authentication compares new presentations against the stored representation.

This architecture has a fatal property: the credential is static. Once stored, it becomes a fixed target. Any adversary who can reproduce the credential — whether through theft, synthesis, or replay — can authenticate as the original human.

This is not a bug in implementation. It is a property of the architecture. Stored identity is fundamentally vulnerable because identity is reduced to data — and data is copyable.

AI does not "break" stored identity. AI reveals what was always true: stored identity was never identity. It was always just a password with extra steps.`,
  },
  {
    id: "presence",
    heading: "Generated Presence: A New Primitive",
    content: `What if identity cannot be stored?

What if it must be continuously generated — by a living entity, in real time, from irreducible biological entropy?

This is the core thesis of MyShape Protocol.

A presence-based identity system works differently:
1. A camera captures skeletal motion at 30 fps — not a single frame, but a continuous stream.
2. A 128-dimensional Motion Signature is extracted across four independent feature groups: kinematics, acceleration, jerk, and jerk spectrum.
3. A Presence Entropy Score (PES) quantifies the depth of biological entropy in the motion.
4. A ZK-presence proof is generated — proving the motion is human without revealing the motion itself.
5. Zero raw data is stored. Zero raw data is uploaded.

The key insight: presence is not data. Presence is a physical property of a living nervous system. It cannot be copied because it is not a file. It cannot be replayed because it requires continuous non-deterministic entropy. It cannot be synthesized because AI models — trained to minimize loss over distributions — systematically suppress the very signal that makes human motion human.`,
  },
  {
    id: "entropy-gap",
    heading: "The Entropy Gap: Why AI Cannot Forge Presence",
    content: `The PES engine measures four dimensions of biological entropy:

Φ_K — Kinematics. Skeletal ratios, joint angle variances, velocity and acceleration statistics. Human motion is stochastic at the millisecond scale.

Φ_A — Acceleration Profile. Hurst exponent. Human acceleration exhibits H ≈ 0.6–0.8 (long-range dependence). AI acceleration exhibits H ≈ 0.5 (uncorrelated noise after smoothing).

Φ_J — Jerk Profile. The third temporal derivative of position. The most unforgeable single kinematic dimension. Human jerk follows approximate 1/f^α scaling (α ≈ 1.0–1.5). AI jerk exhibits α > 2.0 (over-smoothed) or α ≈ 0 (white noise).

Φ_Jspec — Jerk Spectrum. Frequency-domain analysis across 4 bands. Spectral entropy. The AI Paradox: the better AI gets at generating realistic motion, the more aggressively it smooths — and the more detectable it becomes.

The result: a Human—AI PES gap of 0.3960. This gap is not a temporary AI limitation. It is a consequence of how neural networks optimize for visual fidelity. Every improvement in visual realism comes at the cost of spectral fidelity. AI cannot do both.

This is the Entropy Gap Theorem: Pr[AI generates PES ≥ 0.65] → 0.`,
  },
  {
    id: "infrastructure",
    heading: "What This Means For Identity Infrastructure",
    content: `If you are building any system that needs to know whether a user is human — authentication, KYC, access control, agent delegation — you have two choices:

1. Store a credential. Accept that it can be copied, stolen, or synthesized.
2. Verify presence. Accept only a continuous, entropy-rich signal that cannot be stored.

The second option is harder. It requires real-time computation. It requires camera access. It requires local processing to preserve privacy. But it is the only option that survives the AI era.

MyShape Protocol is the reference implementation of this second option. It is not a product. It is a standard — a set of primitives that any application can adopt.

The protocol is open for inspection. The benchmark results are reproducible. The threat model is published. The code is on GitHub.

We are not asking you to trust us.
We are asking you to verify.`,
  },
];

export default function PostClient() {
  const [active, setActive] = useState("crisis");
  const [tocShow, setTocShow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = TOC_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(TOC_ITEMS[i].id);
        if (el && el.offsetTop <= scrollY) { setActive(TOC_ITEMS[i].id); break; }
      }
      const footer = document.querySelector("footer");
      if (footer) setTocShow(footer.getBoundingClientRect().top > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    playTick(600, "sine", 0.06, 0.015);
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 flex flex-col md:flex-row gap-12 md:gap-24">
        {/* Spacer */}
        <div className="md:w-56 shrink-0 hidden md:block" />
        {/* TOC sidebar */}
        <aside className="hidden md:block" style={{
          position: "fixed", top: "128px", width: "224px",
          left: "max(24px, calc((100vw - 1024px) / 2 + 24px))",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.5em] uppercase mb-8 font-mono font-bold">ARCHIVE_INDEX</div>
          <ul className="space-y-6 border-l" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
            {TOC_ITEMS.map(s => {
              const isActive = s.id === active;
              return (
                <li key={s.id}>
                  <button onClick={() => scrollTo(s.id)}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="block text-left w-full transition-all duration-300"
                    style={{
                      borderLeft: isActive ? "2px solid rgba(144,200,255,0.8)" : "2px solid transparent",
                      marginLeft: "-1px",
                      paddingLeft: "20px",
                      background: isActive ? "linear-gradient(90deg, rgba(144,200,255,0.06), transparent)" : "transparent",
                    }}>
                    <span className="flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.6)] scale-100" : "bg-transparent scale-0"}`} />
                      <span className="text-[12px] tracking-[0.2em] uppercase transition-all duration-300"
                        style={{
                          color: isActive ? "rgba(144,200,255,0.95)" : "rgba(255,255,255,0.2)",
                          textShadow: isActive ? "0 0 12px rgba(144,200,255,0.4)" : "none",
                        }}>
                        {s.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="flex-1 min-w-0" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
        <div className="mb-16">
          <div className="text-[#90c8ff]/40 text-[9px] tracking-[0.4em] uppercase mb-4">PROTOCOL_ESSAY // 001</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.04em] text-white leading-tight mb-6"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.15)" }}>
            Stored Identity vs. Generated Presence
          </h1>
          <p className="text-white/40 text-[18px] leading-relaxed">
            Why your &ldquo;identity&rdquo; is just a copyable database record — and what comes next.
          </p>
          <div className="flex items-center gap-3 mt-4 text-[9px]">
            <span className="text-white/20">MyShape Protocol</span>
            <span className="text-white/10">·</span>
            <span className="text-white/20">June 27, 2026</span>
            <span className="text-white/10">·</span>
            <span className="text-white/20">8 min read</span>
          </div>
        </div>

        {/* Visual Hook — Architecture Diagram */}
        <div className="my-16 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-6 md:p-8 font-mono transition-all duration-300 hover:border-[#90c8ff]/35"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="text-[#90c8ff]/30 text-[8px] tracking-[0.3em] uppercase mb-4 text-center">SYSTEM_SCHEMA: PRESENCE PIPELINE</div>
          <pre className="text-[#90c8ff]/40 text-[10px] leading-[2.2] tracking-[0.08em] whitespace-pre overflow-x-auto text-center">
{`CAMERA ──→ SST_18PT ──→ PES_4D ──→ 128D_VECTOR ──→ ZK_PROOF
 30fps      Skeleton    Entropy     Motion          Presence
 Local      Topology    Scoring     Signature       Verified

  ◄──────────────── 0 DATA UPLOADED ────────────────►
         All processing on-device. Nothing stored.`}
          </pre>
          <div className="mt-4 flex justify-center gap-4 text-[8px]">
            <span className="text-[#90c8ff]/25">◈ Benchmark: 0.3960 Human—AI Gap</span>
            <span className="text-white/10">|</span>
            <span className="text-[#90c8ff]/25">◈ Engine: Rust → WASM</span>
            <span className="text-white/10">|</span>
            <span className="text-[#90c8ff]/25">◈ License: MIT</span>
          </div>
        </div>

        <div className="space-y-20">
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 id={s.id} className="text-white/70 text-[18px] md:text-[20px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-[#90c8ff] scroll-mt-28"
                onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>
                {s.heading}
              </h2>
              <div className="space-y-5">
                {s.content.split("\n\n").map((para, j) => (
                  <p key={j} className="text-white/50 text-[18px] leading-[1.85] font-light">
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 p-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]">
          <p className="text-white/30 text-[11px] leading-relaxed mb-4">
            <strong className="text-white/50">To the skeptic:</strong> every claim in this essay is verifiable.
            The benchmark code is on GitHub. The threat model is published. Attack it. We invite adversarial review.
          </p>
          <p className="text-white/20 text-[9px]">
            Repository: github.com/myshapeprotocol &middot; Threat Model: myshape.com/papers/threat-model &middot; Live Demo: myshape.com/motion-demo
          </p>
        </div>

        <div className="mt-16 pt-10 border-t border-white/[0.05] text-center space-y-4">
          <p className="text-white/20 text-[10px]">Discuss this essay on HN or GitHub.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              View on GitHub →
            </a>
            <Link href="/evidence"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              Evidence →
            </Link>
            <a href="/blog/continuity-layer-for-the-simulation-age"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              Continuity Layer →
            </a>
            <Link href="/blog"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="px-6 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase text-center hover:border-[#90c8ff]/45 hover:text-white hover:bg-[#90c8ff]/[0.04] transition-all">
              All Essays →
            </Link>
          </div>
        </div>

        {/* Internal link cluster */}
        <div className="mt-16 pt-12 border-t border-[#90c8ff]/5 space-y-4">
          <p className="text-white/30 text-[9px] tracking-[0.25em] uppercase text-center">
            Continue Reading
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/blog/motion-vs-biometrics-why-your-face-is-not-a-password"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
            >
              <p className="text-white/50 text-[10px] tracking-[0.1em]">
                Motion vs Biometrics
              </p>
              <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                Why your face is not a password →
              </p>
            </Link>
            <Link
              href="/blog/what-is-decentralized-identity-2026"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
            >
              <p className="text-white/50 text-[10px] tracking-[0.1em]">
                What Is Decentralized Identity?
              </p>
              <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                2026 guide to DID, SSI →
              </p>
            </Link>
            <Link
              href="/glossary"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="block p-4 border border-[#90c8ff]/10 hover:border-[#90c8ff]/25 transition-all"
            >
              <p className="text-white/50 text-[10px] tracking-[0.1em]">
                Protocol Glossary
              </p>
              <p className="text-white/20 text-[8px] tracking-[0.1em] mt-1">
                30+ defined terms →
              </p>
            </Link>
          </div>
        </div>
        </article>
      </div>

      <ProtocolFooter />
    </div>
  );
}

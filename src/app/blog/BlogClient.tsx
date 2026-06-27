"use client";

import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  { id: "experiment", label: "The Experiment" },
  { id: "results", label: "The Results" },
  { id: "why", label: "Why This Matters" },
  { id: "how", label: "How It Works" },
  { id: "truth", label: "The Deeper Truth" },
  { id: "run", label: "Run It Yourself" },
  { id: "building", label: "What We're Building" },
];

export default function BlogClient() {
  const [active, setActive] = useState("experiment");

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActive(SECTIONS[i].id);
          break;
        }
      }
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
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 flex flex-col md:flex-row gap-12 md:gap-24">
        {/* ── Desktop TOC: sidebar ── */}
        <aside className="md:w-56 shrink-0 h-fit md:sticky md:top-32 hidden md:block">
          <div className="text-cyan-400/30 text-[9px] tracking-[0.5em] uppercase mb-8 font-mono italic">// ON_THIS_PAGE</div>
          <ul className="space-y-6 border-l" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
            {SECTIONS.map(s => {
              const isActive = s.id === active;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="block text-left w-full transition-all duration-300"
                    style={{
                      borderLeft: isActive ? "2px solid rgba(34,211,238,0.6)" : "2px solid transparent",
                      marginLeft: "-1px",
                      paddingLeft: "20px",
                    }}
                  >
                    <div className="text-[11px] tracking-[0.15em] uppercase transition-colors duration-300"
                      style={{ color: isActive ? "rgba(34,211,238,0.9)" : "rgba(255,255,255,0.2)" }}>
                      {s.label}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="text-cyan-500/40 text-[9px] tracking-[0.4em] uppercase mb-4">TECHNICAL_BLOG // JUNE_2026</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.04em] text-white leading-tight mb-6"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.15)" }}>
            AI Cannot Forge Human Motion.
            <br />
            <span className="text-cyan-300/80">We proved it. Here is the evidence.</span>
          </h1>
          <p className="text-white/35 text-[13px] leading-relaxed">
            AI can fake a face. AI can clone a voice. But AI cannot generate your motion — the specific,
            irreducibly biological pattern of your nervous system. Here are the numbers.
          </p>
          <div className="flex items-center gap-3 mt-4 text-[9px]">
            <span className="text-white/20">MyShape Protocol</span>
            <span className="text-white/10">·</span>
            <span className="text-white/20">June 2026</span>
            <span className="text-white/10">·</span>
            <span className="text-white/20">6 min read</span>
          </div>
        </div>

        {/* Visual Hook — Architecture Diagram */}
        <div className="my-12 md:my-16 border border-cyan-400/15 bg-cyan-400/[0.02] p-5 md:p-8 font-mono transition-all duration-300 hover:border-cyan-400/35"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="text-cyan-400/30 text-[8px] tracking-[0.3em] uppercase mb-4 text-center">SYSTEM_SCHEMA: VERIFICATION PIPELINE</div>
          <pre className="text-cyan-400/40 text-[9px] md:text-[10px] leading-[2.2] tracking-[0.08em] whitespace-pre overflow-x-auto text-center">
{`CAMERA ──→ SST_18PT ──→ PES_4D ──→ 128D_VECTOR ──→ ZK_PROOF
 30fps      Skeleton    Entropy     Motion          Presence
 Local      Topology    Scoring     Signature       Verified

   ◄─────────────── 0 DATA UPLOADED ─────────────────►
          All processing on-device. Nothing stored.`}
          </pre>
          <div className="mt-4 flex justify-center gap-4 text-[8px]">
            <span className="text-cyan-400/25">◈ Engine: Rust + TypeScript</span>
            <span className="text-white/10">|</span>
            <span className="text-cyan-400/25">◈ Human—AI Gap: 0.3960</span>
            <span className="text-white/10">|</span>
            <span className="text-cyan-400/25">◈ License: MIT</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-16 md:space-y-20">
          {/* The Experiment */}
          <section>
            <h2 id="experiment" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Experiment</h2>
            <div className="space-y-5">
              <p className="text-white/40 text-[13px] leading-[1.9] font-light">
                We built a Rust-based verification engine that analyzes human motion through four independent feature dimensions. Then we ran a simple test:
              </p>
              <ol className="list-decimal pl-6 space-y-3 text-white/40 text-[13px] leading-[1.9] font-light">
                <li><strong className="text-white/65 font-normal">Enroll a human:</strong> 20 motion samples → one cryptographic signature.</li>
                <li><strong className="text-white/65 font-normal">Issue a challenge:</strong> "Draw a circle with your right hand. Tilt your torso 12 degrees. Keep your head still." — unpredictable, multi-joint, with a coupling constraint that shares a kinetic chain.</li>
                <li><strong className="text-white/65 font-normal">Test three responses:</strong> genuine human, AI-generated forgery, and a different human.</li>
              </ol>
            </div>
          </section>

          {/* The Results */}
          <section>
            <h2 id="results" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Results</h2>
            <div className="space-y-5">
              <div className="border p-5 my-6 transition-all duration-300 hover:border-cyan-400/40"
                style={{ borderColor: "rgba(144,200,255,0.1)" }}
                onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <pre className="text-cyan-300/50 text-[11px] md:text-[12px] leading-relaxed font-mono whitespace-pre">
{`Test Case              Presence Score   Verdict
─────────────────────────────────────────────────
Genuine Human           0.9817           PASS ✓
AI Forgery              0.5857           FAIL ✗
Impostor                0.0000           FAIL ✗

Human—AI Gap: 0.3960`}
                </pre>
              </div>
              <p className="text-white/40 text-[13px] leading-[1.9] font-light">
                The engine rejected the AI-generated motion across four independent dimensions:
              </p>
              <div className="space-y-2">
                {[
                  { tag: "TREMOR_ABSENT", detail: "8–12 Hz physiological tremor missing — AI has no stretch reflex arc." },
                  { tag: "JERK_SPECTRUM_ANOMALY", detail: "1/f spectral scaling violated — AI jerk is either over-smoothed or white noise." },
                  { tag: "HURST_ANOMALY", detail: "Long-range dependence absent — AI acceleration is uncorrelated noise." },
                  { tag: "OVER_SMOOTHED", detail: "Motor micro-perturbations missing — too perfect to be biological." },
                ].map(r => (
                  <div key={r.tag} className="border p-4 transition-all duration-300 hover:border-cyan-400/35 hover:bg-cyan-400/[0.02]"
                    style={{ borderColor: "rgba(144,200,255,0.08)" }}
                    onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                    <span className="text-cyan-400/70 font-mono text-[10px] md:text-[11px] tracking-[0.1em]">{r.tag}</span>
                    <span className="text-white/40 text-[12px] md:text-[13px] ml-3 font-light">{r.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why This Matters */}
          <section>
            <h2 id="why" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>Why This Matters</h2>
            <div className="space-y-5 text-white/40 text-[13px] leading-[1.9] font-light">
              <p>Every identity system in production today — passwords, KYC, hardware wallets — answers one question: "Does the credential match?"</p>
              <p>None of them answer: "Is the human who enrolled that credential physically present right now?"</p>
              <p>This gap has existed for decades. AI makes it fatal.</p>
              <p>In a world where AI agents hold private keys, where deepfakes bypass visual verification, where GPT-5 can generate convincing video of anyone doing anything — the only signal that cannot be forged is the real-time, physics-bound motion of a living human entity.</p>
              <p>Motion is not a file. Motion is not a template. Motion is a continuous, high-dimensional, noise-driven field generated by the irreducible physics of your nervous system. AI can approximate its output. It cannot replicate its entropy.</p>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 id="how" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>How It Works</h2>
            <div className="space-y-5">
              <p className="text-white/40 text-[13px] leading-[1.9] font-light">
                The engine extracts a 128-dimensional signature from four feature groups:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-white/40 text-[13px] leading-[1.9] font-light">
                <li><strong className="text-white/65 font-normal">Kinematics (40 dims):</strong> Skeletal ratios between 14 bone segments. Your bone-length ratios are physically unique — AI does not know them.</li>
                <li><strong className="text-white/65 font-normal">Acceleration Profile (25 dims):</strong> Statistical distribution including Hurst exponent. Human: H ≈ 0.6–0.8. AI: H ≈ 0.5.</li>
                <li><strong className="text-white/65 font-normal">Jerk Profile (25 dims):</strong> The third derivative of position. The single most unforgeable kinematic dimension.</li>
                <li><strong className="text-white/65 font-normal">Jerk Spectrum (30 dims):</strong> Frequency-domain analysis. Human: 1/f^α scaling (α ≈ 1.0–1.5). AI: α &gt; 2.0 or α ≈ 0.</li>
              </ul>
            </div>
          </section>

          {/* The Deeper Truth */}
          <section>
            <h2 id="truth" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Deeper Truth</h2>
            <div className="space-y-5 text-white/40 text-[13px] leading-[1.9] font-light">
              <p>Every AI motion model — diffusion, transformer, VAE — is trained with L2 loss. L2 loss penalizes the square of the error. A 1 mm tremor deviation is penalized 100× less than a 10 mm trajectory error. The model learns to suppress high-frequency, low-amplitude signals — exactly the signals that make human motion human.</p>
              <p>This is not a temporary AI limitation. It is a structural consequence of neural network optimization. The better AI gets at generating realistic motion, the more aggressively it smooths — and the more detectable it becomes.</p>
              <p><strong className="text-white/65">The AI Paradox:</strong> Every improvement in visual fidelity comes at the cost of spectral fidelity. AI faces an impossible tradeoff: look more real, or be more real. It cannot do both.</p>
            </div>
          </section>

          {/* Run It */}
          <section>
            <h2 id="run" className="text-white/65 text-[17px] md:text-[19px] tracking-[0.06em] font-light mb-6 leading-snug transition-colors duration-300 hover:text-cyan-200 scroll-mt-28"
              onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>Run It Yourself</h2>
            <div className="space-y-5">
              <p className="text-white/40 text-[13px] leading-[1.9] font-light">The core engine is open source:</p>
              <div className="border p-5 transition-all duration-300 hover:border-cyan-400/35"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "rgba(2,4,10,0.6)" }}
                onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                <pre className="text-cyan-400/45 text-[10px] md:text-[11px] leading-relaxed font-mono whitespace-pre">
{`git clone https://github.com/myshapeprotocol
cd cli
cargo run --release --bin myshape-demo -- --verbose`}
                </pre>
              </div>
              <p className="text-white/40 text-[13px] leading-[1.9] font-light">
                25 tests. Zero dependencies beyond the Rust standard library and audited crypto crates.
                See the live dashboard at <a href="/developers" className="text-cyan-400/50 hover:text-cyan-300 transition-colors">myshape.com/developers</a>.
              </p>
            </div>
          </section>

          {/* What We're Building */}
          <section>
            <h2 id="building" className="text-white/60 text-[15px] tracking-[0.08em] font-light mb-6 leading-snug scroll-mt-28">What We're Building</h2>
            <div className="space-y-5 text-white/40 text-[13px] leading-[1.9] font-light">
              <p>MyShape is a presence verification protocol. Not proof of identity — proof of presence.</p>
              <p>World (the orb) proves you are a human. MyShape proves you are <em className="text-white/55">this</em> human — physically present, authorizing this specific operation.</p>
              <p>We are in active development. If you build in identity, security, agent infrastructure, or applied cryptography — we would like to talk.</p>
            </div>
          </section>
        </div>

        {/* Invite adversarial review */}
        <div className="mt-16 p-6 border border-cyan-400/10 bg-cyan-400/[0.02]">
          <p className="text-white/30 text-[11px] leading-relaxed mb-4">
            <strong className="text-white/50">To the skeptic:</strong> every claim in this article is verifiable.
            The benchmark code is on GitHub. The threat model is published. Attack it. We invite adversarial review.
          </p>
          <p className="text-white/20 text-[9px]">
            Repository: github.com/myshapeprotocol &middot; Threat Model: myshape.com/papers/threat-model &middot; Live Demo: myshape.com/motion-demo
          </p>
        </div>

        {/* Discussion + More Essays */}
        <div className="mt-12 pt-10 border-t border-white/[0.05] text-center space-y-4">
          <p className="text-white/20 text-[10px]">Discuss on HN or GitHub. More technical essays below.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              className="px-6 py-2.5 border border-cyan-400/25 text-cyan-300/60 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
              View on GitHub →
            </a>
            <a href="/blog/stored-identity-vs-generated-presence"
              className="px-6 py-2.5 border border-cyan-400/15 text-white/25 text-[10px] tracking-[0.3em] uppercase hover:border-cyan-400/30 hover:text-white/45 transition-all"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
              Stored Identity vs. Generated Presence →
            </a>
            <a href="/architecture"
              className="px-6 py-2.5 border border-cyan-400/15 text-white/25 text-[10px] tracking-[0.3em] uppercase hover:border-cyan-400/30 hover:text-white/45 transition-all"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
              Protocol Architecture →
            </a>
          </div>
        </div>
        </article>
      </div>

      <ProtocolFooter />
    </div>
  );
}

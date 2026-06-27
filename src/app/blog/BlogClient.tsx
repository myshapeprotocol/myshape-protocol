"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

export default function BlogClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />

      <article className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Header */}
        <header className="mb-16">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase mb-6 font-mono">
            TECHNICAL_BLOG // JUNE_2026
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-white leading-tight mb-6">
            We Built an Engine That Detects AI-Generated Human Motion.
            <br />
            <span className="text-cyan-300/80">GPT-5 and DeepSeek Both Failed.</span>
          </h1>
          <div className="flex items-center gap-3 text-[11px] text-white/30">
            <span>MyShape Protocol</span>
            <span className="text-white/10">·</span>
            <span>June 2026</span>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-10 text-[15px] leading-[1.85] font-light text-white/55">
          {/* Lead */}
          <p>
            AI can generate a face. AI can clone a voice. AI can forge a fingerprint.
          </p>
          <p>
            But AI cannot generate <em className="text-white/70">you</em> — not your specific, irreducibly biological, physically-constrained human motion. And we have the numbers to prove it.
          </p>

          {/* The Experiment */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Experiment</h2>
          <p>We built a Rust-based verification engine that analyzes human motion through four independent feature dimensions. Then we ran a simple test:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong className="text-white/70">Enroll a human:</strong> 20 motion samples → one cryptographic signature.</li>
            <li><strong className="text-white/70">Issue a challenge:</strong> "Draw a circle with your right hand. Tilt your torso 12 degrees. Keep your head still." — unpredictable, multi-joint, with a coupling constraint that shares a kinetic chain.</li>
            <li><strong className="text-white/70">Test three responses:</strong> genuine human, AI-generated forgery, and a different human.</li>
          </ol>

          {/* The Results */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6 transition-colors duration-300 hover:text-cyan-200"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Results</h2>
          <div className="border p-5 my-6 transition-all duration-300 hover:border-cyan-400/40"
            style={{ borderColor: "rgba(144,200,255,0.1)" }}
            onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
            <pre className="text-white/55 text-[12px] leading-relaxed font-mono whitespace-pre">
{`Test Case              Presence Score   Verdict
─────────────────────────────────────────────────
Genuine Human           0.9817           PASS ✓
AI Forgery              0.5857           FAIL ✗
Impostor                0.0000           FAIL ✗

Human—AI Gap: 0.3960`}
            </pre>
          </div>

          <p>The engine rejected the AI-generated motion across four independent dimensions:</p>

          <div className="space-y-3">
            {[
              { tag: "TREMOR_ABSENT", detail: "8–12 Hz physiological tremor missing — AI has no stretch reflex arc." },
              { tag: "JERK_SPECTRUM_ANOMALY", detail: "1/f spectral scaling violated — AI jerk is either over-smoothed or white noise." },
              { tag: "HURST_ANOMALY", detail: "Long-range dependence absent — AI acceleration is uncorrelated noise." },
              { tag: "OVER_SMOOTHED", detail: "Motor micro-perturbations missing — too perfect to be biological." },
            ].map(r => (
              <div key={r.tag} className="border p-4 transition-all duration-300 hover:border-cyan-400/35 hover:bg-cyan-400/[0.02]"
                style={{ borderColor: "rgba(144,200,255,0.08)" }}
                onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                <span className="text-cyan-400/70 font-mono text-[11px] tracking-[0.1em]">{r.tag}</span>
                <span className="text-white/45 text-[13px] ml-3">{r.detail}</span>
              </div>
            ))}
          </div>

          {/* Why This Matters */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6 transition-colors duration-300 hover:text-cyan-200"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>Why This Matters</h2>
          <p>Every identity system in production today — passwords, biometrics, hardware wallets, KYC — answers one question: "Does the credential match?"</p>
          <p>None of them answer: "Is the human who enrolled that credential physically present right now?"</p>
          <p>This gap has existed for decades. AI makes it fatal.</p>
          <p>In a world where AI agents hold private keys, where deepfakes bypass visual verification, where GPT-5 can generate convincing video of anyone doing anything — the only signal that cannot be forged is the real-time, physics-bound motion of a living human entity.</p>
          <p>Motion is not a file. Motion is not a template. Motion is a continuous, high-dimensional, noise-driven field generated by the irreducible physics of your nervous system and your skeleton. AI can approximate its output. It cannot replicate its entropy.</p>

          {/* How It Works */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6 transition-colors duration-300 hover:text-cyan-200"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>How It Works</h2>
          <p>The engine extracts a 128-dimensional signature from four feature groups:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-white/70">Kinematics (40 dims):</strong> Skeletal ratios between 14 bone segments. Your femur-to-tibia ratio is physically unique. AI doesn't know your bone lengths.</li>
            <li><strong className="text-white/70">Acceleration Profile (25 dims):</strong> Statistical distribution including Hurst exponent. Human: H ≈ 0.6–0.8. AI: H ≈ 0.5.</li>
            <li><strong className="text-white/70">Jerk Profile (25 dims):</strong> The third derivative of position. The most unforgeable single kinematic dimension.</li>
            <li><strong className="text-white/70">Jerk Spectrum (30 dims):</strong> Frequency-domain analysis. Human: 1/f^α scaling. AI: over-smoothed or white noise.</li>
          </ul>

          {/* Run It */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6 transition-colors duration-300 hover:text-cyan-200"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>Run It Yourself</h2>
          <p>The core engine is open source:</p>
          <div className="border p-5 my-4 transition-all duration-300 hover:border-cyan-400/35"
            style={{ borderColor: "rgba(144,200,255,0.1)", background: "rgba(2,4,10,0.6)" }}
            onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
            <pre className="text-cyan-400/50 text-[11px] leading-relaxed font-mono whitespace-pre">
{`git clone https://github.com/myshapeprotocol
cd cli
cargo run --release --bin myshape-demo -- --verbose`}
            </pre>
          </div>
          <p>25 tests. Zero dependencies beyond the Rust standard library and audited crypto crates.</p>
          <p>See the live dashboard at <a href="/developers" className="text-cyan-400/60 hover:text-cyan-300">myshape.com/developers</a>.</p>

          {/* The Deeper Truth */}
          <h2 className="text-xl font-bold tracking-tighter text-white pt-6 transition-colors duration-300 hover:text-cyan-200"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>The Deeper Truth</h2>
          <p>Every AI motion model — diffusion, transformer, VAE — is trained with L2 loss. L2 loss penalizes the square of the error. A 1 mm tremor deviation is penalized 100× less than a 10 mm trajectory error. The model learns to suppress high-frequency, low-amplitude signals — exactly the signals that make human motion human.</p>
          <p>This is not a temporary AI limitation. It is a structural property of neural network training. The better AI gets at generating realistic motion, the more aggressively it smooths — and the more detectable it becomes.</p>
          <p><strong className="text-white/70">The AI Paradox:</strong> Every improvement in visual fidelity comes at the cost of spectral fidelity. AI faces an impossible tradeoff: look more real, or be more real. It cannot do both.</p>

          {/* CTA */}
          <hr className="my-12" style={{ borderColor: "rgba(144,200,255,0.08)" }} />
          <h2 className="text-xl font-bold tracking-tighter text-white">What We're Building</h2>
          <p>MyShape is a presence verification protocol. Not proof of <em>identity</em> — proof of <em>presence</em>.</p>
          <p>World (the orb project) proves you're <em>a</em> human. MyShape proves you're <em>this</em> human — physically present, authorizing this specific operation.</p>
          <p>We're currently in closed development. If you're building in the identity, security, agent infrastructure, or applied cryptography space, we'd like to talk.</p>

          <div className="flex flex-wrap gap-4 pt-4 text-[11px]">
            <a href="/whitepaper" className="border px-4 py-2 text-cyan-400/60 hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
              style={{ borderColor: "rgba(144,200,255,0.2)" }}
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
              Read the Whitepaper →
            </a>
            <a href="https://x.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="border px-4 py-2 text-cyan-400/60 hover:text-cyan-300 hover:border-cyan-400/40 transition-all"
              style={{ borderColor: "rgba(144,200,255,0.2)" }}
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
              @myshapeprotocol →
            </a>
          </div>

          {/* More Essays */}
          <div className="mt-16 pt-10 border-t border-white/[0.05]">
            <h2 className="text-white/15 text-[9px] tracking-[0.5em] uppercase mb-6">More Essays</h2>
            <a href="/blog/stored-identity-vs-generated-presence"
              className="block border border-cyan-400/10 p-5 hover:border-cyan-400/35 transition-all group"
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
              <div className="text-white/25 text-[9px] tracking-[0.2em] uppercase mb-2">PROTOCOL_ESSAY // 001</div>
              <div className="text-white/50 text-[14px] tracking-[0.05em] font-light mb-1 group-hover:text-white/70 transition-colors">
                Stored Identity vs. Generated Presence
              </div>
              <div className="text-white/20 text-[10px]">Why your identity is just a copyable database record — and what comes next.</div>
            </a>
          </div>
        </div>
      </article>

      <ProtocolFooter />
    </div>
  );
}

import type { Metadata } from "next";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stored Identity vs. Generated Presence — Why Your 'Identity' Is Just a Copyable Database Record",
  description: "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot — because presence is not data. It is physics.",
  openGraph: {
    title: "Stored Identity vs. Generated Presence",
    description: "Every identity system today stores a snapshot. Snapshots can be copied. Presence cannot.",
    url: "https://www.myshape.com/blog/stored-identity-vs-generated-presence",
    siteName: "MyShape Protocol",
    type: "article",
    publishedTime: "2026-06-27",
    authors: ["MyShape Protocol"],
    tags: ["identity", "presence", "AI", "protocol"],
  },
};

const SECTIONS = [
  {
    heading: "The Identity Crisis Nobody Is Talking About",
    content: `In 2026, AI can generate your face. Clone your voice. Forge your writing style. Deepfake detection is an arms race — and the defenders are losing.

But the real crisis is deeper than deepfakes. It is architectural.

Every identity system on the internet today — from OAuth to SSO to identity verification — relies on the same primitive: a stored credential. A password. A token. A visual scan. A static hash. These are snapshots. Frozen data. And anything frozen can be copied.

The question no one is asking: what happens when generative AI can reproduce any stored identity credential at scale?

The answer: stored identity becomes worthless. Not because the cryptography fails — but because the physical link between the credential and the human is severed. A perfect copy of a face is not a face. A perfect copy of a voice is not a voice. And a perfect copy of a password is not a human — but it authenticates as one.`,
  },
  {
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

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <article className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-16">
          <div className="text-cyan-500/40 text-[9px] tracking-[0.4em] uppercase mb-4">PROTOCOL_ESSAY // 001</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.04em] text-white leading-tight mb-6"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.15)" }}>
            Stored Identity vs. Generated Presence
          </h1>
          <p className="text-white/35 text-[13px] leading-relaxed">
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

        <div className="space-y-20">
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 className="text-white/60 text-[15px] tracking-[0.08em] font-light mb-6 leading-snug">
                {s.heading}
              </h2>
              <div className="space-y-5">
                {s.content.split("\n\n").map((para, j) => (
                  <p key={j} className="text-white/40 text-[13px] leading-[1.9] font-light">
                    {para.trim()}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-white/[0.05] text-center space-y-4">
          <p className="text-white/20 text-[10px]">Discuss this essay on GitHub.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              className="px-8 py-3 border border-cyan-400/25 text-cyan-300/60 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all">
              View on GitHub →
            </a>
            <Link href="/blog"
              className="px-8 py-3 border border-cyan-400/15 text-white/25 text-[10px] tracking-[0.3em] uppercase hover:border-cyan-400/30 hover:text-white/45 transition-all">
              All Essays →
            </Link>
          </div>
        </div>
      </article>

      <ProtocolFooter />
    </div>
  );
}

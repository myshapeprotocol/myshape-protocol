"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  {
    id: "the-broken-promise",
    heading: "The Broken Promise of Biometrics",
    content: `Biometrics were sold to us as the ultimate security primitive. "Your face is your password." "Your fingerprint is the key." The promise was irresistible: no more passwords to forget, no more tokens to lose, just you — unique, irreplaceable, always available.

That promise is broken. And the break is permanent.

Here's why: a password can be changed. A private key can be rotated. A biometric cannot. Your face, your fingerprint, your iris — these are static biological facts. Once compromised, they are compromised forever. There is no "reset my iris" button.

The scale of compromise is already staggering:
- The 2015 OPM breach exposed fingerprints of 5.6 million federal employees
- The 2019 Suprema breach leaked 1 million+ fingerprint and facial recognition records
- Deepfake technology can now bypass consumer-grade facial recognition with >95% success rates
- AI voice synthesis can defeat voice authentication in under 3 seconds

Biometrics are not "something you are." They are "something that has been photographed, stored in a database, and almost certainly breached."`,
  },
  {
    id: "the-motion-difference",
    heading: "What Makes Motion Different",
    content: `Motion-based authentication operates on a fundamentally different principle from biometrics.

A biometric is a static fact. A motion is a dynamic performance.

When you authenticate with a fingerprint, you present the same fingerprint every time. If that fingerprint is captured once, it can be replayed indefinitely. But when you authenticate with motion, you perform a fresh signature every time — and the protocol enforces temporal uniqueness. Even if one motion-signature is intercepted, it cannot be replayed because the system expects a new signature with fresh entropy characteristics.

This is not a theoretical distinction. The MyShape motion-signature engine extracts a 128-dimensional vector from your real-time 3D pose sequence across four independent feature groups:
- Kinematics: joint angles, velocities, spatial trajectories
- Acceleration: rate of change of velocity across all tracked points
- Jerk: the third derivative of position — the smoothness or abruptness of movement
- Jerk Spectrum: the frequency-domain analysis of jerk, which reveals biological control system characteristics that no AI can reproduce

These four groups create a feature space so large and so noisy (in the biological sense — micro-timing variance, physiological tremor, motor unit recruitment patterns) that the entropy gap between human and synthetic motion is mathematically provable.`,
  },
  {
    id: "ai-cant-forge",
    heading: "Why AI Cannot Forge Human Motion",
    content: `The claim that "AI can generate anything" is approximately true for static media. It is fundamentally false for real-time biological motion.

Three hard limits prevent AI from forging human motion at the resolution required to defeat motion-signature verification:

1. The Nyquist Limit
To simulate biological motion, an AI must generate pose data at a temporal resolution that captures the micro-timing variance of human motor control. This variance operates at frequencies above what current generative models can resolve. The Nyquist-Shannon sampling theorem guarantees that undersampled motion will exhibit detectable periodicity — a clean mathematical signal that the source is synthetic.

2. Depth Ambiguity
A 2D camera observing a 3D human introduces inherent depth ambiguity. Human motion exploits this: slight rotations, perspective shifts, and depth-parallax effects create patterns that 2D-trained AI models cannot consistently reproduce because they lack a true 3D understanding of the scene.

3. The Entropy Gap
Human motion is driven by a biological control system — the neuromuscular system — that introduces irreducible noise. Motor unit recruitment is stochastic. Muscle fiber contraction has micro-variance. Neural signal propagation has timing jitter. AI-generated motion, by contrast, is the output of a deterministic function (even with stochastic sampling). The entropy characteristics — measured via Hurst exponent, approximate entropy, and detrended fluctuation analysis — are provably different between biological and synthetic motion.

The Presence Entropy Score (PES) quantifies this gap across four dimensions: micro-timing variance, noise residual, frequency entropy, and biological perturbation. A PES above threshold is mathematically impossible for AI-generated motion to achieve.`,
  },
  {
    id: "privacy",
    heading: "Privacy: The Dimension Biometrics Surrendered",
    content: `Even if biometrics were technically secure (they aren't), they surrender privacy by design. A face scan, a fingerprint capture, an iris photograph — these are high-resolution samples of your physical body. They are, by definition, personally identifiable information.

Motion-based authentication in a zero-knowledge architecture inverts this relationship. Your raw motion data never leaves your device. The camera feed is processed locally. The 128-dimensional motion vector is hashed and zero-knowledge proved on-device. Only the cryptographic proof — not the motion data — is transmitted to the network.

This means:
- No central database of motion signatures
- No raw video stored anywhere
- No biometric template to breach
- Each verification is a fresh proof with no linkability to previous verifications (unless the user explicitly opts into continuity chaining)

This is not a marginal improvement in privacy. It is a categorical difference. Biometrics say: "give us your body, and we'll verify you." Motion-based ZK says: "prove you can move like a human, without ever showing us who you are."`,
  },
  {
    id: "adoption",
    heading: "The Post-Biometric Era",
    content: `The transition from biometrics to motion-based authentication is not a matter of "if" but "when." The incentives are too strong and the biometric failure mode is too catastrophic.

Consider the trajectory:
- 2015-2020: Biometrics become mainstream (FaceID, TouchID, Windows Hello)
- 2021-2025: AI defeats static biometrics; deepfake fraud explodes 3000%
- 2026: Post-biometric authentication emerges — motion, behavior, continuity

MyShape Protocol is positioned at the frontier of this transition. The motion-signature engine is operational. The Presence Entropy Score is benchmarked. The Genesis Cohort — 100 founding nodes — is onboarding now.

The post-biometric era will not be defined by better cameras or more secure enclaves. It will be defined by a new primitive: not what you are, but how you move. Not a static fact, but a continuous performance. Not your face. Your presence.`,
  },
];

export default function PostClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />

      <main className="flex-1 relative">
        <BackgroundParticles />
        <div
          className="relative z-10 max-w-3xl mx-auto px-4 md:px-6"
          style={{ paddingTop: "8rem", paddingBottom: "6rem" }}
        >
          {/* Header */}
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase">
              <span>GENESIS 005</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span>2026.07.03</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight">
              Motion vs<br />
              <span className="text-[#90c8ff]">Biometrics</span>
            </h1>
            <p className="text-white/30 text-[11px] tracking-[0.1em] leading-relaxed max-w-xl">
              Why your face is not a password. Why your fingerprint is not a key.
              And why the post-biometric era begins with how you move.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-20">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3">
                  <span className="w-6 h-[1px] bg-[#90c8ff]/30" />
                  {section.heading}
                </h2>
                <div className="text-white/50 text-[12px] leading-relaxed tracking-[0.06em] space-y-5 whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="my-16 h-px bg-gradient-to-r from-transparent via-[#90c8ff]/15 to-transparent" />

          {/* CTA */}
          <div className="p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">
              Experience Post-Biometric Authentication
            </p>
            <p className="text-white/25 text-[10px] leading-relaxed max-w-md mx-auto">
              The Motion Demo is live. See how your unique motion-signature
              generates a cryptographic proof of presence — without ever
              revealing who you are.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link
                href="/motion-demo"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all"
              >
                Try Motion Demo →
              </Link>
              <Link
                href="/whitepaper"
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all"
              >
                Read Whitepaper →
              </Link>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-white/15 text-[9px] tracking-[0.2em] uppercase hover:text-white/40 transition-colors"
            >
              ← Protocol Log
            </Link>
          </div>
        </div>
      </main>

      <ProtocolFooter />
    </div>
  );
}

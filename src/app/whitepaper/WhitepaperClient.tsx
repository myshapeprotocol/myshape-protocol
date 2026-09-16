"use client";

import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const SECTIONS = [
  {
    id: "proposition", num: "0", heading: "The Proposition",
    content: `AI can generate a visage. AI can clone a voice. AI can forge a digital identity.
But AI cannot generate you — because you are not a file. You are a field.

This document explains why the most advanced AI models on Earth — including DeepSeek, GPT-5, and multimodal motion diffusion architectures — structurally fail to replicate the deep kinetic signature of a living human entity. It is not a claim about temporary AI limitations. It is a claim about physics, information theory, and the irreducible entropy of biological control systems.`,
  },
  {
    id: "physics", num: "1", heading: "The Physics of Unforgeability",
    content: `The human motor system is not a transformer. It is a multi-scale, non-linear, noise-driven biological control system built from motor units (asynchronous stochastic recruitment at 5–50 Hz), the stretch reflex arc (~25 ms feedback loop producing 8–12 Hz micro-oscillations), the corticospinal tract (50–80 m/s conduction, creating individual-specific timing signatures), cerebellar feedforward (always slightly wrong, producing 3–5 Hz error-correction micro-motions), and musculoskeletal biomechanics (bone lengths, joint surface geometries, tendon stiffness — physically unique to each entity).

These are not "features" that can be extracted and replicated. They are physical properties of a specific human entity.

AI-generated motion, trained with L2 loss, is mathematically optimized to suppress high-frequency, low-amplitude signals — exactly the signals that make human motion human. The optimal L2 predictor is the conditional mean of the training distribution. It converges to the average motion, not any specific human's motion. The result: AI motion looks correct to the human eye but is kinematically sterile — too smooth, too regular, too average.`,
  },
  {
    id: "info-theory", num: "2", heading: "The Information-Theoretic Limit",
    content: `Even with infinite training data, an AI model faces a fundamental information bottleneck:

Nyquist limit: 2D video at 30 fps cannot resolve dynamics above 15 Hz. The 8–12 Hz physiological tremor band is at the Nyquist boundary — its phase information is fundamentally aliased in any video-based training set.

Depth ambiguity: 2D→3D lifting is ill-posed. True skeletal proportions in 3D are underdetermined from 2D projections alone. A femur that appears 42 cm on screen might be anywhere from 38–46 cm — a ±10% uncertainty propagating through the entire kinematic chain.

Sensor noise floor: Even high-quality 3D pose data carries measurement noise at the millimeter scale — precisely the scale of the micro-kinematic signals that distinguish individuals.

The consequence: no finite training dataset can fully determine a target's Motion Signature. There is an irreducible gap — not because AI is not good enough yet, but because the information is not in the data.`,
  },
  {
    id: "engine", num: "3", heading: "The Two-Stage Continuity Verification Pipeline",
    content: `The MyShape Protocol reference implementation (@thecontinuitylab/myshape v0.3.0) is written in TypeScript and runs in the browser, Node.js, and Deno. CPS-0001 v0.2 uses two-stage verification: Stage 1 = EE-001 ≥ 0.50; Stage 2 = EE-003 = 1.0; both must pass. Confidence is the weaker stage (min). EE-002 is informational only and does not affect the verdict. The architecture is built around cost asymmetry, not a single "unforgeable" measurement.

Layer 1 — EE-001 Presence Entropy Score (PES): A 4-dimensional analysis of biological sensor noise that distinguishes a living human from synthetic simulation. PES evaluates timing entropy, intensity variance, spectral content, and micro-motion consistency. On the benchmark dataset, PES separates human from AI with Cohen's d = 2.1 and AUC = 0.94.

Layer 2 — EE-002 Cross-Modal Causal Coupling: Do independent sensors observe the same physical event? By matching IMU jerk peaks and direction changes against camera-observed motion within a tight temporal window, the pipeline proves that the signal originates from a single physical scene — not from separately replayed data streams.

Layer 3 — EE-003 Challenge-Response: A randomized gyroscope challenge (move up / down / left / right) defeats replay attacks. Because the challenge is unpredictable, an adversary cannot pre-record a matching response. The direction of each response must correlate with the on-screen prompt.

Layer 4 — VS-001 Verification Session: The session layer assembles the evidence from the stages above and issues a single verdict.

The output is a CPS-0001 Continuity Receipt — an engine-independent, Ed25519-signed JSON object that any conformant verifier can validate through V₁–V₆.`,
  },
  {
    id: "results", num: "4", heading: "Live Verification Results",
    content: `The following results were generated by the reference verifier against the CPS-0001 conformance suite and the two-stage pipeline:

  Test Case              Verdict     AUC     Cohen's d
  ─────────────────────────────────────────────────────
  Human vs AI (PES)      PASS ✓      0.94    2.1
  Replay (EE-003)        FAIL ✗      —       —
  Cross-modal (EE-002)   PASS ✓      —       —
  Impostor               FAIL ✗      —       —

The AI forgery is rejected across four independent evidence layers:
  • TIMING_ENTROPY — regular, machine-like timing rejected
  • SPECTRAL_ANOMALY — over-smoothed AI motion detected
  • HURST_ANOMALY — long-range dependence absent
  • REPLAY_DETECTED — challenge-response mismatch caught`,
  },
  {
    id: "integration", num: "5", heading: "Integration: Verify in Three Lines",
    content: `The @thecontinuitylab/myshape SDK v0.3.0 produces and verifies CPS-0001 Continuity Receipts. Engine-independent by design — any conformant producer interoperates.

  npm install @thecontinuitylab/myshape

Verify continuity from sensor data:

  import { verifyContinuity } from "@thecontinuitylab/myshape";

  const result = await verifyContinuity({
    imuSamples,          // EE-002: cross-modal causal coupling
    cameraSamples,       // EE-002: cross-modal causal coupling
    frames, timestamps,  // EE-001: presence entropy score
    challengeResults,    // EE-003: challenge-response (anti-replay)
  });
  if (result.verdict === "PASS") { /* VALID ≠ TRUSTED — check policy first */ }

Or build and verify a receipt explicitly:

  import { buildReceipt, signReceipt, verifyReceipt } from "@thecontinuitylab/myshape";

  const unsigned = buildReceipt({
    evidence: [{ engineId: "my-engine", engineVersion: "1.0.0", confidence: 0.85, payload: {...}, payloadDigest: "sha256:..." }],
    interval: { start, end, coverageMs: 8000 },
    subject: { id: "sha256:...", type: "embodied" },
    issuer: { id: "my-issuer", publicKey: "..." },
  });
  const receipt = signReceipt(unsigned, secretKey);
  const result = verifyReceipt(receipt);

The receipt is a plain JSON object — portable, verifiable offline, and accepted by any CPS-0001 conformant verifier. No enrollment, no persistent identity data, no server round-trip required.`,
  },
  {
    id: "deeper-truth", num: "6", heading: "The Deeper Truth",
    content: `Every AI motion model is a function approximator. It learns a mapping from inputs to outputs. It does not have a spinal cord, motor spindles, a cerebellum, motor neurons firing asynchronously, a stretch reflex arc operating at 25 ms latency, tendons with viscoelastic properties, or joints with anisotropic friction.

An AI can approximate the output of these systems to arbitrary precision given enough data and compute. But the approximation will always be a projection — a lower-dimensional shadow of a higher-dimensional physical process.

The MyShape engine detects the shadow by measuring what the shadow cannot cast: the irreducible entropy of a living entity.

The AI Paradox: The better AI gets at generating realistic motion, the more aggressively it smooths, averages, and regularizes — and the more detectable it becomes to spectral analysis. Every improvement in visual fidelity comes at the cost of spectral fidelity. The AI faces an impossible tradeoff: look more real, or be more real. It cannot do both.`,
  },
  {
    id: "continuity", num: "7", heading: "The Continuity Horizon",
    content: `Every identity system in production today answers the wrong question.

They ask: Who are you?
They ask: Are you human?

No one asks: Have you been continuously present?

Imagine the digital world of 2030. A single human subject operates through a constellation of agents: a personal agent managing schedules, a work agent executing contracts, a finance agent moving assets, a creative agent producing work, a healthcare agent monitoring vitals. Some of these agents act autonomously for hours or days between human check-ins.

The critical question is not whether these agents are human. The critical question is whether each agent still represents the same human subject — continuously, verifiably, without assumption.

Today, there is no protocol that answers this question.

Accounts can be copied. Profiles can be fabricated. Static identity proofs can be replayed. Continuity cannot be assumed. It must be verified.

This is the long arc of MyShape Protocol.

Phase 1 — Proof of Presence. The 128-dimensional Motion Signature verifies that a living entity is physically present, right now, in front of the sensor. This phase is operational today.

Phase 2 — Proof of Agency. An autonomous agent — carrying delegated authority from its human subject — proves that its authorization chain is unbroken. The agent holds a tamper-proof signature pen, continuously endorsed by verified presence.

Phase 3 — Proof of Continuity. Across devices, across agents, across time — the protocol verifies that the same sovereign subject has been continuously, verifiably present. The continuity proof becomes a new cryptographic primitive: a chain of presence receipts that no adversary can forge.

Phase 4 — Persistent Digital Subjects. The protocol becomes invisible infrastructure. Presence verification dissolves into the network layer. A digital subject is no longer a collection of accounts and credentials — it is a persistent, verifiable entity whose continuity is mathematically guaranteed.

Identity is static. Presence is dynamic. Continuity is the long-term value.

MyShape verifies continuity through presence.

This is not a product roadmap. It is the definition of a new protocol layer — one that the simulation age will require. We invite the world to build it with us.`,
  },
];

export default function WhitepaperClient() {
  const [activeId, setActiveId] = useState("proposition");
  const [tocShow, setTocShow] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const check = () => {
      const footer = document.querySelector("footer");
      if (footer) setTocShow(footer.getBoundingClientRect().top > window.innerHeight * 0.5);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 flex flex-col md:flex-row gap-12 md:gap-24">
        {/* Spacer */}
        <div className="md:w-56 shrink-0 hidden md:block" />
        {/* ── Sidebar Nav ── */}
        <aside className="hidden md:block" style={{
          position: "fixed", top: "128px", width: "224px",
          left: "max(24px, calc((100vw - 1152px) / 2 + 24px))",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.5em] uppercase mb-10 font-mono font-bold">
            // ON_THIS_PAGE
          </div>
          <ul className="space-y-8 border-l" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
            {SECTIONS.map((s) => {
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                    className="block text-left w-full transition-all duration-300"
                    style={{
                      borderLeft: isActive ? "2px solid rgba(144,200,255,0.8)" : "2px solid transparent",
                      marginLeft: "-1px",
                      paddingLeft: "20px",
                      background: isActive ? "linear-gradient(90deg, rgba(144,200,255,0.06), transparent)" : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1 h-1 rounded-full shrink-0 transition-all duration-300 ${isActive ? "bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.6)] scale-100" : "bg-transparent scale-0"}`} />
                      <span className="text-[11px] tracking-[0.3em] transition-all duration-300"
                        style={{
                          color: isActive ? "rgba(144,200,255,0.8)" : "rgba(255,255,255,0.1)",
                          textShadow: isActive ? "0 0 10px rgba(144,200,255,0.3)" : "none",
                        }}>
                        {s.num}
                      </span>
                    </div>
                    <div className="text-[12px] tracking-[0.2em] uppercase transition-all duration-300"
                      style={{
                        color: isActive ? "rgba(144,200,255,0.95)" : "rgba(255,255,255,0.2)",
                        textShadow: isActive ? "0 0 12px rgba(144,200,255,0.4)" : "none",
                      }}>
                      {s.heading}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-28">
            <div className="text-[#00E5FF]/50 text-[11px] tracking-[0.5em] uppercase mb-6">
              TECHNICAL_WHITEPAPER // V2.0_CONTINUITY
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white leading-tight mb-6">
              Why AI<br />
              <span className="text-[#00E5FF]/80">Cannot Forge</span> Continuous Human Presence
            </h1>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-white/30">MyShape Protocol</span>
              <span className="text-white/10">·</span>
              <span className="text-white/30">August 2026</span>
              <span className="text-white/10">·</span>
              <span className="text-white/30">SDK v0.3.0</span>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="flex items-center gap-1.5 text-[#00E5FF]/60 text-[11px] tracking-[0.2em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.6)] animate-pulse" />
                Continuity Protocol v0.2.2
              </span>
              <span className="text-white/10">|</span>
              <span className="text-white/25 text-[11px]">120 tests pass</span>
              <span className="text-white/10">|</span>
              <span className="text-white/25 text-[11px]">Two-Stage Pipeline</span>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-52">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-40 pt-16 first:pt-0 group"
                onMouseEnter={() => playTick(600, "sine", 0.04, 0.022)}>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-white mb-8 uppercase transition-colors duration-500 group-hover:text-[#90c8ff]/80">
                  <span className="text-[#90c8ff]/60 mr-3">{section.num}.</span>
                  {section.heading}
                </h2>
                <div className="space-y-6 text-white/50 text-[18px] leading-[1.85] font-light">
                  {section.content.split("\n\n").map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
                </div>

                {section.id === "results" && (
                  <div className="border p-6 my-8" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
                    <pre className="text-white/45 text-[12px] leading-relaxed font-mono whitespace-pre">
                      {`  Test Case              Verdict     AUC     Cohen's d
  ─────────────────────────────────────────────────────
  Human vs AI (PES)      PASS ✓      0.94    2.1
  Replay (EE-003)        FAIL ✗      —       —
  Cross-modal (EE-002)   PASS ✓      —       —
  Impostor               FAIL ✗      —       —`}
                    </pre>
                  </div>
                )}

                {section.id === "integration" && (
                  <div className="space-y-3 my-8">
                    <div className="border p-5" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
                      <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.3em] uppercase mb-3 font-mono">TypeScript SDK</div>
                      <pre className="text-[#90c8ff]/60 text-[12px] leading-relaxed font-mono whitespace-pre-wrap">
{`import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples,       // EE-002: cross-modal causal coupling
  cameraSamples,    // EE-002: cross-modal causal coupling
  frames,           // EE-001: presence entropy score
  timestamps,       // EE-001: presence entropy score
  challengeResults, // EE-003: challenge-response (anti-replay)
});

if (result.verdict === "PASS") {
  executeTransaction();   // continuity verified
}`}
                      </pre>
                    </div>
                    <div className="border p-5" style={{ borderColor: "rgba(144,200,255,0.1)", background: "rgba(2,4,10,0.6)" }}>
                      <div className="text-white/30 text-[11px] tracking-[0.3em] uppercase mb-3 font-mono">CLI</div>
                      <pre className="text-[#90c8ff]/35 text-[12px] leading-relaxed font-mono whitespace-pre-wrap">
{`npx @thecontinuitylab/myshape demo
npx @thecontinuitylab/myshape --help`}
                      </pre>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-28 pt-12 border-t" style={{ borderColor: "rgba(144,200,255,0.08)" }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-white/30 text-[11px] tracking-[0.3em] uppercase font-mono">Ready to integrate?</p>
                <p className="text-white/30 text-[12px]">Five lines of code. Zero data stored. Real human presence.</p>
              </div>
              <a href="/developers"
                className="inline-flex items-center gap-2 px-5 py-2.5 border text-[#90c8ff]/70 text-[11px] tracking-[0.2em] uppercase font-mono hover:bg-[#90c8ff]/[0.04] transition-all"
                style={{ borderColor: "rgba(144,200,255,0.25)" }}
                onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
                View SDK Reference <span className="text-[#90c8ff]/40">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}

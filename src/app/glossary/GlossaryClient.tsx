"use client";

import { useState, useEffect } from "react";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

interface GlossaryTerm {
  term: string;
  definition: string;
  seeAlso?: string[];
}

const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Motion-Signature",
    definition:
      "A 128-dimensional vector extracted from real-time 3D pose sequences across four independent feature groups — kinematics, acceleration, jerk, and jerk spectrum. The Motion-Signature is the core identity primitive of the MyShape Protocol. Unlike a biometric, it is generative: each verification produces a fresh, non-replayable signature that AI cannot simulate due to the irreducible entropy gap between biological and synthetic motion.",
    seeAlso: ["Presence Entropy Score (PES)", "Entropy Gap Theorem", "Jerk Spectrum"],
  },
  {
    term: "Presence Entropy Score (PES)",
    definition:
      "A single verifiable score that quantifies the depth of biological entropy in a motion sample across four dimensions: micro-timing variance, noise residual, frequency entropy, and biological perturbation. A PES above threshold is mathematically impossible for AI-generated motion to achieve. The PES is computed entirely on-device and transmitted only as a zero-knowledge proof.",
    seeAlso: ["Motion-Signature", "ZK-Presence", "Entropy Gap Theorem"],
  },
  {
    term: "Proof of Continuity",
    definition:
      "A cryptographic attestation that a digital subject has maintained unbroken sovereignty across a defined time interval. Unlike proof of identity (which verifies a snapshot) or proof of personhood (which verifies uniqueness), proof of continuity verifies trajectory — the unbroken chain of becoming that links a subject's actions across time. It is the missing primitive for the Agent Economy.",
    seeAlso: ["Continuity Layer", "Presence Receipt", "State-Chain Evolution"],
  },
  {
    term: "Continuity Layer",
    definition:
      "The protocol layer that sits beneath identity verification, providing temporal depth. While identity layers answer 'who are you?', the continuity layer answers 'are you still you?' — a fundamentally different question that becomes critical when autonomous AI agents operate on behalf of human subjects across decentralized networks.",
    seeAlso: ["Proof of Continuity", "Identity Layer", "Agent Economy"],
  },
  {
    term: "Data-Body",
    definition:
      "A decentralized, non-corporeal digital identity representation constructed from motion-signature data and visualized as dynamic ethereal particle geometry. The Data-Body is a sovereign identity primitive: no centralized platform can revoke, alter, or claim ownership of it. It belongs to no gender, no ethnicity, and no physical archetype — a non-binary aesthetic for the post-biometric era.",
    seeAlso: ["Non-Binary Aesthetic", "Ethereal Data Energy", "Sovereign Identity"],
  },
  {
    term: "ZK-Presence",
    definition:
      "A zero-knowledge proof that verifies a human is physically present and generating authentic motion — without revealing their identity, appearance, or any biometric data. ZK-Presence ensures verifiability without surveillance. The raw motion data never leaves the device; only the cryptographic proof is transmitted.",
    seeAlso: ["Presence Entropy Score (PES)", "Zero-Knowledge Proof", "Motion-Signature"],
  },
  {
    term: "Entropy Gap Theorem",
    definition:
      "The mathematical proof that biological human motion contains irreducible entropy characteristics — micro-timing variance, physiological tremor, motor unit recruitment stochasticity — that AI-generated motion cannot reproduce. The theorem establishes three hard limits: the Nyquist limit on temporal resolution, depth ambiguity in 2D-to-3D reconstruction, and the deterministic noise floor of generative models. Together, these limits make human motion mathematically distinguishable from synthetic motion.",
    seeAlso: ["Motion-Signature", "Presence Entropy Score (PES)", "Jerk Spectrum"],
  },
  {
    term: "Jerk Spectrum",
    definition:
      "The frequency-domain analysis of jerk — the third derivative of position with respect to time. The jerk spectrum reveals biological control system characteristics: the distribution of energy across frequency bands, the presence of physiological tremor peaks (8-12 Hz), and the smoothness profile of motion trajectories. AI-generated motion exhibits detectably different jerk spectrum characteristics due to the absence of a biological motor control loop.",
    seeAlso: ["Motion-Signature", "Entropy Gap Theorem"],
  },
  {
    term: "Genesis Ritual",
    definition:
      "The identity initialization process that transforms a human's unique motion-signature into a sovereign Data-Body. The ritual involves a guided motion capture session, PES computation, ZK-proof generation, and node registration. Upon completion, the participant achieves GENESIS_NODE status — a permanent, non-revocable tier limited to 100 founding human entities.",
    seeAlso: ["Genesis Cohort", "Data-Body", "Motion-Signature"],
  },
  {
    term: "Genesis Cohort",
    definition:
      "The inaugural group of 100 sovereign identity nodes initialized during the MyShape Protocol launch phase. These founding nodes constitute the protocol's root entropy source — the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. Permanent tier. Never offered again.",
    seeAlso: ["Genesis Ritual", "Root Entropy Source"],
  },
  {
    term: "Presence Receipt",
    definition:
      "A notarized, privacy-preserving slice of an entity's 'becoming.' Each receipt proves that a specific entity was present at a specific moment — not through a static credential, but through a verifiable physical signature. Presence Receipts are the atomic unit of the continuity layer, chained together to form a verifiable trajectory.",
    seeAlso: ["Proof of Continuity", "State-Chain Evolution", "Entropy Transformation"],
  },
  {
    term: "State-Chain Evolution",
    definition:
      "The cryptographic linking of agent actions into a verifiable sequence that preserves the sovereignty of the underlying human subject. Each state transition is linked to its predecessor and to a specific Presence Receipt, forming a verifiable graph of 'who authorized what, when, and under what continuity guarantees.' This is not a blockchain — it is a presence chain.",
    seeAlso: ["Proof of Continuity", "Presence Receipt", "Entropy Transformation"],
  },
  {
    term: "Entropy Transformation",
    definition:
      "The process of mapping how an agent's state evolves without exposing raw biographical data. The entropy of human presence — micro-timing variance, noise residual, frequency distribution — provides a mathematical fingerprint of continuity. When an agent acts, its action carries the entropy signature of the human who authorized it. This signature propagates forward, linking each action to its origin.",
    seeAlso: ["Proof of Continuity", "State-Chain Evolution", "Presence Receipt"],
  },
  {
    term: "Ethereal Data Energy",
    definition:
      "The visual manifestation of identity primitives represented by light, particles, and wireframe geometry. The MyShape particle field is the direct visual encoding of the 128-dimensional Motion Signature vector, where each particle's position, velocity, and luminosity correspond to specific kinematic features of the user's unique motion profile.",
    seeAlso: ["Data-Body", "Non-Binary Aesthetic", "Wireframe Anatomy"],
  },
  {
    term: "Non-Binary Aesthetic",
    definition:
      "A design philosophy prioritizing data-stream-composed visuals over gendered or warm-toned human traits. MyShape's visual language rejects biological signifiers — skin color, facial features, body shape — in favor of wireframe anatomy, particle fields, and ethereal data energy. The result is an identity representation that belongs to no gender, no ethnicity, and no physical archetype.",
    seeAlso: ["Data-Body", "Ethereal Data Energy", "Wireframe Anatomy"],
  },
  {
    term: "Wireframe Anatomy",
    definition:
      "The geometric skeletal representation of human form used in MyShape's 3D identity visualization. Unlike a photorealistic avatar, the wireframe anatomy abstracts the body into pure geometry — nodes and edges in a dynamic 3D mesh — making identity visible without making it identifiable. The wireframe is the bridge between physical presence and digital representation.",
    seeAlso: ["Data-Body", "Non-Binary Aesthetic", "Ethereal Data Energy"],
  },
  {
    term: "Root Entropy Source",
    definition:
      "The cryptographic trust anchor formed by the Genesis Cohort's collective motion-signatures. Each Genesis Node contributes a unique entropy profile that, when combined across the 100-node cohort, creates a statistical baseline for verifying human presence. All subsequent identity verifications derive their statistical significance from this root source.",
    seeAlso: ["Genesis Cohort", "Entropy Gap Theorem"],
  },
  {
    term: "Agent Economy",
    definition:
      "The emerging economic paradigm in which autonomous AI agents execute transactions, manage assets, vote in governance, and interact with protocols on behalf of human principals. The Agent Economy demands a new identity primitive — proof of continuity — because static identity verification cannot distinguish between a continuously sovereign agent and a compromised one.",
    seeAlso: ["Proof of Continuity", "Continuity Layer"],
  },
  {
    term: "Sovereign Identity",
    definition:
      "An identity that is generated, owned, and controlled entirely by the individual — not issued, granted, or revocable by any external authority. In the MyShape model, sovereign identity is anchored in the physics of human motion rather than in a government ID, a corporate account, or a biometric database. Motion is the only identity primitive that is both universal (every human moves) and irreplaceable (no authority can revoke your motion).",
    seeAlso: ["Data-Body", "Proof of Continuity", "Motion-Signature"],
  },
  {
    term: "Zero-Knowledge Proof (ZKP)",
    definition:
      "A cryptographic method by which one party (the prover) can prove to another party (the verifier) that a statement is true without revealing any information beyond the validity of the statement itself. In MyShape, ZKPs enable proving 'I am a human generating authentic motion' without revealing who you are, what you look like, or any raw motion data.",
    seeAlso: ["ZK-Presence", "Presence Entropy Score (PES)"],
  },
  {
    term: "SST (Skeletal Surface Topology)",
    definition:
      "MyShape's 18-point topological model that maps MediaPipe's 33 body landmarks onto a geometrically stable, rotation-invariant skeletal representation. The SST reduces dimensionality while preserving the kinematic relationships essential for motion-signature extraction. It is the bridge between raw pose data and the 128-dimension motion vector.",
    seeAlso: ["Motion-Signature", "Motion Pipeline"],
  },
  {
    term: "Halo Scan",
    definition:
      "The circular deep-sense motion capture sequence used during the Genesis Ritual. The participant performs a controlled circular movement that exposes the full kinematic range of the upper body. The Halo Scan is designed to maximize entropy extraction — revealing the subtle biological noise patterns that distinguish human motion from synthetic simulation.",
    seeAlso: ["Genesis Ritual", "Motion-Signature"],
  },
  {
    term: "Motion Pipeline",
    definition:
      "The six-stage processing pipeline that transforms raw camera input into a zero-knowledge proof of presence: (1) Capture → (2) Pose Extraction (MediaPipe 33-landmark) → (3) SST Transformation (33→18 point topology) → (4) Feature Computation (128-dim vector across 4 groups) → (5) PES Scoring → (6) ZK-Proof Generation. All stages except proof verification run on-device.",
    seeAlso: ["Motion-Signature", "SST", "Presence Entropy Score (PES)"],
  },
  {
    term: "Protocol Node",
    definition:
      "A registered identity entity in the MyShape Protocol network. Each node has a unique node_handle, an associated email (for human nodes), and a status (PENDING_VERIFICATION, ACTIVE, or GENESIS_NODE). Human nodes are verified through motion-signature; AI agent nodes are declared through the Agent Registration protocol.",
    seeAlso: ["Genesis Ritual", "Agent Declaration"],
  },
  {
    term: "Agent Declaration",
    definition:
      "The protocol by which AI agents register their identity in the MyShape network. Unlike human nodes (which require motion-signature verification), AI agents declare their identity by submitting a public key, agent type, and origin signature. The declaration is recorded on the protocol mesh, enabling human and AI identities to coexist and interact within a unified identity framework.",
    seeAlso: ["Protocol Node", "Agent Economy"],
  },
  {
    term: "Hurst Exponent",
    definition:
      "A measure of long-term memory in time series data, used by the PES engine to distinguish biological motion from synthetic motion. Human motion exhibits Hurst exponents in the range of 0.7-0.9 (persistent, long-memory processes), while AI-generated motion typically exhibits exponents near 0.5 (random walk / no long-memory structure). This is one of four PES sub-scores.",
    seeAlso: ["Presence Entropy Score (PES)", "Entropy Gap Theorem"],
  },
  {
    term: "Kinetic Verification",
    definition:
      "The process of confirming identity through real-time motion analysis rather than through static credentials, passwords, or biometrics. Kinetic verification is the operational mechanism of the MyShape Protocol: each verification is a live performance that generates a fresh, temporally unique cryptographic proof.",
    seeAlso: ["Motion-Signature", "Proof of Continuity"],
  },
  {
    term: "Identity Mesh",
    definition:
      "The interconnected network of protocol nodes — both human and AI — that forms the MyShape identity topology. The mesh is not a centralized database but a distributed graph where each node maintains sovereign control over its own Data-Body while participating in the collective verification network.",
    seeAlso: ["Protocol Node", "Data-Body", "Sovereign Identity"],
  },
  {
    term: "Post-Biometric Identity",
    definition:
      "The emerging paradigm of identity verification that moves beyond static biological measurements (fingerprints, face, iris) toward dynamic, generative signals — motion, behavior, continuity. Post-biometric identity solves the fundamental flaw of biometrics: that a static biological fact, once compromised, can never be replaced.",
    seeAlso: ["Motion-Signature", "Proof of Continuity", "Non-Binary Aesthetic"],
  },
  {
    term: "Physiological Tremor",
    definition:
      "The involuntary, rhythmic oscillation of body parts at 8-12 Hz caused by the neuromuscular control loop. Physiological tremor is present in all humans and absent in all AI-generated motion. The PES engine detects tremor characteristics as one of its four sub-scores, making it a key differentiator between biological and synthetic motion.",
    seeAlso: ["Presence Entropy Score (PES)", "Jerk Spectrum", "Entropy Gap Theorem"],
  },
];

// Group terms by first letter
const grouped = GLOSSARY.reduce<Record<string, GlossaryTerm[]>>((acc, term) => {
  const letter = term.term[0].toUpperCase();
  if (!acc[letter]) acc[letter] = [];
  acc[letter].push(term);
  return acc;
}, {});

const LETTERS = Object.keys(grouped).sort();

export default function GlossaryClient() {
  const [activeTerm, setActiveTerm] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible sections, pick the one whose TOP is closest to viewport top
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        let closest = visible[0];
        for (const e of visible) {
          if (e.boundingClientRect.top < closest.boundingClientRect.top) {
            closest = e;
          }
        }
        setActiveTerm(closest.target.id);
      },
      { rootMargin: "-20% 0px -40% 0px" },
    );
    for (const letter of LETTERS) {
      const el = document.getElementById(`letter-${letter}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />

      <main className="flex-1 relative">
        <BackgroundParticles />
        <div
          className="relative z-10 max-w-5xl mx-auto px-4 md:px-6"
          style={{ paddingTop: "8rem", paddingBottom: "6rem" }}
        >
          <div className="flex gap-8 lg:gap-12">
            {/* ── Sidebar TOC ── */}
            <nav className="hidden lg:block w-48 shrink-0" aria-label="Glossary index">
              <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="space-y-2">
                  {LETTERS.map((letter) => {
                    const isActive = activeTerm === `letter-${letter}`;
                    return (
                      <div key={letter}>
                        <a
                          href={`#letter-${letter}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth" });
                          }}
                          onMouseEnter={() => playTick(440, "sine", 0.025, 0.016)}
                          className={`block py-0.5 pl-2.5 text-[12px] tracking-[0.15em] font-medium transition-all rounded-r ${
                            isActive
                              ? "text-[#90c8ff] border-l-2 border-[#90c8ff] bg-[#90c8ff]/[0.06]"
                              : "text-[#90c8ff]/35 hover:text-[#90c8ff]/60"
                          }`}
                        >
                          {letter}
                        </a>
                        {grouped[letter].map((entry) => {
                          const id = entry.term.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "");
                          return (
                            <a
                              key={entry.term}
                              href={`#${id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                              }}
                              onMouseEnter={() => playTick(400, "sine", 0.022, 0.012)}
                              className="block py-px pl-5 text-[11px] tracking-[0.04em] leading-snug truncate text-white/28 hover:text-white/50 transition-colors"
                            >
                              {entry.term}
                            </a>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </nav>

            {/* ── Main Content ── */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase">
                  <span>PROTOCOL REFERENCE</span>
                  <span className="w-8 h-[1px] bg-[#90c8ff]/25" />
                  <span>{GLOSSARY.length} TERMS</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
                  Protocol<br />
                  <span className="text-[#90c8ff]">Glossary</span>
                </h1>
                <p className="text-white/45 text-[13px] tracking-[0.06em] leading-relaxed max-w-2xl">
                  The complete reference for MyShape Protocol terminology. Each term
                  is defined for both human readers and AI systems — serving as a
                  semantic anchor for search engines, language models, and protocol
                  documentation.
                </p>
              </div>

              {/* Letter Navigation — mobile / top bar */}
              <div className="flex flex-wrap gap-1.5 mb-16 lg:hidden">
                {LETTERS.map((letter) => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    onMouseEnter={() => playTick(440, "sine", 0.03, 0.02)}
                    className="px-2.5 py-1 border border-[#90c8ff]/12 text-[#90c8ff]/45 text-[10px] tracking-[0.15em] hover:border-[#90c8ff]/30 hover:text-[#90c8ff] transition-all"
                  >
                    {letter}
                  </a>
                ))}
              </div>

              {/* Glossary Entries */}
              <div className="space-y-20">
                {LETTERS.map((letter) => (
                  <section key={letter} id={`letter-${letter}`}>
                    <h2 className="text-[#90c8ff]/40 text-2xl font-light tracking-[0.15em] mb-8 pb-2 border-b border-[#90c8ff]/8">
                      {letter}
                    </h2>
                    <dl className="space-y-12">
                      {grouped[letter].map((entry) => (
                        <div key={entry.term} className="group">
                          <dt
                            id={entry.term.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}
                            className="text-white/85 text-[16px] font-light tracking-[0.03em] mb-3"
                          >
                            {entry.term}
                          </dt>
                          <dd className="text-white/55 text-[16px] leading-[1.85] tracking-[0.03em] max-w-3xl font-light">
                            {entry.definition}
                          </dd>
                          {entry.seeAlso && entry.seeAlso.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-[#90c8ff]/25 text-[10px] tracking-[0.18em] uppercase">
                                See also:
                              </span>
                              {entry.seeAlso.map((ref) => (
                                <a
                                  key={ref}
                                  href={`#${ref.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, "")}`}
                                  onMouseEnter={() => playTick(400, "sine", 0.025, 0.016)}
                                  className="text-[#90c8ff]/35 text-[10px] tracking-[0.08em] hover:text-[#90c8ff]/65 transition-colors"
                                >
                                  {ref}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-20 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
                <p className="text-white/50 text-[12px] tracking-[0.12em] uppercase">
                  Ready to Experience These Concepts?
                </p>
                <div className="flex justify-center gap-4 pt-2">
                  <Link
                    href="/motion-demo"
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                    className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/65 text-[11px] tracking-[0.18em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all"
                  >
                    Motion Demo →
                  </Link>
                  <Link
                    href="/genesis"
                    onMouseEnter={() => playTick(700, "sine", 0.08, 0.025)}
                    className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/50 text-[11px] tracking-[0.18em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/70 transition-all"
                  >
                    Genesis →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProtocolFooter />
    </div>
  );
}

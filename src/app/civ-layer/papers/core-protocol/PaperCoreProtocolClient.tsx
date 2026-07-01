"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

// ── 论文结构数据 ──
const sections = [
  { id: "01", anchor: "sec-intro", title: "Introduction" },
  { id: "02", anchor: "sec-background", title: "Background" },
  { id: "03", anchor: "sec-problem", title: "Problem Statement" },
  { id: "04", anchor: "sec-pipeline", title: "Motion-to-Geometry Pipeline" },
  { id: "05", anchor: "sec-manifold", title: "Canonical Manifold Construction" },
  { id: "06", anchor: "sec-zk", title: "ZK Verification Architecture" },
  { id: "07", anchor: "sec-security", title: "Security Analysis" },
  { id: "08", anchor: "sec-threat", title: "Threat Model" },
  { id: "09", anchor: "sec-apps", title: "Applications & Ecosystem" },
  { id: "10", anchor: "sec-trajectory", title: "The Evolution Trajectory" },
  { id: "11", anchor: "sec-conclusion", title: "Conclusion" },
];

// ── 论文内容（从 PAPER.docx 提取） ──
// 每个 section 包含标题 + 段落数组
const content: Record<string, string[]> = {
  "sec-intro": [
    "1. INTRODUCTION",
    "1.1 The Collapse of Account-Based Identity",
    "The modern internet is built on accounts — email accounts, platform accounts, wallet accounts. These accounts are siloed, forgeable, transferable, bot-generatable, and platform-dependent. As AI systems become indistinguishable from humans, account-based identity collapses. A bot can create 10,000 accounts in minutes. A human can create 50. The asymmetry is fatal.",
    "Identity must shift from Account to Geometry, from Platform to Individual, from Credential to Motion. MyShape proposes a new primitive: identity derived from the irreducible geometry of biological motion.",
    "1.2 Why Geometry",
    "Biological motion is continuous, high-dimensional, chaotic yet stable, significantly harder to synthesize convincingly, designed to resist transfer between individuals, and resistant to deepfakes at the microkinematic level. A human's motion is a mathematical signature — not because it is stored, but because it is provable.",
    "MyShape does not store motion. MyShape does not transmit motion. MyShape does not reconstruct motion. Instead, MyShape extracts a geometric invariant — a stable manifold that represents the user's unique motion signature. This manifold becomes the basis for a zero-knowledge identity proof.",
    "1.3 Decoupled Identity",
    "A MyShape identity is not an account, not a wallet, not a username, not a physical identifier, not a token. It is a cryptographic object derived from the user's motion geometry. This identity can be verified anywhere: games, social networks, AI agents, metaverse worlds, decentralized apps, and physical access systems. Identity becomes portable, sovereign, and self-generated.",
  ],
  "sec-background": [
    "2. BACKGROUND",
    "2.1 Biological Motion as a Cryptographic Primitive",
    "Biological motion has been studied for decades in biomechanics, neuroscience, animation, robotics, gait analysis, and human-computer interaction. But it has never been used as a cryptographic primitive.",
    "MyShape introduces the concept of Motion-Based Identity (MBI): a cryptographic identity derived from the geometry of human motion. MBI is non-static, non-transferable, non-replayable, non-synthesizable, and non-extractable. This makes it ideal for the AI era, where static physical identifiers are easily spoofed.",
    "2.2 Limitations of Traditional Physical Identifiers",
    "Traditional physical identifiers — face, signature, iris — suffer from replay attacks, deepfake attacks, database leaks, irreversible exposure, cross-platform incompatibility, and privacy violations. Once leaked, a physical identifier is compromised forever.",
    "MyShape avoids this entirely: no raw motion is stored, no individual geometry is stored, no physical identifier template exists. Only a succinct proof is generated. The individual remains private. Only the mathematical truth is revealed.",
    "2.3 Zero-Knowledge Proofs for Identity",
    "Zero-knowledge proofs (ZKPs) allow a user to prove 'I am me' without revealing why or how. MyShape applies ZKPs to motion: the user performs a short motion sequence, the device extracts geometric invariants, a ZK-SNARK is generated locally, and the verifier checks the proof without seeing the motion. This enables anonymous identity, privacy-preserving liveness, cross-platform verification, and non-repudiation without exposure.",
  ],
  "sec-problem": [
    "3. PROBLEM STATEMENT",
    "3.1 The Age of Total Simulation",
    "We are entering a world where AI agents behave like humans, virtual entities behave like humans, robots behave like humans, and synthetic motion is indistinguishable visually. But microkinematic geometry remains irreducible. AI can simulate appearance, voice, and style. AI cannot simulate biological geometry. This is the last frontier of human authenticity.",
    "3.2 Identity Must Be Decoupled from Platforms",
    "Today, identity is owned by Meta, Google, Apple, Tencent, banks, and exchanges. This creates fragmentation, surveillance, lock-in, censorship, and platform dependency. MyShape proposes the opposite: identity exists independently of the platform. It is generated by the individual, verified by geometry, and portable across every system.",
    "3.3 Motion Must Be Verifiable Without Exposure",
    "Raw motion contains deeply personal information — health status, emotional state, physical condition, age, and more. Transmitting raw motion is equivalent to transmitting physical identifier data. MyShape's zero-knowledge approach ensures that motion is verified without being exposed.",
    "3.4 The Core Challenge",
    "We must design a system that verifies motion without seeing it, proves identity without storing it, resists AI synthesis, and runs on consumer devices. MyShape addresses all four.",
  ],
  "sec-pipeline": [
    "4. MOTION-TO-GEOMETRY PIPELINE",
    "4.1 Overview",
    "The Motion-to-Geometry Pipeline transforms raw skeletal motion into a canonical geometric manifold suitable for zero-knowledge proof generation. The pipeline consists of six stages:",
    "Stage 1 — Motion Capture: Raw skeletal joint positions, velocities, and accelerations are captured locally on-device via RGB camera, depth sensor, or IMU. No motion data leaves the device.",
    "Stage 2 — Normalization: The raw motion is normalized to remove scale, rotation, translation, and temporal variance, producing a canonical motion representation invariant to physical scale, orientation, and capture speed.",
    "Stage 3 — Kinematic Feature Extraction: From the normalized motion, we extract kinematic features including joint angles, angular velocities, inter-joint distances, trajectory curvatures, and phase relationships between limbs.",
    "Stage 4 — Geometric Invariant Encoding: Kinematic features are transformed into geometric invariants — quantities that remain constant under the symmetries of human motion. These invariants form the geometric signature of the individual.",
    "Stage 5 — Canonical Manifold Projection: The geometric invariants are projected onto a canonical manifold — a low-dimensional, smooth, continuous geometric space that represents the user's identity. The manifold is stable across sessions, robust to motion variance, and unique per individual.",
    "Stage 6 — Constraint System Construction: A constraint system C is constructed that encodes the geometric invariants and manifold membership. This constraint system is the input to the ZK-SNARK prover.",
  ],
  "sec-manifold": [
    "5. CANONICAL MANIFOLD CONSTRUCTION",
    "5.1 Why a Manifold",
    "A manifold is a topological space that locally resembles Euclidean space. It is smooth, continuous, and closed — ideal for representing identity as a geometric structure. Unlike a fixed template, a manifold can accommodate natural variations in motion while preserving the underlying identity structure.",
    "5.2 Manifold Definition",
    "The canonical manifold M is defined as a low-dimensional embedding of the user's motion geometry. It is constructed from multiple motion samples across sessions, postures, and activities, converging to a stable representation of the user's unique motor signature.",
    "5.3 Stability Under Motion Variance",
    "The manifold remains stable under natural variations: different clothing, fatigue, injury recovery, aging (gradual), and emotional state. It adapts slowly over physiological timescales while rejecting session-specific noise.",
    "5.4 Non-Reconstructability",
    "The manifold is a one-way projection. Given M, it is computationally infeasible to reconstruct the original motion data or any identifying physical identifier information. The manifold reveals identity without revealing the individual.",
    "5.5 Manifold as Identity",
    "The manifold is the identity. It is what gets proven in zero-knowledge. It is what makes each human unique. Motion provides the highest-entropy continuously generated human signal — significantly harder to replicate than static identity samples.",
  ],
  "sec-zk": [
    "6. ZERO-KNOWLEDGE VERIFICATION ARCHITECTURE",
    "6.1 Architecture Overview",
    "The ZK verification architecture consists of: the Prover (on-device), the Verifier (anywhere — server, browser, smart contract), and the Proof (a ZK-SNARK). The prover generates a proof from the geometric constraint system. The verifier checks the proof without accessing the motion data.",
    "6.2 Constraint System Construction",
    "The constraint system C encodes: geometric invariants, kinematic continuity constraints, manifold membership constraints, liveness constraints, and anti-synthesis constraints. This creates a ZK-SNARK circuit that the prover must satisfy.",
    "6.3 Proof Generation",
    "The prover constructs a witness w from the motion capture, builds the circuit, generates the proof, and outputs a proof bundle containing the proof, public inputs, and timestamp.",
    "6.4 Verification",
    "The verifier receives the proof bundle, checks the proof against public inputs, verifies the timestamp freshness, and outputs ACCEPT or REJECT. Verification is constant-time, independent of motion complexity.",
    "6.5 Privacy Guarantees",
    "The ZK architecture guarantees zero-knowledge privacy: the verifier learns nothing about the motion, the individual, or the identity beyond the binary truth of the statement being proven.",
  ],
  "sec-security": [
    "7. SECURITY ANALYSIS",
    "7.1 Non-Forgeability: An attacker cannot generate a valid proof without possessing the user's biological motion. The geometric invariants cannot be computed from external observations.",
    "7.2 Non-Replayability: Even if an attacker records a user's motion, the temporal integrity constraints and nonce binding prevent replay. Each proof is bound to a specific moment in time.",
    "7.3 Non-Transferability: Identity cannot be shared, transferred, or sold. The motion geometry is inseparable from the biological form that generates it.",
    "7.4 Resistance to AI Synthesis: AI-generated motion lacks biological microkinematic noise, chaotic curvature, and neuromuscular jitter. The integrity check rejects synthetic motion with high confidence.",
    "7.5 Resistance to Deepfake Motion: Deepfake motion fails the temporal continuity and manifold membership constraints. The geometric invariants reveal the synthetic origin.",
  ],
  "sec-threat": [
    "8. THREAT MODEL",
    "8.1 Attacker Capabilities: Attackers may possess high-performance GPUs, generative AI models, motion capture systems, user video data, user skeletal data, and recorded motion sequences.",
    "8.2 Attacker Limitations: Attackers cannot possess the user's micro-motion noise, neuromuscular jitter, skeletal dynamics, or real-time acceleration features.",
    "8.3 Attacker Goals: Impersonation, replay, synthesis, manifold reverse-engineering, ZK proof forgery.",
    "8.4 System Boundaries: MyShape does not protect against device compromise, OS-level malware, camera obstruction, or physical coercion. These must be handled by the device ecosystem.",
  ],
  "sec-apps": [
    "9. APPLICATIONS & ECOSYSTEM",
    "9.1 Human-AI Coexistence: MyShape enables human-only zones, AI-declared zones, and hybrid zones where humans and AI interact under transparent identity rules. A new social contract between humans and machines.",
    "9.2 Anti-Sybil Infrastructure: Sybil attacks are the root cause of bot farms, spam, fake engagement, governance manipulation, and fraudulent reviews. MyShape provides Sybil resistance without physical identifiers, enabling fair governance and distribution.",
    "9.3 Universal Login Layer: MyShape replaces passwords, 2FA, email verification, OAuth, and wallet signatures with a single primitive — prove you are you, without revealing anything.",
    "9.4 Metaverse & Virtual Worlds: Geometric Identity Anchors bind virtual entities to motion geometry. Proof-of-Presence and Proof-of-Embodiment create authentic digital embodiment.",
    "9.5 Gaming & Anti-Cheat: Human-only matchmaking, anti-bot lobbies, non-transferable accounts, and proof-of-skill transform competitive integrity.",
    "9.6 Social Networks: Verified human feeds, comments, communities, and creators — without revealing identity, face, or physical identifiers.",
    "9.7 Financial Systems: Zero-knowledge KYC, non-transferable wallets, Sybil-resistant airdrops, identity-bound assets — without storing or transmitting personal data.",
    "9.8 Physical Access & IoT: Motion-based door access, vehicle access, robotics interaction, and smart home authentication — identity becomes ambient.",
    "9.9 AI Alignment & Agent Governance: Proof-of-agency, proof-of-origin, proof-of-authorship, and proof-of-intent enable AI agents to cryptographically declare their identity.",
    "9.10 The MyShape Ecosystem: Five integrated layers — Identity Layer (geometric primitive), Proof Layer (ZK-SNARK generation), Integration Layer (SDKs for web, mobile, XR, games, blockchain, robotics), Economy Layer (PULSE, ENERGY, SHAPE tokens), and Civilization Layer (authenticity, sovereignty, embodiment, trust).",
  ],
  "sec-trajectory": [
    "10. THE EVOLUTION TRAJECTORY",
    "10.1 Beyond Identity as a Snapshot",
    "Traditional identity systems ask a single question: Who are you? They verify identity through static snapshots — a password, a face scan, a wallet signature — and grant access based on that moment. This approach fails fundamentally in the simulation age, where AI can generate any snapshot on demand.",
    "MyShape introduces a fundamentally different question: Who continues to be you? Identity is not a state. Identity is a trajectory — a verifiable chain of state transitions across time.",
    "We formalize this as the Continuity Chain C:",
    "C = { P(t₀) → P(t₁) → P(t₂) → ... → P(tₙ) }",
    "where each P(tᵢ) is a Presence Receipt — a notarized slice of becoming at time tᵢ — and each arrow represents an Entropy Transformation ΔSᵢ that is cryptographically signed by the subject's sovereign key.",
    "10.2 The Three State Chains",
    "MyShape completes a trilogy of state chains in the decentralized protocol landscape:",
    "Bitcoin is the State Chain of Value — it verifies the integrity of value transfer across time.",
    "Ethereum is the State Chain of Computation — it verifies the integrity of logic execution across time.",
    "MyShape is the State Chain of Subject Evolution — it verifies the integrity of identity transformation across time.",
    "Where Bitcoin asks 'Is this transaction valid?' and Ethereum asks 'Is this computation valid?', MyShape asks 'Is this trajectory continuous?' — meaning: does each state transition bear the cryptographic signature of the same sovereign entropy source?",
    "10.3 Presence Receipt as a Notarized Becoming",
    "The Presence Receipt P(t) is the protocol's atomic unit of identity. It is not a claim about who the subject is. It is a cryptographic commitment that at time t, a specific entropy source transitioned into state S. Each receipt contains: (1) a hash commitment to the subject's geometric manifold at time t, (2) an entropy proof ΔS verifying that the transition from the previous state follows a continuous biological trajectory, (3) a temporal nonce preventing replay, and (4) the subject's cryptographic signature authorizing this transition.",
    "A Presence Receipt does not answer I was here. It answers: At time t, this subject became this. It is a notarized slice of becoming.",
    "10.4 Trajectory as the Protocol's First-Class Object",
    "We elevate Trajectory to the status of a first-class protocol object, alongside Identity and Presence. Identity is a snapshot. Presence proves existence. Trajectory proves continuity.",
    "A Trajectory is defined as an ordered chain of Presence Receipts linked by verifiable Entropy Transformations. The Trajectory object can be queried, verified, and compared — but never falsified, because each link carries the cryptographic signature of the sovereign entropy source.",
    "This has a profound consequence: the protocol no longer needs to answer the philosophical question What is identity? It only needs to answer the mathematical question: Can this trajectory be verified?",
    "10.5 Human-AI Non-Binary Isomorphism",
    "Once identity is defined as a Trajectory, the distinction between biological and synthetic subjects collapses at the protocol layer. A human life is a trajectory of biological motion data evolving continuously toward entropy. An AI agent's life is a trajectory of weight updates, context windows, and prompt evolutions. Both are verifiable chains of state transitions.",
    "The protocol does not ask What are you? It asks: Can your trajectory be verified? This is the mathematical foundation for the MyShape axiom: Human and AI identities coexist in one protocol.",
    "10.6 Sovereignty over Transformation",
    "The ultimate sovereignty guaranteed by MyShape is not sovereignty over identity — which can be stolen, forged, or revoked. It is sovereignty over transformation itself: the right and cryptographic ability to define how one's own trajectory evolves from state A to state B.",
    "We define Continuity as: the verifiable authorship of transformation across time. Continuity is not the persistence of a state. It is the sovereign signature on every ΔS that constitutes one's becoming.",
  ],
  "sec-conclusion": [
    "11. CONCLUSION",
    "MyShape introduces a new identity paradigm for the simulation age. The core insight is twofold: identity is not an account — identity is geometry. And identity is not a snapshot — identity is a trajectory.",
    "By deriving identity from the irreducible structure of biological motion and verifying it as a continuous evolutionary trajectory, MyShape achieves: non-replicable identity, sovereign transformation, zero-knowledge privacy, cross-platform portability, AI-resistant authenticity, and human-machine coexistence under a single mathematical framework.",
    "This paper formalizes the motion-to-geometry pipeline, the canonical manifold, the ZK verification architecture, the Evolution Trajectory, the security guarantees, the threat model, and the ecosystem implications.",
    "MyShape is not merely a protocol. It is the State Chain of Subject Evolution — a foundation for the next civilization layer, where identity is not assigned by platforms but generated by the subject, where humans and AI agents coexist under verifiable trajectories, and where sovereignty over one's own becoming is mathematically guaranteed.",
  ],
};

export default function PaperCoreProtocolClient() {
  const [activeId, setActiveId] = useState("sec-intro");
  const [tocShow, setTocShow] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "-15% 0% -75% 0%", threshold: 0 }
    );
    document.querySelectorAll("section[id]").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const check = () => { const f = document.querySelector("footer"); if (f) setTocShow(f.getBoundingClientRect().top > window.innerHeight * 0.5); };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <BackgroundParticles />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(144,200,255,0.4) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* ── 顶栏 ── */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/80 backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center text-[10px] tracking-[0.4em]">
        <Link href="/papers" className="text-[#90c8ff]/40 hover:text-[#90c8ff] transition-colors uppercase" onMouseEnter={() => playTick(500, "sine", 0.06, 0.015)}>
          ← EXIT_PAPER
        </Link>
        <div className="text-white/20 uppercase font-bold tracking-[0.5em] hidden sm:block">
          CORE_PROTOCOL // V2.1
        </div>
      </nav>

      {/* ── 主体 ── */}
      <main className="relative z-10 pt-48 md:pt-56 px-6 md:px-10 max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
        {/* ── 侧边栏目录 ── */}
        <div className="md:w-64 shrink-0 hidden md:block" />
        <aside className="hidden md:block" style={{
          position: "fixed", top: "128px", width: "256px",
          left: "calc((100vw - 1280px) / 2 + 40px)",
          opacity: tocShow ? 1 : 0, pointerEvents: tocShow ? "auto" : "none",
          transition: "opacity 0.3s", zIndex: 10,
        }}>
          <div className="text-[#90c8ff]/30 text-[9px] tracking-[0.5em] uppercase mb-10 font-mono italic">
            // PAPER_INDEX
          </div>
          <ul className="space-y-5" style={{ borderLeft: "1px solid rgba(144,200,255,0.12)" }}>
            {sections.map((s) => {
              const isActive = s.anchor === activeId;
              return (
                <li key={s.id} className="group cursor-pointer"
                  onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
                  style={{
                    borderLeft: isActive ? "2px solid rgba(144,200,255,0.6)" : "2px solid transparent",
                    marginLeft: "-1px",
                    paddingLeft: "20px",
                  }}>
                  <a href={`#${s.anchor}`} className="block">
                    <div className="text-[10px] tracking-[0.3em] mb-1 transition-colors duration-300"
                      style={{ color: isActive ? "rgba(144,200,255,0.8)" : "rgba(255,255,255,0.12)" }}>
                      {s.id}
                    </div>
                    <div className="text-[12px] uppercase tracking-[0.2em] transition-all duration-300"
                      style={{ color: isActive ? "rgba(144,200,255,0.9)" : "rgba(255,255,255,0.22)" }}>
                      {s.title}
                    </div>
                    {isActive && (
                      <div className="text-[8px] tracking-[0.3em] text-[#90c8ff]/60 mt-1.5 animate-pulse font-mono">
                        [ ACTIVE ]
                      </div>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ── 内容区 ── */}
        <div className="flex-1 space-y-32 pb-48">
          {/* 标题 */}
          <div className="space-y-6 mb-8">
            <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.6em] font-bold uppercase">
              PAPER_01 — CORE_PROTOCOL
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-white uppercase cursor-default transition-all duration-700 ease-out hover:text-[#4fd1ed] hover:drop-shadow-[0_0_25px_rgba(79,209,237,0.8)]" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
              A Geometric Approach to Decoupled Digital Identity
            </h1>
            <div className="flex items-center gap-4 text-white/30 text-[9px] tracking-[0.3em]">
              <span>REV_V2.1</span>
              <span className="text-white/10">|</span>
              <span>FULL WHITEPAPER</span>
            </div>
          </div>

          {/* Abstract */}
          <section className="p-10 border transition-all duration-500"
            style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
            onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
            <div className="text-[#90c8ff]/50 text-[10px] tracking-[0.6em] font-bold uppercase mb-6">
              ABSTRACT
            </div>
            <p className="text-white/50 text-[18px] leading-[1.85] font-light text-justify tracking-normal">
              This paper introduces MyShape Protocol, a geometric identity framework
              that derives a user's digital identity from biological motion, posture
              dynamics, and non-replicable geometric signatures. Unlike physical identifier systems
              that rely on static features, MyShape constructs identity from continuous,
              high-dimensional motion geometry captured locally on consumer devices.
              The protocol achieves decoupled identity, non-replicability, local sovereignty,
              ZK-verifiable liveness, and cross-platform interoperability — establishing
              a sovereign identity layer for the AI and simulation age.
            </p>
          </section>

          {/* 各章节 */}
          {sections.map((s) => (
            <section key={s.id} id={s.anchor} className="group max-w-[750px] scroll-mt-32" onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}>
              {content[s.anchor]?.map((para, i) => {
                const isMajorHeader = para.match(/^\d+\.\s+[A-Z]/);
                const isSubHeader = para.match(/^\d+\.\d+\s+[A-Z]/);
                const isBullet =
                  para.trim().startsWith("-") || para.trim().startsWith("•");
                if (isMajorHeader) {
                  return (
                    <div key={i} className="flex items-center gap-6 mb-12 mt-4">
                      <span className="text-[#90c8ff]/50 text-[10px] tracking-[0.6em] font-bold group-hover:text-[#90c8ff] transition-colors duration-700">
                        {para}
                      </span>
                      <div className="h-[1px] flex-1 bg-white/10 group-hover:bg-[#90c8ff]/30 transition-colors duration-700" />
                    </div>
                  );
                }
                if (isSubHeader) {
                  return (
                    <h3 key={i} className="text-[#90c8ff]/60 text-[11px] tracking-[0.3em] font-bold uppercase mt-8 mb-3 transition-colors duration-500 hover:text-[#90c8ff]">
                      {para}
                    </h3>
                  );
                }
                if (isBullet) {
                  return (
                    <p key={i} className="text-white/35 text-[16px] leading-[1.85] font-light pl-4 mb-1">
                      {para}
                    </p>
                  );
                }
                return (
                  <p key={i} className="text-white/50 text-[18px] leading-[1.85] font-light tracking-normal opacity-80 group-hover:opacity-100 transition-all duration-700 mb-3">
                    {para}
                  </p>
                );
              })}
            </section>
          ))}

          {/* Footer */}
          <div className="mt-40 border-t border-white/5 pt-24">
            <ProtocolFooter />
          </div>
        </div>
      </main>
    </div>
  );
}

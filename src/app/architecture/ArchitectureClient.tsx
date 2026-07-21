"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import "./architecture.css";

const PIPELINE = [
  { step: "01", name: "Camera", desc: "Local webcam input. On-device only. MediaPipe Pose extracts 33 skeletal landmarks. Nothing uploaded — raw frames discarded after processing.", output: "33 Landmarks" },
  { step: "02", name: "Motion", desc: "SST 18-point topology maps 33→18 key joints. Temporal window captures 128-dim motion vector across 4 feature groups: kinematics, acceleration, jerk, jerk spectrum.", output: "128-dim Vector" },
  { step: "03", name: "Encoding", desc: "4-dimensional entropy scoring: micro-timing variance, noise residual, frequency entropy, biological perturbation. AI-generated motion fails here — the entropy gap is mathematically provable.", output: "PES Score" },
  { step: "04", name: "Vector", desc: "Motion geometry distilled into a compact, non-replicable identity vector. Poseidon-hashed. Non-invertible — you cannot reconstruct motion data from the hash.", output: "Identity Vector" },
  { step: "05", name: "Proof", desc: "PoP + MP + EP → Continuity composite proof. < 512 bytes. Verifiable in < 1ms. Proves presence without exposing identity or motion data.", output: "ZK-Proof" },
  { step: "06", name: "Agent", desc: "Cross-species verification. Human and AI identities coexist in one protocol. Presence Receipt issued — a cryptographic record that an entity proved presence at a specific time.", output: "Presence Receipt" },
];

const ENTROPY_BARS = [
  { label: "Human Motion", pct: 99.2, opacity: 1 },
  { label: "Replay Attack", pct: 12.5, opacity: 0.45 },
  { label: "MoCap Data", pct: 18.3, opacity: 0.35 },
  { label: "AI Generated", pct: 1.4, opacity: 0.2 },
];

const ENTROPY_DIMS = [
  { dim: "D1 — Micro-Timing", what: "Inter-frame interval variance at sub-100ms scale", human: "Chaotic — breathing, fatigue, neural jitter", ai: "Uniform — generated frames have consistent timing" },
  { dim: "D2 — Noise Residual", what: "Sensor + environment noise in landmark coordinates", human: "Organic — CMOS noise interacts with real light", ai: "Absent — perfect coordinates are a red flag" },
  { dim: "D3 — Frequency Entropy", what: "Spectral density across 0.5–15 Hz motion band", human: "Broad spectrum — multiple overlapping frequencies", ai: "Narrow peaks — limited frequency range" },
  { dim: "D4 — Biological Perturbation", what: "Involuntary micro-movements (saccades, tremor, drift)", human: "Present — humans cannot suppress these", ai: "None — AI does not model involuntary biology" },
];

const THREATS = [
  { attack: "Generative AI", vector: "Synthetic video frames", defense: "4D entropy gap — AI cannot reproduce biological micro-timing", confidence: 0.992 },
  { attack: "Replay Attack", vector: "Recorded motion playback", defense: "Temporal nonce + frame freshness check", confidence: 0.998 },
  { attack: "Imitation", vector: "Human mimicking target motion", defense: "Motion signature is individual — imitation ≠ original", confidence: 0.985 },
  { attack: "Motion Capture", vector: "MoCap data injection", defense: "Sensor noise profile verification", confidence: 0.990 },
  { attack: "Sensor Spoof", vector: "Fake camera feed", defense: "Device attestation + hardware fingerprint", confidence: 0.995 },
  { attack: "Adversarial Pose", vector: "Perturbed landmark input", defense: "Kinematic consistency check — joints must obey biomechanics", confidence: 0.987 },
  { attack: "Statistical", vector: "ML-generated motion stats", defense: "Frequency-domain analysis exposes synthetic patterns", confidence: 0.991 },
];

function confBrightness(c: number) {
  if (c >= 0.998) return 0.9;
  if (c >= 0.990) return 0.7;
  if (c >= 0.985) return 0.55;
  return 0.4;
}

export default function ArchitectureClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        {/* Header */}
        <div className="space-y-4 md:space-y-5 mb-12 md:mb-16">
          <div className="text-[#90c8ff]/60 text-[11px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>
            Protocol_Architecture
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase leading-tight">
            Camera <span className="text-[#90c8ff]/50">→</span> Presence Receipt
          </h1>
          <p className="text-white/45 md:text-white/50 text-[11px] md:text-[14px] leading-relaxed max-w-2xl font-light">
            Six stages. One pipeline. Zero data stored.<br />
            <span className="text-[#90c8ff]/60">Human and AI identities coexist in one protocol.</span>
          </p>
        </div>

        {/* Pipeline */}
        <section className="mb-14 md:mb-20">
          <h2 className="arch-section-h text-[11px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6 md:mb-10"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // PIPELINE
          </h2>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-0 max-w-3xl mx-auto">
              {PIPELINE.map((p, i) => (
                <div key={p.step} className="flex items-start">
                  <div className="flex flex-col items-center cursor-default arch-pipeline-node"
                    title={p.desc}
                    onMouseEnter={() => playTick(800, "sine", 0.08, 0.02)}>
                    <div className="w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[13px] tracking-[0.05em] transition-all duration-300 arch-pipeline-circle">
                      {p.step}
                    </div>
                    <span className="text-[11px] tracking-[0.15em] uppercase mt-3 text-center leading-tight font-medium transition-all duration-300 arch-pipeline-name">
                      {p.name}
                    </span>
                    <span className="text-[11px] tracking-[0.1em] font-mono mt-1.5 transition-all duration-300 arch-pipeline-output">
                      {p.output}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="flex items-center pt-7 mx-2">
                      <div className="w-8 h-[1px] bg-gradient-to-r from-[#90c8ff]/35 to-[#90c8ff]/15" />
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[rgba(144,200,255,0.4)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical flow */}
          <div className="md:hidden relative">
            <div className="absolute left-[20px] top-5 bottom-5 w-[1px] bg-gradient-to-b from-[#90c8ff]/40 via-[#90c8ff]/20 to-[#90c8ff]/5" />
            {PIPELINE.map((p, i) => (
              <div key={p.step} className="relative flex gap-3 pb-3 last:pb-0"
                onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                <div className="absolute left-[14px] top-[20px] w-3.5 h-3.5 rounded-full border-2 border-[#90c8ff]/50 bg-[#02040a] z-10 transition-all duration-500 arch-mobile-dot"
                  style={{ animationDelay: `${i * 0.5}s` }} />
                <div className="flex-1 pl-10 py-1.5">
                  <span className="text-[11px] tracking-[0.2em] uppercase font-medium text-white/60">{p.step}. {p.name}</span>
                  <span className="block text-[11px] mt-0.5 font-mono text-[#90c8ff]/45">→ {p.output}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Protocol Artifacts — What the outputs actually look like */}
        <section className="mb-14 md:mb-20">
          <h2 className="arch-section-h text-[11px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // PROTOCOL ARTIFACTS
          </h2>
          <p className="text-white/25 md:text-white/30 text-[11px] md:text-[11px] mb-6 md:mb-8">
            These are the concrete outputs of the MyShape pipeline. This is what your application receives.
          </p>

          {/* Identity Vector */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-[#90c8ff]/50 text-[11px] md:text-[11px] tracking-[0.2em] uppercase mb-3">Identity Vector <span className="text-white/15">— 128-dim, Poseidon-hashed, non-invertible</span></h3>
            <div className="border p-4 md:p-5 overflow-x-auto font-mono arch-code-block"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              <pre className="text-[#90c8ff]/70 text-[11px] md:text-[11px] leading-relaxed whitespace-pre-wrap">
{`// Motion Vector hash — the geometric signature
{
  "mv_hash": "0x7a3f1b2c8d4e9f01...3a6b5c7d2e8f4a9b",
  "dimensions": 128,
  "feature_groups": ["kinematics", "acceleration", "jerk", "spectrum"],
  "sst_topology": "18-point",
  "poseidon_params": { "t": 5, "rounds": 80, "field": "BN254" },
  "non_invertible": true
}`}</pre>
            </div>
          </div>

          {/* Presence Proof */}
          <div className="mb-6 md:mb-8">
            <h3 className="text-[#90c8ff]/50 text-[11px] md:text-[11px] tracking-[0.2em] uppercase mb-3">Presence Proof <span className="text-white/15">— &lt; 512 bytes, verifiable in &lt; 1ms</span></h3>
            <div className="border p-4 md:p-5 overflow-x-auto font-mono arch-code-block"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              <pre className="text-[#90c8ff]/70 text-[11px] md:text-[11px] leading-relaxed whitespace-pre-wrap">
{`// Continuity composite proof
{
  "proof_type": "Continuity",
  "pes_score": 0.94,
  "pes_components": { "timing": 0.91, "noise": 0.96, "frequency": 0.89, "biological": 0.97 },
  "timestamp": 1719000000,
  "session_id": "sess_7b3f2a1c...",
  "zkp_hash": "0x9f2a8b1c3d4e...",
  "proof_size": 486,
  "verification_ms": 0.8
}`}</pre>
            </div>
          </div>

          {/* Entropy Gap Distribution */}
          <div>
            <h3 className="text-[#90c8ff]/50 text-[11px] md:text-[11px] tracking-[0.2em] uppercase mb-3">Entropy Gap Distribution <span className="text-white/15">— zero overlap between human and AI</span></h3>
            <div className="border p-5 md:p-6 arch-dist-block"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              <div className="space-y-5">
                {/* Human distribution */}
                <div>
                  <div className="flex justify-between text-[11px] md:text-[11px] mb-1.5">
                    <span className="text-white/50">Human PES</span>
                    <span className="font-mono text-[#90c8ff]/70">0.65 — 0.99</span>
                  </div>
                  <div className="h-5 md:h-6 rounded-sm flex overflow-hidden arch-entropy-track">
                    <div className="w-[5%] h-full bg-[rgba(255,255,255,0.03)]" />
                    <div className="w-[30%] h-full bg-[rgba(144,200,255,0.1)]" />
                    <div className="w-[35%] h-full bg-[rgba(144,200,255,0.35)]" />
                    <div className="w-[25%] h-full bg-[rgba(144,200,255,0.6)]" style={{ boxShadow: "0 0 8px rgba(144,200,255,0.3)" }} />
                    <div className="w-[5%] h-full bg-[rgba(144,200,255,0.15)]" />
                  </div>
                </div>
                {/* Threshold line */}
                <div className="relative h-0">
                  <div className="absolute left-[65%] -top-1 w-[1px] h-12 bg-[rgba(144,200,255,0.5)]" />
                  <span className="absolute left-[65%] -top-4 text-[11px] tracking-[0.15em] uppercase font-mono -translate-x-1/2 whitespace-nowrap text-[#90c8ff]/70">
                    threshold 0.65
                  </span>
                </div>
                {/* AI distribution */}
                <div>
                  <div className="flex justify-between text-[11px] md:text-[11px] mb-1.5 mt-2">
                    <span className="text-white/40">AI / Synthetic PES</span>
                    <span className="font-mono text-white/30">0.01 — 0.15</span>
                  </div>
                  <div className="h-5 md:h-6 rounded-sm flex overflow-hidden arch-entropy-track">
                    <div className="w-[5%] h-full bg-[rgba(255,255,255,0.03)]" />
                    <div className="w-[15%] h-full bg-[rgba(144,200,255,0.2)]" />
                    <div className="w-[80%] h-full bg-[rgba(255,255,255,0.02)]" />
                  </div>
                </div>
                <p className="text-white/20 text-[11px] tracking-[0.15em] uppercase mt-3">
                  Zero overlap between distributions. AI cannot cross the entropy threshold — <span className="text-[#90c8ff]/50">mathematically provable</span> via §10.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Entropy Gap */}
        <section className="mb-14 md:mb-20">
          <h2 className="arch-section-h text-[11px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // THE ENTROPY GAP
          </h2>
          <p className="text-white/35 md:text-white/40 text-[11px] md:text-[12px] leading-relaxed mb-6 md:mb-8">
            Human motion carries irreducible biological entropy. AI-generated motion is mathematically clean — and that cleanliness is <span className="text-[#90c8ff]/60">detectable</span>.
          </p>
          <div className="space-y-4 md:space-y-5">
            {ENTROPY_BARS.map(bar => (
              <div key={bar.label} className="flex items-center gap-3 md:gap-4"
                onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <span className="text-[11px] md:text-[11px] tracking-[0.15em] uppercase w-28 md:w-36 text-right shrink-0 font-medium arch-entropy-label">{bar.label}</span>
                <div className="flex-1 h-4 md:h-5 rounded-sm overflow-hidden arch-entropy-track">
                  <div className="h-full rounded-sm arch-entropy-fill"
                    style={{
                      width: `${bar.pct}%`,
                      background: `linear-gradient(90deg, rgba(144,200,255,${bar.opacity * 0.5}), rgba(144,200,255,${bar.opacity}))`,
                      boxShadow: bar.pct > 50 ? "0 0 12px rgba(144,200,255,0.25)" : "none",
                    }} />
                </div>
                <span className="text-[11px] md:text-[12px] font-mono w-16 shrink-0 font-medium arch-entropy-value"
                  style={{ color: `rgba(144,200,255,${0.4 + bar.opacity * 0.6})` }}>{bar.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-[11px] md:text-[11px] tracking-[0.2em] uppercase mt-5 md:mt-6">
            PES Score threshold for human verification: <span className="text-[#90c8ff]/50">&ge; 85%</span>
          </p>
        </section>

        {/* 4D Entropy */}
        <section className="mb-14 md:mb-20">
          <h2 className="arch-section-h text-[11px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // 4D ENTROPY SCORING
          </h2>
          <p className="text-white/25 md:text-white/30 text-[11px] md:text-[11px] mb-5 md:mb-6">
            Four independent dimensions. Each one alone can flag synthetic motion. Together, the false-positive rate approaches zero.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] md:text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-white/35">
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase w-[28%]">Dimension</th>
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase hidden md:table-cell">Measures</th>
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase text-white/50">Human</th>
                  <th className="text-left py-3 font-medium tracking-[0.15em] uppercase text-white/25">AI</th>
                </tr>
              </thead>
              <tbody>
                {ENTROPY_DIMS.map(d => (
                  <tr key={d.dim} className="border-b border-white/[0.03] arch-table-row"
                    onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                    <td className="py-3 pr-2 align-top font-medium arch-col-dim text-[11px]">{d.dim}</td>
                    <td className="py-3 pr-2 align-top hidden md:table-cell arch-col-what text-[11px]">{d.what}</td>
                    <td className="py-3 pr-2 align-top arch-col-human text-[11px]">{d.human}</td>
                    <td className="py-3 align-top arch-col-ai text-[11px]">{d.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Threat Matrix */}
        <section className="mb-14 md:mb-20">
          <h2 className="arch-section-h text-[11px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-3 md:mb-4"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // THREAT MATRIX
          </h2>
          <p className="text-white/30 text-[11px] md:text-[11px] mb-6 md:mb-8">
            7 known attack vectors. 7 verified defenses. Each independently tested against real-world threat models.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] md:text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-white/35">
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase">Attack</th>
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase hidden md:table-cell">Vector</th>
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase">Defense</th>
                  <th className="text-right py-3 font-medium tracking-[0.15em] uppercase">Detection</th>
                </tr>
              </thead>
              <tbody>
                {THREATS.map(t => (
                  <tr key={t.attack} className="border-b border-white/[0.03] arch-threat-row"
                    onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                    <td className="py-3 pr-3 font-medium arch-threat-attack text-[11px]">{t.attack}</td>
                    <td className="py-3 pr-3 hidden md:table-cell arch-threat-vector text-[11px]">{t.vector}</td>
                    <td className="py-3 pr-3 arch-threat-defense text-[11px]">{t.defense}</td>
                    <td className="py-3 text-right font-mono font-medium text-[11px]"
                      style={{ color: `rgba(144,200,255,${confBrightness(t.confidence)})` }}>
                      {(t.confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-14 md:mt-20">
          {[
            { label: "Read", title: "Technical Spec", desc: "Full protocol specification", href: "/papers/technical-spec" },
            { label: "Review", title: "Threat Model", desc: "Security analysis & audit", href: "/papers/threat-model" },
            { label: "Build", title: "Developer SDK", desc: "Integrate in 5 lines", href: "/developers" },
          ].map(card => (
            <a key={card.href} href={card.href}
              onMouseEnter={() => playTick(700, "sine", 0.10, 0.025)}
              className="block p-5 md:p-6 text-center arch-cta-card">
              <div className="text-[11px] md:text-[11px] tracking-[0.3em] uppercase mb-2 font-mono arch-cta-label">{card.label}</div>
              <div className="text-[11px] md:text-[13px] tracking-[0.2em] uppercase mb-1.5 font-medium arch-cta-title">{card.title}</div>
              <div className="text-[11px] md:text-[11px] arch-cta-desc">{card.desc}</div>
              <div className="mt-3 inline-block text-[11px] arch-cta-arrow">→</div>
            </a>
          ))}
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

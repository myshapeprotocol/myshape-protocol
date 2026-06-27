"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const PIPELINE = [
  { step: "01", name: "Camera", desc: "Local webcam input. On-device only. MediaPipe Pose extracts 33 skeletal landmarks. Nothing uploaded — raw frames discarded after processing.", output: "33 Landmarks" },
  { step: "02", name: "Motion", desc: "SST 18-point topology maps 33→18 key joints. Temporal window captures 128-dim motion vector across 4 feature groups: kinematics, acceleration, jerk, jerk spectrum.", output: "128-dim Vector" },
  { step: "03", name: "Encoding", desc: "4-dimensional entropy scoring: micro-timing variance, noise residual, frequency entropy, biological perturbation. AI-generated motion fails here — the entropy gap is mathematically provable.", output: "PES Score" },
  { step: "04", name: "Vector", desc: "Motion geometry distilled into a compact, non-replicable identity vector. Poseidon-hashed. Non-invertible — you cannot reconstruct motion data from the hash.", output: "Identity Vector" },
  { step: "05", name: "Proof", desc: "PoP + MP + EP → ZK-Presence composite proof. < 512 bytes. Verifiable in < 1ms. Proves presence without exposing identity or motion data.", output: "ZK-Proof" },
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

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.hover || ''; });
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.default || ''; });
};

export default function ArchitectureClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        {/* Header */}
        <div className="space-y-4 md:space-y-5 mb-12 md:mb-16">
          <div className="text-cyan-400/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>
            Protocol_Architecture
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase leading-tight">
            Camera <span className="text-cyan-400/50">→</span> Presence Receipt
          </h1>
          <p className="text-white/45 md:text-white/50 text-[11px] md:text-[14px] leading-relaxed max-w-2xl font-light">
            Six stages. One pipeline. Zero data stored.<br />
            <span className="text-cyan-400/60">Human and AI identities coexist in one protocol.</span>
          </p>
        </div>

        {/* Pipeline */}
        <section className="mb-14 md:mb-20">
          <h2 className="section-h text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6 md:mb-10"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // PIPELINE
          </h2>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:block">
            <div className="flex items-start justify-between gap-0 max-w-3xl mx-auto">
              {PIPELINE.map((p, i) => (
                <div key={p.step} className="flex items-start">
                  <div className="flex flex-col items-center group cursor-default"
                    title={p.desc}
                    onMouseEnter={() => playTick(800, "sine", 0.08, 0.02)}>
                    <div className="w-14 h-14 rounded-full border border-cyan-400/30 flex items-center justify-center font-mono text-[13px] tracking-[0.05em] transition-all duration-500 group-hover:border-cyan-300/90 group-hover:shadow-[0_0_24px_rgba(34,211,238,0.45)] group-hover:scale-110"
                      style={{ color: "rgba(34,211,238,0.55)", background: "#02040a" }}>
                      {p.step}
                    </div>
                    <span className="text-[11px] tracking-[0.15em] uppercase mt-3 text-center leading-tight font-medium transition-all duration-500 group-hover:text-white/80"
                      style={{ color: "rgba(255,255,255,0.55)" }}>
                      {p.name}
                    </span>
                    <span className="text-[8px] tracking-[0.1em] font-mono mt-1.5 transition-all duration-500 group-hover:text-cyan-300/60"
                      style={{ color: "rgba(34,211,238,0.3)" }}>
                      {p.output}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="flex items-center pt-7 mx-2">
                      <div className="w-8 h-[1px] bg-gradient-to-r from-cyan-400/35 to-cyan-400/15" />
                      <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px]"
                        style={{ borderLeftColor: "rgba(34,211,238,0.4)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical flow */}
          <div className="md:hidden relative">
            <div className="absolute left-[20px] top-5 bottom-5 w-[1px] bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-cyan-400/5" />
            {PIPELINE.map((p, i) => (
              <div key={p.step} className="relative flex gap-3 pb-3 last:pb-0"
                onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                <div className="absolute left-[14px] top-[20px] w-3.5 h-3.5 rounded-full border-2 border-cyan-400/50 bg-[#02040a] z-10 transition-all duration-500"
                  style={{
                    boxShadow: "0 0 10px rgba(34,211,238,0.35)",
                    animation: `nodePulse 2.5s ease-in-out ${i * 0.5}s infinite`,
                  }} />
                <div className="flex-1 pl-10 py-1.5">
                  <span className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{p.step}. {p.name}</span>
                  <span className="block text-[9px] mt-0.5 font-mono" style={{ color: "rgba(34,211,238,0.45)" }}>→ {p.output}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The Entropy Gap */}
        <section className="mb-14 md:mb-20">
          <h2 className="section-h text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // THE ENTROPY GAP
          </h2>
          <p className="text-white/35 md:text-white/40 text-[10px] md:text-[12px] leading-relaxed mb-6 md:mb-8">
            Human motion carries irreducible biological entropy. AI-generated motion is mathematically clean — and that cleanliness is <span className="text-cyan-400/60">detectable</span>.
          </p>
          <div className="space-y-4 md:space-y-5">
            {ENTROPY_BARS.map(bar => (
              <div key={bar.label} className="flex items-center gap-3 md:gap-4"
                onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <span className="text-[9px] md:text-[11px] tracking-[0.15em] uppercase w-28 md:w-36 text-right shrink-0 font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}>{bar.label}</span>
                <div className="flex-1 h-4 md:h-5 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="h-full rounded-sm transition-all duration-1000"
                    style={{
                      width: `${bar.pct}%`,
                      background: `linear-gradient(90deg, rgba(34,211,238,${bar.opacity * 0.5}), rgba(34,211,238,${bar.opacity}))`,
                      boxShadow: bar.pct > 50 ? "0 0 12px rgba(34,211,238,0.25)" : "none",
                    }} />
                </div>
                <span className="text-[10px] md:text-[12px] font-mono w-16 shrink-0 font-medium"
                  style={{ color: `rgba(34,211,238,${0.4 + bar.opacity * 0.6})` }}>{bar.pct}%</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-[8px] md:text-[9px] tracking-[0.2em] uppercase mt-5 md:mt-6">
            PES Score threshold for human verification: <span className="text-cyan-400/50">&ge; 85%</span>
          </p>
        </section>

        {/* 4D Entropy */}
        <section className="mb-14 md:mb-20">
          <h2 className="section-h text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // 4D ENTROPY SCORING
          </h2>
          <p className="text-white/25 md:text-white/30 text-[9px] md:text-[10px] mb-5 md:mb-6">
            Four independent dimensions. Each one alone can flag synthetic motion. Together, the false-positive rate approaches zero.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] md:text-[10px]">
              <thead>
                <tr className="border-b border-white/10" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase w-[28%]">Dimension</th>
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase hidden md:table-cell">Measures</th>
                  <th className="text-left py-3 pr-2 font-medium tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Human</th>
                  <th className="text-left py-3 font-medium tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>AI</th>
                </tr>
              </thead>
              <tbody>
                {ENTROPY_DIMS.map(d => (
                  <tr key={d.dim} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors"
                    onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                    <td className="py-3 pr-2 align-top font-medium" style={{ color: "rgba(34,211,238,0.7)" }}>{d.dim}</td>
                    <td className="py-3 pr-2 align-top hidden md:table-cell" style={{ color: "rgba(255,255,255,0.35)" }}>{d.what}</td>
                    <td className="py-3 pr-2 align-top" style={{ color: "rgba(255,255,255,0.55)" }}>{d.human}</td>
                    <td className="py-3 align-top" style={{ color: "rgba(255,255,255,0.3)" }}>{d.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Threat Matrix */}
        <section className="mb-14 md:mb-20">
          <h2 className="section-h text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-3 md:mb-4"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>
            // THREAT MATRIX
          </h2>
          <p className="text-white/30 text-[9px] md:text-[10px] mb-6 md:mb-8">
            7 known attack vectors. 7 verified defenses. Each independently tested against real-world threat models.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] md:text-[10px]">
              <thead>
                <tr className="border-b border-white/10" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase">Attack</th>
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase hidden md:table-cell">Vector</th>
                  <th className="text-left py-3 pr-3 font-medium tracking-[0.15em] uppercase">Defense</th>
                  <th className="text-right py-3 font-medium tracking-[0.15em] uppercase">Detection</th>
                </tr>
              </thead>
              <tbody>
                {THREATS.map(t => (
                  <tr key={t.attack} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors"
                    onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
                    <td className="py-3 pr-3 font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{t.attack}</td>
                    <td className="py-3 pr-3 hidden md:table-cell" style={{ color: "rgba(255,255,255,0.3)" }}>{t.vector}</td>
                    <td className="py-3 pr-3" style={{ color: "rgba(34,211,238,0.6)" }}>{t.defense}</td>
                    <td className="py-3 text-right font-mono font-medium" style={{ color: `rgba(34,211,238,${confBrightness(t.confidence)})` }}>{(t.confidence * 100).toFixed(1)}%</td>
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
              onMouseEnter={e => { playTick(700, "sine", 0.10, 0.025); e.currentTarget.style.borderColor = "rgba(144,200,255,0.45)"; e.currentTarget.style.background = "radial-gradient(circle at top left, rgba(144,200,255,0.08) 0%, transparent 70%)"; e.currentTarget.style.transform = "translateY(-2px)"; hoverOn(e); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.15)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateY(0)"; hoverOff(e); }}
              className="block p-5 md:p-6 transition-all duration-400 text-center"
              style={{ border: "1px solid rgba(144,200,255,0.15)", background: "transparent" }}>
              <div className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase mb-2 font-mono" style={{ color: "rgba(34,211,238,0.4)" }} data-default="rgba(34,211,238,0.4)" data-hover="rgba(34,211,238,0.8)">{card.label}</div>
              <div className="text-[11px] md:text-[13px] tracking-[0.2em] uppercase mb-1.5 font-medium" style={{ color: "rgba(255,255,255,0.75)" }} data-default="rgba(255,255,255,0.75)" data-hover="rgba(255,255,255,1)">{card.title}</div>
              <div className="text-[9px] md:text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">{card.desc}</div>
              <div className="mt-3 inline-block text-[11px]" style={{ color: "rgba(34,211,238,0.35)" }} data-default="rgba(34,211,238,0.35)" data-hover="rgba(34,211,238,0.8)">→</div>
            </a>
          ))}
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

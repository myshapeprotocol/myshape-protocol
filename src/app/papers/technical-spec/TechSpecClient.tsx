"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => {
    k.style.color = k.dataset.hover || '';
    if (k.dataset.hoverSize) k.style.fontSize = k.dataset.hoverSize;
  });
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => {
    k.style.color = k.dataset.default || '';
    if (k.dataset.defaultSize) k.style.fontSize = k.dataset.defaultSize;
  });
};

const SPECS = [
  {
    question: "How is the Identity Vector generated?",
    answer: [
      "Camera captures motion at 30fps. MediaPipe Pose extracts 33 landmarks.",
      "SST mapper converts to standardized 18-point topology (§2.2).",
      "Feature Pipeline (§3): Preprocessing → Temporal → Kinematic → Entropy → Hash.",
      "Output: Motion Vector — a fixed-size geometric signature, not raw video.",
      "The raw signal never leaves the device. Only the hashed vector is transmitted.",
    ],
  },
  {
    question: "What are the feature dimensions?",
    answer: [
      "4-dimensional Presence Entropy Score (PES §3.5):",
      "μTiming Variance — micro-second frame timing irregularities (biological).",
      "Noise Residual — signal-to-noise ratio from low-pass prediction error.",
      "Frequency Entropy — Shannon entropy over DFT power spectrum.",
      "Biological Perturbation — cross-joint jerk correlation (6 joint pairs).",
      "Combined via weighted sum: PES = 0.20·μT + 0.25·ε + 0.20·Hf + 0.35·Bio.",
    ],
  },
  {
    question: "What is the error rate?",
    answer: [
      "False Accept Rate (FAR): empirically < 5% for AI-generated motion (PES threshold 0.65).",
      "False Reject Rate (FRR): < 15% for real humans in normal standing conditions.",
      "Entropy Gap Theorem (§10) proves: Pr[AI PES ≥ 0.65] → 0.",
      "Note: These are protocol-level metrics, not conventional FAR/FRR. MyShape verifies presence, not identity.",
    ],
  },
  {
    question: "What are the device requirements?",
    answer: [
      "Minimum: 640×480 camera, 20fps, any modern browser (Firefox recommended).",
      "Recommended: 1280×720, 30fps, dedicated webcam.",
      "Processing: all on-device. No GPU required. No cloud dependency.",
      "Latency: < 100ms for feature extraction. < 10ms for proof verification.",
      "Proof size: < 512 bytes (ZK-Presence composite).",
      "Platform support: Web (TypeScript SDK). iOS/Android/Unity/Unreal (planned).",
    ],
  },
  {
    question: "How does it resist attacks?",
    answer: [
      "8 attack signatures detected across 4 PES dimensions (§5):",
      "Generative AI — frequency entropy collapse + missing jerk correlation.",
      "Replay — uniform inter-frame timing + stale hash.",
      "Imitation — cannot replicate unconscious micro-motion patterns.",
      "Mocap — over-clean data lacks biological noise.",
      "Sensor spoofing — inter-frame consistency checks + frequency monitoring.",
      "Adversarial pose injection — MV normalization removes perturbations.",
      "Statistical forgery — cannot satisfy all 4 dimensions simultaneously.",
      "Digital twin — lacks original neural noise source.",
      "Defense-in-depth: 5-layer architecture with independent security boundaries.",
    ],
  },
];

const ARCHITECTURE = [
  { layer: "L5 — Agent Identity", detail: "AI-native declaration. Cross-species verification. Identity becomes multispecies." },
  { layer: "L4 — Proof Layer", detail: "ZK-Presence: PoP + MP + EP → composite proof. 128-512 bytes. < 1ms verification." },
  { layer: "L3 — Identity Vector", detail: "Motion Vector → SST 18-pt → Feature Pipeline → PES. The geometric signature." },
  { layer: "L2 — Behavior Encoding", detail: "Temporal, kinematic, entropy features. Jerk analysis. Cross-joint correlation." },
  { layer: "L1 — Motion Capture", detail: "30fps camera input. MediaPipe Pose. On-device only. Nothing leaves the device." },
];

const METRICS = [
  { label: "Spec Sections Implemented", value: "§1–40" },
  { label: "Protocol Engines", value: "16" },
  { label: "SDK Modules", value: "3" },
  { label: "Attack Signatures Detected", value: "8" },
  { label: "Verification Rules", value: "6" },
  { label: "Skeleton Topology", value: "SST 18-pt" },
  { label: "Proof Types", value: "PoP / MP / EP / ZKP" },
  { label: "PES Dimensions", value: "4" },
];

export default function TechSpecClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        <div className="space-y-4 mb-12 md:mb-14">
          <div className="text-cyan-400/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>TECHNICAL_SPECIFICATION // V1.0</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase">Protocol Reference</h1>
          <p className="text-white/45 md:text-white/50 text-[11px] md:text-[14px] leading-relaxed max-w-2xl font-light">
            The engineering document behind the MyShape Protocol. Motion Vector format,
            PES engine, proof system, SST topology, and reference implementation.
          </p>
          <p className="text-white/20 text-[9px] md:text-[10px] tracking-[0.15em] mt-2">
            By MyShape Protocol &nbsp;·&nbsp; V1.0 &nbsp;·&nbsp; June 2026
          </p>
        </div>

        {/* Metrics */}
        <section className="mb-12 md:mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-5 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>// PROTOCOL_METRICS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {METRICS.map((m) => (
              <div key={m.label} className="border p-3 md:p-4 text-center transition-all duration-300"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="text-cyan-300/80 text-lg md:text-xl font-light tracking-wider"
                  data-default="rgba(200,240,255,0.8)" data-hover="rgba(200,240,255,1)">{m.value}</div>
                <div className="text-white/20 text-[8px] tracking-[0.15em] uppercase mt-1"
                  data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.5)">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-12 md:mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-5 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>// FIVE_LAYER_ARCHITECTURE</h2>
          <div className="space-y-1">
            {ARCHITECTURE.map((a, i) => (
              <div key={i} className="border p-4 transition-all duration-300"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; e.currentTarget.style.background = "rgba(144,200,255,0.03)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.background = "transparent"; }}>
                <div className="text-cyan-400/60 text-[10px] tracking-[0.2em] uppercase mb-1"
                  data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,1)">{a.layer}</div>
                <div className="text-white/30 text-[10px] leading-relaxed"
                  data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">{a.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Questions */}
        <section className="mb-12 md:mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-5 md:mb-6"
            onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>// KEY_SPECIFICATIONS</h2>
          <div className="space-y-3 md:space-y-4">
            {SPECS.map((s, i) => (
              <div key={i} className="border overflow-hidden transition-all duration-300"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(700, "sine", 0.08, 0.02); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-cyan-400/70 text-[11px] md:text-[12px] tracking-[0.15em] uppercase font-medium"
                    data-default="rgba(34,211,238,0.7)" data-hover="rgba(34,211,238,1)">{s.question}</span>
                </div>
                <div className="p-5 space-y-2">
                  {s.answer.map((line, j) => (
                    <p key={j} className="text-white/35 text-[11px] leading-relaxed"
                      data-default="rgba(255,255,255,0.35)" data-hover="rgba(255,255,255,0.6)">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Citation */}
        <section className="mt-14 p-5 border transition-all duration-300"
          style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
          onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; }}
          onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
          <div className="text-white/25 text-[8px] tracking-[0.2em] uppercase mb-2"
            data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">Cite This Document</div>
          <p className="text-white/30 text-[9px] leading-relaxed font-mono"
            data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">
            MyShape Protocol. "MyShape Technical Specification v1.0." June 2026. https://www.myshape.com/papers/technical-spec
          </p>
        </section>

        {/* Reference Implementation */}
        <section className="mt-4 p-6 border text-center transition-all duration-300"
          style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
          onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.4)"; }}
          onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
          <div className="text-cyan-400/50 text-[10px] tracking-[0.3em] uppercase mb-3"
            data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.9)">Reference Implementation</div>
          <p className="text-white/30 text-[11px] leading-relaxed mb-4"
            data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">
            16 protocol engines implemented in TypeScript. Zero external dependencies.
            All processing on-device. No data stored or transmitted.
          </p>
          <a href="/developers" className="inline-block px-8 py-2 border border-cyan-400/30 text-cyan-400/60 text-[10px] tracking-[0.2em] uppercase hover:border-cyan-300 hover:text-cyan-200 transition-all"
            onMouseEnter={e => { playTick(700, "sine", 0.08, 0.02); }}>
            View SDK →
          </a>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

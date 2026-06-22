"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

const ATTACKS = [
  {
    class: "A — Generative AI",
    attacks: ["Motion Diffusion Models", "Neural Motion Prediction", "Digital Twin", "Real-time Motion Synthesis"],
    detection: "Frequency entropy collapse + missing cross-joint jerk correlation",
    severity: "Critical",
    successRate: "~0%",
  },
  {
    class: "B — Replay & Imitation",
    attacks: ["Recorded Motion Replay", "Human Imitation", "Professional Mocap Forgery"],
    detection: "Uniform inter-frame timing + stale MV_hash + over-clean noise profile",
    severity: "High",
    successRate: "Near zero",
  },
  {
    class: "C — Sensor & System",
    attacks: ["Camera Spoofing", "Adversarial Pose Injection", "Statistical Forgery"],
    detection: "Inter-frame consistency + frequency monitoring + multi-dimension corroboration",
    severity: "Medium",
    successRate: "Very low",
  },
];

const COST_MODEL = [
  { tier: "C0 — Low", cost: "< $1K", attacks: "Replay, basic imitation", maxSuccess: "~0%" },
  { tier: "C1 — Medium", cost: "$1K–$100K", attacks: "Mocap, diffusion models", maxSuccess: "< 1%" },
  { tier: "C2 — High", cost: "$100K–$10M", attacks: "Digital twin, adversarial training", maxSuccess: "< 5%" },
  { tier: "C3 — Extreme", cost: "> $10M", attacks: "Full biological simulation", maxSuccess: "< 10%" },
];

const DEFENSES = [
  {
    layer: "L5 — Identity Layer",
    mechanism: "Sybil resistance via PES uniqueness. One presence → one identity.",
    boundary: "Application Boundary — apps only see Presence Receipt",
  },
  {
    layer: "L4 — Proof Layer",
    mechanism: "ZK-Presence: PoP + MP + EP. Verifiable without exposing motion data.",
    boundary: "Proof Boundary — only FV_hash, PES, ZKP leave device",
  },
  {
    layer: "L3 — Integrity Layer",
    mechanism: "PES 4-dimensional entropy. Anti-replay. Anti-synthesis. Cross-joint correlation.",
    boundary: "Proof Boundary — raw data never leaves device",
  },
  {
    layer: "L2 — Geometry Layer",
    mechanism: "SST 18-point normalization. Device-agnostic. Manifold projection — non-invertible.",
    boundary: "Proof Boundary",
  },
  {
    layer: "L1 — Capture Layer",
    mechanism: "Raw sensor input processed on-device. Nothing stored. Nothing uploaded.",
    boundary: "Device Boundary — raw data never leaves",
  },
];

export default function ThreatModelClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">SECURITY_ANALYSIS // V1.0</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Threat Model</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-2xl">
            The MyShape Protocol faces three classes of adversaries. Eight attack signatures
            are detected across four PES dimensions. Defense-in-depth across five layers.
          </p>
        </div>

        {/* Attack Classification */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-6">// ATTACK_CLASSIFICATION</h2>
          <div className="space-y-4">
            {ATTACKS.map((a, i) => (
              <div key={i} className="border border-white/10 bg-black/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-cyan-400/70 text-[11px] tracking-[0.15em] uppercase">{a.class}</span>
                  <span className={`text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 border ${
                    a.severity === "Critical" ? "text-red-300/70 border-red-400/20" :
                    a.severity === "High" ? "text-amber-300/70 border-amber-400/20" :
                    "text-cyan-300/70 border-cyan-400/20"
                  }`}>{a.severity}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-white/25 text-[9px] tracking-[0.15em] uppercase">Attack Vectors</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.attacks.map((atk, j) => (
                        <span key={j} className="text-white/35 text-[10px] px-2 py-0.5 border border-white/5">{atk}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/25 text-[9px] tracking-[0.15em] uppercase">Detection</span>
                    <p className="text-white/35 text-[11px] mt-1">{a.detection}</p>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-white/20">Success Rate</span>
                    <span className="text-emerald-300/60">{a.successRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost Model */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// ATTACK_COST_MODEL (§5.5)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-white/5">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Tier</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Cost</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Attack Types</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Max Success</th>
                </tr>
              </thead>
              <tbody>
                {COST_MODEL.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-cyan-500/[0.02]">
                    <td className="p-3 text-cyan-400/60 text-[10px]">{c.tier}</td>
                    <td className="p-3 text-white/40 text-[10px]">{c.cost}</td>
                    <td className="p-3 text-white/30 text-[10px]">{c.attacks}</td>
                    <td className="p-3 text-emerald-400/50 text-[10px]">{c.maxSuccess}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-white/20 text-[9px] tracking-[0.1em] italic">
            MyShape security property: the cost to forge presence exceeds the value of forging it.
          </p>
        </section>

        {/* Defense-in-Depth */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// DEFENSE_IN_DEPTH</h2>
          <div className="space-y-1">
            {DEFENSES.map((d, i) => (
              <div key={i} className="border border-white/5 bg-black/30 p-4 group hover:border-cyan-500/20 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400/60 text-[10px] tracking-[0.15em] uppercase">{d.layer}</span>
                  <span className="text-white/15 text-[8px] tracking-[0.1em]">{d.boundary}</span>
                </div>
                <p className="text-white/30 text-[10px] leading-relaxed">{d.mechanism}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Entropy Gap Theorem */}
        <section className="p-6 border border-cyan-400/10 bg-cyan-400/[0.02] text-center">
          <div className="text-cyan-400/50 text-[10px] tracking-[0.3em] uppercase mb-3">Entropy Gap Theorem (§10)</div>
          <p className="text-white/40 text-[11px] leading-relaxed mb-2">
            Pr[AI generates PES ≥ 0.65] → 0
          </p>
          <p className="text-white/20 text-[10px] leading-relaxed">
            The gap between biological entropy and AI-generated smoothness is a fundamental limit,
            not a technological one. It arises from the informational asymmetry between a living
            nervous system and any external model of it.
          </p>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

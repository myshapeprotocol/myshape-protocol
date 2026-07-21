"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import "@/app/papers/papers.css";

const ATTACKS = [
  { class: "A — Generative AI", attacks: ["Motion Diffusion Models", "Neural Motion Prediction", "Digital Twin", "Real-time Motion Synthesis"], detection: "Frequency entropy collapse + missing cross-joint jerk correlation", severity: "Critical", successRate: "~0%" },
  { class: "B — Replay & Imitation", attacks: ["Recorded Motion Replay", "Human Imitation", "Professional Mocap Forgery"], detection: "Uniform inter-frame timing + stale MV_hash + over-clean noise profile", severity: "High", successRate: "Near zero" },
  { class: "C — Sensor & System", attacks: ["Camera Spoofing", "Adversarial Pose Injection", "Statistical Forgery"], detection: "Inter-frame consistency + frequency monitoring + multi-dimension corroboration", severity: "Medium", successRate: "Very low" },
];

const COST_MODEL = [
  { tier: "C0 — Low", cost: "< $1K", attacks: "Replay, basic imitation", maxSuccess: "~0%" },
  { tier: "C1 — Medium", cost: "$1K–$100K", attacks: "Mocap, diffusion models", maxSuccess: "< 1%" },
  { tier: "C2 — High", cost: "$100K–$10M", attacks: "Digital twin, adversarial training", maxSuccess: "< 5%" },
  { tier: "C3 — Extreme", cost: "> $10M", attacks: "Full biological simulation", maxSuccess: "< 10%" },
];

const DEFENSES = [
  { layer: "L5 — Identity Layer", mechanism: "Sybil resistance via PES uniqueness. One presence → one identity.", boundary: "Application Boundary — apps only see Presence Receipt" },
  { layer: "L4 — Proof Layer", mechanism: "Continuity: PoP + MP + EP. Verifiable without exposing motion data.", boundary: "Proof Boundary — only FV_hash, PES, ZKP leave device" },
  { layer: "L3 — Integrity Layer", mechanism: "PES 4-dimensional entropy. Anti-replay. Anti-synthesis. Cross-joint correlation.", boundary: "Proof Boundary — raw data never leaves device" },
  { layer: "L2 — Geometry Layer", mechanism: "SST 18-point normalization. Device-agnostic. Manifold projection — non-invertible.", boundary: "Proof Boundary" },
  { layer: "L1 — Capture Layer", mechanism: "Raw sensor input processed on-device. Nothing stored. Nothing uploaded.", boundary: "Device Boundary — raw data never leaves" },
];

function sevStyle(s: string) {
  if (s === "Critical") return { color: "rgba(252,165,165,0.7)", borderColor: "rgba(252,165,165,0.2)" };
  if (s === "High") return { color: "rgba(252,211,77,0.7)", borderColor: "rgba(252,211,77,0.2)" };
  return { color: "rgba(144,200,255,0.7)", borderColor: "rgba(144,200,255,0.2)" };
}

export default function ThreatModelClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-[#90c8ff]/50 text-[11px] tracking-[0.5em] uppercase">SECURITY_ANALYSIS // V1.0</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase" style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Threat Model</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-2xl">The MyShape Protocol faces three classes of adversaries. Eight attack signatures are detected across four PES dimensions. Defense-in-depth across five layers.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            {[{ label: "Attacks Modeled", value: "12", sub: "Across 3 classes" }, { label: "Max Success Rate", value: "< 10%", sub: "At extreme cost tier" }, { label: "Defense Layers", value: "5", sub: "Device → Application" }].map((m) => (
              <div key={m.label} className="tm-stat-card" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
                <div className="tm-stat-value">{m.value}</div>
                <div className="tm-stat-label">{m.label}</div>
                <div className="tm-stat-sub">{m.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-white/15 text-[11px] tracking-[0.15em] mt-2">By MyShape Protocol · V1.0 · June 2026 · Security Analysis — Not an Academic Paper</p>
        </div>

        <section className="mb-14">
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>// ATTACK_CLASSIFICATION</h2>
          <div className="space-y-4">
            {ATTACKS.map((a, i) => (
              <div key={i} className="tm-attack-card" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
                <div className="tm-attack-header">
                  <span className="tm-attack-class">{a.class}</span>
                  <span className="tm-severity" style={sevStyle(a.severity)}>{a.severity}</span>
                </div>
                <div className="tm-attack-content space-y-3">
                  <div>
                    <span className="tm-section-label">Attack Vectors</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.attacks.map((atk, j) => (<span key={j} className="tm-attack-tag">{atk}</span>))}
                    </div>
                  </div>
                  <div>
                    <span className="tm-section-label">Detection</span>
                    <p className="tm-detection mt-1">{a.detection}</p>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="tm-success-label">Success Rate</span>
                    <span className="tm-success-rate">{a.successRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>// ATTACK_COST_MODEL (§5.5)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-white/5">
              <thead><tr className="border-b border-white/10 bg-white/[0.02]"><th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Tier</th><th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Cost</th><th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Attack Types</th><th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Max Success</th></tr></thead>
              <tbody>
                {COST_MODEL.map((c, i) => (
                  <tr key={i} className="tm-cost-row border-b border-white/5" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                    <td className="p-3 tm-cost-tier">{c.tier}</td>
                    <td className="p-3 tm-cost-amount">{c.cost}</td>
                    <td className="p-3 tm-cost-attacks">{c.attacks}</td>
                    <td className="p-3 tm-cost-result">{c.maxSuccess}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-white/20 text-[11px] tracking-[0.1em] italic">MyShape security property: the cost to forge presence exceeds the value of forging it.</p>
        </section>

        <section className="mb-14">
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>// DEFENSE_IN_DEPTH</h2>
          <div className="space-y-1">
            {DEFENSES.map((d, i) => (
              <div key={i} className="tm-defense-card" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="tm-defense-layer">{d.layer}</span>
                  <span className="tm-defense-boundary">{d.boundary}</span>
                </div>
                <p className="tm-defense-mech">{d.mechanism}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="tm-theorem" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="tm-theorem-title">Entropy Gap Theorem (§10)</div>
          <p className="tm-theorem-eq">Pr[AI generates PES ≥ 0.65] → 0</p>
          <p className="tm-theorem-desc">The gap between biological entropy and AI-generated smoothness is a fundamental limit, not a technological one. It arises from the informational asymmetry between a living nervous system and any external model of it.</p>
        </section>

        <section className="mt-14 text-center border-t border-white/[0.04] pt-10">
          <div className="text-white/30 text-[11px] tracking-[0.25em] uppercase mb-3 hover:text-[#90c8ff]/50 transition-colors cursor-default" onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>Cite This Document</div>
          <p className="text-white/25 text-[11px] leading-relaxed font-mono hover:text-white/40 transition-colors cursor-default" onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>MyShape Protocol. "Threat Model v1.0." June 2026. https://www.myshape.com/papers/threat-model</p>
        </section>
      </div>
      <ProtocolFooter />
    </div>
  );
}

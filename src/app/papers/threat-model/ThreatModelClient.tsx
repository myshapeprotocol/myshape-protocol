"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
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
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Threat Model</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-2xl">
            The MyShape Protocol faces three classes of adversaries. Eight attack signatures
            are detected across four PES dimensions. Defense-in-depth across five layers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            {[
              { label: "Attacks Modeled", value: "12", sub: "Across 3 classes" },
              { label: "Max Success Rate", value: "< 10%", sub: "At extreme cost tier" },
              { label: "Defense Layers", value: "5", sub: "Device → Application" },
            ].map(m => (
              <div key={m.label} className="border border-cyan-400/10 p-4 text-center bg-cyan-400/[0.02] transition-all duration-500"
                onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(34,211,238,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.1)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div className="text-cyan-300/70 text-[22px] font-light font-mono mb-1">{m.value}</div>
                <div className="text-white/30 text-[8px] tracking-[0.2em] uppercase">{m.label}</div>
                <div className="text-white/12 text-[7px] mt-1">{m.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-white/15 text-[10px] tracking-[0.15em] mt-2">
            By MyShape Protocol &nbsp;·&nbsp; V1.0 &nbsp;·&nbsp; June 2026 &nbsp;·&nbsp; Security Analysis — Not an Academic Paper
          </p>
        </div>

        {/* Attack Classification */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-6">// ATTACK_CLASSIFICATION</h2>
          <div className="space-y-4">
            {ATTACKS.map((a, i) => (
              <div key={i} className="border overflow-hidden transition-all duration-500"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(700, "sine", 0.08, 0.02); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[11px] tracking-[0.15em] uppercase" style={{ color: "rgba(34,211,238,0.7)" }} data-default="rgba(34,211,238,0.7)" data-hover="rgba(34,211,238,1)">{a.class}</span>
                  <span className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 border"
                    style={{
                      color: a.severity === "Critical" ? "rgba(252,165,165,0.7)" : a.severity === "High" ? "rgba(252,211,77,0.7)" : "rgba(34,211,238,0.7)",
                      borderColor: a.severity === "Critical" ? "rgba(252,165,165,0.2)" : a.severity === "High" ? "rgba(252,211,77,0.2)" : "rgba(34,211,238,0.2)"
                    }}
                    data-default={a.severity === "Critical" ? "rgba(252,165,165,0.7)" : a.severity === "High" ? "rgba(252,211,77,0.7)" : "rgba(34,211,238,0.7)"}
                    data-hover={a.severity === "Critical" ? "rgba(252,165,165,1)" : a.severity === "High" ? "rgba(252,211,77,1)" : "rgba(34,211,238,1)"}>{a.severity}</span>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.45)">Attack Vectors</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.attacks.map((atk, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 border transition-colors duration-500" style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.08)" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.55)">{atk}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.45)">Detection</span>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }} data-default="rgba(255,255,255,0.35)" data-hover="rgba(255,255,255,0.6)">{a.detection}</p>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.4)">Success Rate</span>
                    <span className="text-cyan-300/60" data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.9)">{a.successRate}</span>
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
                  <tr key={i} className="border-b border-white/5 transition-all"
                    onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); }}
                    onMouseLeave={e => hoverOff(e)}>
                    <td className="p-3 text-[10px]" style={{ color: "rgba(34,211,238,0.6)", fontSize: "10px" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.9)" data-default-size="10px" data-hover-size="13px">{c.tier}</td>
                    <td className="p-3 text-[10px]" style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }} data-default="rgba(255,255,255,0.4)" data-hover="rgba(255,255,255,0.7)" data-default-size="10px" data-hover-size="13px">{c.cost}</td>
                    <td className="p-3 text-[10px]" style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.55)" data-default-size="10px" data-hover-size="13px">{c.attacks}</td>
                    <td className="p-3 text-[10px]" style={{ color: "rgba(34,211,238,0.5)", fontSize: "10px" }} data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.85)" data-default-size="10px" data-hover-size="13px">{c.maxSuccess}</td>
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
              <div key={i} className="border p-4 transition-all duration-500"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(34,211,238,0.6)", fontSize: "10px" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.9)" data-default-size="10px" data-hover-size="13px">{d.layer}</span>
                  <span className="text-[8px] tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.15)", fontSize: "8px" }} data-default="rgba(255,255,255,0.15)" data-hover="rgba(255,255,255,0.35)" data-default-size="8px" data-hover-size="11px">{d.boundary}</span>
                </div>
                <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.55)" data-default-size="10px" data-hover-size="13px">{d.mechanism}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Entropy Gap Theorem */}
        <section className="p-6 border text-center transition-all duration-500"
          style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
          onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
          onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(34,211,238,0.5)" }} data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.9)">Entropy Gap Theorem (§10)</div>
          <p className="text-[11px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.4)" }} data-default="rgba(255,255,255,0.4)" data-hover="rgba(255,255,255,0.7)">
            Pr[AI generates PES ≥ 0.65] → 0
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.4)">
            The gap between biological entropy and AI-generated smoothness is a fundamental limit,
            not a technological one. It arises from the informational asymmetry between a living
            nervous system and any external model of it.
          </p>
        </section>

        {/* Citation */}
        <section className="mt-14 text-center">
          <div className="text-[8px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.4)">Cite This Document</div>
          <p className="text-[9px] leading-relaxed font-mono" style={{ color: "rgba(255,255,255,0.3)" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.55)">
            MyShape Protocol. "MyShape Threat Model v1.0." June 2026. https://www.myshape.com/papers/threat-model
          </p>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

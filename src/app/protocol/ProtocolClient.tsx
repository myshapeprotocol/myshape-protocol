"use client";
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import EcosystemMap from "@/components/ecosystem-map/EcosystemMap";
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

const SPEC_SECTIONS = [
  { id: "§1", title: "Definitions", desc: "Presence, Motion Vector, ZK-Presence — the mathematical vocabulary", status: "implemented" },
  { id: "§2", title: "Motion Vector Format", desc: "Standardized 18-point skeleton topology, 30fps, 1s window, Poseidon hash", status: "implemented" },
  { id: "§3", title: "Feature Pipeline", desc: "Five-stage extraction: preprocessing → temporal → kinematic → entropy → hash", status: "implemented" },
  { id: "§4", title: "Entropy Model", desc: "Micro-timing, noise residual, frequency entropy, biological perturbation", status: "implemented" },
  { id: "§5", title: "Threat & Attack Model", desc: "Generative / Replay / Imitation / Sensor-spoof — all detectable via PES", status: "implemented" },
  { id: "§6", title: "Proof System", desc: "PoP + MP + EP → ZK-Presence composite proof, 3-layer architecture", status: "implemented" },
  { id: "§7", title: "Reference Architecture", desc: "Five engines: LIE, MPE, ZPE, VN, Presence Network — 4 security boundaries", status: "implemented" },
  { id: "§8", title: "SDK Specification", desc: "Presence / Proof / Verification modules — 5 lines to integrate", status: "implemented" },
  { id: "§9", title: "Protocol Specification", desc: "Wire format, 6 verification rules, stateless network design", status: "implemented" },
  { id: "§10", title: "Unforgeability Proof", desc: "Theorem: Pr[AI PES ≥ 0.65] → 0 — 5-step mathematical proof", status: "implemented" },
  { id: "§11-13", title: "Presence Stream", desc: "Aggregation, multi-device fusion, continuous presence + PSS stability score", status: "implemented" },
  { id: "§14-16", title: "Reputation & Graph", desc: "Reputation scoring, co-presence graph, network consensus", status: "implemented" },
];

const FIVE_LAYERS = [
  { layer: 5, name: "IDENTITY LAYER", role: "Sovereign Identity · Presence · Liveness · Sybil Defense", status: "active" },
  { layer: 4, name: "PROOF LAYER", role: "ZK-MG · ZK-MIP · Succinct Verification · Cross-Platform", status: "active" },
  { layer: 3, name: "INTEGRITY LAYER", role: "Anti-Synthesis · Anti-Replay · Sensor Fusion · PES Engine", status: "active" },
  { layer: 2, name: "GEOMETRY LAYER", role: "Invariants · Manifold Projection · SST 18-Point Topology", status: "active" },
  { layer: 1, name: "CAPTURE LAYER", role: "Real-Time Motion · Sensor Input · On-Device Preprocessing", status: "active" },
];

const ENGINES = [
  { name: "Local Identity Engine", file: "local-identity.ts", desc: "Device salt, local key derivation, session anchoring" },
  { name: "Motion Processing Engine", file: "presence-entropy.ts", desc: "SST mapping, PES computation, feature pipeline" },
  { name: "ZK-Proof Engine", file: "proof-system.ts", desc: "PoP/MP/EP generation, ZK-Presence composite" },
  { name: "Threat Assessment", file: "threat-assessment.ts", desc: "8 attack signatures, corroboration logic" },
  { name: "Protocol Validator", file: "protocol-validator.ts", desc: "6 verification rules, replay registry" },
  { name: "Presence Stream", file: "presence-stream.ts", desc: "Aggregation, multi-device, PSS stability" },
  { name: "Reputation Engine", file: "presence-reputation.ts", desc: "PRS scoring, decay model, tier system" },
  { name: "Unforgeability Proof", file: "unforgeability.ts", desc: "Entropy gap detection, security horizon" },
];

export default function ProtocolClient() {
  return (
    <ProtocolLayout
      refId="001" category="PROTOCOL_CORE" title="PROTOCOL_OVERVIEW"
      secLevel="CLASS_OMEGA" systemStatus="ALL_SYSTEMS_ACTIVE"
      renderSigil={true}
    >
      <div className="space-y-20 md:space-y-28">
        {/* ── 五层架构 ── */}
        <section>
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">Five-Layer Architecture</h2>
          <div className="space-y-1 max-w-3xl mx-auto">
            {FIVE_LAYERS.map((l) => (
              <div key={l.layer}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                className="flex items-center gap-4 p-4 bg-[#02040a] transition-all"
                style={{ border: "1px solid rgba(144,200,255,0.1)" }}>
                <div className="w-8 h-8 flex items-center justify-center border border-cyan-500/30 text-cyan-400/60 font-mono text-[10px] shrink-0">
                  L{l.layer}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] tracking-[0.3em] uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }} data-default="rgba(255,255,255,0.6)" data-hover="rgba(255,255,255,0.95)">{l.name}</div>
                  <div className="text-[9px] tracking-[0.1em] truncate" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{l.role}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] tracking-[0.2em] uppercase" style={{ color: "rgba(34,211,238,0.4)" }} data-default="rgba(34,211,238,0.4)" data-hover="rgba(34,211,238,0.8)">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                  {l.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 规范实施状态 ── */}
        <section>
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">Specification Implementation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPEC_SECTIONS.map((s) => (
              <div key={s.id}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.012); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                className="bg-[#02040a] p-5 transition-all"
                style={{ border: "1px solid rgba(144,200,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400/60 font-mono text-[10px] tracking-[0.3em]">{s.id}</span>
                  <span className="flex items-center gap-1 text-[8px] tracking-[0.2em] uppercase" style={{ color: "rgba(34,211,238,0.5)" }} data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.9)">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] tracking-[0.15em] uppercase mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }} data-default="rgba(255,255,255,0.6)" data-hover="rgba(255,255,255,0.95)">{s.title}</div>
                <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 引擎清单 ── */}
        <section>
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">Protocol Engines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Engine</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal hidden md:table-cell">Module</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {ENGINES.map((e) => (
                  <tr key={e.file} className="border-b border-white/5 hover:bg-cyan-500/[0.02] transition-all"
                    onMouseEnter={e => { playTick(700, "sine", 0.06, 0.015); hoverOn(e); }} onMouseLeave={e => hoverOff(e)}>
                    <td className="p-3 tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px" }} data-default="rgba(255,255,255,0.5)" data-hover="rgba(255,255,255,0.9)" data-default-size="10px" data-hover-size="13px">{e.name}</td>
                    <td className="p-3 font-mono hidden md:table-cell" style={{ color: "rgba(34,211,238,0.35)", fontSize: "9px" }} data-default="rgba(34,211,238,0.35)" data-hover="rgba(34,211,238,0.7)" data-default-size="9px" data-hover-size="12px">{e.file}</td>
                    <td className="p-3" style={{ color: "rgba(255,255,255,0.25)", fontSize: "9px" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)" data-default-size="9px" data-hover-size="12px">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Protocol Respiration & Evolution ── */}
        <section className="py-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-white/25 text-[10px] tracking-[0.5em] uppercase mb-6 hover:text-cyan-300/50 transition-colors cursor-default"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>Protocol Respiration &amp; Evolution</div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-8">
              Identity is not static.<br />
              <span className="text-cyan-300/70">It breathes with you.</span>
            </h2>
            <div className="space-y-6 text-white/35 text-[14px] leading-[1.9] font-light">
              <p>
                A MyShape identity is not a record. It is a living geometry — a digital entity
                that grows, strengthens, and evolves with every breath you take in front of the sensor.
              </p>
              <p>
                Each motion captured. Each signature verified. Each proof generated. These are not
                transactions. They are respirations — the protocol inhaling entropy, exhaling trust.
              </p>
              <p>
                Your particle geometry begins in stillness. With each scan, a new orbital particle
                ignites — drifting from the core outward, tracing the path from silence to saturation.
                From emptiness to fullness. From <span className="text-white/50">Awakening</span> to{' '}
                <span className="text-cyan-300/70">Genesis Sealed</span>.
              </p>
              <p>
                This is not a points system. It is a cartography of presence — a map of how deeply
                you have inscribed yourself into the protocol&apos;s trust substrate. The particles
                are not awarded. They emerge, as a natural consequence of entropy contributed.
              </p>
            </div>

            {/* 进化阶段视觉指示器 */}
            <div className="mt-12 flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} className="flex flex-col items-center gap-2">
                  <div
                    className="rounded-full transition-all duration-1000"
                    style={{
                      width: `${6 + n * 3}px`,
                      height: `${6 + n * 3}px`,
                      background: n === 0 ? "rgba(255,255,255,0.05)" : n === 8 ? "rgba(34,211,238,0.7)" : `rgba(34,211,238,${0.1 + n * 0.07})`,
                      boxShadow: n === 8 ? "0 0 16px rgba(34,211,238,0.5)" : n > 0 ? `0 0 ${4 + n}px rgba(34,211,238,${0.1 + n * 0.05})` : "none",
                      animation: `pulse ${2 + n * 0.3}s ease-in-out infinite`,
                      animationDelay: `${n * 0.2}s`,
                    }}
                  />
                  <span className="text-[7px] text-white/10 font-mono">{n}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-white/25 hover:text-cyan-300/50 text-[9px] tracking-[0.25em] uppercase transition-colors cursor-default"
              onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>
              Stillness → Awakening → Genesis Sealed
            </div>

            <div className="mt-8 text-white/20 text-[9px] tracking-[0.15em]">
              Full evolution specification archived in{' '}
              <a href="/papers/technical-spec"
                onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
                className="text-cyan-400/40 hover:text-cyan-300/70 transition-colors underline decoration-cyan-400/20 hover:decoration-cyan-400/40">Technical Specification §12</a>
            </div>
          </div>
        </section>

        {/* ── Protocol Lifecycle ── */}
        <section className="py-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-white/25 text-[10px] tracking-[0.5em] uppercase mb-10 text-center hover:text-cyan-300/50 transition-colors cursor-default"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>Protocol Lifecycle</div>

            {/* 流水线图 */}
            <div className="relative border border-cyan-400/15 bg-gradient-to-b from-cyan-400/[0.03] to-transparent p-8 md:p-10 font-mono group"
              onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); e.currentTarget.style.borderColor = "rgba(34,211,238,0.35)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(34,211,238,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.15)"; e.currentTarget.style.boxShadow = "none"; }}>
              {/* 步骤条 */}
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-3">
                {[
                  { label: "WALLET", sub: "EIP-4361" },
                  { label: "SIWE_VERIFY", sub: "on-chain" },
                  { label: "PROTOCOL_NODES", sub: "local anchor" },
                  { label: "ZK_PROOF", sub: "zero-knowledge" },
                  { label: "IDENTITY_MESH", sub: "decentralized" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="border border-cyan-400/20 bg-cyan-400/[0.03] px-4 py-3 text-center transition-all duration-300 hover:border-cyan-400/50 hover:bg-cyan-400/[0.06] hover:scale-105"
                      onMouseEnter={() => playTick(500 + i * 80, "sine", 0.05, 0.01)}>
                      <div className="text-cyan-300/70 text-[11px] tracking-[0.15em] font-bold mb-1">{step.label}</div>
                      <div className="text-cyan-400/25 text-[8px] tracking-[0.2em]">{step.sub}</div>
                    </div>
                    {i < 4 && (
                      <span className="text-cyan-400/30 mx-1 text-[14px] font-light">→</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 底部说明 */}
              <p className="mt-8 text-white/40 text-[11px] leading-[1.7] font-light text-center max-w-xl mx-auto">
                From wallet signature to decentralized identity mesh. Each step is cryptographically
                verifiable. No raw data stored. No centralized intermediary.
              </p>
            </div>

            {/* Agent 角色说明 */}
            <p className="mt-6 text-white/30 text-[11px] leading-[1.8] font-light text-center max-w-lg mx-auto italic"
              onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>
              Agents such as Hermes operate at the application layer — they consume
              protocol-anchored identity signals but never possess the underlying
              cryptographic material. The protocol remains the single source of truth.
            </p>
          </div>
        </section>

        {/* ── Ecosystem Map ── */}
        <section className="py-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <div className="text-white/35 text-[11px] tracking-[0.5em] uppercase mb-10 text-center hover:text-cyan-300/60 transition-colors cursor-default"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.015)}
            style={{ textShadow: "0 0 20px rgba(34,211,238,0.15)" }}>Protocol Ecosystem</div>
          <EcosystemMap />
        </section>

        {/* ── 入口 ── */}
        <section className="flex flex-wrap justify-center gap-6 py-16 border-t" style={{ borderColor: "rgba(144,200,255,0.1)" }}>
          <Link href="/protocol/manifesto" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)} className="group relative px-10 py-4 border border-cyan-500/30 text-cyan-400/80 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-cyan-400 transition-all" style={{ background: "transparent" }}>
            Protocol_Manifesto →
          </Link>
          <Link href="/protocol/motion-pipeline" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)} className="group relative px-10 py-4 border border-cyan-500/30 text-cyan-400/80 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-cyan-400 transition-all" style={{ background: "transparent" }}>
            Motion_Pipeline →
          </Link>
          <Link href="/protocol/identity-layer" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)} className="group relative px-10 py-4 border border-cyan-500/30 text-cyan-400/80 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-cyan-400 transition-all" style={{ background: "transparent" }}>
            Identity_Layer →
          </Link>
        </section>
      </div>
    </ProtocolLayout>
  );
}

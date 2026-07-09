"use client";
import Link from "next/link";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import EcosystemMap from "@/components/ecosystem-map/EcosystemMap";
import { playTick } from "@/utils/useAudioTick";
import "./protocol.css";

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

const LIFECYCLE = [
  { step: "01", label: "Wallet", sub: "EIP-4361 Sign-In", desc: "Connect any EIP-1193 wallet. SIWE signature anchors your address to the protocol." },
  { step: "02", label: "Verify", sub: "On-Chain Validation", desc: "Signature verified against Base Mainnet. Wallet address bound to protocol node." },
  { step: "03", label: "Anchor", sub: "Protocol Nodes", desc: "Node created in local registry. Genesis scan initializes Motion Signature entropy." },
  { step: "04", label: "Prove", sub: "ZK-Presence", desc: "Zero-knowledge proof generated. Presence verified without exposing motion data." },
  { step: "05", label: "Mesh", sub: "Identity Mesh", desc: "Node joins the decentralized identity mesh. Sovereign. Permanent. Verifiable." },
];

export default function ProtocolClient() {
  return (
    <ProtocolLayout
      refId="001" category="PROTOCOL_CORE" title="PROTOCOL_OVERVIEW"
      secLevel="CLASS_OMEGA" systemStatus="ALL_SYSTEMS_ACTIVE"
      renderSigil={true}
    >
      <div className="space-y-20 md:space-y-28">
        {/* Five-Layer Architecture */}
        <section>
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Five-Layer Architecture</h2>
          <div className="space-y-1 max-w-3xl mx-auto">
            {FIVE_LAYERS.map((l) => (
              <div key={l.layer} className="proto-layer-card" onMouseEnter={() => playTick(600, "sine", 0.06, 0.022)}>
                <div className="proto-layer-num">L{l.layer}</div>
                <div className="flex-1 min-w-0">
                  <div className="proto-layer-name">{l.name}</div>
                  <div className="proto-layer-role truncate">{l.role}</div>
                </div>
                <div className="proto-layer-status"><span className="proto-status-dot" />{l.status}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Specification Implementation */}
        <section>
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Specification Implementation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPEC_SECTIONS.map((s) => (
              <div key={s.id} className="proto-spec-card" onMouseEnter={() => playTick(600, "sine", 0.06, 0.02)}>
                <div className="proto-spec-header">
                  <span className="proto-spec-id">{s.id}</span>
                  <span className="proto-spec-status"><span className="proto-status-dot" />{s.status}</span>
                </div>
                <div className="proto-spec-title">{s.title}</div>
                <div className="proto-spec-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Protocol Engines */}
        <section>
          <h2 className="proto-section-title mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Protocol Engines</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 text-white/40 text-[10px] tracking-[0.25em] uppercase font-normal">Engine</th>
                  <th className="p-3 text-white/40 text-[10px] tracking-[0.25em] uppercase font-normal hidden md:table-cell">Module</th>
                  <th className="p-3 text-white/40 text-[10px] tracking-[0.25em] uppercase font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {ENGINES.map((e) => (
                  <tr key={e.file} className="proto-engine-row border-b border-white/5" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                    <td className="p-3 proto-engine-name">{e.name}</td>
                    <td className="p-3 proto-engine-file hidden md:table-cell">{e.file}</td>
                    <td className="p-3 proto-engine-desc">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Protocol Respiration & Evolution */}
        <section className="proto-divider py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="proto-section-title text-center mb-6" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Protocol Respiration &amp; Evolution</div>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white mb-8">
              Identity is not static.<br />
              <span className="text-[#90c8ff]/70">It breathes with you.</span>
            </h2>
            <div className="space-y-6 text-white/35 text-[14px] leading-[1.9] font-light">
              <p>A MyShape identity is not a record. It is a living geometry — a digital entity that grows, strengthens, and evolves with every breath you take in front of the sensor.</p>
              <p>Each motion captured. Each signature verified. Each proof generated. These are not transactions. They are respirations — the protocol inhaling entropy, exhaling trust.</p>
              <p>Your particle geometry begins in stillness. With each scan, a new orbital particle ignites — drifting from the core outward, tracing the path from silence to saturation. From emptiness to fullness. From <span className="text-white/50">Awakening</span> to <span className="text-[#90c8ff]/70">Genesis Sealed</span>.</p>
              <p>This is not a points system. It is a cartography of presence — a map of how deeply you have inscribed yourself into the protocol&apos;s trust substrate. The particles are not awarded. They emerge, as a natural consequence of entropy contributed.</p>
            </div>
            <div className="mt-12 flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="flex flex-col items-center gap-2">
                  <div className="proto-evo-dot"
                    style={{
                      width: `${6 + n * 3}px`, height: `${6 + n * 3}px`,
                      background: n === 0 ? "rgba(255,255,255,0.05)" : n === 8 ? "rgba(144,200,255,0.7)" : `rgba(144,200,255,${0.1 + n * 0.07})`,
                      boxShadow: n === 8 ? "0 0 16px rgba(144,200,255,0.5)" : n > 0 ? `0 0 ${4 + n}px rgba(144,200,255,${0.1 + n * 0.05})` : "none",
                      animation: `pulse ${2 + n * 0.3}s ease-in-out infinite`,
                      animationDelay: `${n * 0.2}s`,
                    }}
                  />
                  <span className="text-[8px] text-white/15 font-mono">{n}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-white/25 hover:text-[#90c8ff]/50 text-[9px] tracking-[0.25em] uppercase transition-colors cursor-default" onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>Stillness → Awakening → Genesis Sealed</div>
            <div className="mt-8 text-white/20 text-[9px] tracking-[0.15em]">
              Full evolution specification archived in{" "}
              <a href="/papers/technical-spec" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/70 transition-colors underline decoration-[#90c8ff]/20 hover:decoration-[#90c8ff]/40" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Technical Specification §12</a>
            </div>
          </div>
        </section>

        {/* Protocol Lifecycle */}
        <section className="proto-divider py-16">
          <div className="max-w-3xl mx-auto">
            <div className="proto-section-title text-center mb-12" onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}>Protocol Lifecycle</div>
            <div className="relative">
              <div className="hidden md:block absolute left-[10%] right-[10%] top-10 h-[1px] bg-gradient-to-r from-transparent via-[#90c8ff]/20 to-transparent" />
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                {LIFECYCLE.map((s, i) => (
                  <div key={s.step} className="flex items-center">
                    <div className="proto-lifecycle-node" onMouseEnter={() => playTick(600 + i * 100, "sine", 0.06, 0.015)}>
                      <div className="proto-lifecycle-circle">{s.step}</div>
                      <span className="proto-lifecycle-label">{s.label}</span>
                      <span className="proto-lifecycle-sub">{s.sub}</span>
                      <span className="proto-lifecycle-desc">{s.desc}</span>
                    </div>
                    {i < 4 && <span className="proto-lifecycle-arrow mx-1 md:mx-0">→</span>}
                  </div>
                ))}
              </div>
              <p className="mt-10 md:mt-14 text-white/30 text-[10px] md:text-[11px] leading-[1.7] font-light text-center max-w-xl mx-auto">
                From wallet signature to decentralized identity mesh. Each step cryptographically verifiable. No raw data stored. No centralized intermediary.
              </p>
            </div>
            <p className="mt-8 text-white/25 text-[10px] md:text-[11px] leading-[1.8] font-light text-center max-w-lg mx-auto italic" onMouseEnter={() => playTick(450, "sine", 0.03, 0.01)}>
              Agents such as Hermes operate at the application layer — they consume protocol-anchored identity signals but never possess the underlying cryptographic material. The protocol remains the single source of truth.
            </p>
          </div>
        </section>

        {/* Ecosystem Map */}
        <section className="proto-divider py-16">
          <div className="proto-section-title text-center mb-10" onMouseEnter={() => playTick(500, "sine", 0.05, 0.015)} style={{ textShadow: "0 0 20px rgba(144,200,255,0.15)" }}>Protocol Ecosystem</div>
          <EcosystemMap />
        </section>

        {/* Entry Points */}
        <section className="proto-divider flex flex-wrap justify-center gap-6 py-16">
          <Link href="/protocol/manifesto" className="proto-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Protocol_Manifesto →</Link>
          <Link href="/protocol/motion-pipeline" className="proto-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Motion_Pipeline →</Link>
          <Link href="/protocol/identity-layer" className="proto-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Identity_Layer →</Link>
        </section>
      </div>
    </ProtocolLayout>
  );
}

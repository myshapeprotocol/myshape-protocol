"use client";
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

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
              <div key={l.layer} className="flex items-center gap-4 p-4 bg-[#02040a] border border-white/5 group hover:border-cyan-500/20 transition-all">
                <div className="w-8 h-8 flex items-center justify-center border border-cyan-500/30 text-cyan-400/60 font-mono text-[10px] shrink-0">
                  L{l.layer}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-[11px] tracking-[0.3em] uppercase mb-0.5">{l.name}</div>
                  <div className="text-white/25 text-[9px] tracking-[0.1em] truncate">{l.role}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-cyan-400/50 tracking-[0.2em] uppercase">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {SPEC_SECTIONS.map((s) => (
              <div key={s.id} onMouseEnter={() => playTick(600, "sine", 0.06, 0.012)} className="bg-[#02040a] p-5 group hover:bg-cyan-500/[0.02] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400/60 font-mono text-[10px] tracking-[0.3em]">{s.id}</span>
                  <span className="flex items-center gap-1 text-[8px] text-emerald-400/60 tracking-[0.2em] uppercase">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    {s.status}
                  </span>
                </div>
                <div className="text-white/70 text-[11px] tracking-[0.15em] uppercase mb-1.5">{s.title}</div>
                <div className="text-white/25 text-[9px] leading-relaxed">{s.desc}</div>
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
                  <tr key={e.file} className="border-b border-white/5 hover:bg-cyan-500/[0.02] transition-all">
                    <td className="p-3 text-white/60 text-[10px] tracking-[0.15em] uppercase">{e.name}</td>
                    <td className="p-3 text-cyan-400/40 font-mono text-[9px] hidden md:table-cell">{e.file}</td>
                    <td className="p-3 text-white/25 text-[9px]">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 入口 ── */}
        <section className="flex flex-wrap justify-center gap-6 py-16 border-t border-white/5">
          <Link href="/protocol/manifesto" className="group relative px-10 py-4 border border-cyan-500/30 bg-black text-cyan-400/80 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-cyan-400 transition-all">
            Protocol_Manifesto →
          </Link>
          <Link href="/protocol/motion-pipeline" className="group relative px-10 py-4 border border-white/10 bg-black text-white/40 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-white/30 transition-all">
            Motion_Pipeline →
          </Link>
          <Link href="/protocol/identity-layer" className="group relative px-10 py-4 border border-white/10 bg-black text-white/40 text-[10px] tracking-[0.4em] uppercase hover:text-white hover:border-white/30 transition-all">
            Identity_Layer →
          </Link>
        </section>
      </div>
    </ProtocolLayout>
  );
}

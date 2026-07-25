"use client";
import Link from "next/link";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import EcosystemMap from "@/components/ecosystem-map/EcosystemMap";
import { playTick } from "@/utils/useAudioTick";
import "./protocol.css";

const SPEC_SECTIONS = [
  { id: "CPS-0001", title: "Continuity Protocol Core", desc: "Protocol object, semantics, trust model, verification contract. Engine-independent. v1.0-RC.", status: "rc" },
  { id: "RFC-0001", title: "Motion Signature Format", desc: "PES, jerk detection, cross-modal matching, challenge-response protocol", status: "draft" },
  { id: "RFC-0002", title: "Continuity Proof Format", desc: "Evidence receipts, CFC catalog, predecessor chaining, verification policy", status: "draft" },
  { id: "EE-001", title: "Presence Detection", desc: "4D entropy scoring: micro-timing, noise residual, frequency entropy, perturbation", status: "active" },
  { id: "EE-002", title: "Causal Coupling", desc: "IMU + camera event matching ±500ms. Temporal alignment: 100%", status: "active" },
  { id: "EE-003", title: "Challenge Response", desc: "3-round gyroscope challenge. Jittered timing. Anti-replay.", status: "active" },
  { id: "VS-001", title: "Verification Session", desc: "Dual-engine pipeline. Passive → escalate → aggregate → verdict", status: "active" },
  { id: "npm", title: "SDK", desc: "verifyContinuity(). npm install @thecontinuitylab/myshape. 192 tests. MIT.", status: "published" },
];

const FIVE_LAYERS = [
  { layer: "CPS", name: "PROTOCOL OBJECT", role: "CPS-0001 Continuity Receipt · Assertions · Trust Model · Verification Contract", status: "rc" },
  { layer: "RFC", name: "SPECIFICATION", role: "RFC-0001 Motion Signature · RFC-0002 Continuity Proof", status: "published" },
  { layer: "EE", name: "EVIDENCE ENGINES", role: "EE-001 Presence · EE-002 Causal Coupling · EE-003 Challenge", status: "active" },
  { layer: "VS", name: "VERIFICATION", role: "Dual-Engine Pipeline · Escalation Logic · CFC Detection", status: "active" },
  { layer: "SDK", name: "DEVELOPER SURFACE", role: "npm install @thecontinuitylab/myshape · verifyContinuity()", status: "published" },
];

const ENGINES = [
  { name: "Presence Detection (EE-001)", file: "N/A — 100% floor", desc: "4D entropy scoring from IMU data. Distinguishes embodied entities from synthetic motion." },
  { name: "Causal Coupling (EE-002)", file: "316 runs · 58% pass", desc: "Cross-modal event binding. Proves IMU and camera observe the same physical event." },
  { name: "Gyroscope Challenge (EE-003)", file: "200 runs · 59% pass", desc: "3-round randomized directional challenge with jittered timing. Defeats replay." },
  { name: "Verification Session (VS-001)", file: "60 runs · 93% pass", desc: "Dual-engine pipeline. Passive presence + active challenge escalation." },
  { name: "Reference Verifier", file: "192 tests · MIT license", desc: "CPS-0001 conformance suite. 23 assertions, 10 scenarios. Zero engine deps." },
];

const LIFECYCLE = [
  { step: "01", label: "Capture", sub: "Sensor Data", desc: "IMU at 60Hz + camera at 7Hz. All processing on-device. No raw data leaves the device." },
  { step: "02", label: "Extract", sub: "Evidence Engines", desc: "Jerk peak detection, direction changes, cross-modal matching. Per-component diagnostics." },
  { step: "03", label: "Evaluate", sub: "Verification Policy", desc: "Confidence thresholds. Escalation logic. CFC checks. Evidence → Verdict." },
  { step: "04", label: "Receipt", sub: "Evidence Receipt", desc: "SHA-256 hash-chained. Verifiable by any conforming verifier. RFC-0002 compliant." },
  { step: "05", label: "Verify", sub: "Any Verifier", desc: "Open specification. Reference implementation. Anyone can build a compatible verifier." },
];

export default function ProtocolClient() {
  return (
    <ProtocolLayout
      refId="CPS-0001" category="PROTOCOL_CORE" title="PROTOCOL_OVERVIEW"
      secLevel="v1.0-RC" systemStatus="RESEARCH_CANDIDATE"
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
                  <th className="p-3 text-white/55 text-[11px] tracking-[0.2em] uppercase font-normal">Engine</th>
                  <th className="p-3 text-white/55 text-[11px] tracking-[0.2em] uppercase font-normal hidden md:table-cell">Module</th>
                  <th className="p-3 text-white/55 text-[11px] tracking-[0.2em] uppercase font-normal">Description</th>
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

        {/* Protocol Status */}
        <section className="proto-divider py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="proto-section-title text-center mb-8" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>Protocol Status</div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-0">
              {[
                { phase: "Research Candidate", status: "current", desc: "v1.0-RC · CPS-0001 frozen · 192 tests · reference verifier · conformance suite", freq: 500 },
                { phase: "Protocol Candidate", status: "next", desc: "Community review · third-party implementations · interoperability validation", freq: 600 },
                { phase: "Stable", status: "future", desc: "v1.0 release · RFC 3161 public timestamp · ecosystem adoption", freq: 700 },
              ].map((p, i) => (
                <div key={p.phase} className="flex items-center">
                  <div className="proto-lifecycle-node" onMouseEnter={() => playTick(p.freq, "sine", 0.06, 0.015)}>
                    <div className={`proto-lifecycle-circle status-${p.status}`}>
                      {p.status === "current" ? "●" : "○"}
                    </div>
                    <span className={`proto-lifecycle-label status-${p.status}`}>{p.phase}</span>
                    <span className={`proto-lifecycle-desc ${p.status !== "current" ? `status-${p.status}` : ""}`} style={{ maxWidth: "12rem", margin: "0.5rem auto" }}>{p.desc}</span>
                  </div>
                  {i < 2 && <span className="proto-lifecycle-arrow mx-2 md:mx-1">→</span>}
                </div>
              ))}
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
              <p className="mt-10 md:mt-14 text-white/45 text-[12px] leading-[1.7] font-light text-center max-w-xl mx-auto">
                From sensor capture to cryptographic receipt. Each step independently verifiable. No raw data stored. No centralized intermediary.
              </p>
            </div>
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
          <Link href="/protocol/identity-layer" className="proto-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Identity_Layer →</Link>
        </section>
      </div>
    </ProtocolLayout>
  );
}

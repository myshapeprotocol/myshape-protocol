"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { useState } from "react";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import DeveloperPlayground from "@/components/developer-playground/DeveloperPlayground";
import GenesisNodeInit from "@/components/genesis-node-init/GenesisNodeInit";
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

const SDK_METHODS = [
  { module: "Presence", method: "generatePresenceProof(frames, timestamps, opts?)", returns: "PresenceProofResult", desc: "Generate PoP + MP + EP + ZKP from MediaPipe frames" },
  { module: "Presence", method: "getEntropyScore(frames, timestamps)", returns: "number | null", desc: "Real-time PES for live UI feedback" },
  { module: "Presence", method: "requestPresence(frames, timestamps)", returns: "PresenceReceipt", desc: "Full flow: proof → submit → receipt" },
  { module: "Proof", method: "verifyLocalProof(proof, opts?)", returns: "VerificationResult", desc: "Verify ZKP locally with 5 checks" },
  { module: "Proof", method: "aggregateProofs(proofs[])", returns: "AggregatedProof", desc: "Recursive proof aggregation over time windows" },
  { module: "Proof", method: "revokeDevice(reason?)", returns: "RevocationReceipt", desc: "Rotate device salt and revoke old identity" },
  { module: "Verification", method: "verifyPresenceProof(zkp, opts?)", returns: "VerificationResult", desc: "Full 6-rule verification (§9.4)" },
  { module: "Verification", method: "verifyPresenceReceipt(receipt)", returns: "boolean", desc: "Lightweight app-layer verification" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/identity?email=...", desc: "Look up a node by email" },
  { method: "GET", path: "/api/nodes/count", desc: "Total protocol node counts" },
  { method: "POST", path: "/api/nodes/handshake", desc: "Register a new protocol node → returns node_token + node_handle", cta: "/handshake" },
];

const QUICK_START = `// 5 lines to integrate Presence
import MyShape from "@/sdk";

const frames = [...]; // MediaPipe pose landmarks
const timestamps = [...];

const receipt = MyShape.requestPresence(frames, timestamps);
const isValid = MyShape.verifyReceipt(receipt);
// Done. Your app now has presence verification.`;

export default function DevelopersClient() {
  const [showNodeInit, setShowNodeInit] = useState(false);
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-12">
          <div className="text-[#90c8ff]/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>DEVELOPER_HUB // V1.0</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase">Build with Presence</h1>
          <p className="text-white/45 md:text-white/50 text-[11px] md:text-[14px] leading-relaxed max-w-xl font-light">
            Integrate sovereign identity verification into any application.
            Five lines of code. Zero data stored. Real human presence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/motion-demo" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.25em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white transition-all">
              ◈ Try Live Demo →
            </a>
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.25em] uppercase hover:border-[#90c8ff]/40 hover:text-[#90c8ff]/80 hover:bg-[#90c8ff]/[0.03] transition-all">
              GitHub →
            </a>
            <button onClick={() => { setShowNodeInit(true); playTick(600, "sine", 0.06, 0.015); }}
              onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#d4af37]/30 text-[#d4af37]/70 text-[10px] tracking-[0.25em] uppercase hover:bg-[#d4af37]/[0.06] hover:text-[#d4af37] transition-all">
              ◈ Connect Node →
            </button>
          </div>
        </div>

        {/* ── Quick Start: 5-minute interactive ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6">// QUICK_START (5 MIN)</h2>
          <div className="space-y-4">
            {[
              {
                step: "01",
                title: "Get the SDK",
                time: "30 sec",
                code: `git clone https://github.com/myshapeprotocol/sdk.git
cd sdk && npm install`,
                desc: "Zero dependencies. TypeScript native. Works with Node.js 18+.",
              },
              {
                step: "02",
                title: "Capture Motion Frames",
                time: "2 min",
                code: `import { Pose } from "@mediapipe/pose";

const pose = new Pose({ locateFile: (f) => ... });
pose.onResults((results) => {
  const frames = results.poseLandmarks;
  // Each frame: 33 joints × { x, y, z, visibility }
});`,
                desc: "Use any MediaPipe-compatible camera. We recommend Firefox for WebGL stability.",
              },
              {
                step: "03",
                title: "Verify Presence",
                time: "1 min",
                code: QUICK_START,
                desc: "That's it. Your app now rejects AI-generated motion at the protocol level.",
              },
              {
                step: "04",
                title: "See It Working",
                time: "30 sec",
                code: "",
                desc: "",
                isAction: true,
              },
            ].map((s, i) => (
              <div key={s.step}
                onMouseEnter={e => { playTick(500 + i * 100, "sine", 0.08, 0.02); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(144,200,255,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                className="border border-white/5 bg-white/[0.01] transition-all duration-500 overflow-hidden cursor-default">
                <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5">
                  <span className="text-[#90c8ff]/40 text-[18px] font-light tracking-[0.1em]"
                    data-default="rgba(144,200,255,0.4)" data-hover="rgba(144,200,255,0.8)">{s.step}</span>
                  <div className="flex-1">
                    <span className="text-white/55 text-[11px] tracking-[0.2em] uppercase"
                      data-default="rgba(255,255,255,0.55)" data-hover="rgba(255,255,255,0.9)">{s.title}</span>
                  </div>
                  <span className="text-white/22 text-[9px] tracking-[0.1em]"
                    data-default="rgba(255,255,255,0.22)" data-hover="rgba(255,255,255,0.5)">{s.time}</span>
                </div>
                {!s.isAction && (
                  <div className="p-5 bg-black/30 relative group/code">
                    <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto"
                      style={{ color: "rgba(144,200,255,0.6)", fontSize: "10px" }}
                      data-default="rgba(144,200,255,0.6)" data-hover="rgba(144,200,255,0.9)"
                      data-default-size="10px" data-hover-size="11px">
                      {s.code}
                    </pre>
                    <button onClick={() => { navigator.clipboard.writeText(s.code.trim()); playTick(600, "sine", 0.06, 0.015); }}
                      className="absolute top-3 right-3 text-white/10 hover:text-[#90c8ff]/60 text-[8px] tracking-[0.15em] uppercase transition-colors opacity-0 group-hover/code:opacity-100">
                      Copy
                    </button>
                  </div>
                )}
                {s.isAction && (
                  <div className="p-5 flex gap-3">
                    <a href="/motion-demo"
                      onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                      className="px-5 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/[0.06] hover:text-white transition-all">
                      ◈ Try Live Demo →
                    </a>
                    <a href="#playground"
                      onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                      className="px-5 py-2 border border-white/10 text-white/30 text-[10px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">
                      ▼ Skip to Playground
                    </a>
                  </div>
                )}
                {s.desc && (
                  <div className="px-5 pb-3 text-[9px] tracking-[0.08em]"
                    style={{ color: "rgba(255,255,255,0.30)", fontSize: "9px" }}
                    data-default="rgba(255,255,255,0.30)" data-hover="rgba(255,255,255,0.6)"
                    data-default-size="9px" data-hover-size="10px">{s.desc}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── SDK Reference ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// SDK_REFERENCE (§8)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-white/5">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal w-20">Module</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Method</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal w-32">Returns</th>
                  <th className="p-3 text-white/30 text-[9px] tracking-[0.3em] uppercase font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {SDK_METHODS.map((m, i) => (
                  <tr key={i} className="border-b border-white/5 transition-all duration-300"
                    onMouseEnter={ev => { playTick(700, "sine", 0.06, 0.015); hoverOn(ev); ev.currentTarget.style.background = "rgba(144,200,255,0.04)"; }}
                    onMouseLeave={ev => { hoverOff(ev); ev.currentTarget.style.background = "transparent"; }}>
                    <td className="p-3 text-[10px] tracking-[0.15em]" style={{ color: "rgba(144,200,255,0.5)", fontSize: "10px" }} data-default="rgba(144,200,255,0.5)" data-hover="rgba(144,200,255,0.9)" data-default-size="10px" data-hover-size="12px">{m.module}</td>
                    <td className="p-3 font-mono" style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }} data-default="rgba(255,255,255,0.45)" data-hover="rgba(255,255,255,0.85)" data-default-size="10px" data-hover-size="12px">{m.method}</td>
                    <td className="p-3 font-mono" style={{ color: "rgba(144,200,255,0.4)", fontSize: "9px" }} data-default="rgba(144,200,255,0.4)" data-hover="rgba(144,200,255,0.8)" data-default-size="9px" data-hover-size="11px">{m.returns}</td>
                    <td className="p-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)" data-default-size="10px" data-hover-size="12px">{m.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Protocol Engines ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// PROTOCOL_ENGINES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "PES Engine", path: "engine/presence-entropy.ts", desc: "4-dimensional entropy scoring" },
              { name: "Proof System", path: "engine/proof-system.ts", desc: "PoP + MP + EP → ZK-Presence" },
              { name: "SST Mapper", path: "engine/skeleton-topology.ts", desc: "MediaPipe 33-pt → SST 18-pt" },
              { name: "Threat Assessment", path: "engine/threat-assessment.ts", desc: "8 attack signatures, corroboration logic" },
              { name: "Protocol Validator", path: "engine/protocol-validator.ts", desc: "6 verification rules §9.4" },
              { name: "Local Identity", path: "engine/local-identity.ts", desc: "Device salt, key derivation, session" },
              { name: "Presence Stream", path: "engine/presence-stream.ts", desc: "Aggregation, multi-device, PSS" },
              { name: "Unforgeability", path: "engine/unforgeability.ts", desc: "Entropy gap theorem, security horizon" },
            ].map((e) => (
              <div key={e.name} className="p-4 transition-all duration-300"
                onMouseEnter={ev => { playTick(700, "sine", 0.08, 0.015); hoverOn(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; ev.currentTarget.style.transform = "translateY(-2px)"; ev.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(144,200,255,0.10)"; }}
                onMouseLeave={ev => { hoverOff(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; ev.currentTarget.style.transform = "translateY(0)"; ev.currentTarget.style.boxShadow = "none"; }}
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="text-[11px] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px" }} data-default="rgba(255,255,255,0.55)" data-hover="rgba(255,255,255,0.9)" data-default-size="11px" data-hover-size="13px">{e.name}</div>
                <div className="font-mono text-[9px] mb-1.5" style={{ color: "rgba(144,200,255,0.3)", fontSize: "9px" }} data-default="rgba(144,200,255,0.3)" data-hover="rgba(144,200,255,0.7)" data-default-size="9px" data-hover-size="11px">{e.path}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)" data-default-size="10px" data-hover-size="12px">{e.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code Examples ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// CODE_EXAMPLES</h2>
          <div className="space-y-4">
            {[
              {
                title: "Basic Presence Verification",
                code: `import MyShape from "@/sdk";

// MediaPipe pose landmarks from camera
const frames = [...];
const timestamps = [...];

const receipt = MyShape.requestPresence(frames, timestamps);
// → { zkp_hash, pes: 0.72, timestamp, session_id }

const valid = MyShape.verifyReceipt(receipt);
// → true if human presence confirmed`,
              },
              {
                title: "Threat Assessment",
                code: `import { assessThreat } from "@/engine/threat-assessment";
import { computeFullPES } from "@/engine/presence-entropy";

const { pes, components } = computeFullPES(sstFrames, timestamps);
const threat = assessThreat(pes, components);

if (threat.overallVerdict === "human") {
  // Allow access. Real human confirmed.
} else if (threat.overallVerdict === "suspicious") {
  // Request additional verification
} else {
  // Block. Likely synthetic.
}`,
              },
            ].map((ex, i) => (
              <div key={i} className="overflow-hidden transition-all duration-300"
                onMouseEnter={ev => { playTick(600, "sine", 0.06, 0.015); hoverOn(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; ev.currentTarget.style.transform = "translateY(-2px)"; ev.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(144,200,255,0.10)"; }}
                onMouseLeave={ev => { hoverOff(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; ev.currentTarget.style.transform = "translateY(0)"; ev.currentTarget.style.boxShadow = "none"; }}
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(144,200,255,0.6)", fontSize: "10px" }} data-default="rgba(144,200,255,0.6)" data-hover="rgba(144,200,255,0.95)" data-default-size="10px" data-hover-size="13px">{ex.title}</span>
                </div>
                <div className="p-5">
                  <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto" style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)" data-default-size="10px" data-hover-size="12px">
                    {ex.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Developer Playground ── */}
        <section className="mb-14" id="playground">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// ONLINE_PLAYGROUND</h2>
          <DeveloperPlayground />
        </section>

        {/* ── Developer Cohort ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// DEVELOPER_COHORT</h2>
          <div className="border border-purple-400/20 bg-purple-400/[0.02] p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <div className="text-purple-300/60 text-[10px] tracking-[0.2em] uppercase">Early Ecosystem</div>
                <p className="text-white/40 text-[12px] leading-relaxed max-w-lg">
                  MyShape SDK is in active development. Join the Developer Cohort to get early access,
                  influence the API design, and build the first wave of presence-verified applications.
                </p>
                <div className="space-y-1.5 pt-1">
                  {[
                    "Early SDK access before public release",
                    "Direct line to protocol architects",
                    "Your app featured on myshape.com/build",
                    "Genesis Developer badge (on-chain record)",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/25 text-[10px]">
                      <span className="text-purple-400/40 text-[8px]">◆</span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[220px]">
                <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
                  onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
                  className="px-6 py-3 border border-purple-400/30 text-purple-300/70 text-[10px] tracking-[0.2em] uppercase text-center hover:bg-purple-400/[0.06] hover:text-purple-200 transition-all">
                  Star on GitHub →
                </a>
                <a href="/genesis"
                  onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
                  className="px-6 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/60 text-[10px] tracking-[0.2em] uppercase text-center hover:bg-[#90c8ff]/[0.06] hover:text-[#90c8ff] transition-all">
                  Join Genesis Cohort →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Verification Dashboard ── */}
        <section className="mb-20">
          <VerificationDashboard />
        </section>

        {/* ── REST API ── */}
        <section className="mb-14">
          <h2 className="text-white/30 md:text-white/35 text-[10px] md:text-[11px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-4">// REST_API</h2>
          {API_ENDPOINTS.map((ep) => (
            <div key={ep.path} className="p-4 mb-2 flex items-center gap-4 transition-all duration-300"
              onMouseEnter={ev => { playTick(600, "sine", 0.06, 0.015); hoverOn(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; ev.currentTarget.style.transform = "translateY(-2px)"; ev.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(144,200,255,0.10)"; }}
              onMouseLeave={ev => { hoverOff(ev); ev.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; ev.currentTarget.style.transform = "translateY(0)"; ev.currentTarget.style.boxShadow = "none"; }}
              style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
              <span className="text-[10px] tracking-[0.2em] font-bold w-10 shrink-0" style={{ color: "rgba(144,200,255,0.6)", fontSize: "10px" }} data-default="rgba(144,200,255,0.6)" data-hover="rgba(144,200,255,0.95)" data-default-size="10px" data-hover-size="13px">{ep.method}</span>
              <span className="font-mono text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }} data-default="rgba(255,255,255,0.45)" data-hover="rgba(255,255,255,0.85)" data-default-size="11px" data-hover-size="13px">{ep.path}</span>
              <span className="text-[10px] flex-1" style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)" data-default-size="10px" data-hover-size="12px">{ep.desc}</span>
              {"cta" in ep && (
                <a href={ep.cta} className="shrink-0 px-3 py-1 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[9px] tracking-[0.15em] uppercase hover:border-[#90c8ff]/50 hover:text-[#90c8ff]/90 transition-all no-underline">
                  Try it →
                </a>
              )}
            </div>
          ))}

          {/* Live API Response Examples */}
          <div className="mt-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5">
            <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.3em] uppercase mb-4">// RESPONSE_FORMAT</div>
            <div className="space-y-4">
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1">GET /api/identity?email=protocol@myshape.com</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
{`{
  "found": true,
  "email": "protocol@myshape.com",
  "node_handle": null,
  "status": "GENESIS_NODE",
  "registered_at": "2026-06-22T09:12:01.329Z"
}`}</pre>
              </div>
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1">GET /api/nodes/count</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
{`{
  "total": 17,
  "humans": 8,
  "agents": 3,
  "genesis_nodes": 4
}`}</pre>
              </div>
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1 flex items-center gap-2">
                  POST /api/nodes/handshake
                  <a href="/handshake" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/80 text-[8px] tracking-[0.15em] uppercase no-underline transition-colors">→ Live Demo</a>
                </div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
{`// Request
{ "email": "entity@protocol.io", "origin_domain": "myshape.com" }

// Response (201)
{
  "node_token": "ms_a1b2c3d4e5f6...",
  "node_handle": "SIG_4F7A2C1B",
  "stage": "GENESIS_NODE_INITIALIZED"
}`}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showNodeInit && <GenesisNodeInit onClose={() => setShowNodeInit(false)} />}
      <ProtocolFooter />
    </div>
  );
}

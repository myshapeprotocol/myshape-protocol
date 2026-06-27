"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
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
];

const QUICK_START = `// 5 lines to integrate Presence
import MyShape from "@/sdk";

const frames = [...]; // MediaPipe pose landmarks
const timestamps = [...];

const receipt = MyShape.requestPresence(frames, timestamps);
const isValid = MyShape.verifyReceipt(receipt);
// Done. Your app now has presence verification.`;

export default function DevelopersClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-12">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">DEVELOPER_HUB // V1.0</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Build with Presence</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Integrate sovereign identity verification into any application.
            Five lines of code. Zero data stored. Real human presence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/motion-demo" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-cyan-400/30 text-cyan-300/70 text-[10px] tracking-[0.25em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all">
              ◈ Try Live Demo →
            </a>
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/10 text-white/25 text-[10px] tracking-[0.25em] uppercase hover:border-white/25 hover:text-white/50 transition-all">
              GitHub →
            </a>
          </div>
        </div>

        {/* ── Quick Start ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// QUICK_START</h2>
          <div className="border border-cyan-400/20 bg-cyan-400/[0.02] p-5 overflow-x-auto relative group">
            <pre className="text-cyan-200/70 text-[11px] leading-relaxed font-mono whitespace-pre">
              {QUICK_START}
            </pre>
            <button onClick={() => { navigator.clipboard.writeText(QUICK_START); playTick(600, "sine", 0.06, 0.015); }}
              className="absolute top-3 right-3 text-white/10 hover:text-cyan-400/60 text-[8px] tracking-[0.15em] uppercase transition-colors opacity-0 group-hover:opacity-100">
              Copy
            </button>
          </div>
          <div className="mt-2 text-white/20 text-[8px] tracking-[0.15em]">
            TypeScript · Zero dependencies · Works with any MediaPipe-compatible camera
          </div>
        </section>

        {/* ── SDK Reference ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// SDK_REFERENCE (§8)</h2>
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
                  <tr key={i} className="border-b border-white/5 transition-all"
                    onMouseEnter={e => { playTick(700, "sine", 0.06, 0.015); hoverOn(e); }}
                    onMouseLeave={e => hoverOff(e)}>
                    <td className="p-3 text-[10px] tracking-[0.15em]" style={{ color: "rgba(34,211,238,0.5)", fontSize: "10px" }} data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.9)" data-default-size="10px" data-hover-size="12px">{m.module}</td>
                    <td className="p-3 font-mono" style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }} data-default="rgba(255,255,255,0.45)" data-hover="rgba(255,255,255,0.85)" data-default-size="10px" data-hover-size="12px">{m.method}</td>
                    <td className="p-3 font-mono" style={{ color: "rgba(34,211,238,0.4)", fontSize: "9px" }} data-default="rgba(34,211,238,0.4)" data-hover="rgba(34,211,238,0.8)" data-default-size="9px" data-hover-size="11px">{m.returns}</td>
                    <td className="p-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)" data-default-size="10px" data-hover-size="12px">{m.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Protocol Engines ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// PROTOCOL_ENGINES</h2>
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
              <div key={e.name} className="p-4 transition-all"
                onMouseEnter={e => { playTick(700, "sine", 0.08, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="text-[11px] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.55)" }} data-default="rgba(255,255,255,0.55)" data-hover="rgba(255,255,255,0.9)">{e.name}</div>
                <div className="font-mono text-[9px] mb-1.5" style={{ color: "rgba(34,211,238,0.3)" }} data-default="rgba(34,211,238,0.3)" data-hover="rgba(34,211,238,0.7)">{e.path}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{e.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code Examples ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// CODE_EXAMPLES</h2>
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
              <div key={i} className="overflow-hidden transition-all"
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[10px] tracking-[0.15em] uppercase" style={{ color: "rgba(34,211,238,0.6)" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.95)">{ex.title}</span>
                </div>
                <div className="p-5">
                  <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto" style={{ color: "rgba(255,255,255,0.3)" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">
                    {ex.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Verification Dashboard ── */}
        <section className="mb-20">
          <VerificationDashboard />
        </section>

        {/* ── REST API ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// REST_API</h2>
          {API_ENDPOINTS.map((ep) => (
            <div key={ep.path} className="p-4 mb-2 flex items-center gap-4 transition-all"
              onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
              onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
              style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
              <span className="text-[10px] tracking-[0.2em] font-bold w-10" style={{ color: "rgba(34,211,238,0.6)" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.95)">{ep.method}</span>
              <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }} data-default="rgba(255,255,255,0.45)" data-hover="rgba(255,255,255,0.85)">{ep.path}</span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{ep.desc}</span>
            </div>
          ))}

          {/* Live API Response Examples */}
          <div className="mt-6 border border-cyan-400/10 bg-cyan-400/[0.02] p-5">
            <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase mb-4">// RESPONSE_FORMAT</div>
            <div className="space-y-4">
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1">GET /api/identity?email=hello@myshape.com</div>
                <pre className="bg-black/60 p-3 text-cyan-400/50 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
{`{
  "found": true,
  "email": "hello@myshape.com",
  "node_handle": null,
  "status": "GENESIS_NODE",
  "registered_at": "2026-06-22T09:12:01.329Z"
}`}</pre>
              </div>
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1">GET /api/nodes/count</div>
                <pre className="bg-black/60 p-3 text-cyan-400/50 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
{`{
  "total": 17,
  "humans": 8,
  "agents": 3,
  "genesis_nodes": 4
}`}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

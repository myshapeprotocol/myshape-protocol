"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

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
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Build with Presence</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Integrate sovereign identity verification into any application.
            Five lines of code. Zero data stored. Real human presence.
          </p>
        </div>

        {/* ── Quick Start ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// QUICK_START</h2>
          <div className="border border-cyan-400/20 bg-cyan-400/[0.02] p-5 overflow-x-auto">
            <pre className="text-cyan-200/70 text-[11px] leading-relaxed font-mono whitespace-pre">
              {QUICK_START}
            </pre>
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
                  <tr key={i} className="border-b border-white/5 hover:bg-cyan-500/[0.02] transition-all">
                    <td className="p-3 text-cyan-400/60 text-[10px] tracking-[0.15em]">{m.module}</td>
                    <td className="p-3 text-white/50 font-mono text-[10px]">{m.method}</td>
                    <td className="p-3 text-emerald-400/50 text-[9px] font-mono">{m.returns}</td>
                    <td className="p-3 text-white/25 text-[10px] leading-relaxed">{m.desc}</td>
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
              <div key={e.name} className="border border-white/5 bg-black/30 p-4 hover:border-cyan-500/20 transition-all">
                <div className="text-white/60 text-[11px] tracking-[0.15em] uppercase mb-1">{e.name}</div>
                <div className="text-cyan-400/30 text-[9px] font-mono mb-1.5">{e.path}</div>
                <div className="text-white/20 text-[10px]">{e.desc}</div>
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
              <div key={i} className="border border-white/10 bg-black/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-cyan-400/70 text-[10px] tracking-[0.15em] uppercase">{ex.title}</span>
                </div>
                <div className="p-5">
                  <pre className="text-white/35 text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
                    {ex.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── REST API ── */}
        <section className="mb-14">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// REST_API</h2>
          {API_ENDPOINTS.map((ep) => (
            <div key={ep.path} className="border border-white/10 bg-black/40 p-4 mb-2 flex items-center gap-4">
              <span className="text-cyan-400/70 text-[10px] tracking-[0.2em] font-bold w-10">{ep.method}</span>
              <span className="text-white/50 font-mono text-[11px]">{ep.path}</span>
              <span className="text-white/25 text-[10px]">{ep.desc}</span>
            </div>
          ))}

          {/* Live API Response Examples */}
          <div className="mt-6 border border-cyan-400/10 bg-cyan-400/[0.02] p-5">
            <div className="text-cyan-400/40 text-[8px] tracking-[0.3em] uppercase mb-4">// LIVE_RESPONSE_EXAMPLES</div>
            <div className="space-y-4">
              <div>
                <div className="text-white/25 text-[9px] tracking-[0.1em] mb-1">GET /api/identity?email=hello@myshape.com</div>
                <pre className="bg-black/60 p-3 text-emerald-400/60 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
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
                <pre className="bg-black/60 p-3 text-emerald-400/60 text-[9px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
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

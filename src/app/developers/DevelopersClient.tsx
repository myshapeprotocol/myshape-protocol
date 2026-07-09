"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { useState } from "react";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import DeveloperPlayground from "@/components/developer-playground/DeveloperPlayground";
import GenesisNodeInit from "@/components/genesis-node-init/GenesisNodeInit";
import DevQuickstart from "@/components/dev-quickstart/DevQuickstart";
import { playTick } from "@/utils/useAudioTick";
import "./developers.css";

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
  { method: "POST", path: "/api/nodes/handshake", desc: "Register a new protocol node → returns node_token + node_handle", cta: "/handshake" as const },
];

const QUICK_START = `// 5 lines to integrate Presence
import MyShape from "@/sdk";

const frames = [...]; // MediaPipe pose landmarks
const timestamps = [...];

const receipt = MyShape.requestPresence(frames, timestamps);
const isValid = MyShape.verifyReceipt(receipt);
// Done. Your app now has presence verification.`;

const QUICK_STEPS = [
  { step: "01", title: "Get the SDK", time: "30 sec", code: "git clone https://github.com/myshapeprotocol/sdk.git\ncd sdk && npm install", desc: "Zero dependencies. TypeScript native. Works with Node.js 18+." },
  { step: "02", title: "Capture Motion Frames", time: "2 min", code: 'import { Pose } from "@mediapipe/pose";\n\nconst pose = new Pose({ locateFile: (f) => ... });\npose.onResults((results) => {\n  const frames = results.poseLandmarks;\n  // Each frame: 33 joints × { x, y, z, visibility }\n});', desc: "Use any MediaPipe-compatible camera. We recommend Firefox for WebGL stability." },
  { step: "03", title: "Verify Presence", time: "1 min", code: QUICK_START, desc: "That's it. Your app now rejects AI-generated motion at the protocol level." },
  { step: "04", title: "See It Working", time: "30 sec", code: "", desc: "", isAction: true },
];

const ENGINES = [
  { name: "PES Engine", path: "engine/presence-entropy.ts", desc: "4-dimensional entropy scoring" },
  { name: "Proof System", path: "engine/proof-system.ts", desc: "PoP + MP + EP → ZK-Presence" },
  { name: "SST Mapper", path: "engine/skeleton-topology.ts", desc: "MediaPipe 33-pt → SST 18-pt" },
  { name: "Threat Assessment", path: "engine/threat-assessment.ts", desc: "8 attack signatures, corroboration logic" },
  { name: "Protocol Validator", path: "engine/protocol-validator.ts", desc: "6 verification rules §9.4" },
  { name: "Local Identity", path: "engine/local-identity.ts", desc: "Device salt, key derivation, session" },
  { name: "Presence Stream", path: "engine/presence-stream.ts", desc: "Aggregation, multi-device, PSS" },
  { name: "Unforgeability", path: "engine/unforgeability.ts", desc: "Entropy gap theorem, security horizon" },
];

const API_EXAMPLES = [
  { label: "CHECK_PROTOCOL_HEALTH", curl: "curl https://www.myshape.com/api/health", response: '{ "status": "healthy", "services": { "supabase": { "ok": true }, "wasm": { "ok": true } } }' },
  { label: "GET_NETWORK_STATUS", curl: "curl https://www.myshape.com/api/nodes/status", response: '{ "total_nodes": 42, "genesis_nodes": 23, "genesis_remaining": 77, "active_nodes": 12 }' },
  { label: "LOOKUP_NODE", curl: "curl https://www.myshape.com/api/identity?email=user@example.com", response: '{ "handle": "SIG_XXXX", "status": "GENESIS_NODE", "pes": 0.87 }' },
];

const CODE_EXAMPLES = [
  { title: "Basic Presence Verification", code: `import MyShape from "@/sdk";

// MediaPipe pose landmarks from camera
const frames = [...];
const timestamps = [...];

const receipt = MyShape.requestPresence(frames, timestamps);
// → { zkp_hash, pes: 0.72, timestamp, session_id }

const valid = MyShape.verifyReceipt(receipt);
// → true if human presence confirmed` },
  { title: "Threat Assessment", code: `import { assessThreat } from "@/engine/threat-assessment";
import { computeFullPES } from "@/engine/presence-entropy";

const { pes, components } = computeFullPES(sstFrames, timestamps);
const threat = assessThreat(pes, components);

if (threat.overallVerdict === "human") {
  // Allow access. Real human confirmed.
} else if (threat.overallVerdict === "suspicious") {
  // Request additional verification
} else {
  // Block. Likely synthetic.
}` },
];

export default function DevelopersClient() {
  const [showNodeInit, setShowNodeInit] = useState(false);
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      {/* Compact CTA banner — replaces the old global AnnouncementBar */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-4 py-2.5 border-b border-[#90c8ff]/10 bg-[#90c8ff]/[0.03] font-mono text-[10px] tracking-[0.08em] text-white/45">
        <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.5)] animate-pulse flex-shrink-0" />
        Dev Nodes are live. Deploy a protocol anchor in 60 seconds. No wallet. No invite.
        <a href="#quickstart" className="text-[#90c8ff]/70 hover:text-[#90c8ff] transition-colors whitespace-nowrap ml-1">Get Started ↓</a>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-16">
        <div className="space-y-4 mb-12">
          <div className="text-[#90c8ff]/60 text-[10px] md:text-[12px] tracking-[0.4em] md:tracking-[0.5em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.022)}>DEVELOPER_HUB // V1.0</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase">Build with Presence</h1>
          <p className="text-white/45 md:text-white/50 text-[12px] md:text-[14px] leading-relaxed max-w-xl font-light">
            Integrate sovereign identity verification into any application.
            Five lines of code. Zero data stored. Real human presence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/motion-demo" className="dev-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>◈ Try Live Demo →</a>
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="dev-cta dev-cta-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>GitHub →</a>
            <a href="https://discord.gg/zr8Tczard" target="_blank" rel="noopener noreferrer" className="dev-cta dev-cta-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Discord #api #agents →</a>
            <button onClick={() => { setShowNodeInit(true); playTick(600, "sine", 0.06, 0.015); }} className="dev-cta dev-cta-gold" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>◈ Connect Node →</button>
          </div>
        </div>

        {/* Quick Start */}
        <section className="mb-14" id="quickstart">
          <h2 className="dev-section-title">// QUICK_START (5 MIN)</h2>
          <div className="space-y-4">
            {QUICK_STEPS.map((s, i) => (
              <div key={s.step} className="dev-qs-card" onMouseEnter={() => playTick(500 + i * 100, "sine", 0.08, 0.02)}>
                <div className="dev-qs-header">
                  <span className="dev-qs-step">{s.step}</span>
                  <span className="dev-qs-title">{s.title}</span>
                  <span className="dev-qs-time">{s.time}</span>
                </div>
                {!s.isAction && (
                  <div className="dev-qs-code-block">
                    <pre>{s.code}</pre>
                    <button onClick={() => { navigator.clipboard.writeText(s.code.trim()); playTick(600, "sine", 0.06, 0.015); }} className="dev-qs-copy-btn">Copy</button>
                  </div>
                )}
                {s.isAction && (
                  <div className="dev-qs-actions">
                    <a href="/motion-demo" className="dev-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>◈ Try Live Demo →</a>
                    <a href="#playground" className="dev-cta dev-cta-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>▼ Skip to Playground</a>
                  </div>
                )}
                {s.desc && <div className="dev-qs-desc-row"><span className="dev-qs-desc">{s.desc}</span></div>}
              </div>
            ))}
          </div>
        </section>

        {/* REST API */}
        <section className="mb-14">
          <h2 className="dev-section-title">// REST_API (CURL_READY)</h2>
          <div className="space-y-3">
            {API_EXAMPLES.map((ex) => (
              <div key={ex.label} className="dev-api-card" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <div className="dev-api-header">
                  <span className="text-[#90c8ff]/45 text-[10px] tracking-[0.25em] uppercase">{ex.label}</span>
                  <button onClick={() => { navigator.clipboard.writeText(ex.curl); playTick(600, "sine", 0.06, 0.015); }} className="dev-api-copy">COPY</button>
                </div>
                <div className="dev-api-content">
                  <pre className="dev-api-curl">{ex.curl}</pre>
                  <div className="dev-api-resp-label">→ RESPONSE</div>
                  <pre className="dev-api-resp">{ex.response}</pre>
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/25 text-[10px] tracking-[0.12em] uppercase mt-3">
            Full OpenAPI spec: <a href="/openapi.json" target="_blank" className="text-[#90c8ff]/35 hover:text-[#90c8ff]/60 transition-colors">openapi.json</a>
            &nbsp;·&nbsp; Complete reference: <a href="/docs" className="text-[#90c8ff]/35 hover:text-[#90c8ff]/60 transition-colors">/docs →</a>
          </p>
        </section>

        {/* SDK Reference */}
        <section className="mb-14">
          <h2 className="dev-section-title">// SDK_REFERENCE (§8)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-white/5">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-3 text-white/30 text-[10px] tracking-[0.3em] uppercase font-normal w-20">Module</th>
                  <th className="p-3 text-white/30 text-[10px] tracking-[0.3em] uppercase font-normal">Method</th>
                  <th className="p-3 text-white/30 text-[10px] tracking-[0.3em] uppercase font-normal w-32">Returns</th>
                  <th className="p-3 text-white/30 text-[10px] tracking-[0.3em] uppercase font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {SDK_METHODS.map((m, i) => (
                  <tr key={i} className="dev-sdk-row border-b border-white/5" onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}>
                    <td className="p-3 dev-sdk-module">{m.module}</td>
                    <td className="p-3 dev-sdk-method">{m.method}</td>
                    <td className="p-3 dev-sdk-returns">{m.returns}</td>
                    <td className="p-3 dev-sdk-desc">{m.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Protocol Engines */}
        <section className="mb-14">
          <h2 className="dev-section-title">// PROTOCOL_ENGINES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENGINES.map((e) => (
              <div key={e.name} className="dev-card p-4" onMouseEnter={() => playTick(700, "sine", 0.08, 0.015)}>
                <div className="dev-engine-name mb-1">{e.name}</div>
                <div className="dev-engine-path mb-1.5">{e.path}</div>
                <div className="dev-engine-desc">{e.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-14">
          <h2 className="dev-section-title">// CODE_EXAMPLES</h2>
          <div className="space-y-4">
            {CODE_EXAMPLES.map((ex, i) => (
              <div key={i} className="dev-card overflow-hidden" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="dev-code-title">{ex.title}</span>
                </div>
                <div className="p-5">
                  <pre className="dev-code-pre font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed m-0">{ex.code}</pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Developer Playground */}
        <section className="mb-14" id="playground">
          <h2 className="dev-section-title">// ONLINE_PLAYGROUND</h2>
          <DeveloperPlayground />
        </section>

        {/* Developer Cohort */}
        <section className="mb-14">
          <h2 className="dev-section-title">// DEVELOPER_COHORT</h2>
          <div className="border border-purple-400/20 bg-purple-400/[0.02] p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <div className="text-purple-300/60 text-[10px] tracking-[0.2em] uppercase">Early Ecosystem</div>
                <p className="text-white/40 text-[12px] leading-relaxed max-w-lg">
                  MyShape SDK is in active development. Join the Developer Cohort to get early access,
                  influence the API design, and build the first wave of presence-verified applications.
                </p>
                <div className="space-y-1.5 pt-1">
                  {["Early SDK access before public release", "Direct line to protocol architects", "Your app featured on myshape.com/build", "Genesis Developer badge (on-chain record)"].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/25 text-[10px]"><span className="text-purple-400/40 text-[10px]">◆</span>{benefit}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[220px]">
                <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-purple-400/30 text-purple-300/70 text-[10px] tracking-[0.2em] uppercase text-center hover:bg-purple-400/[0.06] hover:text-purple-200 transition-all" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Star on GitHub →</a>
                <a href="/genesis" className="px-6 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/60 text-[10px] tracking-[0.2em] uppercase text-center hover:bg-[#90c8ff]/[0.06] hover:text-[#90c8ff] transition-all" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Join Genesis Cohort →</a>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Dashboard */}
        <section className="mb-20">
          <VerificationDashboard />
        </section>

        {/* REST API Endpoints */}
        <section className="mb-14">
          <h2 className="dev-section-title">// REST_API</h2>
          {API_ENDPOINTS.map((ep) => (
            <div key={ep.path} className="dev-api-row p-4 mb-2 flex items-center gap-4" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
              <span className="dev-api-row-method font-bold w-10 shrink-0">{ep.method}</span>
              <span className="dev-api-row-path font-mono shrink-0">{ep.path}</span>
              <span className="dev-api-row-desc flex-1">{ep.desc}</span>
              {"cta" in ep && <a href={ep.cta} className="shrink-0 px-3 py-1 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.15em] uppercase hover:border-[#90c8ff]/50 hover:text-[#90c8ff]/90 transition-all no-underline">Try it →</a>}
            </div>
          ))}

          <div className="mt-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5">
            <div className="text-[#90c8ff]/40 text-[10px] tracking-[0.3em] uppercase mb-4">// RESPONSE_FORMAT</div>
            <div className="space-y-4">
              <div>
                <div className="text-white/25 text-[10px] tracking-[0.1em] mb-1">GET /api/identity?email=protocol@myshape.com</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'{\n  "found": true,\n  "email": "protocol@myshape.com",\n  "node_handle": null,\n  "status": "GENESIS_NODE",\n  "registered_at": "2026-06-22T09:12:01.329Z"\n}'}</pre>
              </div>
              <div>
                <div className="text-white/25 text-[10px] tracking-[0.1em] mb-1">GET /api/nodes/count</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'{\n  "total": 17,\n  "humans": 8,\n  "agents": 3,\n  "genesis_nodes": 4\n}'}</pre>
              </div>
              <div>
                <div className="text-white/25 text-[10px] tracking-[0.1em] mb-1 flex items-center gap-2">POST /api/nodes/handshake <a href="/handshake" className="text-[#90c8ff]/40 hover:text-[#90c8ff]/80 text-[10px] tracking-[0.15em] uppercase no-underline transition-colors">→ Live Demo</a></div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[10px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'// Request\n{ "email": "entity@protocol.io", "origin_domain": "myshape.com" }\n\n// Response (201)\n{\n  "node_token": "ms_a1b2c3d4e5f6...",\n  "node_handle": "SIG_4F7A2C1B",\n  "stage": "GENESIS_NODE_INITIALIZED"\n}'}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Two Paths */}
        <section className="mb-14">
          <h2 className="dev-section-title">// PROTOCOL_PATHS</h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#90c8ff]/8">
              <div className="dev-path-panel dev-path-panel-dev p-6 md:p-8 space-y-4" onMouseEnter={() => playTick(500, "sine", 0.04, 0.022)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#90c8ff]/70 text-[10px]">◆</span>
                  <span className="text-[#90c8ff]/60 text-[10px] tracking-[0.3em] uppercase font-bold">DEV_NODE</span>
                  <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase ml-auto">YOU_ARE_HERE</span>
                </div>
                {[{ label: "Purpose", value: "Protocol Access — Build & Deploy" }, { label: "Setup", value: "60 seconds. No wallet. No invite." }, { label: "Scope", value: "API / Agent Layer — productivity & integration" }, { label: "Status", value: "Renewable. Sandbox-first. Scaleable." }, { label: "Path", value: "Deploy → Call API → Build Agents" }].map((r) => (
                  <div key={r.label} className="flex gap-2 text-[10px]"><span className="text-white/25 shrink-0 w-16 text-right">{r.label}</span><span className="text-white/40">{r.value}</span></div>
                ))}
              </div>
              <div className="dev-path-panel dev-path-panel-genesis p-6 md:p-8 space-y-4" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#d4af37]/70 text-[12px]">◈</span>
                  <span className="text-[#d4af37]/60 text-[10px] tracking-[0.3em] uppercase font-bold">GENESIS_NODE</span>
                  <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase ml-auto">INVITE_ONLY</span>
                </div>
                {[{ label: "Purpose", value: "Sovereign Identity — Governance & Trust" }, { label: "Setup", value: "40-second kinetic ceremony + OTP verification" }, { label: "Scope", value: "Identity Layer — protocol root & entropy anchor" }, { label: "Status", value: "Permanent. Immutable. Never offered again." }, { label: "Path", value: "Verify Presence → Claim Slot → Anchor Identity" }].map((r) => (
                  <div key={r.label} className="flex gap-2 text-[10px]"><span className="text-white/25 shrink-0 w-16 text-right">{r.label}</span><span className="text-white/40">{r.value}</span></div>
                ))}
                <a href="/genesis" className="inline-block mt-3 px-5 py-2 border border-[#d4af37]/30 text-[#d4af37]/60 text-[10px] tracking-[0.2em] uppercase hover:bg-[#d4af37]/[0.06] hover:text-[#d4af37] transition-all no-underline" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Enter Genesis →</a>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center py-2 border-t border-[#90c8ff]/5 bg-[#02040a]/50">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#90c8ff]/15" />
                <span className="text-white/30 text-[7px] tracking-[0.4em] uppercase">Protocol_Boundary</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#90c8ff]/15" />
              </div>
            </div>
          </div>
        </section>

        {/* Deploy Anchor */}
        <section className="mb-14">
          <h2 className="dev-section-title">// DEPLOY_ANCHOR_NOW</h2>
          <DevQuickstart />
        </section>
      </div>

      {showNodeInit && <GenesisNodeInit onClose={() => setShowNodeInit(false)} />}
      <ProtocolFooter />
    </div>
  );
}

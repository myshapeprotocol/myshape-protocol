"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import DeveloperPlayground from "@/components/developer-playground/DeveloperPlayground";
import DevQuickstart from "@/components/dev-quickstart/DevQuickstart";
import { playTick } from "@/utils/useAudioTick";
import "./developers.css";

const SDK_METHODS = [
  { module: "Continuity", method: "verifyContinuity(opts)", returns: "VerifyContinuityOutput", desc: "Two-stage verification: Stage 1 EE-001 ≥ 0.50; Stage 2 EE-003 = 1.0 (both required; confidence = min)" },
  { module: "Receipt", method: "buildReceipt(params)", returns: "Omit<ContinuityReceipt, 'signature'>", desc: "Construct a CPS-0001 conformant receipt" },
  { module: "Receipt", method: "signReceipt(unsigned, sk)", returns: "ContinuityReceipt", desc: "Ed25519-sign an unsigned receipt" },
  { module: "Receipt", method: "verifyReceipt(receipt)", returns: "VerificationResult", desc: "V₁-V₆ verification with FailureCode" },
  { module: "Receipt", method: "computePayloadDigest(payload)", returns: "string", desc: "SHA-256 digest of evidence payload" },
  { module: "Verifier", method: "verifySchema(receipt)", returns: "FailureCode | null", desc: "V₁ schema validity check" },
  { module: "Verifier", method: "verifyEvidenceIntegrity(receipt)", returns: "FailureCode | null", desc: "V₅ payload integrity check" },
  { module: "Verifier", method: "engineEvidenceToBlock(ee)", returns: "EvidenceBlock", desc: "Convert engine evidence to protocol block" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/identity?email=...", desc: "Demo app lookup by email (not part of CPS-0001/CPS-0002)" },
  { method: "GET", path: "/api/nodes/count", desc: "Demo app node counts (not part of CPS-0001/CPS-0002)" },
  { method: "POST", path: "/api/nodes/handshake", desc: "Demo app registration → returns node_token + node_handle (not part of CPS-0001/CPS-0002)" },
];

const QUICK_START = `// Verify continuity in 5 lines
import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples,        // from device motion sensors
  cameraSamples,     // optional: cross-modal
  frames, timestamps,// optional: presence entropy
});

// { verdict: "PASS", confidence: 0.92, evidence, threatReport }`;

const QUICK_STEPS = [
  { step: "01", title: "Install the SDK", time: "30 sec", code: "npm install @thecontinuitylab/myshape", desc: "Zero native dependencies. TypeScript. Works with Node.js 18+." },
  { step: "02", title: "Verify Continuity", time: "8 sec", code: QUICK_START, desc: "That's it. Your app now has protocol-level continuity verification." },
  { step: "03", title: "Build with Receipts", time: "ongoing", code: 'import { verifyReceipt } from "@thecontinuitylab/myshape";\n\n// Any CPS-0001 receipt — from any engine — works\nconst result = await verifyReceipt(receipt);\nif (result.status === "VALID") { /* VALID ≠ TRUSTED — check policy first */ }', desc: "Engine-independent. Accept receipts from any CPS-0001 producer." },
  { step: "04", title: "Try It Live", time: "30 sec", code: "", desc: "", isAction: true },
];

const ENGINES = [
  { name: "Reference Verifier", path: "continuity-protocol/reference-verifier/", desc: "V₁-V₇ · zero engine deps · TypeScript" },
  { name: "EE-001 Presence Detection", path: "src/lib/evidence/", desc: "4D entropy scoring from IMU data" },
  { name: "EE-002 Causal Coupling", path: "src/lib/evidence/causal-coupling.ts", desc: "Cross-modal IMU + camera binding" },
  { name: "EE-003 Challenge Response", path: "src/lib/evidence/gyro-challenge.ts", desc: "3-round gyroscope challenge" },
  { name: "VS-001 Verification Session", path: "src/lib/evidence/session.test.ts", desc: "Dual-engine pipeline · escalation logic" },
  { name: "Conformance Suite", path: "continuity-protocol/conformance/", desc: "23 assertions · 10 scenarios · any engine" },
  { name: "CPS-0001 Types", path: "src/lib/evidence/cps0001.ts", desc: "ContinuityReceipt · EvidenceBlock · VerificationResult" },
  { name: "Dummy Engine", path: "continuity-protocol/second-producer/", desc: "Second producer · proves engine-independence" },
];

const API_EXAMPLES = [
  { label: "PROTOCOL_HEALTH", curl: "curl https://www.myshape.com/api/health", response: `HTTP 200 — all dependencies reachable
{ "status": "healthy", "services": { "supabase": { "ok": true }, "wasm": { "ok": true } } }

HTTP 503 — a dependency is unavailable (endpoint reflects real state; may return degraded)
{ "status": "degraded", "services": { "wasm": { "ok": false, "error": "WASM_UNAVAILABLE" } } }` },
  { label: "NETWORK_STATUS", curl: "curl https://www.myshape.com/api/nodes/status", response: '{ "total_nodes": 42, "active_nodes": 12 }' },
  { label: "LOOKUP_NODE", curl: "curl https://www.myshape.com/api/identity?email=user@example.com", response: '{ "handle": "NODE_XXXX", "status": "ACTIVE" }' },
];

const CODE_EXAMPLES = [
  { title: "Continuity Verification", code: `import { verifyContinuity } from "@thecontinuitylab/myshape";

// 8-second IMU capture on-device
const result = await verifyContinuity({
  imuSamples,       // EE-002: cross-modal causal coupling
  cameraSamples,    // EE-002: cross-modal causal coupling
  frames, timestamps, // EE-001: presence entropy score
  challengeResults, // EE-003: challenge-response (anti-replay)
});

// → { verdict: "PASS" | "FAIL", confidence, evidence, threatReport }
// PASS means the interval checks passed — apply your trust policy before acting
if (result.verdict === "PASS") { /* VALID ≠ TRUSTED — check policy first */ }` },
  { title: "Build & Verify a Receipt", code: `import { buildReceipt, signReceipt, verifyReceipt, computePayloadDigest, generateKeyPair, createIssuerIdentity } from "@thecontinuitylab/myshape";

const kp = generateKeyPair();
const issuer = createIssuerIdentity(kp);
const payload = { score: 0.85 };

const unsigned = buildReceipt({
  evidence: [{
    engineId: "my-engine",
    engineVersion: "1.0.0",
    confidence: 0.85,
    payload,
    payloadDigest: computePayloadDigest(payload),
  }],
  interval: { start, end, coverageMs: 8000 },
  subject: { id: "sha256:...", type: "embodied" },
  issuer,
});

const receipt = signReceipt(unsigned, kp.secretKey);
const result = verifyReceipt(receipt);
// → { status: "VALID" } — engine-independent, cryptographic validity only (not trust)` },
];

export default function DevelopersClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      {/* Compact CTA banner — replaces the old global AnnouncementBar */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-4 py-2.5 border-b border-[#90c8ff]/10 bg-[#90c8ff]/[0.03] font-mono text-[11px] tracking-[0.06em] text-white/55">
        <span className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] shadow-[0_0_6px_rgba(144,200,255,0.5)] animate-pulse flex-shrink-0" />
        CPS-0001 v1.0-RC1 · Reference verifier · Conformance suite · npm SDK
        <a href="#quickstart" className="text-[#90c8ff]/70 hover:text-[#90c8ff] transition-colors whitespace-nowrap ml-1">Get Started ↓</a>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-16">
        <div className="space-y-4 mb-12">
          <div className="text-[#90c8ff]/70 text-[12px] tracking-[0.2em] uppercase"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.022)}>DEVELOPER_HUB</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase">Build with Presence</h1>
          <p className="text-white/45 md:text-white/50 text-[12px] md:text-[14px] leading-relaxed max-w-xl font-light">
            Integrate continuity verification into any application.
            Five lines of code. Zero data stored. Real human presence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/lab/playground" className="dev-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Verify Continuity →</a>
            <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="dev-cta dev-cta-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>GitHub →</a>
            <a href="/research/notes/008-continuity-protocol-core" className="dev-cta dev-cta-dim" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>CPS-0001 →</a>
            <a href="https://www.npmjs.com/package/@thecontinuitylab/myshape" target="_blank" rel="noopener noreferrer" className="dev-cta dev-cta-gold" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>npm Install →</a>
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
                    <a href="/lab/playground" className="dev-cta" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Verify Continuity →</a>
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
                  <span className="text-[#90c8ff]/45 text-[11px] tracking-[0.25em] uppercase">{ex.label}</span>
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
          <p className="text-white/40 text-[11px] tracking-[0.12em] uppercase mt-3">
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
                  <th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal w-20">Module</th>
                  <th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Method</th>
                  <th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal w-32">Returns</th>
                  <th className="p-3 text-white/30 text-[11px] tracking-[0.3em] uppercase font-normal">Description</th>
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

        {/* Developer Ecosystem */}
        <section className="mb-14">
          <h2 className="dev-section-title">// DEVELOPER_ECOSYSTEM</h2>
          <div className="border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <div className="text-[#90c8ff]/60 text-[11px] tracking-[0.15em] uppercase">Build with the Protocol</div>
                <p className="text-white/45 text-[13px] leading-relaxed max-w-lg">
                  CPS-0001 is engine-independent. Build your own evidence engine, produce valid receipts,
                  and integrate with any conforming verifier. The protocol is the object — not the engine.
                </p>
                <div className="space-y-1.5 pt-1">
                  {["npm install @thecontinuitylab/myshape", "Reference verifier — zero engine deps", "Conformance suite — 23 tests, 10 scenarios", "Second producer included — proves independence"].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/35 text-[11px]"><span className="text-[#90c8ff]/50 text-[11px]">◆</span>{benefit}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[220px]">
                <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-[#90c8ff]/25 text-[#90c8ff]/60 text-[11px] tracking-[0.15em] uppercase text-center hover:bg-[#90c8ff]/[0.06] hover:text-[#90c8ff] transition-all" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Star on GitHub →</a>
                <a href="/research/notes/008-continuity-protocol-core" className="px-6 py-3 border border-[#d4af37]/25 text-[#d4af37]/60 text-[11px] tracking-[0.15em] uppercase text-center hover:bg-[#d4af37]/[0.06] hover:text-[#d4af37] transition-all" onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Read CPS-0001 →</a>
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
            </div>
          ))}

          <div className="mt-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5">
            <div className="text-[#90c8ff]/40 text-[11px] tracking-[0.3em] uppercase mb-4">// RESPONSE_FORMAT</div>
            <div className="space-y-4">
              <div>
                <div className="text-white/40 text-[11px] tracking-[0.1em] mb-1">GET /api/identity?email=protocol@myshape.com</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'{\n  "found": true,\n  "email": "protocol@myshape.com",\n  "node_handle": "NODE_4F7A",\n  "status": "ACTIVE",\n  "registered_at": "2026-06-22T09:12:01.329Z"\n}'}</pre>
              </div>
              <div>
                <div className="text-white/40 text-[11px] tracking-[0.1em] mb-1">GET /api/nodes/count</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'{\n  "total": 17,\n  "humans": 8,\n  "agents": 3\n}'}</pre>
              </div>
              <div>
                <div className="text-white/40 text-[11px] tracking-[0.1em] mb-1">POST /api/nodes/handshake</div>
                <pre className="bg-black/60 p-3 text-[#90c8ff]/50 text-[11px] leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">{'// Request\n{ "email": "entity@protocol.io", "origin_domain": "myshape.com" }\n\n// Response (201)\n{\n  "node_token": "ms_a1b2c3d4e5f6...",\n  "node_handle": "NODE_4F7A2C1B",\n  "stage": "INITIALIZED"\n}'}</pre>
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

      <ProtocolFooter />
    </div>
  );
}

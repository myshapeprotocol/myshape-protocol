"use client";

import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

const API_SECTIONS = [
  {
    title: "Quick Start",
    anchor: "quickstart",
    content: `Install the SDK:
\`\`\`bash
npm install @myshapeprotocol/sdk
\`\`\`

Initialize and verify in 5 lines:
\`\`\`typescript
import { MyShapeClient } from '@myshapeprotocol/sdk';

const client = new MyShapeClient({ apiKey: 'ms_live_...' });
const proof = await client.verifyPresence();        // on-device WASM
const { valid, pes } = await client.validate(proof); // server-side
console.log(valid ? 'Human present' : 'Verification failed');
\`\`\`

All motion processing runs on-device via WASM. The server only receives the ~250 byte ZK proof. Zero raw motion data is transmitted.`,
  },
  {
    title: "API Reference",
    anchor: "api-reference",
    content: ``,
  },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/nodes/count", desc: "Total humans, agents, genesis nodes", auth: "Public" },
  { method: "GET", path: "/api/nodes/genesis", desc: "Genesis Cohort (anonymized)", auth: "Public" },
  { method: "GET", path: "/api/nodes/status", desc: "Protocol health dashboard", auth: "Public" },
  { method: "GET", path: "/api/presence/network", desc: "Live network visualization data", auth: "Public" },
  { method: "GET", path: "/api/health", desc: "System health check", auth: "Public" },
  { method: "GET", path: "/api/node/privileges", desc: "Node tier, entropy, streak, PES", auth: "Query param (email)" },
  { method: "GET", path: "/api/identity", desc: "Lookup node by email", auth: "Query param (email)" },
  { method: "POST", path: "/api/send-otp", desc: "Send 6-digit OTP for verification", auth: "Rate-limited" },
  { method: "POST", path: "/api/verify-otp", desc: "Verify OTP and activate node", auth: "Rate-limited" },
  { method: "POST", path: "/api/auth/siwe", desc: "Sign-In with Ethereum (EIP-4361)", auth: "Wallet signature" },
  { method: "POST", path: "/api/subscribe", desc: "Join waitlist (email subscription)", auth: "Rate-limited" },
  { method: "POST", path: "/api/verify", desc: "WASM presence verification", auth: "Rate-limited" },
  { method: "POST", path: "/api/motion/record", desc: "Record successful scan (3/day max)", auth: "Rate-limited" },
  { method: "POST", path: "/api/agent/declare", desc: "AI agent identity declaration", auth: "Public key" },
  { method: "POST", path: "/api/matrix/publish", desc: "Cross-platform publish (Bluesky/X/etc)", auth: "x-api-key" },
];

const MODULES = [
  { name: "presence-entropy.ts", desc: "Core PES computation — 4D entropy scoring across kinematics, acceleration, jerk, jerk spectrum" },
  { name: "proof-system.ts", desc: "ZK-Presence proof generation and verification — produces ~250 byte proofs, verifies in <10ms" },
  { name: "zk-circuit.ts", desc: "ZK-SNARK circuit definitions — 'PES > threshold AND motion recent AND biological entropy'" },
  { name: "skeleton-topology.ts", desc: "33-point MediaPipe → 18-point SST transformation — rotation-invariant skeletal model" },
  { name: "motion-vector.ts", desc: "128-dim motion vector extraction and serialization across 4 feature groups" },
  { name: "unforgeability.ts", desc: "Entropy gap analysis — Hurst exponent, approximate entropy, DFA for human vs AI" },
  { name: "threat-assessment.ts", desc: "8 attack signatures and defense-in-depth response matrix" },
];

export default function DocsClient() {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          {/* Header */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-4 text-[#90c8ff]/40 text-[9px] tracking-[0.3em] uppercase"><span>SDK v2.0</span><span className="w-8 h-[1px] bg-[#90c8ff]/20" /><span>REFERENCE</span></div>
            <h1 className="text-2xl md:text-4xl font-light tracking-[0.06em] text-white leading-tight">SDK<br /><span className="text-[#90c8ff]">Documentation</span></h1>
            <p className="text-white/35 text-[11px] tracking-[0.08em] leading-relaxed max-w-2xl">Integrate sovereign identity verification into any application. Five lines of code. Zero data stored. Real human presence — verified through the irreducible entropy of biological motion.</p>
            <div className="flex gap-3 pt-2">
              <a href="https://github.com/myshapeprotocol/myshape-engine" target="_blank" rel="noopener noreferrer" className="text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff] transition-colors">GitHub ↗</a>
              <span className="text-white/10">|</span>
              <Link href="/developers" className="text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff] transition-colors">Developer Portal →</Link>
              <span className="text-white/10">|</span>
              <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff] transition-colors">OpenAPI Spec ↗</a>
              <span className="text-white/10">|</span>
              <Link href="/papers/technical-spec" className="text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff] transition-colors">Technical Spec →</Link>
            </div>
          </div>

          {/* Quick Start */}
          <section id="quickstart" className="mb-16">
            <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />Quick Start</h2>
            <div className="space-y-6">
              <div className="p-6 border border-[#90c8ff]/10 bg-white/[0.01]">
                <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase mb-3">Install</p>
                <pre className="text-[#90c8ff]/60 text-[11px] bg-[#02040a] p-4 border border-[#90c8ff]/5 overflow-x-auto"><code>npm install @myshapeprotocol/sdk</code></pre>
              </div>
              <div className="p-6 border border-[#90c8ff]/10 bg-white/[0.01]">
                <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase mb-3">Verify Presence (5 lines)</p>
                <pre className="text-[#90c8ff]/50 text-[10px] bg-[#02040a] p-4 border border-[#90c8ff]/5 overflow-x-auto leading-relaxed">
{`import { MyShapeClient } from '@myshapeprotocol/sdk';

const client = new MyShapeClient({ apiKey: 'ms_live_...' });
const proof = await client.verifyPresence();        // on-device WASM
const { valid, pes } = await client.validate(proof); // server-side
console.log(valid ? '✅ Human present (PES: ' + pes + ')' : '❌ Verification failed');`}
                </pre>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="api" className="mb-16">
            <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />REST API Reference</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] tracking-[0.04em] border-collapse">
                <thead>
                  <tr className="border-b border-[#90c8ff]/10 text-left">
                    <th className="py-2 px-3 text-[#90c8ff]/40 uppercase tracking-[0.15em] text-[9px] w-[8%]">Method</th>
                    <th className="py-2 px-3 text-[#90c8ff]/40 uppercase tracking-[0.15em] text-[9px] w-[30%]">Endpoint</th>
                    <th className="py-2 px-3 text-[#90c8ff]/40 uppercase tracking-[0.15em] text-[9px] w-[44%]">Description</th>
                    <th className="py-2 px-3 text-[#90c8ff]/40 uppercase tracking-[0.15em] text-[9px] w-[18%]">Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((ep) => (
                    <tr key={ep.path} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                      <td className="py-2 px-3"><span className={`text-[9px] px-1.5 py-0.5 ${ep.method === "GET" ? "text-[#3fb950] bg-[#3fb950]/10" : "text-[#f0883e] bg-[#f0883e]/10"}`}>{ep.method}</span></td>
                      <td className="py-2 px-3 text-[#90c8ff]/60 font-mono text-[9px]">{ep.path}</td>
                      <td className="py-2 px-3 text-white/30">{ep.desc}</td>
                      <td className="py-2 px-3 text-white/20 text-[9px]">{ep.auth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Engine Modules */}
          <section id="modules" className="mb-16">
            <h2 className="text-white/60 text-[11px] tracking-[0.25em] uppercase mb-6 flex items-center gap-3"><span className="w-6 h-[1px] bg-[#90c8ff]/30" />Engine Modules</h2>
            <div className="space-y-3">
              {MODULES.map((mod) => (
                <div key={mod.name} className="p-4 border border-[#90c8ff]/5 hover:border-[#90c8ff]/15 transition-all">
                  <p className="text-[#90c8ff]/50 text-[11px] font-mono mb-1">{mod.name}</p>
                  <p className="text-white/25 text-[10px] leading-relaxed">{mod.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 p-8 border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] text-center space-y-4">
            <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase">Ready to Build?</p>
            <div className="flex justify-center gap-4 pt-2">
              <a href="https://github.com/myshapeprotocol/myshape-engine" target="_blank" rel="noopener noreferrer" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="px-6 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/60 text-[9px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/10 hover:text-[#90c8ff] transition-all">GitHub →</a>
              <Link href="/motion-demo" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)} className="px-6 py-2 border border-[#90c8ff]/15 text-[#90c8ff]/40 text-[9px] tracking-[0.2em] uppercase hover:border-[#90c8ff]/30 hover:text-[#90c8ff]/60 transition-all">Motion Demo →</Link>
            </div>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}

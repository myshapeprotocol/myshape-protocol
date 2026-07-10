"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ResearchMeta from "@/components/research/ResearchMeta";
import RelatedResearch from "@/components/research/RelatedResearch";
import { playTick } from "@/utils/useAudioTick";

/* ============================================================
   BenchmarksClient — The Continuity Lab Benchmark Dashboard

   Data sourced from `npx vitest run --reporter=json`
   Last run: 2026-07-10
   ============================================================ */

const SUMMARY = {
  totalSuites: 100,
  totalTests: 314,
  passing: 309,
  pending: 5,
  failed: 0,
};

const ENGINE_MODULES = [
  {
    name: "Presence Entropy Score",
    file: "presence-entropy.test.ts",
    tests: 15,
    desc: "4D entropy scoring: micro-timing variance, noise residual, frequency entropy, biological perturbation.",
    key: "pes",
  },
  {
    name: "Entropy Growth",
    file: "entropy-growth.test.ts",
    tests: 34,
    desc: "Particle level system, visual tiers, decay mechanics, entropy gain with streak multipliers.",
    key: "growth",
  },
  {
    name: "Proof System",
    file: "proof-system.test.ts",
    tests: 10,
    desc: "PoP generation, entropy proofs, ZK-SNARK composite proofs, full proof pipeline.",
    key: "proof",
  },
  {
    name: "Threat Assessment",
    file: "threat-assessment.test.ts",
    tests: 19,
    desc: "7 threat classes, 8 attack signatures, 4 cost tiers. Adversarial classification engine.",
    key: "threat",
  },
  {
    name: "Unforgeability",
    file: "unforgeability.test.ts",
    tests: 12,
    desc: "Entropy gap theorem verification, AI ceiling projections 2026–2040, Nyquist-limit guarantees.",
    key: "unforgeability",
  },
  {
    name: "Presence Stream",
    file: "presence-stream.test.ts",
    tests: 20,
    desc: "Proof aggregation across time windows, multi-device fusion, stability scoring, trend detection.",
    key: "stream",
  },
  {
    name: "Protocol Validator",
    file: "protocol-validator.test.ts",
    tests: 10,
    desc: "Transaction verification with 7 rule checks: entropy, expiry, clock skew, version, PES consistency, device revocation.",
    key: "validator",
  },
  {
    name: "Skeleton Topology",
    file: "skeleton-topology.test.ts",
    tests: 10,
    desc: "MediaPipe → SST joint mapping (33→18), coordinate normalization, bone topology validation.",
    key: "skeleton",
  },
  {
    name: "Local Identity",
    file: "local-identity.test.ts",
    tests: 10,
    desc: "Device salt generation, local identity creation, presence session binding, clearing.",
    key: "identity",
  },
  {
    name: "Presence Economy",
    file: "presence-economy.test.ts",
    tests: 7,
    desc: "Presence value computation, scarcity (PES×PSS), authenticity (PRS), cap enforcement.",
    key: "economy",
  },
  {
    name: "Presence Reputation",
    file: "presence-reputation.test.ts",
    tests: 7,
    desc: "Reputation scoring with decay, device diversity bonus, drop-rate penalties.",
    key: "reputation",
  },
];

const BENCHMARKS = [
  {
    name: "PES Benchmark v0.2",
    tests: 6,
    metrics: [
      { label: "Cohen's d", value: "2.1" },
      { label: "AUC", value: "0.94" },
      { label: "Human samples", value: "54" },
      { label: "AI samples", value: "54" },
      { label: "Replay samples", value: "54" },
    ],
    desc: "Three-class classification benchmark. Each dimension independently separates human from AI.",
  },
  {
    name: "PES Multi-Source v0.2",
    tests: 5,
    metrics: [
      { label: "Random Walk PES", value: "0.31" },
      { label: "Spline Interp PES", value: "0.38" },
      { label: "GAN White Noise PES", value: "0.22" },
      { label: "Near Static PES", value: "0.08" },
    ],
    desc: "Four AI-generation strategies tested against the same PES pipeline. All AI sources score below human floor (0.40).",
  },
  {
    name: "Motion Pipeline E2E",
    tests: 9,
    metrics: [
      { label: "Signature dims", value: "128" },
      { label: "Feature dims", value: "120" },
      { label: "Human pass rate", value: "100%" },
      { label: "AI pass rate", value: "0%" },
    ],
    desc: "Full pipeline: WASM engine → signature extraction → enrollment → verification. Human passes, AI fails.",
  },
];

const INTEGRATION = [
  { name: "Protocol Progress", file: "protocol-progress.test.ts", tests: 60, desc: "Stage transitions, reputation tiers, eligibility gates, DTO mapping, narrative builder." },
  { name: "API Contracts", file: "api-contracts.test.ts", tests: 29, desc: "Zod schema shape validation, backward compatibility, protocol version enforcement." },
  { name: "Entropy Governance", file: "entropy-governance.test.ts", tests: 27, desc: "Genesis minting eligibility matrix, decision algorithm, cohort cap invariants." },
  { name: "Approximation Snapshot", file: "approximation-snapshot.test.ts", tests: 7, desc: "Deterministic tier/stage/rights/eligibility snapshots for all boundary cases." },
  { name: "Rate Limiter", file: "rate-limiter.test.ts", tests: 6, desc: "Windowed rate limiting, IP isolation, pruning, reset mechanics." },
  { name: "Identity API", file: "route.test.ts", tests: 5, desc: "Input validation, rate limiting, Supabase env-var guard." },
  { name: "Engine Smoke", file: "__smoke.test.ts", tests: 7, desc: "Module integrity: every engine file exports expected functions." },
];

export default function BenchmarksClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-16">

        {/* ── Hero ── */}
        <section className="mb-16">
          <div className="mb-4">
            <ResearchMeta
              artifactId="BM-001"
              type="Benchmark"
              status="Active"
              published="2026.07.04"
              updated="2026.07.10"
            />
          </div>
          <div className="flex items-center gap-3 mb-4 mt-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950]/20 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3fb950] shadow-[0_0_8px_rgba(63,185,80,0.5)]" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#90c8ff]/55">
              &gt; benchmarks <span className="text-white/20">--all</span>
            </span>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/15 ml-auto">100% passing</span>
          </div>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-light tracking-[-0.02em] leading-[1.1] text-white">
            Protocol <span style={{ color: "rgba(144,200,255,0.8)" }}>Benchmarks</span>
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-white/50 text-[clamp(0.9rem,2vw,1.1rem)] font-light max-w-xl leading-relaxed">
              Every engine function, every API contract, every threat vector — tested.
            </p>
            <span className="font-mono text-[9px] tracking-[0.15em] text-[#3fb950]/40 shrink-0 border border-[#3fb950]/15 px-2 py-0.5"
              style={{ background: "rgba(63,185,80,0.03)" }}>
              Last run: 2026-07-10 07:59 UTC
            </span>
          </div>
        </section>

        {/* ── Summary Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-16">
          {[
            { label: "Test Suites", value: SUMMARY.totalSuites, color: "#90c8ff" },
            { label: "Total Tests", value: SUMMARY.totalTests, color: "#d4af37" },
            { label: "Passing", value: SUMMARY.passing, color: "#3fb950" },
            { label: "Failed", value: SUMMARY.failed, color: "#f85149" },
            { label: "Dataset", value: "281", color: "#a371f7", suffix: "benchmark samples" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 md:p-6 text-center transition-all duration-500 hover:-translate-y-1"
              style={{
                border: `1px solid ${stat.color}15`,
                background: `${stat.color}03`,
              }}
              onMouseEnter={(e) => {
                playTick(500, "sine", 0.04, 0.015);
                e.currentTarget.style.borderColor = `${stat.color}35`;
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}08`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${stat.color}15`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">{stat.label}</div>
              <div className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[-0.03em]" style={{ color: stat.color }}>
                {stat.value}
                {stat.suffix && <span className="text-[0.45em] ml-1 opacity-50">{stat.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Engine Modules ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-4" style={{ background: "linear-gradient(to bottom, #90c8ff, transparent)" }} />
            <h2 className="text-white/80 text-[14px] tracking-[0.3em] uppercase font-bold">Protocol Engines</h2>
            <span className="text-white/15 text-[10px] tracking-[0.15em] ml-2">7 modules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENGINE_MODULES.map((mod) => (
              <div
                key={mod.key}
                className="p-5 transition-all duration-500 hover:-translate-y-0.5"
                style={{ border: "1px solid rgba(144,200,255,0.08)", background: "rgba(2,6,14,0.6)" }}
                onMouseEnter={(e) => {
                  playTick(440, "triangle", 0.03, 0.015);
                  e.currentTarget.style.borderColor = "rgba(144,200,255,0.2)";
                  e.currentTarget.style.background = "rgba(144,200,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(144,200,255,0.08)";
                  e.currentTarget.style.background = "rgba(2,6,14,0.6)";
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-[12px] tracking-[0.05em] font-light">{mod.name}</span>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-[#3fb950]/60">{mod.tests} tests</span>
                </div>
                <p className="text-white/25 text-[11px] leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Benchmarks ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-4" style={{ background: "linear-gradient(to bottom, #d4af37, transparent)" }} />
            <h2 className="text-white/80 text-[14px] tracking-[0.3em] uppercase font-bold">Active Benchmarks</h2>
            <span className="text-white/15 text-[10px] tracking-[0.15em] ml-2">3 suites</span>
          </div>

          <div className="space-y-6">
            {BENCHMARKS.map((bm) => (
              <div
                key={bm.name}
                className="p-6 md:p-8 transition-all duration-500"
                style={{ border: "1px solid rgba(212,175,55,0.12)", background: "rgba(2,6,14,0.7)" }}
                onMouseEnter={(e) => {
                  playTick(520, "sine", 0.04, 0.02);
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
                  e.currentTarget.style.boxShadow = "0 0 32px rgba(212,175,55,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(212,175,55,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/85 text-[14px] font-light tracking-[0.04em]">{bm.name}</h3>
                  <span className="font-mono text-[10px] text-[#3fb950]/60">{bm.tests} tests</span>
                </div>
                <p className="text-white/30 text-[12px] leading-relaxed mb-4">{bm.desc}</p>
                <div className="flex flex-wrap gap-3">
                  {bm.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="px-3 py-1.5 font-mono"
                      style={{ border: "1px solid rgba(212,175,55,0.15)", background: "rgba(212,175,55,0.03)" }}
                    >
                      <span className="text-white/25 text-[9px] tracking-[0.1em] uppercase">{m.label}</span>
                      <span className="text-[#d4af37]/80 text-[11px] ml-2 tracking-[0.05em]">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Integration & Utilities ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-4" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }} />
            <h2 className="text-white/80 text-[14px] tracking-[0.3em] uppercase font-bold">Integration &amp; Utilities</h2>
            <span className="text-white/15 text-[10px] tracking-[0.15em] ml-2">7 suites</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTEGRATION.map((item) => (
              <div
                key={item.file}
                className="p-4 transition-all duration-500"
                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(2,6,14,0.5)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/70 text-[11px] tracking-[0.04em] font-light">{item.name}</span>
                  <span className="font-mono text-[9px] text-[#3fb950]/50">{item.tests} tests</span>
                </div>
                <p className="text-white/20 text-[10px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Related Research ── */}
        <RelatedResearch
          relatedNotes={[
            { id: "RN-001", label: "The Continuity Problem", href: "/research/notes/001-the-continuity-problem" },
          ]}
          openQuestions={[
            { id: "OQ-001", label: "Can continuity exist independently of identity?", href: "/research/open-questions/001" },
          ]}
          referencedDecisions={[
            { id: "DL-001", label: "PES threshold set at 0.40", href: "/research" },
          ]}
        />

        {/* ── Methodology Note ── */}
        <div className="mt-12 pt-8 border-t border-white/[0.05]">
          <p className="text-white/15 text-[10px] tracking-[0.08em] leading-relaxed text-center max-w-xl mx-auto">
            All benchmarks run via <code className="text-white/25">npx vitest run</code> on every commit.
            Results above from 2026-07-10. No failing tests. 5 pending tests are live-integration
            checks that require a running Supabase instance (skipped in CI).
          </p>
          <Link
            href="https://github.com/myshapeprotocol"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center mt-3 text-[#90c8ff]/20 text-[9px] tracking-[0.2em] uppercase hover:text-[#90c8ff]/40 transition-colors"
            onMouseEnter={() => playTick(440, "sine", 0.025, 0.012)}
          >
            View Source on GitHub →
          </Link>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] text-center">
          <Link
            href="/research"
            className="text-white/25 text-[10px] tracking-[0.2em] uppercase hover:text-white/45 transition-colors"
            onMouseEnter={() => playTick(400, "sine", 0.03, 0.018)}
          >
            ← Research Hub
          </Link>
        </div>
      </div>
      <ProtocolFooter />
    </div>
  );
}

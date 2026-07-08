"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import { playTick } from "@/utils/useAudioTick";
import "./evidence.css";

const BENCHMARKS = [
  { test: "Genuine Human", score: "0.9817", verdict: "PASS ✓", accent: "text-[#90c8ff]", glow: "shadow-[0_0_6px_rgba(144,200,255,0.3)]" },
  { test: "AI Forgery (GPT-5)", score: "0.5857", verdict: "FAIL ✗", accent: "text-white/30", glow: "" },
  { test: "Impostor", score: "0.0000", verdict: "FAIL ✗", accent: "text-white/20", glow: "" },
];

const VECTOR_SAMPLE = [
  { k: "Kinematics", v: "0.42", desc: "Bone length ratios" }, { k: "Acceleration", v: "0.88", desc: "Hurst exponent" },
  { k: "Jerk", v: "0.15", desc: "MAD + lag-1" }, { k: "Jerk Spectrum", v: "0.71", desc: "1/f scaling" },
  { k: "PES Score", v: "0.94", desc: "Composite" }, { k: "ZK Hash", v: "0x7f3a...b2e1", desc: "SHA-256" },
];

const ATTACK_SUMMARY = [
  { class: "A — Generative AI", severity: "Critical" as const, success: "~0%", detection: "Frequency entropy collapse" },
  { class: "B — Replay", severity: "High" as const, success: "Near zero", detection: "Uniform inter-frame timing" },
  { class: "C — Sensor Spoof", severity: "Medium" as const, success: "Very low", detection: "Multi-dim corroboration" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-white/30 text-[11px] tracking-[0.4em] uppercase mb-6 text-center hover:text-[#90c8ff]/50 transition-colors cursor-default" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>{children}</h2>;
}

export default function EvidenceClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-16 md:space-y-20">
        <div className="text-center">
          <div className="text-[#90c8ff]/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase mb-6" onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>PROTOCOL_EVIDENCE // V1.0_GENESIS</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] text-white mb-4">Show Me</h1>
          <p className="text-white/40 md:text-white/45 text-[11px] md:text-[13px] max-w-xl mx-auto leading-relaxed font-light">Verifiable proof that MyShape Protocol distinguishes human presence from synthetic simulation. Every claim on this page is reproducible.</p>
        </div>

        <section>
          <SectionHeading>PES Benchmark Results</SectionHeading>
          <div className="ev-table-wrap" onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/[0.06]"><th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal">Test Case</th><th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal">PES</th><th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal text-right">Verdict</th></tr></thead>
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.test} className="ev-row" onMouseEnter={() => playTick(600, "sine", 0.06, 0.012)}>
                    <td className="p-3 ev-row-name">{b.test}</td>
                    <td className={`p-3 ev-row-score ${b.glow}`}>{b.score}</td>
                    <td className={`p-3 ev-row-verdict text-right ${b.accent}`}>{b.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex justify-between text-[9px]"><span className="ev-gap-label">Human—AI Gap</span><span className="ev-gap-value">0.3960</span></div>
          </div>
          <p className="text-white/14 text-[8px] text-center mt-3 tracking-[0.12em]">Source: myshape-demo CLI · Rust core engine · 25/25 tests pass</p>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <SectionHeading>Identity Vector Sample</SectionHeading>
            <div className="border border-[#90c8ff]/12 bg-[#90c8ff]/[0.01] p-5 space-y-1" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              {VECTOR_SAMPLE.map(({ k, v, desc }) => (
                <div key={k} className="ev-item" onMouseEnter={() => playTick(450, "sine", 0.03, 0.008)}>
                  <div><span className="ev-item-label">{k}</span><span className="ev-item-desc">{desc}</span></div>
                  <span className="ev-item-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading>Attack Surface Summary</SectionHeading>
            <div className="border border-[#90c8ff]/12 bg-[#90c8ff]/[0.01] p-5 space-y-1.5" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              {ATTACK_SUMMARY.map((a) => (
                <div key={a.class} className="ev-attack-item" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.severity === "Critical" ? "bg-[#90c8ff] shadow-[0_0_10px_rgba(144,200,255,0.6)]" : a.severity === "High" ? "bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.4)]" : "bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.2)]"}`} />
                  <div className="flex-1"><span className="ev-attack-name">{a.class}</span><span className="ev-attack-det">{a.detection}</span></div>
                  <span className="ev-attack-rate">{a.success}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section><SectionHeading>Live Verification Engine</SectionHeading><VerificationDashboard /></section>

        <section className="text-center py-10 border-t border-white/[0.05] space-y-5">
          <p className="text-white/25 text-[11px]">All evidence is reproducible. Run the benchmarks yourself.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/motion-demo" className="px-9 py-3 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white transition-all" style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)", background: "rgba(144,200,255,0.03)" }} onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}>Try Live Demo →</Link>
            <Link href="/papers/threat-model" className="px-9 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/35 hover:text-[#90c8ff]/70 transition-all" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Full Threat Model →</Link>
            <Link href="/whitepaper" className="px-9 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/35 hover:text-[#90c8ff]/70 transition-all" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>Whitepaper →</Link>
          </div>
        </section>
      </div>
      <ProtocolFooter />
    </div>
  );
}

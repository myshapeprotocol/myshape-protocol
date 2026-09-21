"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import { playTick } from "@/utils/useAudioTick";
import "@/app/research/research.css";

export default function ChallengeClient() {
  return (
    <div className="min-h-screen bg-[#051025] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 pt-36 pb-16 text-center">

        <div className="mb-8">
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#f85149]/40">
            Challenge BM-001
          </span>
        </div>

        <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-light tracking-[-0.02em] leading-[1.2] text-white mb-8"
          style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
          If you believe PES fails under a specific condition, tell us.
          <span style={{ color: "rgba(255,255,255,0.4)" }}> We will test it.</span>
        </h1>

        <p className="text-white/35 text-[14px] leading-relaxed mb-10 max-w-lg mx-auto"
          style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
The Presence Entropy Score separates human motion from synthetic motion with
           a large effect size and AUC = 0.94. But every benchmark has boundary conditions
          it has not yet encountered. If you can describe a scenario where you believe
          the PES would misclassify — a specific population, a specific motion pattern,
          a specific hardware configuration — we will design an experiment, run it,
          and publish the result whether it confirms or refutes the current benchmark.
        </p>

        <div className="space-y-4 mb-12">
          <a
            href="https://github.com/myshapeprotocol/myshape-protocol/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-300"
            style={{ border: "1px solid rgba(248,81,73,0.3)", color: "rgba(248,81,73,0.7)", background: "rgba(248,81,73,0.03)" }}
            onMouseEnter={(e) => {
              playTick(600, "sine", 0.06, 0.02);
              e.currentTarget.style.borderColor = "rgba(248,81,73,0.6)";
              e.currentTarget.style.color = "rgba(248,81,73,0.9)";
              e.currentTarget.style.background = "rgba(248,81,73,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(248,81,73,0.3)";
              e.currentTarget.style.color = "rgba(248,81,73,0.7)";
              e.currentTarget.style.background = "rgba(248,81,73,0.03)";
            }}
          >
            Open a GitHub Issue →
          </a>

          <p className="text-white/12 text-[11px] tracking-[0.1em]">
            Or email challenge@myshape.com
          </p>
        </div>

        <div className="pt-8 border-t border-white/[0.04]">
          <p className="text-white/15 text-[11px] tracking-[0.1em] leading-relaxed max-w-md mx-auto">
            We do not defend our benchmarks. We design experiments that can falsify
            them. If you can break BM-001, you have advanced the research.
          </p>
          <Link
            href="/lab/research"
            className="inline-block mt-6 text-[#90c8ff]/30 text-[11px] tracking-[0.2em] uppercase hover:text-[#90c8ff]/50 transition-colors"
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

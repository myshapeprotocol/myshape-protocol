"use client";
import { useState, useCallback } from "react";
import { playTick } from "@/utils/useAudioTick";

// Pre-computed sample data — MediaPipe SST frames from a real human scan
const SAMPLE_DATA = {
  pes: 0.72,
  components: {
    timing: 0.34,
    noise: 0.68,
    frequency: 0.41,
    biological: 0.55,
  },
  threatVerdict: "✓ HUMAN_PRESENCE_VERIFIED" as const,
  proof: {
    zkp: "e8f3a2c1",
    pop: "b7d4e5f6",
    mp: "3c9a0b1d",
    ep: "f2e6d8c4",
  },
  frames: 180,
  durationMs: 30000,
};

type Step = "idle" | "running" | "done";

export default function DeveloperPlayground() {
  const [step, setStep] = useState<Step>("idle");

  const handleRun = useCallback(() => {
    playTick(800, "sine", 0.10, 0.025);
    setStep("running");
    // Simulate processing delay
    setTimeout(() => {
      setStep("done");
      playTick(1200, "triangle", 0.12, 0.03);
    }, 2000);
  }, []);

  const handleReset = useCallback(() => {
    playTick(500, "sine", 0.05, 0.01);
    setStep("idle");
  }, []);

  return (
    <div className="border border-[#90c8ff]/20 bg-[#90c8ff]/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div>
          <span className="text-[#90c8ff]/60 text-[10px] tracking-[0.3em] uppercase">Developer Playground</span>
          <span className="text-white/15 text-[8px] ml-3 tracking-[0.1em]">No setup · No camera · Browser only</span>
        </div>
        <span className="text-white/10 text-[8px] tracking-[0.15em]">PLAYGROUND_ENGINE_V1</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Left: Code panel | Right: Output panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Code Panel */}
          <div>
            <div className="text-white/20 text-[8px] tracking-[0.2em] uppercase mb-2">// YOUR_CODE</div>
            <div className="bg-black/50 p-4 font-mono text-[10px] leading-relaxed overflow-x-auto"
              style={{ border: "1px solid rgba(144,200,255,0.08)" }}>
              <span className="text-white/20">{"// 1. Pre-recorded frames from a real human scan"}</span>
              <br />
              <span className="text-[#90c8ff]/50">import</span>
              <span className="text-white/40"> {"{ computeFullPES }"} </span>
              <span className="text-[#90c8ff]/50">from</span>
              <span className="text-[#90c8ff]/40"> "@/engine/presence-entropy"</span>;
              <br />
              <span className="text-[#90c8ff]/50">import</span>
              <span className="text-white/40"> {"{ assessThreat }"} </span>
              <span className="text-[#90c8ff]/50">from</span>
              <span className="text-[#90c8ff]/40"> "@/engine/threat-assessment"</span>;
              <br />
              <br />
              <span className="text-white/20">{"// 2. Run PES + Threat Assessment"}</span>
              <br />
              <span className="text-[#90c8ff]/50">const</span>
              <span className="text-white/50"> {"{ pes, components }"} = </span>
              <span className="text-[#90c8ff]/40">computeFullPES</span>
              <span className="text-white/40">(sampleFrames, timestamps)</span>;
              <br />
              <span className="text-[#90c8ff]/50">const</span>
              <span className="text-white/50"> threat = </span>
              <span className="text-[#90c8ff]/40">assessThreat</span>
              <span className="text-white/40">(pes, components)</span>;
              <br />
              <br />
              <span className="text-white/20">{"// 3. Check result"}</span>
              <br />
              <span className="text-[#90c8ff]/50">if</span>
              <span className="text-white/40"> (threat.overallVerdict === </span>
              <span className="text-[#90c8ff]/60">"human"</span>
              <span className="text-white/40">) {"{"}</span>
              <br />
              <span className="text-white/30">  {"// ✓ Real human presence confirmed"}</span>
              <br />
              <span className="text-white/40">{"}"}</span>
            </div>

            {/* Run Button */}
            <div className="mt-3 flex gap-3">
              {step === "idle" && (
                <button onClick={handleRun}
                  className="px-5 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/[0.06] hover:text-white hover:border-[#90c8ff]/50 transition-all">
                  ▶ Run Verification
                </button>
              )}
              {step === "running" && (
                <div className="flex items-center gap-2 px-5 py-2 border border-amber-400/30 text-amber-300/60 text-[10px] tracking-[0.15em]">
                  <span className="inline-block w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" />
                  Processing...
                </div>
              )}
              {step === "done" && (
                <>
                  <button onClick={handleReset}
                    className="px-5 py-2 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.2em] uppercase hover:bg-[#90c8ff]/[0.06] hover:text-[#90c8ff] transition-all">
                    ↻ Run Again
                  </button>
                  <span className="flex items-center text-[#90c8ff]/60 text-[10px] tracking-[0.15em]">
                    <span className="inline-block w-1.5 h-1.5 bg-[#90c8ff] rounded-full mr-1.5" />
                    Complete
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div>
            <div className="text-white/20 text-[8px] tracking-[0.2em] uppercase mb-2">// OUTPUT</div>
            <div className="bg-black/50 p-4 font-mono text-[10px] leading-relaxed space-y-2 overflow-x-auto"
              style={{ border: "1px solid rgba(144,200,255,0.08)", minHeight: "200px" }}>
              {step === "idle" && (
                <div className="flex items-center justify-center h-40">
                  <span className="text-white/10 text-[10px] tracking-[0.15em]">
                    Press &quot;Run Verification&quot; to see output
                  </span>
                </div>
              )}

              {step === "running" && (
                <div className="space-y-1.5 animate-pulse">
                  <div className="text-amber-400/40">computing PES...</div>
                  <div className="text-amber-400/30">detecting attack signatures...</div>
                  <div className="text-amber-400/20">generating ZK proof...</div>
                </div>
              )}

              {step === "done" && (
                <div className="space-y-2">
                  {/* PES */}
                  <div>
                    <span className="text-white/30">pes_score:</span>
                    <span className="text-[#90c8ff]/70 ml-2">{SAMPLE_DATA.pes}</span>
                    <span className="text-white/15 ml-2">{"// >0.70 → HUMAN"}</span>
                  </div>

                  {/* Components */}
                  <div>
                    <span className="text-white/30">components:</span>
                    <span className="text-white/15 ml-2">{"{"}</span>
                  </div>
                  <div className="ml-4 space-y-0.5">
                    <div><span className="text-[#90c8ff]/40">timing:</span> <span className="text-white/40">{SAMPLE_DATA.components.timing}</span></div>
                    <div><span className="text-[#90c8ff]/40">noise:</span> <span className="text-white/40">{SAMPLE_DATA.components.noise}</span></div>
                    <div><span className="text-[#90c8ff]/40">frequency:</span> <span className="text-white/40">{SAMPLE_DATA.components.frequency}</span></div>
                    <div><span className="text-[#90c8ff]/40">biological:</span> <span className="text-white/40">{SAMPLE_DATA.components.biological}</span></div>
                  </div>
                  <div><span className="text-white/15 ml-2">{"}"}</span></div>

                  {/* Threat */}
                  <div className="pt-1 border-t border-white/5">
                    <span className="text-white/30">threat_verdict:</span>
                    <span className="text-[#90c8ff]/80 ml-2 font-bold">{SAMPLE_DATA.threatVerdict}</span>
                  </div>

                  {/* Proof */}
                  <div className="pt-1 border-t border-white/5">
                    <span className="text-white/30">zk_proof:</span>
                    <span className="text-white/15 ml-2">{"{"}</span>
                  </div>
                  <div className="ml-4 space-y-0.5 text-[9px]">
                    <div><span className="text-[#90c8ff]/30">zkp:</span> <span className="text-white/25">{SAMPLE_DATA.proof.zkp}</span></div>
                    <div><span className="text-[#90c8ff]/30">pop:</span> <span className="text-white/25">{SAMPLE_DATA.proof.pop}</span></div>
                    <div><span className="text-[#90c8ff]/30">mp:</span> <span className="text-white/25">{SAMPLE_DATA.proof.mp}</span></div>
                    <div><span className="text-[#90c8ff]/30">ep:</span> <span className="text-white/25">{SAMPLE_DATA.proof.ep}</span></div>
                  </div>
                  <div><span className="text-white/15 ml-2">{"}"}</span></div>

                  {/* Stats */}
                  <div className="pt-1 border-t border-white/5 text-[9px]">
                    <span className="text-white/20">frames_processed: </span>
                    <span className="text-white/30">{SAMPLE_DATA.frames}</span>
                    <span className="text-white/20 ml-3">duration: </span>
                    <span className="text-white/30">{SAMPLE_DATA.durationMs}ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            {step === "done" && (
              <div className="mt-2 text-white/15 text-[8px] leading-relaxed">
                This is a pre-computed result from an actual human scan. PES ≥ 0.70 indicates real biological presence.
                The 4-component entropy profile (timing/noise/frequency/biological) forms a uniquely human &quot;motion signature&quot;
                that current AI generation models cannot reproduce at the distribution level.
              </div>
            )}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-white/10 text-[8px] tracking-[0.15em]">
            Sample data: 30s scan · 180 frames · Real human · MediaPipe 33-pt → SST 18-pt
          </span>
          <a href="/motion-demo" className="text-[#90c8ff]/30 hover:text-[#90c8ff]/60 text-[8px] tracking-[0.15em] transition-colors">
            Try with YOUR motion →
          </a>
        </div>
      </div>
    </div>
  );
}

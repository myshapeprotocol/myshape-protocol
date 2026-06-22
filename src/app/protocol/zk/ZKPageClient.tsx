"use client";
import ProtocolLayout from "@/components/layout/ProtocolLayout";

const PROOF_LAYERS = [
  {
    id: "PoP",
    name: "Presence Proof",
    desc: "H(Feature Vector) — proves the motion data carries valid geometric structure. The smallest verifiable unit of presence.",
    color: "cyan",
  },
  {
    id: "MP",
    name: "Motion Proof",
    desc: "H(FPS, window, nodes, timestamp, device_salt) — proves the data came from real hardware within a valid time window.",
    color: "blue",
  },
  {
    id: "EP",
    name: "Entropy Proof",
    desc: "H(PES, H_f, σ_timing, ε) — proves the signal exceeds biological entropy floor and is below AI ceiling.",
    color: "indigo",
  },
];

const VERIFICATION_RULES = [
  { rule: 1, name: "ZKP Validity", desc: "Recomputed root hash must match submitted proof" },
  { rule: 2, name: "Entropy Threshold", desc: "PES ≥ 0.65 — below this, presence is not confirmed" },
  { rule: 3, name: "Timestamp Validity", desc: "Proof must be within valid time window, not expired" },
  { rule: 4, name: "Replay Protection", desc: "PoP hash, timestamp, and device salt must be unique" },
  { rule: 5, name: "Device Revocation", desc: "Device must not appear in revocation registry" },
  { rule: 6, name: "Proof Integrity", desc: "All three sub-proofs must be version-consistent and match" },
];

export default function ZKPage() {
  return (
    <ProtocolLayout
      refId="004"
      category="PROTOCOL_CORE"
      title="ZERO_KNOWLEDGE"
      secLevel="CLASS_A"
      systemStatus="ENCRYPTED"
    >
      <div className="space-y-20 md:space-y-28">
        {/* ── 核心声明 ── */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gradient-to-r from-cyan-500/60 to-transparent" />
            Core_Principle
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            Prove <span className="text-cyan-300/90">presence</span> without revealing{" "}
            <span className="text-cyan-300/90">identity</span>.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-widest leading-loose font-light">
            The MyShape proof system generates three independent cryptographic proofs —
            Presence, Motion, and Entropy — and composes them into a single Zero-Knowledge
            Presence proof. The verifier learns only one bit: "real human present." Nothing else.
          </p>
        </section>

        {/* ── 三层证明架构 ── */}
        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-10 text-center">Three-Proof Architecture</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {PROOF_LAYERS.map((p, i) => (
              <div key={p.id} className="relative bg-[#02040a] border border-white/5 p-6 group hover:border-cyan-500/20 transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 flex items-center justify-center border border-cyan-500/20 text-cyan-400/70 font-mono text-[12px] tracking-[0.2em] shrink-0">
                    {p.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-[13px] tracking-[0.3em] uppercase mb-2">{p.name}</div>
                    <div className="text-white/25 text-[10px] leading-relaxed">{p.desc}</div>
                  </div>
                  {i < PROOF_LAYERS.length - 1 && (
                    <div className="hidden md:flex items-center text-cyan-400/20 text-lg">↓</div>
                  )}
                </div>
              </div>
            ))}
            {/* ZKP composite */}
            <div className="relative bg-[#02040a] border border-cyan-400/30 p-6 text-center"
              style={{ boxShadow: "0 0 30px rgba(34,211,238,0.06)" }}>
              <div className="text-cyan-400/50 text-[9px] tracking-[0.5em] uppercase mb-3">Composite Proof</div>
              <div className="text-cyan-200/80 text-[14px] tracking-[0.4em] uppercase font-light"
                style={{ textShadow: "0 0 12px rgba(34,211,238,0.3)" }}>
                ZK-Presence = ZK(PoP, MP, EP)
              </div>
              <div className="text-white/20 text-[9px] tracking-[0.2em] mt-2">128-512 bytes · verifiable in &lt;1ms · platform-agnostic</div>
            </div>
          </div>
        </section>

        {/* ── 六条验证规则 ── */}
        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-8 text-center">Six Verification Rules (§9.4)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {VERIFICATION_RULES.map((r) => (
              <div key={r.rule} className="bg-[#02040a] p-5 group hover:bg-cyan-500/[0.02] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-5 h-5 flex items-center justify-center border border-cyan-500/30 text-cyan-400/60 font-mono text-[9px]">
                    {r.rule}
                  </span>
                  <span className="text-white/60 text-[11px] tracking-[0.2em] uppercase">{r.name}</span>
                </div>
                <div className="text-white/25 text-[9px] leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 隐私保证 ── */}
        <section className="border border-dashed border-white/8 p-10 text-center">
          <div className="text-white/30 text-[9px] tracking-[0.6em] uppercase mb-6">Privacy Guarantees</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] tracking-[0.15em] text-white/40">
            <div>
              <div className="text-cyan-400/60 mb-2">Reveals Nothing</div>
              <div className="text-white/20">No motion data · No identity · No behavior · No device info</div>
            </div>
            <div>
              <div className="text-cyan-400/60 mb-2">Stores Nothing</div>
              <div className="text-white/20">No raw signals · No feature vectors · No personal data</div>
            </div>
            <div>
              <div className="text-cyan-400/60 mb-2">Leaks Nothing</div>
              <div className="text-white/20">No inference possible · No statistical attack surface</div>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}

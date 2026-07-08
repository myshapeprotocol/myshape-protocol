"use client";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";
import "./zk.css";

const PROOF_LAYERS = [
  { id: "PoP", name: "Presence Proof", desc: "H(Feature Vector) — proves the motion data carries valid geometric structure. The smallest verifiable unit of presence." },
  { id: "MP", name: "Motion Proof", desc: "H(FPS, window, nodes, timestamp, device_salt) — proves the data came from real hardware within a valid time window." },
  { id: "EP", name: "Entropy Proof", desc: "H(PES, H_f, σ_timing, ε) — proves the signal exceeds biological entropy floor and is below AI ceiling." },
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
    <ProtocolLayout refId="004" category="PROTOCOL_CORE" title="ZERO_KNOWLEDGE" secLevel="CLASS_A" systemStatus="ENCRYPTED">
      <div className="space-y-20 md:space-y-28">
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gradient-to-r from-[#90c8ff]/60 to-transparent" />Core_Principle
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">Prove <span className="text-[#90c8ff]/90">presence</span> without revealing <span className="text-[#90c8ff]/90">identity</span>.</p>
          <p className="mt-6 text-white/40 text-sm tracking-widest leading-loose font-light">The MyShape proof system generates three independent cryptographic proofs — Presence, Motion, and Entropy — and composes them into a single Zero-Knowledge Presence proof. The verifier learns only one bit: "real human present." Nothing else.</p>
        </section>

        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-10 text-center">Three-Proof Architecture</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {PROOF_LAYERS.map((p, i) => (
              <div key={p.id} className="zk-proof-card" onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}>
                <div className="zk-proof-accent" />
                <div className="flex items-start gap-5">
                  <div className="zk-proof-id">{p.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="zk-proof-name">{p.name}</div>
                    <div className="zk-proof-desc">{p.desc}</div>
                  </div>
                  {i < PROOF_LAYERS.length - 1 && <div className="hidden md:flex items-center text-[#90c8ff]/20 text-lg">↓</div>}
                </div>
              </div>
            ))}
            <div className="zk-composite" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
              <div className="zk-composite-label">Composite Proof</div>
              <div className="zk-composite-formula">ZK-Presence = ZK(PoP, MP, EP)</div>
              <div className="zk-composite-meta">128-512 bytes · verifiable in &lt;1ms · platform-agnostic</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-8 text-center">Six Verification Rules (§9.4)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VERIFICATION_RULES.map((r) => (
              <div key={r.rule} className="zk-rule-card" onMouseEnter={() => playTick(600, "sine", 0.06, 0.015)}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="zk-rule-num">{r.rule}</span>
                  <span className="zk-rule-name">{r.name}</span>
                </div>
                <div className="zk-rule-desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="zk-privacy" onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
          <div className="zk-privacy-title">Privacy Guarantees</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><div className="zk-privacy-col-title">Reveals Nothing</div><div className="zk-privacy-col-text">No motion data · No identity · No behavior · No device info</div></div>
            <div><div className="zk-privacy-col-title">Stores Nothing</div><div className="zk-privacy-col-text">No raw signals · No feature vectors · No personal data</div></div>
            <div><div className="zk-privacy-col-title">Leaks Nothing</div><div className="zk-privacy-col-text">No inference possible · No statistical attack surface</div></div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}

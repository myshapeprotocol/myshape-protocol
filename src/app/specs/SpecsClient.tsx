"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";

export default function SpecsClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-12">
          <div className="text-[#90c8ff]/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase">
            PROTOCOL_SPEC // V1.0
          </div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] md:tracking-[0.12em] text-white uppercase">
            Protocol Specification
          </h1>
          <p className="text-white/45 md:text-white/50 text-[11px] md:text-[14px] leading-relaxed max-w-xl font-light">
            The technical foundation of MyShape Protocol. For engineers, auditors, and protocol implementers.
          </p>
        </div>

        {/* ── PES Engine ── */}
        <section className="mb-12">
          <h2 className="text-[#90c8ff] text-[13px] tracking-[0.15em] uppercase mb-4">
            1. Presence Entropy Score (PES)
          </h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5 space-y-3 text-[12px] leading-relaxed text-white/50">
            <p>
              The PES is a 0–1 scalar quantifying the biological entropy density in a motion sample.
              It operates across four independent dimensions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Micro-Timing Variance", desc: "Frame-to-frame temporal jitter. Humans exhibit 8–12 ms variance from stretch reflex latency. AI interpolation is deterministic." },
                { label: "Noise Residual", desc: "High-frequency motor-unit noise (20–50 Hz band). AI-generated motion over-smooths this band." },
                { label: "Frequency Entropy", desc: "1/f spectral scaling of jerk (derivative of acceleration). Biological motion follows pink noise. AI output is white." },
                { label: "Biological Perturbation", desc: "Micro-saccadic corrections at limb endpoints. These are absent in synthetic trajectories." },
              ].map((d) => (
                <div key={d.label} className="border border-[#90c8ff]/08 p-3">
                  <div className="text-[#90c8ff]/70 text-[10px] tracking-[0.1em] uppercase mb-1">{d.label}</div>
                  <div className="text-white/35 text-[10px] leading-relaxed">{d.desc}</div>
                </div>
              ))}
            </div>

            <p className="text-[#90c8ff]/30 text-[10px]">
              PES = w₁·timing + w₂·noise + w₃·frequency + w₄·biological, where weights are calibrated
              on 54 real human samples against a GAN-generated control set. Benchmark: 0.3960 Human–AI gap (PES v0.2).
            </p>
          </div>
        </section>

        {/* ── Data Sovereignty ── */}
        <section className="mb-12">
          <h2 className="text-[#90c8ff] text-[13px] tracking-[0.15em] uppercase mb-4">
            2. Data Sovereignty Path
          </h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5 space-y-3 text-[12px] leading-relaxed text-white/50">
            <div className="font-mono text-[10px] text-[#90c8ff]/60 tracking-[0.15em] space-y-1">
              <div>1. Local Capture — MediaPipe Pose extracts 33-pt landmarks on-device</div>
              <div>2. SST Reduction — 33-pt → 18-pt skeleton topology (discards face/hand identity data)</div>
              <div>3. Motion Vector — 4D PES engine produces 128-dim signature from kinematics + acceleration + jerk + spectrum</div>
              <div>4. ZK-SNARK Proof — ~250 byte zero-knowledge proof. Verifies presence without exposing the vector.</div>
              <div>5. Genesis Enrollment — Proof anchored to protocol node. Node receives genesis_key (UUID v4).</div>
            </div>

            <div className="border-t border-[#90c8ff]/08 pt-3 mt-3">
              <p className="text-white/30 text-[10px]">
                <span className="text-[#90c8ff]/50">Zero raw data leaves the device.</span>{" "}
                The server never sees camera frames, pose landmarks, or the 128-dim vector.
                It only verifies the ZK proof. This is not a privacy policy — it is a cryptographic invariant.
              </p>
            </div>
          </div>
        </section>

        {/* ── Governance ── */}
        <section className="mb-12">
          <h2 className="text-[#90c8ff] text-[13px] tracking-[0.15em] uppercase mb-4">
            3. Genesis Governance
          </h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5 space-y-3 text-[12px] leading-relaxed text-white/50">
            <p>
              Genesis cohort admission is algorithmic, not discretionary. No human decides who enters the
              Genesis 100. The protocol evaluates two objective criteria:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-white/35">
              <li><span className="text-white/50">Presence Proof</span> — PES &gt; 0.5, verified via the 4D entropy engine</li>
              <li><span className="text-white/50">Temporal Position</span> — Among the first 100 eligible entities to submit a valid proof</li>
            </ul>
            <p className="text-[#90c8ff]/30 text-[10px]">
              Full governance specification:{" "}
              <a href="https://github.com/myshapeprotocol/docs/genesis-governance.md" className="text-[#90c8ff]/50 hover:text-[#90c8ff]/80 underline">
                genesis-governance.md
              </a>
            </p>
          </div>
        </section>

        {/* ── Roadmap ── */}
        <section className="mb-12">
          <h2 className="text-[#90c8ff] text-[13px] tracking-[0.15em] uppercase mb-4">
            4. Protocol Evolution
          </h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5 space-y-3">
            {[
              { phase: "Genesis", status: "LIVE", desc: "First 100 sovereign nodes. Motion-signature enrollment. Genesis Key minting.", color: "#3fb950" },
              { phase: "Continuity", status: "NEXT", desc: "ZK-Identity credentials for all nodes. Cross-session presence continuity. Agent identity registration.", color: "#d2991d" },
              { phase: "Sovereignty", status: "PLANNED", desc: "Protocol governance weight for Genesis holders. Identity mesh peer discovery. On-chain proof anchoring.", color: "#6e7681" },
            ].map((p) => (
              <div key={p.phase} className="flex items-start gap-3 text-[11px]">
                <span
                  className="shrink-0 mt-0.5 text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded border"
                  style={{ color: p.color, borderColor: p.color + "30", background: p.color + "0a" }}
                >
                  {p.status}
                </span>
                <div>
                  <span className="text-white/60">{p.phase}</span>
                  <span className="text-white/30 ml-2">{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stack ── */}
        <section className="mb-12">
          <h2 className="text-[#90c8ff] text-[13px] tracking-[0.15em] uppercase mb-4">
            5. Reference Stack
          </h2>
          <div className="border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02] p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
              {[
                ["Framework", "Next.js 16 (App Router)"],
                ["UI", "React 19 + Tailwind CSS 4"],
                ["3D", "Three.js + R3F 9.x"],
                ["Motion", "MediaPipe Pose"],
                ["Crypto", "@noble/hashes + curves"],
                ["Backend", "Supabase 2.x"],
                ["WASM", "Rust → wasm-pack"],
                ["Infra", "PM2 + Vercel"],
              ].map(([k, v]) => (
                <div key={k} className="border border-[#90c8ff]/06 p-2">
                  <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.12em] uppercase">{k}</div>
                  <div className="text-white/45 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
          <a
            href="https://github.com/myshapeprotocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#90c8ff]/40 text-[10px] tracking-[0.2em] uppercase hover:text-[#90c8ff]/70 transition-colors"
          >
            ◈ Contribute on GitHub
          </a>
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}

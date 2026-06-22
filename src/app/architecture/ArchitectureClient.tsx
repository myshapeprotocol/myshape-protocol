"use client";
import ProtocolHeader from "@/components/header/header";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const PIPELINE = [
  { step: "01", name: "Human Motion", desc: "Real-time camera input. On-device processing. MediaPipe Pose → 33 landmarks. Nothing uploaded.", output: "Raw Frames" },
  { step: "02", name: "Behavioral Encoding", desc: "SST 18-point topology mapping. Temporal + kinematic + entropy features. 4-dimensional PES scoring.", output: "Feature Vector" },
  { step: "03", name: "Identity Vector", desc: "Motion geometry distilled into a compact, non-replicable signature. Poseidon-hashed. Non-invertible.", output: "MV_hash + PES" },
  { step: "04", name: "Proof Engine", desc: "PoP + MP + EP → ZK-Presence composite proof. < 512 bytes. Verifiable in < 1ms.", output: "ZK-Proof" },
  { step: "05", name: "Agent Identity", desc: "Cross-species verification. Human and AI identities coexist in one protocol. Presence Receipt issued.", output: "Presence Receipt" },
];

const ENGINES = [
  { name: "PES Engine", file: "presence-entropy.ts", desc: "4D entropy scoring" },
  { name: "Proof System", file: "proof-system.ts", desc: "PoP/MP/EP/ZKP" },
  { name: "SST Mapper", file: "skeleton-topology.ts", desc: "33→18 point topology" },
  { name: "Threat Assessment", file: "threat-assessment.ts", desc: "8 attack signatures" },
  { name: "Protocol Validator", file: "protocol-validator.ts", desc: "6 verification rules" },
  { name: "Local Identity", file: "local-identity.ts", desc: "Device salt + keys" },
  { name: "Presence Stream", file: "presence-stream.ts", desc: "Aggregation + PSS" },
  { name: "Unforgeability", file: "unforgeability.ts", desc: "Entropy gap theorem" },
];

export default function ArchitectureClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">Protocol_Architecture</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
            Human Motion <span style={{ color: "rgba(144,200,255,0.6)" }}>→</span> Presence Receipt
          </h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-2xl">
            The complete MyShape Protocol pipeline — from raw camera input to cryptographic proof of presence.
            Five stages. Sixteen engines. Zero data stored.
          </p>
        </div>

        {/* Pipeline Flow */}
        <section className="mb-16">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-8">// PROTOCOL_PIPELINE</h2>
          <div className="relative">
            <div className="absolute left-6 top-8 bottom-8 w-[1px] bg-gradient-to-b from-cyan-400/30 via-cyan-400/15 to-cyan-400/5" />
            {/* Scanning beam */}
            <div className="absolute left-[21px] w-[3px] h-12"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(34,211,238,0.25), transparent)",
                animation: "spineScan 4s ease-in-out infinite",
                filter: "blur(1px)",
              }} />
            <div className="space-y-0">
              {PIPELINE.map((p, i) => (
                <div key={p.step} className="relative flex gap-5 pl-10 pb-8 last:pb-0 group">
                  <div className="absolute left-[10px] top-3 w-3 h-3 rounded-full border-2 border-cyan-400/40 bg-[#02040a] z-10 group-hover:border-cyan-300/80 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-500"
                    style={{
                      boxShadow: "0 0 8px rgba(34,211,238,0.3)",
                      animation: `nodePulse 2.5s ease-in-out ${i * 0.4}s infinite`,
                    }} />
                  <div className="flex-1 border border-white/5 bg-black/30 p-5 hover:border-cyan-400/20 hover:bg-black/40 hover:-translate-y-0.5 transition-all duration-500"
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400/40 font-mono text-[10px] tracking-[0.2em]">{p.step}</span>
                        <span className="text-white/70 text-[12px] tracking-[0.2em] uppercase">{p.name}</span>
                      </div>
                      <span className="text-cyan-400/20 group-hover:text-cyan-300/50 text-[9px] tracking-[0.1em] font-mono transition-colors duration-500">{p.output}</span>
                    </div>
                    <p className="text-white/25 text-[10px] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Engines */}
        <section className="mb-16">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-6">// REFERENCE_IMPLEMENTATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ENGINES.map(e => (
              <div key={e.file} onMouseEnter={() => playTick(700, "sine", 0.08, 0.015)} className="border border-white/5 bg-black/30 p-4 flex items-center justify-between hover:border-cyan-400/15 transition-all">
                <div>
                  <div className="text-white/60 text-[11px] tracking-[0.15em] uppercase mb-0.5">{e.name}</div>
                  <div className="text-white/20 text-[9px]">{e.desc}</div>
                </div>
                <span className="text-cyan-400/25 font-mono text-[9px]">{e.file}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Reference Implementation */}
        <section className="mb-16 p-6 border border-cyan-400/20 bg-cyan-400/[0.02] text-center">
          <h2 className="text-white/20 text-[9px] tracking-[0.6em] uppercase mb-4">// REFERENCE_IMPLEMENTATION</h2>
          <p className="text-white/50 text-[12px] leading-relaxed mb-2">
            16 protocol engines. 3863-line specification. Zero external dependencies.
          </p>
          <p className="text-white/25 text-[10px] leading-relaxed mb-4">
            TypeScript monorepo. All processing on-device. No data stored or transmitted.
          </p>
          <a href="https://github.com/myshapeprotocol" target="_blank" rel="noopener noreferrer"
            className="inline-block px-8 py-2.5 border border-cyan-400/30 text-cyan-400/60 text-[10px] tracking-[0.2em] uppercase hover:border-cyan-400 hover:text-cyan-200 transition-all">
            View on GitHub →
          </a>
        </section>

        {/* CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-14">
          {[
            { label: "Read", title: "Technical Spec", desc: "Full specification (§1-40)", href: "/papers/technical-spec" },
            { label: "Review", title: "Threat Model", desc: "Security analysis", href: "/papers/threat-model" },
            { label: "Build", title: "Developer SDK", desc: "5 lines to integrate", href: "/developers" },
          ].map(card => (
            <a key={card.href} href={card.href}
              className="group block p-5 transition-all duration-500 text-center hover:-translate-y-1"
              style={{ border: "1px solid rgba(144,200,255,0.1)", background: "rgba(2,4,10,0.85)" }}>
              <div className="text-cyan-400/30 text-[9px] tracking-[0.3em] uppercase mb-2 group-hover:text-cyan-400/60 transition-colors">{card.label}</div>
              <div className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-1.5 group-hover:text-white transition-colors">{card.title}</div>
              <div className="text-white/20 text-[9px] group-hover:text-white/35 transition-colors">{card.desc}</div>
              <div className="mt-3 text-cyan-400/25 group-hover:text-cyan-400/60 group-hover:translate-x-1 transition-all inline-block text-[10px]">→</div>
            </a>
          ))}
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}

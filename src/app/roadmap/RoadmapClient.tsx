"use client";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";
import "./roadmap.css";

type Status = "COMPLETED" | "CURRENT" | "PENDING";

interface Milestone { label: string; status: Status; }

interface Epoch {
  epoch: string; title: string; timeframe: string; status: Status;
  thesis: string; milestones: Milestone[];
}

const statusConfig: Record<Status, { dot: string; badge: string; border: string; glow: string; label: string }> = {
  COMPLETED: {
    dot: "bg-[#90c8ff] shadow-[0_0_10px_rgba(144,200,255,0.8)]",
    badge: "border-[#90c8ff]/40 text-[#90c8ff] bg-[#90c8ff]/5",
    border: "border-[#90c8ff]/15",
    glow: "shadow-[0_0_30px_rgba(144,200,255,0.06)]",
    label: "● COMPLETED",
  },
  CURRENT: {
    dot: "bg-[#90c8ff] animate-pulse shadow-[0_0_12px_rgba(144,200,255,0.6)]",
    badge: "border-[#90c8ff]/60 text-[#90c8ff] bg-[#90c8ff]/8 animate-pulse",
    border: "border-[#90c8ff]/25",
    glow: "shadow-[0_0_40px_rgba(144,200,255,0.1)]",
    label: "◉ IN_PROGRESS",
  },
  PENDING: {
    dot: "bg-white/10",
    badge: "border-white/10 text-white/30 bg-transparent",
    border: "border-white/5",
    glow: "",
    label: "○ PLANNED",
  },
};

function msClass(s: Status): string {
  if (s === "COMPLETED") return "rm-ms-done";
  if (s === "CURRENT") return "rm-ms-current";
  return "rm-ms-pending";
}

function msIcon(s: Status): string {
  if (s === "COMPLETED") return "✓";
  if (s === "CURRENT") return "▶";
  return "○";
}

const EPOCHS: Epoch[] = [
  {
    epoch: "EPOCH_I", title: "Genesis", timeframe: "2025–2027", status: "CURRENT", thesis: "Identity = Geometry",
    milestones: [
      { label: "Motion Vector type system (§1-2)", status: "COMPLETED" },
      { label: "PES engine — 4-dimensional entropy scoring (§3-4)", status: "COMPLETED" },
      { label: "Threat & Attack Model — 8 attack signatures (§5)", status: "COMPLETED" },
      { label: "Proof System — PoP/MP/EP/ZKP architecture (§6)", status: "COMPLETED" },
      { label: "SDK v1.0 — Presence/Proof/Verification modules (§8)", status: "COMPLETED" },
      { label: "Motion demo — live PES via camera (§2-6 integrated)", status: "COMPLETED" },
      { label: "Developer SDK release + documentation", status: "CURRENT" },
      { label: "First partner integrations (social, gaming, XR)", status: "PENDING" },
    ],
  },
  {
    epoch: "EPOCH_II", title: "Protocolization", timeframe: "2027–2030", status: "PENDING", thesis: "Identity = Protocol",
    milestones: [
      { label: "ZK circuit productionization (Halo2/Plonky2)", status: "PENDING" },
      { label: "Universal Verification Standard (UVS)", status: "PENDING" },
      { label: "Cross-platform identity handshake", status: "PENDING" },
      { label: "Agent declaration protocol — human/AI coexistence", status: "PENDING" },
      { label: "Tokenomics activation — $PULSE/$ENERGY/$SHAPE", status: "PENDING" },
      { label: "Governance v1 — identity-weighted voting", status: "PENDING" },
      { label: "Major platform SDKs (Unreal, Unity, iOS, Android)", status: "PENDING" },
      { label: "Cross-chain identity bridge", status: "PENDING" },
    ],
  },
  {
    epoch: "EPOCH_III", title: "Ecosystem Expansion", timeframe: "2030–2035", status: "PENDING", thesis: "Identity = Substrate",
    milestones: [
      { label: "Multi-world identity portability", status: "PENDING" },
      { label: "XR-native identity standard", status: "PENDING" },
      { label: "AI identity standard — agent personhood", status: "PENDING" },
      { label: "Robotics SDK — embodied AI identity", status: "PENDING" },
      { label: "Identity-bound assets (soulbound tokens)", status: "PENDING" },
      { label: "Presence-based economies", status: "PENDING" },
      { label: "Multi-agent coordination networks", status: "PENDING" },
    ],
  },
  {
    epoch: "EPOCH_IV", title: "Civilization Layer", timeframe: "2035–2045+", status: "PENDING", thesis: "Identity = Civilization",
    milestones: [
      { label: "Universal identity kernel", status: "PENDING" },
      { label: "Cross-species identity protocols", status: "PENDING" },
      { label: "Global identity infrastructure", status: "PENDING" },
      { label: "Identity-bound governance at civilizational scale", status: "PENDING" },
      { label: "Multi-species constitutional framework", status: "PENDING" },
      { label: "ZK civilization — presence-weighted democracy", status: "PENDING" },
    ],
  },
];

export default function RoadmapClient() {
  return (
    <ProtocolLayout refId="010" category="SYS_COMP" title="ROADMAP" secLevel="CLASS_GAMMA" systemStatus="EVOLVING">
      <div className="space-y-24 md:space-y-32">
        <section className="max-w-4xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-4">// FOUR_EPOCH_ROADMAP</h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            From <span className="text-[#90c8ff]">geometry</span> → to{" "}
            <span className="text-[#90c8ff]">protocol</span> → to{" "}
            <span className="text-[#90c8ff]">substrate</span> → to{" "}
            <span className="text-[#90c8ff]">civilization</span>.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-[0.2em] leading-loose font-light">
            Four epochs spanning 20+ years. Each epoch establishes a new layer of identity infrastructure.
            This is not a product roadmap — it is a civilizational blueprint.
          </p>
          <p className="mt-4 text-[#90c8ff]/20 text-[10px] tracking-[0.3em] uppercase font-mono italic">// ROADMAP_UPDATING_VIA_GENESIS_ENTROPY</p>
        </section>

        <section className="relative">
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#90c8ff]/20 via-[#90c8ff]/10 to-transparent" />
          <div className="space-y-20">
            {EPOCHS.map((epoch, ei) => {
              const cfg = statusConfig[epoch.status];
              return (
                <div key={epoch.epoch} className="relative pl-16 md:pl-20">
                  <div className="absolute left-[22px] md:left-[30px] top-2 z-10">
                    <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    {epoch.status === "CURRENT" && <div className="absolute -inset-1 rounded-full border border-[#90c8ff]/30 animate-ping" />}
                  </div>

                  <div className={`rm-card border ${cfg.border} ${cfg.glow}`}
                    onMouseEnter={() => playTick([600, 700, 800, 900][ei] || 700, "sine", 0.08, 0.015)}>
                    <div className="p-6 md:p-10">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-2">
                        <span className="rm-epoch-label">{epoch.epoch}</span>
                        <h3 className="rm-title">{epoch.title}</h3>
                        <span className="rm-timeframe">{epoch.timeframe}</span>
                      </div>
                      <p className="rm-thesis mb-6">{epoch.thesis}</p>

                      <div className="space-y-2 mb-6">
                        {epoch.milestones.map((m, idx) => (
                          <div key={idx} className={`flex gap-3 items-start ${msClass(m.status)}`}>
                            <span className="rm-milestone-check">{msIcon(m.status)}</span>
                            <span className="rm-milestone-label">{m.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`h-[1px] w-8 ${epoch.status === "COMPLETED" ? "bg-gradient-to-r from-[#90c8ff]/60 to-transparent" : epoch.status === "CURRENT" ? "bg-gradient-to-r from-[#90c8ff]/40 to-transparent" : "bg-white/5"}`} />
                          <span className={`text-[10px] tracking-[0.3em] uppercase font-mono ${epoch.status === "COMPLETED" ? "text-[#90c8ff]/70" : epoch.status === "CURRENT" ? "text-[#90c8ff]/60" : "text-white/15"}`}>
                            {epoch.status === "COMPLETED" ? "DELIVERED" : epoch.status === "CURRENT" ? `${epoch.timeframe} — ACTIVE` : `EST. ${epoch.timeframe}`}
                          </span>
                        </div>
                        <div className={`px-3 py-1 border text-[10px] tracking-[0.25em] uppercase font-mono ${cfg.badge}`}>{cfg.label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col items-center text-center py-8">
          <p className="text-white/25 text-[10px] tracking-[0.6em] uppercase mb-8">End_Of_Document_Temporal_Projection</p>
          <p className="text-white/50 text-sm tracking-[0.2em] uppercase leading-loose max-w-2xl italic">
            &ldquo;The roadmap is a living protocol. Each completed milestone is a verifiable proof of work.
            The direction is fixed — the timeline adapts.&rdquo;
          </p>
          <div className="mt-10 h-px w-24 bg-gradient-to-r from-transparent via-[#90c8ff]/40 to-transparent" />
        </section>
      </div>
    </ProtocolLayout>
  );
}

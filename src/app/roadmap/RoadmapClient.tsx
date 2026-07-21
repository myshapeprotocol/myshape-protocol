"use client";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";
import "./roadmap.css";

type Status = "COMPLETED" | "CURRENT" | "PENDING";
interface Milestone { label: string; status: Status; }

const statusConfig: Record<Status, { dot: string; badge: string; border: string; glow: string; label: string }> = {
  COMPLETED: { dot: "bg-[#90c8ff] shadow-[0_0_10px_rgba(144,200,255,0.8)]", badge: "border-[#90c8ff]/40 text-[#90c8ff] bg-[#90c8ff]/5", border: "border-[#90c8ff]/15", glow: "shadow-[0_0_30px_rgba(144,200,255,0.06)]", label: "● COMPLETED" },
  CURRENT: { dot: "bg-[#90c8ff] animate-pulse shadow-[0_0_12px_rgba(144,200,255,0.6)]", badge: "border-[#90c8ff]/60 text-[#90c8ff] bg-[#90c8ff]/8 animate-pulse", border: "border-[#90c8ff]/25", glow: "shadow-[0_0_40px_rgba(144,200,255,0.1)]", label: "◉ IN_PROGRESS" },
  PENDING: { dot: "bg-white/20", badge: "border-white/15 text-white/50 bg-transparent", border: "border-white/[0.08]", glow: "", label: "○ PLANNED" },
};

function msClass(s: Status): string { return s==="COMPLETED"?"rm-ms-done":s==="CURRENT"?"rm-ms-current":"rm-ms-pending"; }
function msIcon(s: Status): string { return s==="COMPLETED"?"✓":s==="CURRENT"?"▶":"○"; }

const EPOCHS = [
  {
    epoch: "PHASE_I", title: "Research Foundation", timeframe: "2026 Q2–Q3", status: "CURRENT" as Status, thesis: "Continuity as a measurable property",
    milestones: [
      { label: "Evidence Engines — EE-001, EE-002, EE-003, VS-001", status: "COMPLETED" as Status },
      { label: "576 experimental runs — 4 engines, consumer hardware", status: "COMPLETED" as Status },
      { label: "RFC-0001 — Motion Signature Format (Draft)", status: "COMPLETED" as Status },
      { label: "RFC-0002 — Continuity Proof Format (Draft)", status: "COMPLETED" as Status },
      { label: "npm SDK — @thecontinuitylab/myshape v0.2.0", status: "COMPLETED" as Status },
      { label: "Playground — interactive verification sandbox", status: "COMPLETED" as Status },
      { label: "Cross-device continuity experiment", status: "CURRENT" as Status },
      { label: "External security review of CFC catalog", status: "PENDING" as Status },
    ],
  },
  {
    epoch: "PHASE_II", title: "Protocol Stabilization", timeframe: "2026 Q4–2027 Q1", status: "PENDING" as Status, thesis: "Open standard, multiple implementations",
    milestones: [
      { label: "CPS-0001 — Continuity Protocol Core v1.0 (Stable)", status: "PENDING" as Status },
      { label: "Open dataset publication (HuggingFace)", status: "PENDING" as Status },
      { label: "Reproducible conformance suite (CI)", status: "PENDING" as Status },
      { label: "Third-party verifier implementation (non-MyShape)", status: "PENDING" as Status },
      { label: "Internet-Draft submission to IETF/IRTF", status: "PENDING" as Status },
      { label: "First external RFC contribution", status: "PENDING" as Status },
    ],
  },
  {
    epoch: "PHASE_III", title: "Ecosystem Growth", timeframe: "2027+", status: "PENDING" as Status, thesis: "External adoption, independent verifiers",
    milestones: [
      { label: "Multi-entity tracking (N > 1 in frame)", status: "PENDING" as Status },
      { label: "Longitudinal study — same entity, weeks apart", status: "PENDING" as Status },
      { label: "Hash-chained multi-session continuity proof", status: "PENDING" as Status },
      { label: "Third-party compatible verifier (non-MyShape)", status: "PENDING" as Status },
      { label: "Protocol adoption by DAO/DeFi identity stack", status: "PENDING" as Status },
    ],
  },
];

export default function RoadmapClient() {
  return (
    <ProtocolLayout refId="002" category="ROADMAP" title="PROTOCOL_ROADMAP" secLevel="v1.0-RC" systemStatus="RESEARCH_CANDIDATE" renderSigil={false}>
      <div className="space-y-14 md:space-y-20">
        <section>
          <p className="text-white/50 text-[14px] leading-relaxed max-w-2xl mx-auto text-center" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            The Continuity Protocol roadmap. All milestones are public. All statuses are honest.
          </p>
        </section>

        {EPOCHS.map((e) => {
          const cfg = statusConfig[e.status];
          return (
            <section key={e.epoch} className={`rm-epoch relative p-6 md:p-10 border ${cfg.border} ${cfg.glow}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className="text-[13px] font-bold tracking-[0.2em] uppercase text-white/70">{e.epoch}</span>
                  </div>
                  <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-light tracking-[0.02em] text-white mt-2">{e.title}</h2>
                  <p className="text-white/45 text-[13px] mt-1">{e.timeframe} · {e.thesis}</p>
                </div>
                <span className={`px-4 py-1.5 border text-[11px] tracking-[0.12em] uppercase font-mono ${cfg.badge}`}>{cfg.label}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {e.milestones.map((m) => (
                  <div key={m.label} className={`rm-ms flex items-center gap-3 px-4 py-3 border ${m.status==="COMPLETED"?"border-[#90c8ff]/10":"border-white/5"} ${msClass(m.status)}`}
                    onMouseEnter={() => playTick(600, "sine", 0.05, 0.02)}>
                    <span className={`text-[11px] ${m.status==="COMPLETED"?"text-[#90c8ff]":m.status==="CURRENT"?"text-[#90c8ff]/60":"text-white/35"}`}>{msIcon(m.status)}</span>
                    <span className={`text-[12px] tracking-[0.03em] ${m.status==="COMPLETED"?"text-white/65":m.status==="CURRENT"?"text-white/55":"text-white/35"}`}>{m.label}</span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </ProtocolLayout>
  );
}

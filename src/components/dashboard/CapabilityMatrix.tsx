"use client";

import type { ProtocolProgress } from "@/types/protocol-progress";
import { UNLOCK_GATES } from "@/types/protocol-progress";
import { playTick } from "@/utils/useAudioTick";

type Props = { progress: ProtocolProgress };

const GATE_LABELS: Record<string, { title: string; body: string; lockedBody: string }> = {
  "Genesis Key Minting": {
    title: "Genesis Key",
    body: "Your cryptographic proof of founding-node status. Permanent, non-transferable, never offered again.",
    lockedBody: "Complete your first motion scan to mint your Genesis Key — the protocol's root entropy anchor.",
  },
  "Continuity Proof": {
    title: "Continuity Identity",
    body: "Generate continuity receipts of presence — prove you are human without revealing who you are.",
    lockedBody: "Reach Regular reputation and PULSE particle level to unlock privacy-preserving ZK proof generation.",
  },
  "Governance Voting": {
    title: "Governance",
    body: "Vote on protocol parameters, upgrades, and resource allocation. Your presence weight determines your voice.",
    lockedBody: "Achieve Established reputation and FIELD_ACTIVE particle level to participate in protocol governance.",
  },
  "Protocol Council": {
    title: "Protocol Council",
    body: "Seat at the highest governance table. Shape the protocol's evolutionary direction with genesis-tier authority.",
    lockedBody: "Reach Genesis reputation and ARCHITECT particle level to join the Protocol Council.",
  },
};

function EligibilityCard({
  gateKey,
  isUnlocked,
  progress,
}: {
  gateKey: string;
  isUnlocked: boolean;
  progress: ProtocolProgress;
}) {
  // Find matching gate config
  const gate = UNLOCK_GATES.find(g => `${g.icon} ${g.feature}` === gateKey || g.feature === gateKey.replace(/^[^\s]+\s/, ""));
  const labels = GATE_LABELS[gate?.feature ?? ""] ?? { title: gateKey, body: "", lockedBody: "" };
  const unlocked = isUnlocked;

  // Find this gate's narrative nextUnlock data (if it's the current target)
  const isCurrentTarget = !unlocked && progress.narrative.nextUnlock?.label === gateKey;

  return (
    <div
      className={`eligibility-card ${unlocked ? "card-unlocked" : "card-locked"} ${isCurrentTarget ? "card-target" : ""}`}
      onMouseEnter={() => playTick(400, "sine", 0.04, 0.008)}
    >
      {/* Icon */}
      <div className={`card-icon ${unlocked ? "icon-lit" : "icon-dim"}`}>
        {gate?.icon ?? "◈"}
      </div>

      {/* Title */}
      <div className={`card-title ${unlocked ? "title-lit" : "title-dim"}`}>
        {labels.title}
      </div>

      {/* Status */}
      <div className={`card-status ${unlocked ? "status-unlocked" : "status-locked"}`}>
        {unlocked ? "● Active" : "○ Locked"}
      </div>

      {/* Body */}
      <p className={`card-desc ${unlocked ? "desc-lit" : "desc-dim"}`}>
        {unlocked ? labels.body : labels.lockedBody}
      </p>

      {/* Locked: show requirement info — target gets highlight, non-target gets gray hint */}
      {!unlocked && (
        <>
          {isCurrentTarget && progress.narrative.nextUnlock ? (
            <div className="card-requirement">
              <span className="req-label">Next Unlock →</span>
              <span className="req-detail">{progress.narrative.nextUnlock.requirement}</span>
              <div className="req-progress-track">
                <div
                  className="req-progress-fill"
                  style={{ width: `${progress.narrative.nextUnlock.progress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="card-requirement card-requirement-dim">
              <span className="req-label-dim">Requires</span>
              <span className="req-detail-dim">{labels.lockedBody}</span>
            </div>
          )}
        </>
      )}

      {/* Unlocked: visual confirmation */}
      {unlocked && (
        <div className="card-check">✓</div>
      )}
    </div>
  );
}

export default function CapabilityMatrix({ progress }: Props) {
  const { isEligibleFor } = progress;

  const cards = [
    { key: "🔑 Genesis Key Minting",    unlocked: isEligibleFor.genesisKey },
    { key: "🔐 ZK Presence Proof",      unlocked: isEligibleFor.zkOps },
    { key: "⚖️ Governance Voting",       unlocked: isEligibleFor.governance },
    { key: "🏛️ Protocol Council",        unlocked: isEligibleFor.protocolCouncil },
  ];

  return (
    <section
      className="capability-matrix"
      onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
    >
      <div className="matrix-header">
        <span className="matrix-label">Protocol Capabilities</span>
        <span className="matrix-hint">
          {cards.filter(c => c.unlocked).length} / {cards.length} unlocked
        </span>
      </div>

      <div className="matrix-grid">
        {cards.map(card => (
          <EligibilityCard
            key={card.key}
            gateKey={card.key}
            isUnlocked={card.unlocked}
            progress={progress}
          />
        ))}
      </div>
    </section>
  );
}

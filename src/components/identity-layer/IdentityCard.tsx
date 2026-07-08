"use client";

import { playTick } from "@/utils/useAudioTick";

export interface IdentityModel {
  name: string;
  status: string;
  desc: string;
  detail: string;
  accent: string;
}

interface Props {
  model: IdentityModel;
}

export default function IdentityCard({ model }: Props) {
  return (
    <div
      className="il-card"
      onMouseEnter={() => playTick(600, "sine", 0.08, 0.015)}
    >
      {/* Radial glow on hover */}
      <div className="il-card-glow" />

      {/* Top accent line */}
      <div
        className={`il-card-accent-line bg-gradient-to-r ${model.accent}`}
      />

      {/* Header: title + status badge */}
      <div className="il-card-header">
        <h4 className="il-card-title">{model.name}</h4>
        <span className="il-card-status">{model.status}</span>
      </div>

      {/* Description */}
      <p className="il-card-desc">{model.desc}</p>

      {/* Animated divider */}
      <div className="il-card-divider">
        <div className="il-card-divider-sweep" />
      </div>

      {/* Detail */}
      <p className="il-card-detail">{model.detail}</p>
    </div>
  );
}

"use client";
import React from "react";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import ContinuityCard from "@/components/identity-layer/IdentityCard";
import SectionHeader from "@/components/identity-layer/SectionHeader";
import PipelineBar from "@/components/identity-layer/PipelineBar";
import type { IdentityModel } from "@/components/identity-layer/IdentityCard";
import "@/components/identity-layer/identity-layer.css";

const FOUNDATION: IdentityModel[] = [
  {
    name: "PHYSICAL CONTINUITY",
    status: "IMMUTABLE",
    desc: "Your motion is a physical signature — unique, irreproducible, and verifiable by anyone. No authority can revoke what physics verifies.",
    detail:
      "The philosophical root: continuity as a property of existence, not a grant from institutions.",
    accent: "from-[#90c8ff]/70 to-[#90c8ff]/0",
  },
  {
    name: "KINEMATIC PRIVACY",
    status: "ENCRYPTED",
    desc: "Motion is processed on-device by default. Only the derived proof is transmitted — not the motion itself.",
    detail:
      "The security root: Continuity means proving presence without revealing how you move.",
    accent: "from-blue-400/70 to-blue-400/0",
  },
  {
    name: "CONTINUITY",
    status: "ACTIVE",
    desc: "Zero-knowledge proof of presence. Verifiable by any third party without access to raw sensor data.",
    detail:
      "The proof layer: PoP + MP + EP composite — built on the 128-dimensional Motion Signature.",
    accent: "from-[#90c8ff]/70 to-[#90c8ff]/0",
  },
];

const EXTENSION: IdentityModel[] = [
  {
    name: "TEMPORAL RECORD",
    status: "STREAMING",
    desc: "Continuous verification over time. Not a snapshot. A stream of proof that accumulates into trust.",
    detail:
      "The state layer: scan_count, data_contribution, orbital evolution — your presence over time.",
    accent: "from-indigo-400/70 to-indigo-400/0",
  },
  {
    name: "AI-NATIVE EXISTENCE",
    status: "COEXISTING",
    desc: "Continuity designed for a world where AI agents and humans coexist. Cross-species verification in one protocol.",
    detail:
      "The cross-species layer: AGENT_ACTIVE nodes verify alongside GENESIS_NODE — one verification network.",
    accent: "from-violet-400/70 to-violet-400/0",
  },
  {
    name: "NEURAL SYNTHESIS",
    status: "FUTURE",
    desc: "The frontier: integrating deeper biological signals with cryptographic continuity primitives.",
    detail:
      "The expansion layer: beyond skeletal motion toward full neuro-kinetic continuity fusion.",
    accent: "from-fuchsia-400/50 to-fuchsia-400/0",
  },
];

const PIPELINE_STEPS = [
  { label: "Motion", variant: "dim" as const },
  { label: "Geometry", variant: "dim" as const },
  { label: "Vector", variant: "dim" as const },
  { label: "Proof", variant: "highlight" as const },
  { label: "Presence", variant: "glow" as const },
];

export default function ContinuityLayer() {
  return (
    <ProtocolLayout
      refId="002"
      category="PROTOCOL_CORE"
      title="CONTINUITY_LAYER"
      secLevel="STANDARD"
      systemStatus="ACTIVE_NODE"
    >
      <div className="space-y-16 md:space-y-28">
        {/* ── Core Concept ── */}
        <section className="max-w-3xl">
          <h2 className="il-page-header-label">
            <span className="il-page-header-accent" />
            Core_Concept
          </h2>
          <p className="il-page-header-hook">
            In the MyShape ecosystem, continuity is not a stored credential,
            but a{" "}
            <span className="il-page-header-accent-text">
              dynamic geometric expression
            </span>.
          </p>
          <p className="il-page-header-tagline">
            Geometry is distilled into a non-replicable Motion Signature.
          </p>
          <p className="il-page-header-text">
            Through the Energy-Presence Model, we translate raw motion data
            into a multi-dimensional visual and cryptographic state. This is the
            first step toward a continuously verifiable data-body.
          </p>
        </section>

        {/* ── Foundation ── */}
        <section>
          <SectionHeader label="Foundation" />
          <div className="il-card-grid">
            {FOUNDATION.map((model) => (
              <ContinuityCard key={model.name} model={model} />
            ))}
          </div>
        </section>

        {/* ── Extension ── */}
        <section>
          <SectionHeader label="Extension" />
          <div className="il-card-grid">
            {EXTENSION.map((model) => (
              <ContinuityCard key={model.name} model={model} />
            ))}
          </div>
        </section>

        {/* ── The Geometric Primitive ── */}
        <section className="max-w-3xl">
          <div className="il-geometric-box">
            <div className="il-geometric-label">The Geometric Primitive</div>
            <p className="il-geometric-text">
              2D images are projections. They collapse depth into pixels,
              discarding the spatial relationships that make a motion signature
              unique. A 3D Motion Signature preserves what 2D cannot — forming
              an irreducible geometric primitive that no AI model can
              reconstruct from flat training data.
            </p>
            <p className="il-geometric-text">
              The Nyquist limit ensures that 30 fps video cannot resolve
              dynamics above 15 Hz. Depth ambiguity from 2D-to-3D lifting
              introduces ±10% uncertainty. The sensor noise floor sits at the
              millimeter scale. These are not temporary AI limitations. They are
              laws of physics and information theory.
            </p>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <PipelineBar
          label="Continuity Pipeline"
          steps={PIPELINE_STEPS}
          footer="Real-time · On-device · Zero upload · Cryptographically verifiable"
        />
      </div>
    </ProtocolLayout>
  );
}

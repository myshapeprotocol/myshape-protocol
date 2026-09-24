"use client";
import React, { useState } from "react";
import Link from "next/link";
import "./latest-updates.css";

interface UpdateEntry {
  date: string;
  text: string;
  href?: string;
  tag?: "RFC" | "RN" | "Benchmark" | "Paper" | "Release" | "Lab";
}

const UPDATES: UpdateEntry[] = [
  {
    date: "2026-09-13",
    text: "CPS-0002 Protocol Core frozen as prototype draft artifact (cps-hsa-0.1-draft) — Trust Framework not frozen, out of scope",
    href: "https://thecontinuitylab.org/protocols/cps-0002",
    tag: "RFC",
  },
  {
    date: "2026-08-29",
    text: "CPS-0001 Specification frozen as v1.0-RC1 — normative serialization and validation semantics fixed (tag v1.0-RC1)",
    href: "https://www.myshape.com/research/notes/008-continuity-protocol-core",
    tag: "RFC",
  },
  {
    date: "2026-08-19",
    text: "SDK 0.3.0 released — evaluation only; predates Batch-2D hardening. For hardened verification use the repository reference verifier / cps-verify",
    href: "https://www.npmjs.com/package/@thecontinuitylab/myshape",
    tag: "Release",
  },
  {
    date: "2026-08-17",
    text: "CPS-0001 v0.2 two-stage verification complete — implementation, semantic tests, and documentation aligned (Stage 1 EE-001 ≥ 0.50, Stage 2 EE-003 = 1.0)",
    href: "/research/notes/009-two-stage-continuity-verification",
    tag: "Release",
  },
  {
    date: "2026-08-07",
    text: "npm package v0.2.2 — 4-layer verification pipeline (EE-001 PES + EE-002 + EE-003 + Threat Assessment), 120 tests, extensible by design (superseded by SDK 0.3.0)",
    href: "https://www.npmjs.com/package/@thecontinuitylab/myshape",
    tag: "Release",
  },
  {
    date: "2026-07-29",
    text: "First external reproduction — clean machine, 5/5 checks passed",
    tag: "Lab",
  },
  {
    date: "2026-07-28",
    text: "Day 5 published — Forgery Cost Deep Dive across 5 platforms",
    href: "https://github.com/myshapeprotocol/myshape-protocol/discussions/10",
    tag: "Lab",
  },
  {
    date: "2026-07-27",
    text: "CPS-0001 v1.0-RC published — engine-independent Continuity Receipt protocol",
    href: "/research/notes/008-continuity-protocol-core",
    tag: "RFC",
  },
  {
    date: "2026-07-25",
    text: "Strategic pivot — CPS-0001 repositioned as temporal trust infrastructure",
    tag: "Lab",
  },
  {
    date: "2026-07-14",
    text: "RN-002 PES Benchmark v0.2 — Cohen's d=2.1, AUC=0.94, N=281",
    href: "/research/notes/002-pes-benchmark",
    tag: "Benchmark",
  },
  {
    date: "2026-07-13",
    text: "Research infrastructure v1 — FD-001, RN-002, VS-001 three-node foundation, 359 tests",
    href: "/research",
    tag: "Lab",
  },
];

const FILTERS = [
  { key: "All", label: "All" },
  { key: "RFC", label: "RFC" },
  { key: "Benchmark", label: "Benchmark" },
  { key: "Release", label: "Release" },
  { key: "Lab", label: "Lab" },
] as const;

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  RFC: { bg: "rgba(0,229,255,0.12)", text: "#00E5FF" },
  RN: { bg: "rgba(212,175,55,0.12)", text: "#d4af37" },
  Benchmark: { bg: "rgba(0,229,255,0.12)", text: "#00E5FF" },
  Paper: { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
  Release: { bg: "rgba(100,255,180,0.10)", text: "#64ffb4" },
  Lab: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.45)" },
};

export default function LatestUpdates() {
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All"
    ? UPDATES
    : UPDATES.filter((e) => e.tag === filter);

  return (
    <section className="latest-updates">
      <div className="latest-updates__header">
        <h2 className="latest-updates__title">Latest Updates</h2>
        <span className="latest-updates__subtitle">A living research lab. Ongoing work.</span>
      </div>

      {/* Filter tabs */}
      <div className="latest-updates__filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`latest-updates__filter-btn${filter === key ? " latest-updates__filter-btn--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="latest-updates__list">
        {filtered.map((entry, i) => {
          const tagStyle = TAG_STYLES[entry.tag || "Lab"];
          const content = (
            <div className="latest-updates__row" key={i}>
              <time className="latest-updates__date">{entry.date}</time>
              <span
                className="latest-updates__tag"
                style={{ background: tagStyle.bg, color: tagStyle.text }}
              >
                {entry.tag}
              </span>
              <span className="latest-updates__text">{entry.text}</span>
              {entry.href && (
                <span className="latest-updates__arrow">→</span>
              )}
            </div>
          );

          if (entry.href) {
            const isExternal = entry.href.startsWith("http");
            return isExternal ? (
              <a
                key={i}
                href={entry.href}
                target="_blank"
                rel="noopener noreferrer"
                className="latest-updates__link"
              >
                {content}
              </a>
            ) : (
              <Link key={i} href={entry.href} className="latest-updates__link">
                {content}
              </Link>
            );
          }
          return <div key={i}>{content}</div>;
        })}
      </div>
    </section>
  );
}

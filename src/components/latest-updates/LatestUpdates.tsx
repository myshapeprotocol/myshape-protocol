"use client";
import React from "react";
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
    date: "2026-07-30",
    text: "npm package v0.1.6 — real sample data, npx myshape demo with live verification output",
    href: "https://www.npmjs.com/package/@thecontinuitylab/myshape",
    tag: "Release",
  },
  {
    date: "2026-07-29",
    text: "First external verifier — clean machine, USA, 5/5 checks passed",
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

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  RFC: { bg: "rgba(144,200,255,0.12)", text: "#90c8ff" },
  RN: { bg: "rgba(212,175,55,0.12)", text: "#d4af37" },
  Benchmark: { bg: "rgba(144,200,255,0.12)", text: "#90c8ff" },
  Paper: { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
  Release: { bg: "rgba(100,255,180,0.10)", text: "#64ffb4" },
  Lab: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.45)" },
};

export default function LatestUpdates() {
  return (
    <section className="latest-updates">
      <div className="latest-updates__header">
        <h2 className="latest-updates__title">Latest Updates</h2>
        <span className="latest-updates__subtitle">A living research lab. Weekly updates.</span>
      </div>

      <div className="latest-updates__list">
        {UPDATES.map((entry, i) => {
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

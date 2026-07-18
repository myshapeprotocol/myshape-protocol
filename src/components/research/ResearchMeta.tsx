"use client";
import React from "react";

/* ============================================================
   ResearchMeta — Consistent research output identification

   Every research page (notes, benchmarks, papers, decisions)
   uses this component as its identity header.

   Artifact ID system:
     RN-001  → Research Notes
     BM-001  → Benchmarks
     DL-001  → Decision Log
     OQ-001  → Open Questions

   The goal: screenshots of any research page are instantly
   recognizable as coming from The Continuity Lab — without
   seeing the logo.

   Usage:
     <ResearchMeta
       artifactId="RN-001"
       type="Research Note"
       status="Published"
       published="2026.07.09"
       updated="2026.07.10"
     />
   ============================================================ */

type ResearchMetaProps = {
  artifactId?: string;
  type: "Research Note" | "Benchmark" | "Technical Paper" | "Decision Log" | "Open Question" | "Dataset" | "Request for Comments" | "Failure Report";
  number?: string;
  status: "Draft" | "Under Review" | "Published" | "Active" | "Deprecated" | "Superseded";
  published: string;
  updated?: string;
};

const STATUS_COLOR: Record<ResearchMetaProps["status"], string> = {
  Draft: "rgba(255,255,255,0.2)",
  "Under Review": "rgba(212,175,55,0.5)",
  Published: "rgba(63,185,80,0.5)",
  Active: "rgba(63,185,80,0.5)",
  Deprecated: "rgba(255,255,255,0.15)",
  Superseded: "rgba(160,130,220,0.4)",
};

export default function ResearchMeta({ artifactId, type, number, status, published, updated }: ResearchMetaProps) {
  return (
    <div className="inline-block">
      {/* Canon label — the unifying namespace above every research object */}
      <div className="font-mono text-[8px] tracking-[0.25em] uppercase mb-1.5"
        style={{ color: "rgba(255,255,255,0.12)" }}>
        The Continuity Canon
      </div>
      <div
        className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.12em] uppercase"
        style={{
          border: "1px solid rgba(144,200,255,0.08)",
          background: "rgba(2,6,14,0.7)",
          padding: "6px 14px",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {/* Lab identifier */}
        <span style={{ color: "rgba(212,175,55,0.5)", fontWeight: 500 }}>
          The Continuity Lab
        </span>

      {/* Artifact ID — the citable identity */}
      {artifactId && (
        <>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
          <span style={{ color: "rgba(144,200,255,0.6)", fontWeight: 500 }}>
            {artifactId}
          </span>
        </>
      )}

      <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>

      {/* Output type */}
      <span>
        {type}
      </span>

      <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>

      {/* Status badge */}
      <span style={{ color: STATUS_COLOR[status] }}>{status.toUpperCase()}</span>

      {/* Dates */}
      <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
      <span style={{ color: "rgba(255,255,255,0.25)" }}>Published: {published}</span>

      {updated && updated !== published && (
        <>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>Updated: {updated}</span>
        </>
      )}
      </div>
    </div>
  );
}

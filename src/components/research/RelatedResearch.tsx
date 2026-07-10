"use client";
import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

/* ============================================================
   RelatedResearch — Cross-reference system for research objects

   Every research object can declare its relationships to others:
   - supportedBy:     Benchmarks that provide evidence
   - referencedDecisions: Decision Log entries that explain choices
   - openQuestions:   OQs that this work raises or addresses
   - relatedNotes:    Other Research Notes in the same thread

   Together these form a Knowledge Network — not a website.
   ============================================================ */

type RelatedRef = {
  id: string;
  label: string;
  href: string;
};

type RelatedResearchProps = {
  supportedBy?: RelatedRef[];
  referencedDecisions?: RelatedRef[];
  openQuestions?: RelatedRef[];
  relatedNotes?: RelatedRef[];
};

function Section({
  title,
  items,
  color,
}: {
  title: string;
  items: RelatedRef[];
  color: string;
}) {
  return (
    <div className="mb-4">
      <span className="font-mono text-[9px] tracking-[0.15em] uppercase mr-3" style={{ color }}>
        {title}
      </span>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="inline-flex items-center gap-1.5 mr-3 mb-1.5 font-mono text-[10px] tracking-[0.08em] transition-all duration-300"
          style={{
            color: `${color}80`,
            border: `1px solid ${color}20`,
            background: `${color}05`,
            padding: "3px 8px",
          }}
          onMouseEnter={(e) => {
            playTick(480, "sine", 0.03, 0.015);
            e.currentTarget.style.borderColor = `${color}50`;
            e.currentTarget.style.color = color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${color}20`;
            e.currentTarget.style.color = `${color}80`;
          }}
        >
          <span style={{ color, fontWeight: 500 }}>{item.id}</span>
          <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.3)" }}>
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function RelatedResearch(props: RelatedResearchProps) {
  const hasContent =
    props.supportedBy?.length ||
    props.referencedDecisions?.length ||
    props.openQuestions?.length ||
    props.relatedNotes?.length;

  if (!hasContent) return null;

  return (
    <div
      className="mt-16 pt-8"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/15 mb-4">
        Related Research
      </div>

      {props.supportedBy && props.supportedBy.length > 0 && (
        <Section title="Supported by" items={props.supportedBy} color="rgba(63,185,80,1)" />
      )}

      {props.referencedDecisions && props.referencedDecisions.length > 0 && (
        <Section title="Referenced Decisions" items={props.referencedDecisions} color="rgba(160,130,220,1)" />
      )}

      {props.openQuestions && props.openQuestions.length > 0 && (
        <Section title="Open Questions" items={props.openQuestions} color="rgba(212,175,55,1)" />
      )}

      {props.relatedNotes && props.relatedNotes.length > 0 && (
        <Section title="Related Notes" items={props.relatedNotes} color="rgba(144,200,255,1)" />
      )}
    </div>
  );
}

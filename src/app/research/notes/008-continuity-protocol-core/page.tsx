import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "CPS-0001 — Continuity Protocol Core · The Continuity Lab",
  description:
    "Core Protocol Specification for the Continuity Protocol. Defines the protocol object (Continuity Receipt) — its semantics, trust model, temporal model, composability, and serialization — independent of any verification engine.",
  alternates: {
    canonical: "https://www.myshape.com/research/notes/008-continuity-protocol-core",
  },
  openGraph: {
    title: "CPS-0001 — Continuity Protocol Core · The Continuity Lab",
    description:
      "A Continuity Protocol does not standardize how continuity is measured. It standardizes how continuity assertions are represented, exchanged, and verified.",
    url: "https://www.myshape.com/research/notes/008-continuity-protocol-core",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-21",
    authors: ["The Continuity Lab"],
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: "CPS-0001 — Continuity Protocol Core",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-07-21",
          }),
        }}
      />
      <NoteClient />
    </>
  );
}

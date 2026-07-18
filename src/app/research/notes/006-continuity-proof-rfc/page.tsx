import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "RFC-0002 — Continuity Proof Format · The Continuity Lab",
  description: "Formal specification of the MyShape Continuity Proof: evidence receipts, hash chaining, cross-device binding, and CFC detection.",
  alternates: { canonical: "https://www.myshape.com/research/notes/006-continuity-proof-rfc" },
  openGraph: {
    title: "RFC-0002 — Continuity Proof Format · The Continuity Lab",
    description: "How to prove that two temporally separated observations describe the same entity. Evidence receipts, hash chains, and CFC detection.",
    url: "https://www.myshape.com/research/notes/006-continuity-proof-rfc",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-18",
    authors: ["The Continuity Lab"],
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        headline: "RFC-0002 — Continuity Proof Format",
        author: { "@type": "Organization", name: "The Continuity Lab" },
        datePublished: "2026-07-18",
      })}} />
      <NoteClient />
    </>
  );
}

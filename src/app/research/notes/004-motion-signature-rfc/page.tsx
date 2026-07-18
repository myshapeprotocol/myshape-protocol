import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "RFC-0001 — Motion Signature Format · The Continuity Lab",
  description:
    "Formal specification of the MyShape Motion Signature: PES, jerk peak detection, cross-modal temporal matching, and verification session protocol.",
  alternates: { canonical: "https://www.myshape.com/research/notes/004-motion-signature-rfc" },
  openGraph: {
    title: "RFC-0001 — Motion Signature Format · The Continuity Lab",
    description:
      "A formal, implementable specification of the MyShape Motion Signature. Any team should be able to build a compatible verifier from this document alone.",
    url: "https://www.myshape.com/research/notes/004-motion-signature-rfc",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-18",
    authors: ["The Continuity Lab"],
    tags: ["rfc", "motion-signature", "pes", "continuity", "specification", "standard"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RFC-0001 — Motion Signature Format",
    description: "A formal specification of the MyShape Motion Signature. Implementable by any team.",
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
            headline: "RFC-0001 — Motion Signature Format",
            description: "Formal specification of the MyShape Motion Signature: PES, jerk peak detection, cross-modal temporal matching, and verification session protocol.",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-07-18",
            url: "https://www.myshape.com/research/notes/004-motion-signature-rfc",
          }),
        }}
      />
      <NoteClient />
    </>
  );
}

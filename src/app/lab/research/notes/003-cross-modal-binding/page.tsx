import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "RN-003 — Cross-Modal Binding · The Continuity Lab",
  description:
    "Can two independent sensor streams be proven to originate from the same physical event? Introducing Event-Level Causal Coupling as a new verification primitive.",
  alternates: { canonical: "https://thecontinuitylab.org/research/notes/003-cross-modal-binding" },
  openGraph: {
    title: "RN-003 — Cross-Modal Binding · The Continuity Lab",
    description:
      "Cross-modal causal verification: proving that camera and IMU observations share a single physical cause. The third research note from The Continuity Lab.",
    url: "https://thecontinuitylab.org/research/notes/003-cross-modal-binding",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-13",
    authors: ["The Continuity Lab"],
    tags: ["cross-modal", "causal-coupling", "binding", "evidence", "continuity", "research"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RN-003 — Cross-Modal Binding",
    description: "Proving that independent sensor streams describe the same physical event.",
    images: ["/og-image.png"],
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
            headline: "RN-003 — Cross-Modal Binding",
            description:
              "Formalizing the problem of cross-modal causal verification: proving that two independent sensor streams originate from the same physical event.",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-07-13",
            url: "https://thecontinuitylab.org/research/notes/003-cross-modal-binding",
            isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://thecontinuitylab.org" },
          }),
        }}
      />
      <NoteClient />
    </>
  );
}

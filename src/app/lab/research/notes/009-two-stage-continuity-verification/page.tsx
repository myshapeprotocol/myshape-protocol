import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "RN-005 — Two-Stage Continuity Verification · The Continuity Lab",
  description:
    "A real-device experiment testing whether a strong presence signal can compensate for an incomplete continuity challenge. Four trials; the two-stage decision rule requires both stages.",
  alternates: {
    canonical: "https://thecontinuitylab.org/research/notes/009-two-stage-continuity-verification",
  },
  openGraph: {
    title: "RN-005 — Two-Stage Continuity Verification · The Continuity Lab",
    description:
      "Can a strong presence signal compensate for an incomplete continuity challenge? Presence alone must not compensate for an incomplete continuity challenge.",
    url: "https://thecontinuitylab.org/research/notes/009-two-stage-continuity-verification",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-08-16",
    authors: ["The Continuity Lab"],
    tags: ["two-stage", "verification", "presence", "challenge-response", "continuity", "research"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RN-005 — Two-Stage Continuity Verification",
    description: "Presence alone must not compensate for an incomplete continuity challenge.",
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
            headline: "RN-005 — Two-Stage Continuity Verification",
            description:
              "A real-device experiment testing whether a strong presence signal can compensate for an incomplete continuity challenge under a mandatory two-stage decision rule.",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-08-16",
            url: "https://thecontinuitylab.org/research/notes/009-two-stage-continuity-verification",
            isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://thecontinuitylab.org" },
          }),
        }}
      />
      <NoteClient />
    </>
  );
}

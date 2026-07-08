import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "Research Note #001 — The Continuity Problem",
  description: "Why proving 'I am still me' may become the missing cryptographic primitive of the AI era. The first research note from The Continuity Lab.",
  alternates: { canonical: "https://www.myshape.com/research/notes/001-the-continuity-problem" },
  openGraph: {
    title: "RN #001 — The Continuity Problem",
    description: "Why proving 'I am still me' may become the missing primitive of the AI era.",
    url: "https://www.myshape.com/research/notes/001-the-continuity-problem",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-09",
    authors: ["The Continuity Lab"],
    tags: ["continuity", "identity", "research", "AI agents", "verification"],
  },
  twitter: { card: "summary_large_image", title: "RN #001 — The Continuity Problem", description: "Why proving 'I am still me' may become the missing primitive of the AI era.", images: ["/og-image.png"] },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "ScholarlyArticle",
        headline: "Research Note #001 — The Continuity Problem",
        description: "Why proving 'I am still me' may become the missing cryptographic primitive of the AI era.",
        author: { "@type": "Organization", name: "The Continuity Lab" },
        datePublished: "2026-07-09",
        url: "https://www.myshape.com/research/notes/001-the-continuity-problem",
        isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://www.myshape.com" },
      }) }} />
      <NoteClient />
    </>
  );
}

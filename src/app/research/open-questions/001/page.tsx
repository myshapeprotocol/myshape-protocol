import type { Metadata } from "next";
import OQClient from "./OQClient";

export const metadata: Metadata = {
  title: "OQ-001 — Can continuity exist independently of identity?",
  description:
    "The Continuity Lab's first Open Question. If continuity can be verified without persistent identifiers, humans, AI agents, and hybrid entities may share a common verification substrate.",
  alternates: { canonical: "https://www.myshape.com/research/open-questions/001" },
  openGraph: {
    title: "OQ-001 — Can continuity exist independently of identity?",
    description:
      "The first Open Question from The Continuity Lab. Investigating whether continuity can become the primary primitive, with identity emerging as a higher-level interpretation.",
    url: "https://www.myshape.com/research/open-questions/001",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-10",
    authors: ["The Continuity Lab"],
    tags: ["continuity", "identity", "open-question", "research"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OQ-001 — Can continuity exist independently of identity?",
    description:
      "The first Open Question from The Continuity Lab.",
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
            headline: "OQ-001 — Can continuity exist independently of identity?",
            description:
              "The Continuity Lab's first Open Question. Investigating whether continuity can be verified without relying on persistent identifiers.",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-07-10",
            url: "https://www.myshape.com/research/open-questions/001",
            isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://www.myshape.com" },
          }),
        }}
      />
      <OQClient />
    </>
  );
}

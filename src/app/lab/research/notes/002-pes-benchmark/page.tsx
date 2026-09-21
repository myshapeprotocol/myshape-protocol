import type { Metadata } from "next";
import NoteClient from "./NoteClient";

export const metadata: Metadata = {
  title: "RN-002 — PES Benchmark v0.2",
  description:
    "Dataset, precision/recall, and threats to validity for the Presence Entropy Score. 54 human subjects, 281 PES Benchmark samples, AUC 0.94.",
  alternates: { canonical: "https://thecontinuitylab.org/research/notes/002-pes-benchmark" },
  openGraph: {
    title: "RN-002 — PES Benchmark v0.2",
    description:
      "Dataset, results, and validity assessment for the Presence Entropy Score. The second research note from The Continuity Lab.",
    url: "https://thecontinuitylab.org/research/notes/002-pes-benchmark",
    siteName: "The Continuity Lab",
    type: "article",
    publishedTime: "2026-07-10",
    authors: ["The Continuity Lab"],
    tags: ["PES", "benchmark", "presence-entropy", "continuity", "research"],
  },
  twitter: {
    card: "summary_large_image",
    title: "RN-002 — PES Benchmark v0.2",
    description: "Dataset, results, and threats to validity for the Presence Entropy Score.",
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
            headline: "RN-002 — PES Benchmark v0.2",
            description:
      "Dataset, precision/recall, and threats to validity for the Presence Entropy Score.",
            author: { "@type": "Organization", name: "The Continuity Lab" },
            datePublished: "2026-07-10",
            url: "https://thecontinuitylab.org/research/notes/002-pes-benchmark",
            isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://thecontinuitylab.org" },
          }),
        }}
      />
      <NoteClient />
    </>
  );
}

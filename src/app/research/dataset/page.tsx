import type { Metadata } from "next";
import DatasetClient from "./DatasetClient";

export const metadata: Metadata = {
  title: "DS-001 — Human Continuity Dataset",
  description:
    "The Continuity Lab's PES Benchmark dataset. 281 PES Benchmark samples across 54 human subjects, 200 synthetic samples. Growing monthly. The foundation of all continuity benchmarks.",
  alternates: { canonical: "https://www.myshape.com/research/dataset" },
  openGraph: {
    title: "DS-001 — Human Continuity Dataset",
    description:
      "281 PES Benchmark samples. 54 human subjects. 4 AI strategies. The Continuity Lab's primary research asset.",
    url: "https://www.myshape.com/research/dataset",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DS-001 — Human Continuity Dataset",
    description: "The Continuity Lab's PES Benchmark dataset. Growing monthly.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Dataset",
        name: "DS-001 — Human Continuity Dataset",
        description: "The Continuity Lab's PES Benchmark dataset for continuity verification research.",
        creator: { "@type": "Organization", name: "The Continuity Lab" },
        datePublished: "2026-07-04",
        url: "https://www.myshape.com/research/dataset",
        isPartOf: { "@type": "WebSite", name: "The Continuity Lab", url: "https://www.myshape.com" },
      }) }} />
      <DatasetClient />
    </>
  );
}

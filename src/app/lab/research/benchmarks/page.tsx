import type { Metadata } from "next";
import BenchmarksClient from "./BenchmarksClient";

export const metadata: Metadata = {
  title: "Benchmarks — The Continuity Lab",
  description:
    "Active benchmark results from The Continuity Lab. 309 passing tests across 7 protocol engines — zero failures, 100% green.",
  alternates: { canonical: "https://thecontinuitylab.org/research/benchmarks" },
  openGraph: {
    title: "Benchmarks — The Continuity Lab",
    description:
      "309 tests. 100 suites. 0 failures. Protocol engine benchmarks from The Continuity Lab.",
    url: "https://thecontinuitylab.org/research/benchmarks",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Lab — Benchmarks",
    description: "309 tests. 100 suites. 0 failures.",
    images: ["/og-image.png"],
  },
};

export default function BenchmarksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://thecontinuitylab.org/research/benchmarks/#webpage",
            url: "https://thecontinuitylab.org/research/benchmarks",
            name: "Benchmarks — The Continuity Lab",
            description:
              "Active benchmark results from The Continuity Lab. 309 passing tests across 7 protocol engines.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://thecontinuitylab.org/#website",
              name: "The Continuity Lab",
              url: "https://thecontinuitylab.org",
            },
          }),
        }}
      />
      <BenchmarksClient />
    </>
  );
}

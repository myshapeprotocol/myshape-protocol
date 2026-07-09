import type { Metadata } from "next";
import ResearchClient from "./ResearchClient";

export const metadata: Metadata = {
  title: "Research — The Continuity Lab",
  description: "Published research notes and active benchmarks from The Continuity Lab. Investigating whether continuity can become a verifiable property of digital existence.",
  alternates: { canonical: "https://www.myshape.com/research" },
  openGraph: {
    title: "Research — The Continuity Lab",
    description: "Published research notes and active benchmarks. Investigating continuity as a cryptographic primitive.",
    url: "https://www.myshape.com/research",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "The Continuity Lab — Research", description: "Published research notes and active benchmarks from The Continuity Lab.", images: ["/og-image.png"] },
};

export default function ResearchPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage",
        "@id": "https://www.myshape.com/research/#webpage",
        url: "https://www.myshape.com/research",
        name: "Research — The Continuity Lab",
        description: "Published research notes and active benchmarks from The Continuity Lab. Investigating whether continuity can become a verifiable property of digital existence.",
        isPartOf: { "@type": "WebSite", "@id": "https://www.myshape.com/#website", name: "The Continuity Lab", url: "https://www.myshape.com" },
      }) }} />
      <ResearchClient />
    </>
  );
}

import type { Metadata } from "next";
import OpenQuestionsIndexClient from "./OpenQuestionsIndexClient";

export const metadata: Metadata = {
  title: "Open Questions — The Continuity Lab",
  description:
    "Index of unresolved research questions. Each entry links to its full framing.",
  alternates: { canonical: "https://www.myshape.com/research/open-questions" },
  openGraph: {
    title: "Open Questions — The Continuity Lab",
    description: "Index of unresolved research questions.",
    url: "https://www.myshape.com/research/open-questions",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Questions — The Continuity Lab",
    description: "Index of unresolved research questions.",
    images: ["/og-image.png"],
  },
};

export default function OpenQuestionsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://www.myshape.com/research/open-questions/#webpage",
            url: "https://www.myshape.com/research/open-questions",
            name: "Open Questions — The Continuity Lab",
            description: "Index of unresolved research questions.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://www.myshape.com/#website",
              name: "The Continuity Lab",
              url: "https://www.myshape.com",
            },
          }),
        }}
      />
      <OpenQuestionsIndexClient />
    </>
  );
}

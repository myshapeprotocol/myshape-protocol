import type { Metadata } from "next";
import NotesIndexClient from "./NotesIndexClient";

export const metadata: Metadata = {
  title: "Research Notes — The Continuity Lab",
  description:
    "Index of every published research artifact: research notes, specifications and research records, each linking to its full text.",
  alternates: { canonical: "https://www.myshape.com/research/notes" },
  openGraph: {
    title: "Research Notes — The Continuity Lab",
    description:
      "Index of every published research artifact: research notes, specifications and research records.",
    url: "https://www.myshape.com/research/notes",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Notes — The Continuity Lab",
    description:
      "Index of every published research artifact: research notes, specifications and research records.",
    images: ["/og-image.png"],
  },
};

export default function NotesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://www.myshape.com/research/notes/#webpage",
            url: "https://www.myshape.com/research/notes",
            name: "Research Notes — The Continuity Lab",
            description:
              "Index of every published research artifact: research notes, specifications and research records.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://www.myshape.com/#website",
              name: "The Continuity Lab",
              url: "https://www.myshape.com",
            },
          }),
        }}
      />
      <NotesIndexClient />
    </>
  );
}

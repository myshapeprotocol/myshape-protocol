import type { Metadata } from "next";
import AgendaClient from "./AgendaClient";

export const metadata: Metadata = {
  title: "Research Agenda — The Continuity Lab",
  description:
    "The Continuity Research Agenda: four open questions driving our investigation into whether continuity can become a verifiable property of the digital world.",
  alternates: { canonical: "https://thecontinuitylab.org/research/agenda" },
  openGraph: {
    title: "Research Agenda — The Continuity Lab",
    description:
      "Four open questions. One research program. Investigating verifiable continuity in the digital world.",
    url: "https://thecontinuitylab.org/research/agenda",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Lab — Research Agenda",
    description:
      "We do not defend hypotheses. We design experiments that can falsify them.",
    images: ["/og-image.png"],
  },
};

export default function AgendaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://thecontinuitylab.org/research/agenda/#webpage",
            url: "https://thecontinuitylab.org/research/agenda",
            name: "Research Agenda — The Continuity Lab",
            description:
              "The Continuity Research Agenda: open questions, active investigations, and the experimental program driving our work on verifiable continuity.",
            isPartOf: {
              "@type": "WebSite",
              "@id": "https://thecontinuitylab.org/#website",
              name: "The Continuity Lab",
              url: "https://thecontinuitylab.org",
            },
            about: {
              "@type": "Thing",
              name: "Continuity Research",
              description:
                "Investigating whether continuity can become a verifiable property of the digital world — from biological measurement to protocol primitives.",
            },
          }),
        }}
      />
      <AgendaClient />
    </>
  );
}

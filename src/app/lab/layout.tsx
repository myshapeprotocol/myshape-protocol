import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Continuity Lab™ — Researching Continuity as a Verifiable Property",
  description:
    "An open research group studying whether continuity can become a verifiable property of the digital world. RFC-0001, RFC-0002, 576 experimental runs. All research published openly.",
  openGraph: {
    title: "The Continuity Lab™ — Researching Continuity as a Verifiable Property",
    description:
      "Open protocol research: Motion Signature Format, Continuity Proof Format, 576 experiments. All data public.",
    url: "https://thecontinuitylab.org",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Lab™",
    description: "Researching continuity as a verifiable property of the digital world.",
  },
  robots: { index: true, follow: true },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ResearchOrganization",
            name: "The Continuity Lab",
            url: "https://thecontinuitylab.org",
            description:
              "Researching continuity as a verifiable property of the digital world.",
            foundingDate: "2026",
            knowsAbout: [
              "Continuity Verification",
              "Motion Signature",
              "Cross-Modal Binding",
              "Presence Detection",
              "Protocol Standards",
            ],
            sameAs: [
              "https://github.com/myshapeprotocol",
              "https://huggingface.co/TheContinuityLab",
              "https://www.myshape.com",
            ],
          }),
        }}
      />
      {children}
    </>
  );
}

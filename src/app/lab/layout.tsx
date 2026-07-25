import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Continuity Lab™ — What is Continuity?",
  description:
    "An open research group studying one question: can continuity — the unbroken chain of entity persistence across time — be made a verifiable property of digital existence? CPS-0001, RFCs, 576 experimental runs. All research published openly.",
  openGraph: {
    title: "The Continuity Lab™ — What is Continuity?",
    description:
      "The internet has protocols for identity, data, and value — but no protocol for proving you are still you across time. The Continuity Lab is building one.",
    url: "https://thecontinuitylab.org",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Lab™",
    description: "What is continuity? Can it be made a verifiable property of digital existence?",
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

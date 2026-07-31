import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

// Prevent static generation — force dynamic render to avoid Vercel CDN staleness
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyShape Protocol — The Sovereign 3D Identity Layer for the Decentralized Human",
  description:
    "AI-native identity. Zero-knowledge presence. Motion-signature verification. From signals to trust — explore the Continuity Layer through live PES demo, constellation research, diagnostic console, declassified evidence dossier, and sonar open questions. Built by The Continuity Lab.",
  keywords: [
    "MyShape Protocol",
    "continuity layer",
    "motion-signature verification",
    "AI-native identity",
    "zero-knowledge presence",
    "sovereign identity",
    "presence entropy score",
    "CPS-0001",
    "continuity proof",
    "decentralized identity",
    "proof of continuity",
    "motion biometrics alternative",
    "The Continuity Lab",
  ],
  alternates: { canonical: "https://www.myshape.com" },
  openGraph: {
    title: "MyShape Protocol — Motion-Signature Continuity Verification",
    description:
      "AI can generate faces, voices, identities. But can it maintain continuous presence? MyShape investigates continuity — the one thing AI cannot forge. Live PES engine. Open protocol. Research-driven.",
    url: "https://www.myshape.com",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — Motion-Signature Continuity Verification",
    description:
      "AI can generate everything. But can it maintain continuous presence? MyShape investigates the one thing AI cannot forge.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return (
    <>
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com"
        questions={[
          {
            question: "What is MyShape Protocol?",
            answer:
              "MyShape Protocol is an open research framework investigating whether digital continuity can become a verifiable property. It analyzes motion patterns through motion-signature technology — a zero-knowledge approach that verifies continuous presence without storing personal visual data or any personally identifiable information.",
          },
          {
            question: "How is MyShape different from static identity systems?",
            answer:
              "Static identity systems store fixed attributes that, once compromised, can never be replaced. MyShape verifies dynamic presence — the way an entity moves — rather than static attributes. Motion is generative and inexhaustible: each verification is a fresh cryptographic proof that cannot be replayed or stolen. No physical identity data is ever stored or transmitted.",
          },
          {
            question: "What is the Genesis Cohort?",
            answer:
              "The Genesis Cohort is the inaugural group of 100 sovereign identity nodes that serve as the protocol's root entropy source. Limited to the first 100 human entities who complete the Genesis Ritual, these founding nodes constitute the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. This is a permanent tier — never offered again.",
          },
          {
            question: "Can AI agents use MyShape Protocol?",
            answer:
              "Yes. MyShape is designed for the Agent Economy where human and AI identities coexist. AI agents can declare their identity through the Agent Registration protocol and participate in the identity mesh. However, maintaining a convincing continuous presence over time requires sustained physical interaction — creating a cost asymmetry that makes prolonged impersonation practically infeasible.",
          },
        ]}
      />
      {/* Speakable — voice search eligibility for Google Assistant / Alexa */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://www.myshape.com/#webpage",
            url: "https://www.myshape.com",
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: ["h1", ".hero-demo-tagline"],
            },
          }),
        }}
      />
      <HomeClient />
    </>
  );
}

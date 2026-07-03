import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

export const metadata: Metadata = {
  title: "MyShape — The Continuity Layer for the Simulation Age",
  description:
    "Identity tells us who you claim to be. Continuity tells us that you are still you. Motion → Identity Vector → Continuity Proof. The decentralized protocol for verifiable digital continuity in the Agent Economy.",
  keywords: [
    "MyShape Protocol",
    "continuity layer",
    "identity protocol",
    "motion-signature",
    "AI-native identity",
    "zero-knowledge presence",
    "sovereign identity",
    "decentralized identity",
  ],
  alternates: { canonical: "https://www.myshape.com" },
  openGraph: {
    title: "MyShape Protocol — The Continuity Layer for the Simulation Age",
    description:
      "In a world where AI can generate everything — what proves that you continue to exist? MyShape verifies continuity, not identity. Motion-Signature proofs for persistent digital subjects.",
    url: "https://www.myshape.com",
    siteName: "MyShape Protocol",
    images: [{ url: "/identity-sigil.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — The Continuity Layer for the Simulation Age",
    description:
      "Identity is a snapshot. Continuity is a trajectory. MyShape makes digital continuity verifiable.",
    images: ["/identity-sigil.jpg"],
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
              "MyShape Protocol is the sovereign 3D identity layer for the decentralized human. It transforms human motion into verifiable presence through motion-signature technology — a zero-knowledge protocol that proves you are a continuously present human without storing biometric data, facial recognition, or any personally identifiable information.",
          },
          {
            question: "How is MyShape different from biometric identity systems?",
            answer:
              "Biometric systems (fingerprints, face recognition, iris scans) store static biological signatures that, once compromised, can never be replaced. MyShape verifies dynamic presence — the way you move — rather than static attributes. Motion is generative and inexhaustible: each verification is a fresh cryptographic proof that cannot be replayed or stolen. No biometric data is ever stored or transmitted.",
          },
          {
            question: "What is the Genesis Cohort?",
            answer:
              "The Genesis Cohort is the inaugural group of 100 sovereign identity nodes that serve as the protocol's root entropy source. Limited to the first 100 human entities who complete the Genesis Ritual, these founding nodes constitute the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. This is a permanent tier — never offered again.",
          },
          {
            question: "Can AI agents use MyShape Protocol?",
            answer:
              "Yes. MyShape is designed for the Agent Economy where human and AI identities coexist. AI agents can declare their identity through the Agent Registration protocol and participate in the identity mesh. However, AI agents cannot falsify a human motion-signature due to the mathematically provable entropy gap between biological and synthetic motion — ensuring that human presence remains cryptographically distinct from AI simulation.",
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

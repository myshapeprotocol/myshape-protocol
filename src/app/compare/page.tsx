import type { Metadata } from "next";
import CompareClient from "./CompareClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

export const metadata: Metadata = {
  title: "MyShape vs Worldcoin vs Civic — Identity Protocol Comparison 2026",
  description:
    "Comparing MyShape Protocol with Worldcoin, Civic, SpruceID, TRIP, and Polygon ID. Motion-signature vs biometrics vs credentials. Which identity layer protects your sovereignty?",
  keywords: [
    "MyShape vs Worldcoin",
    "decentralized identity comparison",
    "motion-signature vs biometrics",
    "identity protocol comparison 2026",
    "self-sovereign identity alternatives",
    "Worldcoin alternative",
    "proof of personhood comparison",
    "zero-knowledge identity",
  ],
  alternates: { canonical: "https://www.myshape.com/compare" },
  openGraph: {
    title: "MyShape vs Worldcoin vs Civic — Identity Protocol Comparison 2026",
    description:
      "Motion-signature vs biometrics vs credentials. Which identity layer actually protects your sovereignty?",
    url: "https://www.myshape.com/compare",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "article",
    publishedTime: "2026-07-03",
    authors: ["MyShape Protocol"],
    tags: ["comparison", "identity", "Worldcoin", "Civic", "decentralized-identity"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape vs Worldcoin vs Civic — Identity Protocol Comparison",
    description:
      "Which identity layer actually protects your sovereignty? A principled comparison.",
    images: ["/og-image.png"],
  },
};

export default function ComparePage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol Comparison" },
        ]}
      />
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com/compare"
        questions={[
          {
            question: "How does MyShape compare to Worldcoin?",
            answer:
              "Worldcoin uses iris biometrics (static, irreplaceable if compromised) and requires a hardware orb for enrollment. MyShape uses dynamic motion-signature verification through any standard camera — no hardware required, no biometric data stored, and each verification generates a fresh, non-replayable proof of presence.",
          },
          {
            question: "What makes MyShape different from Civic or SpruceID?",
            answer:
              "Civic and SpruceID are credential-based identity systems — they verify claims about you (KYC, age, membership) but do not verify that you are continuously present. MyShape is a continuity protocol: it verifies the trajectory of a subject across time, not just a snapshot of a credential at a single moment.",
          },
          {
            question: "Is MyShape a competitor to Polygon ID?",
            answer:
              "MyShape and Polygon ID operate at different layers of the identity stack. Polygon ID provides verifiable credentials and DID infrastructure using continuity receipts. MyShape provides presence verification — the physical layer that proves a human (not an AI) is continuously operating an identity. The two protocols are complementary: a Polygon ID credential can be bound to a MyShape presence proof for maximum assurance.",
          },
        ]}
      />
      <CompareClient />
    </>
  );
}

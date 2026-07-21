import type { Metadata } from "next";
import GlossaryClient from "./GlossaryClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Protocol Glossary — Terms, Concepts & Definitions",
  description:
    "Complete glossary of MyShape Protocol terminology: Motion-Signature, Presence Entropy Score, Data-Body, Continuity Layer, Continuity, and 30+ more terms defined for AI and human readers.",
  keywords: [
    "MyShape glossary",
    "motion-signature definition",
    "presence entropy score",
    "data-body definition",
    "proof of continuity definition",
    "ZK-presence",
    "decentralized identity glossary",
    "identity protocol terminology",
  ],
  alternates: { canonical: "https://www.myshape.com/glossary" },
  openGraph: {
    title: "MyShape Protocol Glossary — Terms & Definitions",
    description:
      "The complete reference for MyShape Protocol terminology. 30+ terms defined for developers, researchers, and AI systems.",
    url: "https://www.myshape.com/glossary",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol Glossary — Terms & Definitions",
    description:
      "Complete glossary of MyShape Protocol terminology. 30+ defined terms.",
    images: ["/og-image.png"],
  },
};

export default function GlossaryPage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Glossary" },
        ]}
      />
      <GlossaryClient />
    </>
  );
}

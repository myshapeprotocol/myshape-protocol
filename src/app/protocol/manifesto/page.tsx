import type { Metadata } from "next";
import ProtocolManifesto from "./ProtocolManifestoClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Protocol Manifesto — The Human Stance",
  description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure, and the irreducible sovereignty of the human subject.",
  alternates: { canonical: "https://www.myshape.com/protocol/manifesto" },
  keywords: ["protocol manifesto", "sovereign identity", "human stance", "identity philosophy", "MyShape Protocol"],
  openGraph: {
    title: "MyShape Protocol Manifesto — The Human Stance",
    description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure.",
    url: "https://www.myshape.com/protocol/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol Manifesto — The Human Stance",
    description: "The MyShape Protocol manifesto — identity as a local construct, proof without exposure.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Protocol", href: "/protocol" },
          { name: "Manifesto" },
        ]}
      />
      <ProtocolManifesto />
    </>
  );
}

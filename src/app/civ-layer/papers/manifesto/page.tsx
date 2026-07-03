import type { Metadata } from "next";
import PapersManifesto from "./PapersManifesto";

export const metadata: Metadata = {
  title: "MyShape Research Manifesto — Motion as Identity",
  description:
    "Motion as the only irreducible human signal — the research foundation of MyShape Protocol.",
  alternates: { canonical: "https://www.myshape.com/papers/manifesto" },
  openGraph: {
    title: "MyShape Research Manifesto — Motion as Identity",
    description:
      "Motion as the only irreducible human signal — the research foundation of MyShape Protocol.",
    url: "https://www.myshape.com/papers/manifesto",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Research Manifesto — Motion as Identity",
    description:
      "Motion as the only irreducible human signal — the research foundation of MyShape Protocol.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <PapersManifesto />;
}

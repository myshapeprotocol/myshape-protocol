import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "MyShape PAPER_06 — MyShape Protocol Architecture",
  description:
    "The complete five-layer protocol architecture for the MyShape identity layer.",
  alternates: { canonical: "https://www.myshape.com/papers/protocol-architecture" },
  openGraph: {
    title: "MyShape PAPER_06 — MyShape Protocol Architecture",
    description:
      "The complete five-layer protocol architecture for the MyShape identity layer.",
    url: "https://www.myshape.com/papers/protocol-architecture",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape PAPER_06 — MyShape Protocol Architecture",
    description:
      "The complete five-layer protocol architecture for the MyShape identity layer.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  redirect("/papers/protocol-architecture");
}

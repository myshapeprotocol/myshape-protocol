import type { Metadata } from "next";
import CivGenesis from "./CivGenesisClient";

export const metadata: Metadata = {
  title: "MyShape Genesis — Protocol Origin",
  description:
    "The Genesis of MyShape Protocol — the foundational realization of geometric identity.",
  alternates: { canonical: "https://www.myshape.com/genesis" },
  openGraph: {
    title: "MyShape Genesis — Protocol Origin",
    description:
      "The Genesis of MyShape Protocol — the foundational realization of geometric identity.",
    url: "https://www.myshape.com/genesis",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Genesis — Protocol Origin",
    description:
      "The Genesis of MyShape Protocol — the foundational realization of geometric identity.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <CivGenesis />;
}

import type { Metadata } from "next";
import CivVision from "./CivVisionClient";

export const metadata: Metadata = {
  title: "MyShape Vision — The Future of Identity",
  description:
    "The MyShape vision for sovereign identity in the age of distributed intelligence.",
  alternates: { canonical: "https://www.myshape.com/vision" },
  openGraph: {
    title: "MyShape Vision — The Future of Identity",
    description:
      "The MyShape vision for sovereign identity in the age of distributed intelligence.",
    url: "https://www.myshape.com/vision",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Vision — The Future of Identity",
    description:
      "The MyShape vision for sovereign identity in the age of distributed intelligence.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <CivVision />;
}

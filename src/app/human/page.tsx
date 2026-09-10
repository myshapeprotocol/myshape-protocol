import type { Metadata } from "next";
import HumanClient from "./HumanClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Experience MyShape — Human",
  description:
    "Experience MyShape continuity verification. Full verification requires a mobile device with motion sensors.",
  keywords: [
    "MyShape",
    "continuity verification",
    "human",
    "experience",
    "motion sensors",
  ],
  alternates: { canonical: "https://www.myshape.com/human" },
  openGraph: {
    title: "Experience MyShape — Human",
    description:
      "Full continuity verification requires a mobile device with motion sensors.",
    url: "https://www.myshape.com/human",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Experience MyShape — Human",
    description:
      "Full continuity verification requires a mobile device with motion sensors.",
    images: ["/og-image.png"],
  },
};

export default function HumanPage() {
  return <HumanClient />;
}

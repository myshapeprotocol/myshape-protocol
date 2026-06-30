import type { Metadata } from "next";
import ApplyClient from "./ApplyClient";

export const metadata: Metadata = {
  title: "MyShape Genesis 100 — Continuity Research Program",
  description:
    "We are not looking for users. We are looking for the first 100 people who believe that digital continuity should be verifiable. Join the Continuity Research Program and become an Early Presence Pioneer.",
  openGraph: {
    title: "MyShape Genesis 100 — Continuity Research Program",
    description: "We are studying a fundamental question: Can digital continuity be verified? We are looking for the first 100 participants. No biometrics stored. No identity required.",
    url: "https://www.myshape.com/research/apply",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Genesis 100 — Continuity Research Program",
    description: "We are studying a fundamental question: Can digital continuity be verified?",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function ApplyPage() {
  return <ApplyClient />;
}

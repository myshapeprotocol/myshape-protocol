import type { Metadata } from "next";
import ApplyClient from "./ApplyClient";

export const metadata: Metadata = {
  title: "Join MyShape — Founding Tester Application",
  description:
    "Apply to become a founding tester of the MyShape Protocol. First 50 applicants receive Genesis Cohort status — a permanent protocol-level identity anchor. Help calibrate the motion-signature verification engine.",
  openGraph: {
    title: "MyShape Protocol — Founding Tester Recruitment",
    description: "First 50 applicants receive Genesis Cohort status — a permanent protocol-level identity anchor. Join the first 300 to calibrate the motion-signature verification engine.",
    url: "https://www.myshape.com/research/apply",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — Founding Tester Recruitment",
    description: "First 50 get Genesis Cohort status. Join the first 300 to calibrate the motion-signature verification engine.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export default function ApplyPage() {
  return <ApplyClient />;
}

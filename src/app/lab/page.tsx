import type { Metadata } from "next";
import LabClient from "@/components/lab/LabClient";

export const metadata: Metadata = {
  title: "The Continuity Lab — Open Research on Digital Continuity",
  description:
    "We test hypotheses. We do not defend them. An open research program investigating whether continuity can be made a verifiable property of digital existence. Founded by MyShape Protocol.",
  keywords: [
    "The Continuity Lab",
    "continuity research",
    "digital continuity",
    "presence entropy score",
    "CPS-0001",
    "motion-signature",
    "open research",
    "protocol research",
    "continuity proof",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.thecontinuitylab.org" },
  openGraph: {
    title: "The Continuity Lab — Open Research on Digital Continuity",
    description:
      "We test hypotheses. We do not defend them. Living research laboratory investigating whether continuity can be made a verifiable property of digital existence.",
    url: "https://www.thecontinuitylab.org",
    siteName: "The Continuity Lab",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Continuity Lab — Living Research on Digital Continuity",
    description:
      "We publish limitations before claims. We publish failures alongside successes. Evidence precedes belief.",
    images: ["/og-image.png"],
  },
};

export default function LabPage() {
  return <LabClient />;
}

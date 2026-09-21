import type { Metadata } from "next";
import ChallengeClient from "./ChallengeClient";

export const metadata: Metadata = {
  title: "Challenge BM-001 — The Continuity Lab",
  description:
    "If you believe the Presence Entropy Score fails under a specific condition, tell us. We will test it and publish the results.",
  alternates: { canonical: "https://thecontinuitylab.org/research/challenge" },
  openGraph: {
    title: "Challenge BM-001",
    description:
      "If you believe PES fails under a specific condition, tell us. We will test it.",
    url: "https://thecontinuitylab.org/research/challenge",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Challenge BM-001 — The Continuity Lab",
    description: "Tell us where PES fails. We will test it and publish the results.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ChallengeClient />;
}

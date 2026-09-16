import type { Metadata } from "next";
import CPS0001Client from "./CPS0001Client";

export const metadata: Metadata = {
  title: "CPS-0001 — Continuity Proof Protocol | The Continuity Lab",
  description:
    "CPS-0001 v1.0-RC1 — the Continuity Protocol Core: how continuity assertions are represented, exchanged, and cryptographically verified. Specification, verification contract, conformance, and research evidence.",
  alternates: { canonical: "https://thecontinuitylab.org/protocols/cps-0001" },
  openGraph: {
    title: "CPS-0001 — Continuity Proof Protocol",
    description:
      "The Continuity Protocol Core (v1.0-RC1): canonical semantics for continuity receipts — representation, exchange, and cryptographic verification. Published by The Continuity Lab.",
    url: "https://thecontinuitylab.org/protocols/cps-0001",
    siteName: "The Continuity Lab",
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "CPS-0001 — Continuity Protocol Core (v1.0-RC1)",
  description:
    "Canonical specification for Continuity Receipts: cryptographically verifiable statements that an observer collected sufficient evidence supporting the continuity of a subject over a bounded interval of time.",
  version: "1.0-RC1",
  url: "https://thecontinuitylab.org/protocols/cps-0001",
  publisher: {
    "@type": "Organization",
    name: "The Continuity Lab",
    url: "https://thecontinuitylab.org",
  },
};

export default function CPS0001Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <CPS0001Client />
    </>
  );
}

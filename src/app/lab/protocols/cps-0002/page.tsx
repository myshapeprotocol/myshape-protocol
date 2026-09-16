import type { Metadata } from "next";
import CPS0002Client from "./CPS0002Client";

export const metadata: Metadata = {
  title: "CPS-0002 — Human Signal Assertion | The Continuity Lab",
  description:
    "CPS-0002 cps-hsa-0.1-draft — a receipt-bound, attester-signed, evidence-digest-committed, expiry-bounded assertion layer built on the CPS-0001 Continuity Receipt. Protocol Core frozen; Trust Framework not frozen.",
  alternates: { canonical: "https://thecontinuitylab.org/protocols/cps-0002" },
  openGraph: {
    title: "CPS-0002 — Human Signal Assertion",
    description:
      "The CPS-0002 assertion layer (cps-hsa-0.1-draft): an independently verifiable attestation cryptographically bound to a CPS-0001 Continuity Receipt. Published by The Continuity Lab.",
    url: "https://thecontinuitylab.org/protocols/cps-0002",
    siteName: "The Continuity Lab",
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  name: "CPS-0002 — Human Signal Assertion (cps-hsa-0.1-draft)",
  description:
    "An assertion layer over the CPS-0001 Continuity Receipt: an attester-signed, receipt-bound, evidence-digest-committed, expiry-bounded statement. Verifiable to VALID/INVALID. Trust remains a separate policy and deployment decision.",
  version: "cps-hsa-0.1-draft",
  url: "https://thecontinuitylab.org/protocols/cps-0002",
  publisher: {
    "@type": "Organization",
    name: "The Continuity Lab",
    url: "https://thecontinuitylab.org",
  },
};

export default function CPS0002Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <CPS0002Client />
    </>
  );
}
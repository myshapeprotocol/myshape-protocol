import type { Metadata } from "next";
import ProtocolVerifyClient from "./ProtocolVerifyClient";

// LAB surface for VS-001. The canonical URL is the LAB *public* namespace:
// src/proxy.ts rewrites thecontinuitylab.org/research/* → /lab/research/*
// (the same pattern as /protocols/cps-0001 → /lab/protocols/cps-0001). The
// /lab/* namespace itself is internal and deliberately not a canonical URL
// (SITE FOUNDATION BATCH-001 §4/§9).
//
// The MyShape twin lives at src/app/research/protocol-verify — a separate
// surface with its own canonical (that host's listing is public/llms.txt).
//
// Engine ids are the published ones (EE-001/EE-002/EE-003, VS-001). "PE-001"
// was a stale identifier in the previous description and is not used here:
// VS-001 is EE-001 passive + EE-003 active challenge.
export const metadata: Metadata = {
  title: "VS-001 — Dual-Engine Verification Pipeline | The Continuity Lab",
  description:
    "VS-001: EE-001 passive observer + EE-003 active challenge. Two independent evidence engines operating in defense-in-depth formation. A verification-session research artifact — not a protocol guarantee.",
  alternates: { canonical: "https://thecontinuitylab.org/research/protocol-verify" },
  openGraph: {
    title: "VS-001 — Dual-Engine Verification Pipeline",
    description:
      "EE-001 passive observer + EE-003 active challenge. Verification-session research from The Continuity Lab. Research artifact — not a protocol guarantee.",
    url: "https://thecontinuitylab.org/research/protocol-verify",
    siteName: "The Continuity Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VS-001 — Dual-Engine Verification Pipeline",
    description:
      "EE-001 passive + EE-003 active challenge. Engine-independent verification research by The Continuity Lab.",
  },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ProtocolVerifyClient />;
}

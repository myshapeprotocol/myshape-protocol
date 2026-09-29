import type { Metadata } from "next";

// SITE FOUNDATION BATCH-001 — page-level canonical baseline.
// /verify is a client page; this layout carries its metadata only.
//
// MINIMUM-PATH BATCH A / P1-D — route meaning must match route function.
// This route performs a device motion / script check ("Physical Motion Check").
// It is NOT CPS-0001 receipt verification. The receipt verifier is /verify-receipt.
// The previous inherited title/description ("…Continuity Verification") described
// receipt verification and is corrected here. No page function is changed.
export const metadata: Metadata = {
  title: "Physical Motion Check — MyShape Protocol",
  description:
    "Device motion check: verifies that sensor data comes from a physically moving device rather than a replayed script. It is not identity verification and not CPS-0001 receipt verification — to verify a CPS-0001 Continuity Receipt, use /verify-receipt.",
  alternates: { canonical: "https://www.myshape.com/verify" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

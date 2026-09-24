import type { Metadata } from "next";

// PATCH #15 — route-specific metadata for a client page.
// /lab/contribute is a "use client" component, so its metadata lives here,
// following the existing pattern in app/verify/layout.tsx and
// app/verify-receipt/layout.tsx.
//
// Canonical is the LAB public URL: src/proxy.ts rewrites
// thecontinuitylab.org/contribute → /lab/contribute, and the page itself
// hands the mobile experiment off to that same URL (HANDOFF_URL), so the
// canonical and the QR handoff must stay in sync.
export const metadata: Metadata = {
  title: "Contribute Motion Data — The Continuity Lab",
  description:
    "Run the three-step motion capture experiment on your phone and contribute anonymous IMU samples to the open Continuity Dataset. This is research data collection — it reports what the collection engine observed, not a verification result.",
  alternates: { canonical: "https://thecontinuitylab.org/contribute" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

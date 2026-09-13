import type { Metadata } from "next";

// SITE FOUNDATION BATCH-001 — page-level canonical baseline.
// /verify is a client page; this layout carries its metadata only.
export const metadata: Metadata = {
  alternates: { canonical: "https://www.myshape.com/verify" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify CPS-0001 Receipt — MyShape Protocol",
  description:
    "Paste any CPS-0001 ContinuityReceipt to verify it against all seven protocol rules (V₁–V₇). Engine-independent — works with receipts from any CPS-0001 producer.",
  alternates: { canonical: "https://www.myshape.com/verify-receipt" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

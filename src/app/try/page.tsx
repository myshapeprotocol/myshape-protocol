import type { Metadata } from "next";
import TryClient from "@/components/try/TryClient";

export const metadata: Metadata = {
  title: "TRY MyShape — Continuity Verification",
  description:
    "A research preview. Verify continuity from your browser — pose and motion, on-device, no identity required.",
  alternates: { canonical: "https://www.myshape.com/try" },
};

export default function TryPage() {
  return <TryClient />;
}

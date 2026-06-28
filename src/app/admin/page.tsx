import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "MyShape — Calibration Control",
  description: "Engine calibration dashboard — monitor research data collection and trigger PCA/ROC calibration.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}

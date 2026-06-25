import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "MyShape Dashboard — Sovereign Identity Hub",
  description: "Your Genesis identity control panel. Track scan count, orbital particle tier, data contribution, and sovereign node status.",
  openGraph: {
    title: "MyShape Dashboard — Sovereign Identity Hub",
    description: "Track your Genesis identity, scan history, and particle tier on MyShape Protocol.",
    url: "https://www.myshape.com/dashboard",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}

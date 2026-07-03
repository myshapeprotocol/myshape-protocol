import type { Metadata } from "next";
import NewsletterClient from "./NewsletterClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Protocol Newsletter — Signal Subscription",
  description: "Subscribe to the MyShape Protocol newsletter for technical deep-dives on sovereign identity, motion-signature verification, zero-knowledge presence, and the Agent Economy.",
  keywords: ["MyShape newsletter", "identity protocol updates", "motion-signature research", "ZK-presence news", "proof of continuity updates"],
  alternates: { canonical: "https://www.myshape.com/newsletter" },
  openGraph: {
    title: "MyShape Protocol Newsletter — Signal Subscription",
    description: "Technical deep-dives on sovereign identity and the Agent Economy. No spam. Pure signal.",
    url: "https://www.myshape.com/newsletter",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "MyShape Protocol Newsletter", description: "Signal, not noise. Subscribe for protocol updates.", images: ["/og-image.png"] },
};

export default function NewsletterPage() {
  return (
    <>
      <BreadcrumbList items={[{ name: "Home", href: "/" }, { name: "Newsletter" }]} />
      <NewsletterClient />
    </>
  );
}

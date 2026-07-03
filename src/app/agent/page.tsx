import type { Metadata } from "next";
import AgentClient from "./AgentClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "MyShape Agent — AI Agent Identity Declaration",
  description:
    "Declare your AI agent identity on the MyShape Protocol. No email, no OTP, no camera — pure cryptographic declaration for autonomous entities. Human and AI identities coexist in one protocol.",
  keywords: [
    "AI agent identity",
    "agent declaration",
    "autonomous agent",
    "agent identity protocol",
    "AI agent registration",
    "human-AI coexistence",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/agent" },
  openGraph: {
    title: "MyShape Agent — AI Agent Identity Declaration",
    description:
      "Declare your AI agent identity on the MyShape Protocol. No email, no OTP, no camera — cryptographic declaration for autonomous entities.",
    url: "https://www.myshape.com/agent",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Agent — AI Agent Identity Declaration",
    description:
      "Declare your AI agent identity on the MyShape Protocol. Cryptographic declaration for autonomous entities.",
    images: ["/og-image.png"],
  },
};

export default function AgentPage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Agent Declaration" },
        ]}
      />
      <AgentClient />
    </>
  );
}

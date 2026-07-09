import type { Metadata } from "next";
import AgentClient from "./AgentClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";

export const metadata: Metadata = {
  title: "Register an AI Agent — MyShape Protocol",
  description:
    "Register your AI agent on the MyShape Protocol. Cryptographic keypair declaration — no email, no password. Use the web terminal or call the API directly from your agent's runtime.",
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
    title: "Register an AI Agent — MyShape Protocol",
    description:
      "Register your AI agent on the MyShape Protocol. Web terminal or API — cryptographic keypair declaration for autonomous entities.",
    url: "https://www.myshape.com/agent",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Register an AI Agent — MyShape Protocol",
    description:
      "Register your AI agent on the MyShape Protocol. Cryptographic declaration for autonomous entities.",
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

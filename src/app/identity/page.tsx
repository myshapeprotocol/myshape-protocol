// /app/identity/page.tsx  ← Server Component (NO "use client")

import IdentityClient from "./IdentityClient";

/* -----------------------------------------
   Identity Page SEO Metadata
------------------------------------------ */
export const metadata = {
  title: "MyShape Identity — AI-Native Data-Body Initialization",
  description:
    "Initialize your AI-native identity through the MyShape Identity Layer. A kinetic, zero-knowledge, non-biometric activation that forms your sovereign Data-Body.",
  openGraph: {
    title: "MyShape Identity — Data-Body Initialization",
    description:
      "The Identity Layer transforms your presence into a sovereign Data-Body. Begin the AI-native identity formation ritual.",
    url: "https://www.myshape.com/identity",
    siteName: "MyShape Protocol",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Identity — Begin Your Data-Body",
    description:
      "Form your AI-native identity through a kinetic, zero-knowledge activation ritual. The future of identity begins with movement.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <IdentityClient />;
}

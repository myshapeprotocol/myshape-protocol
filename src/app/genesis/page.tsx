import GenesisClient from "./GenesisClient";

export const metadata = {
  title: "MyShape Genesis — Identity Initialization Ritual",
  description:
    "The Genesis Ritual transforms your presence into a sovereign Data-Body. Begin the AI-native identity initialization process through a non-biometric kinetic activation.",
  openGraph: {
    title: "MyShape Genesis — Identity Initialization Ritual",
    description:
      "Experience the Genesis Ritual: a non-biometric activation that generates your sovereign Data-Body for the AI-native era.",
    url: "https://www.myshape.com/genesis",
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
    title: "MyShape Genesis — Begin Your Data-Body",
    description:
      "Initialize your AI-native identity through the Genesis Ritual. A kinetic, zero-knowledge activation for the post-human era.",
    images: ["/og-image.png"],
  },
};

export default function GenesisPage() {
  return <GenesisClient />;
}

import type { Metadata } from "next";
import HandshakeClient from "./HandshakeClient";

export const metadata: Metadata = {
  title: "Node Handshake — MyShape Protocol",
  description:
    "Initialize your sovereign protocol node. Generate your node_token and node_handle through the MyShape Protocol handshake ritual. AI-native identity, zero-knowledge presence, motion-signature verification.",
  alternates: { canonical: "https://www.myshape.com/handshake" },
  openGraph: {
    title: "Node Handshake — MyShape Protocol",
    description:
      "Initialize your sovereign protocol node. AI-native identity layer for the decentralized human.",
    url: "https://www.myshape.com/handshake",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Node Handshake — MyShape Protocol",
    description:
      "Initialize your sovereign protocol node. AI-native identity layer for the decentralized human.",
    images: ["/og-image.png"],
  },
};

export default function HandshakePage() {
  return <HandshakeClient />;
}

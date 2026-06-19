import VisionClient from "./VisionClient";

export const metadata = {
  title: "MyShape Vision — Identity Beyond Surveillance",
  description:
    "Explore the MyShape Vision: AI-native identity, spatial sovereignty, and data permanence. A future where digital presence becomes sovereign, private, and human-aligned.",
  openGraph: {
    title: "MyShape Vision — The Future of Identity",
    description:
      "MyShape envisions a world where identity is sovereign, private, and AI-native. Discover the pillars of the future identity protocol.",
    url: "https://www.myshape.com/vision",
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
    title: "MyShape Vision — Identity Beyond Surveillance",
    description:
      "The future of identity is movement, sovereignty, and AI-native presence. Explore the MyShape Vision.",
    images: ["/og-image.png"],
  },
};

export default function VisionPage() {
  return <VisionClient />;
}

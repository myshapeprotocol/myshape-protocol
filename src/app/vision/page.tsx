import VisionClient from "./VisionClient";

export const metadata = {
  title: "MyShape Vision — The Continuity Layer for the Simulation Age",
  description:
    "Identity tells us who you claim to be. Continuity tells us that you are still you. MyShape is the first protocol to make digital continuity verifiable — the missing layer between AI agents and sovereign human subjects.",
  openGraph: {
    title: "MyShape Vision — The Continuity Layer for the Simulation Age",
    description:
      "In a world where AI can generate your face, voice, and behavior — what proves that you continue to exist? MyShape answers with verifiable continuity: the protocol that makes digital presence unforgeable.",
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
    title: "MyShape Vision — The Continuity Layer for the Simulation Age",
    description:
      "Identity is a snapshot. Continuity is a trajectory. MyShape makes digital continuity verifiable — the missing primitive for the Agent Economy.",
    images: ["/og-image.png"],
  },
};

export default function VisionPage() {
  return <VisionClient />;
}

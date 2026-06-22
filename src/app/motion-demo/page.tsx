import type { Metadata } from "next";
import MotionDemoClient from "./MotionDemoClient";

export const metadata: Metadata = {
  title: "MyShape Motion Demo — Live Presence Entropy Score",
  description:
    "Real-time PES engine via webcam. Motion Vector → SST 18-pt → 4D Entropy → ZK-Proof. Firefox recommended.",
  openGraph: {
    title: "MyShape Motion Demo — Live Presence Entropy Score",
    description: "Real-time PES engine via webcam. Firefox recommended.",
    url: "https://www.myshape.com/motion-demo",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Motion Demo — Live Presence Entropy Score",
    description: "Real-time PES engine via webcam. Firefox recommended.",
    images: ["/og-image.png"],
  },
};

export default function MotionDemoPage() {
  return <MotionDemoClient />;
}

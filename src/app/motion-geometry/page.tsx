import type { Metadata } from "next";
import MotionGeometryClient from "./MotionGeometryClient";

export const metadata: Metadata = {
  title: "MyShape Motion Geometry — Visual Pipeline Demo",
  description: "Visual demonstration of the Motion Geometry pipeline: camera capture → Skeleton Topology → 4D Entropy Scoring → Motion Signature vector. See how human motion becomes cryptographic identity.",
  openGraph: {
    title: "MyShape Motion Geometry — Visual Pipeline Demo",
    description: "See how human motion becomes cryptographic identity — visual demonstration of the 5-step pipeline.",
    url: "https://www.myshape.com/motion-geometry",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
};

export default function MotionGeometryPage() {
  return <MotionGeometryClient />;
}

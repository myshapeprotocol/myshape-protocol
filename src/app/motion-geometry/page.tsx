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
  twitter: {
    card: "summary_large_image",
    title: "MyShape Motion Geometry — Visual Pipeline Demo",
    description: "See how human motion becomes cryptographic identity — visual demonstration of the 5-step pipeline.",
    images: ["/og-image.png"],
  },
};

export default function MotionGeometryPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "WebPage",
        "@id": "https://www.myshape.com/motion-geometry/#webpage",
        url: "https://www.myshape.com/motion-geometry",
        name: "MyShape Motion Geometry — Visual Pipeline Demo",
        description: "Visual demonstration of the Motion Geometry pipeline: camera capture → Skeleton Topology → 4D Entropy Scoring → Motion Signature vector.",
        isPartOf: { "@type": "WebSite", "@id": "https://www.myshape.com/#website", name: "MyShape Protocol", url: "https://www.myshape.com" },
      }) }} />
      <MotionGeometryClient />
    </>
  );
}

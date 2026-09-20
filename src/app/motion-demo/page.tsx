import type { Metadata } from "next";
import MotionDemoClient from "./MotionDemoClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

// Prevent static generation — force dynamic render to avoid Vercel CDN staleness
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MyShape Motion Demo — Live Motion-Signature Research Preview",
  description:
    "Experimental Presence Entropy Score engine via webcam. Research preview — continuity signal verification.",
  keywords: [
    "motion demo",
    "presence entropy score",
    "PES demo",
    "continuity research",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/motion-demo" },
  openGraph: {
    title: "MyShape Motion Demo — Research Preview",
    description:
      "Experimental continuity signal verification via webcam. Research preview.",
    url: "https://www.myshape.com/motion-demo",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Motion Demo — Research Preview",
    description: "Experimental continuity signal verification via webcam.",
    images: ["/og-image.png"],
  },
};

export default function MotionDemoPage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Motion Demo" },
        ]}
      />
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com/motion-demo"
        questions={[
          {
            question: "How does the MyShape Motion Demo work?",
            answer:
              "The Motion Demo captures your real-time movement through your webcam, extracts 33 body landmarks using MediaPipe Pose, transforms them into MyShape's 18-point SST topology, and calculates your Presence Entropy Score — all on-device. No video or images are transmitted. With your explicit consent, derived landmark data (33 body points per frame) may be uploaded for research calibration. This is optional and separate from the local verification flow.",
          },
          {
            question: "What does the Presence Entropy Score (PES) mean?",
            answer:
              "The PES is a 0-100 score that quantifies the biological entropy in your motion. A higher score indicates stronger biological entropy characteristics — the micro-timing variance, physiological tremor, and motor noise that are typically present in human motion. This is a research preview and not a production identity verification system.",
          },
          {
            question: "Is my webcam data stored or sent anywhere?",
            answer:
              "The Motion Demo runs primarily on-device. Your camera feed is processed locally by MediaPipe Pose and the MyShape engine to compute a Presence Entropy Score. No video or images are transmitted. With your explicit consent, derived landmark data (33 body points per frame) may be uploaded for research calibration. This is optional and separate from the local verification flow.",
          },
          {
            question: "Can I run the Motion Demo on mobile?",
            answer:
              "Yes. The Motion Demo works on any device with a camera and a modern browser. Firefox is recommended for optimal performance. Safari requires explicit camera permission. This is a research preview and may not work perfectly on all devices.",
          },
          {
            question: "Can AI-generated video fool the Motion Demo?",
            answer:
              "The PES engine analyzes entropy characteristics (micro-timing variance, noise residual, frequency entropy, biological perturbation) that are typically present in biological motion and absent from AI-generated motion. Research results show strong separation, but this is a research preview and not a production guarantee. No verification system is immune to all forms of spoofing.",
          },
        ]}
      />
      <MotionDemoClient />
      <div style={{textAlign:"center",padding:8,color:"rgba(255,255,255,0.15)",fontSize:10,fontFamily:"monospace"}}>
        deploy: 2026-07-12 · commit 9b05ecf
      </div>
    </>
  );
}

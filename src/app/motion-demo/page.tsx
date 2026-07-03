import type { Metadata } from "next";
import MotionDemoClient from "./MotionDemoClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import FaqJsonLd from "@/components/seo/FaqJsonLd";

export const metadata: Metadata = {
  title: "MyShape Motion Demo — Live Motion-Signature Verification",
  description:
    "Real-time Presence Entropy Score engine via webcam. Watch your motion become a cryptographic identity — AI cannot forge the human kinetic signature. Motion Vector → SST 18-pt → 4D Entropy → ZK-Presence Proof.",
  keywords: [
    "motion demo",
    "motion-signature verification",
    "presence entropy score",
    "PES demo",
    "live identity verification",
    "ZK-presence demo",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/motion-demo" },
  openGraph: {
    title: "MyShape Motion Demo — Live Motion-Signature Verification",
    description:
      "Watch your motion become a cryptographic identity. Real-time PES engine — AI cannot forge human kinetics.",
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
              "The Motion Demo captures your real-time movement through your webcam, extracts 33 body landmarks using MediaPipe Pose, transforms them into MyShape's 18-point SST topology, computes a 128-dimensional motion vector across four feature groups (kinematics, acceleration, jerk, jerk spectrum), and calculates your Presence Entropy Score — all on-device. No video or motion data is ever uploaded to any server.",
          },
          {
            question: "What does the Presence Entropy Score (PES) mean?",
            answer:
              "The PES is a 0-100 score that quantifies the biological entropy in your motion. A score above 70 indicates strong biological entropy characteristics — the micro-timing variance, physiological tremor, and motor noise that are present in all human motion and absent in all AI-generated motion. The PES is not a measure of 'how well you move' — it is a measure of 'how biologically irreducible your movement is.'",
          },
          {
            question: "Is my webcam data stored or sent anywhere?",
            answer:
              "No. The Motion Demo runs entirely on-device. The camera feed is processed locally by MediaPipe Pose and the MyShape WASM engine. No video, no images, no pose data, and no motion vectors are transmitted to any server. The only data that could optionally be sent is an anonymous ZK-Presence proof — but only if you explicitly choose to register a Genesis Node after the demo.",
          },
          {
            question: "Can I run the Motion Demo on mobile?",
            answer:
              "Yes. The Motion Demo works on any device with a camera and a modern browser — desktop, laptop, tablet, or smartphone. Firefox is recommended for optimal performance. Safari requires explicit camera permission. The WASM engine is optimized for mobile processors and completes PES computation in under 500ms on modern smartphone hardware.",
          },
          {
            question: "Can AI-generated video fool the Motion Demo?",
            answer:
              "No. The PES engine analyzes four-dimensional entropy characteristics (micro-timing variance, noise residual, frequency entropy, biological perturbation) that are present in biological motion but fundamentally absent from AI-generated motion. This is not a heuristic — it is a mathematical consequence of three hard limits: the Nyquist limit on temporal resolution, depth ambiguity in 2D-to-3D reconstruction, and the deterministic noise floor of generative models. AI motion consistently scores below 20 PES. Human motion consistently scores above 70 PES.",
          },
        ]}
      />
      <MotionDemoClient />
    </>
  );
}

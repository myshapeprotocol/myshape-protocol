import type { Metadata } from "next";
import GenesisClient from "./GenesisClient";
import FaqJsonLd from "@/components/seo/FaqJsonLd";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import HowToJsonLd from "@/components/seo/HowToJsonLd";

export const metadata: Metadata = {
  title: "MyShape Genesis — Identity Initialization Ritual",
  description:
    "The Genesis Ritual transforms your presence into a sovereign Data-Body. Begin the AI-native identity initialization process through a non-corporeal kinetic activation.",
  keywords: [
    "genesis ritual",
    "identity initialization",
    "data-body",
    "AI-native identity",
    "kinetic activation",
    "zero-knowledge presence",
    "motion-signature",
    "MyShape Protocol",
  ],
  alternates: { canonical: "https://www.myshape.com/genesis" },
  openGraph: {
    title: "MyShape Genesis — Identity Initialization Ritual",
    description:
      "Experience the Genesis Ritual: a non-corporeal activation that generates your sovereign Data-Body for the AI-native era.",
    url: "https://www.myshape.com/genesis",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
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
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Genesis Ritual" },
        ]}
      />
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com/genesis"
        questions={[
          {
            question: "What is the MyShape Genesis Ritual?",
            answer:
              "The Genesis Ritual is the identity initialization process that transforms your unique motion-signature into a sovereign Data-Body — a decentralized, non-corporeal digital identity that cannot be forged, revoked, or controlled by any centralized platform.",
          },
          {
            question: "How does motion-signature verification work?",
            answer:
              "MyShape captures your real-time 3D pose sequence through a standard camera and extracts a 128-dimensional motion vector across four independent feature groups: kinematics, acceleration, jerk, and jerk spectrum. The Presence Entropy Score (PES) mathematically verifies the biological origin of the motion — AI cannot simulate the micro-timing variance, physiological tremor, and noise residual present in human movement.",
          },
          {
            question: "Is my biometric data stored on a server?",
            answer:
              "No. MyShape is a zero-knowledge protocol. Your raw motion data never leaves your device. Only cryptographic proofs of presence are transmitted to the network. The protocol verifies that you are human without ever seeing your face, body, or any personally identifiable biometric information.",
          },
          {
            question: "What is the Genesis Cohort?",
            answer:
              "The Genesis Cohort is the inaugural group of 100 sovereign identity nodes that serve as the protocol's root entropy source — the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. This is a permanent tier limited to the first 100 human entities and will never be offered again.",
          },
          {
            question: "How is MyShape different from biometric identity systems?",
            answer:
              "Biometric systems (fingerprints, face recognition, iris scans) store static biological signatures that, once compromised, can never be replaced. MyShape verifies dynamic presence — the way you move — rather than static attributes. Motion is generative and inexhaustible: each verification is a fresh signature that cannot be replayed or stolen.",
          },
          {
            question: "Can AI agents participate in MyShape?",
            answer:
              "Yes. MyShape is designed for the Agent Economy where human and AI identities coexist. AI agents can declare their identity through the Agent Registration protocol and participate in the identity mesh, but they cannot falsify a human motion-signature due to the irreducible entropy gap between biological and synthetic motion.",
          },
        ]}
      />
      <HowToJsonLd
        name="MyShape Genesis Ritual"
        description="Initialize your sovereign Data-Body through motion-signature verification. A non-corporeal, zero-knowledge activation that transforms your presence into a verifiable identity primitive."
        totalTime="PT10M"
        tool={["Webcam", "Modern Browser (Firefox recommended)", "Email Access"]}
        steps={[
          {
            name: "Enter Your Email",
            text: "Provide your email address to begin the Genesis initialization. A 6-digit OTP will be sent to verify your communication channel. Your email is used only for protocol communication and is never shared.",
          },
          {
            name: "Verify Your OTP",
            text: "Enter the 6-digit one-time password sent to your email. This establishes your first verified communication channel within the protocol mesh.",
          },
          {
            name: "Choose Your Node Handle",
            text: "Select a unique node_handle — your sovereign protocol identifier. This handle is permanent and represents your Data-Body in the identity mesh.",
          },
          {
            name: "Complete the Halo Scan",
            text: "Perform the guided circular motion sequence in front of your camera. The Halo Scan captures your full upper-body kinematic range, exposing the biological entropy characteristics — micro-timing variance, physiological tremor, motor unit recruitment patterns — that distinguish your motion from AI-generated simulation.",
          },
          {
            name: "PES Computation & ZK Proof Generation",
            text: "The Presence Entropy Score engine computes your motion signature across four dimensions (kinematics, acceleration, jerk, jerk spectrum). A zero-knowledge proof is generated on-device, proving 'PES > threshold' without revealing your raw motion data. The proof (~250 bytes) is transmitted to the protocol network.",
          },
          {
            name: "Node Activation",
            text: "Upon successful PES verification, your node transitions to GENESIS_NODE status. Your Data-Body is now a sovereign identity primitive in the MyShape Protocol — verifiable, portable, and controlled entirely by you. Welcome to the Genesis Cohort.",
          },
        ]}
      />
      <GenesisClient />
    </>
  );
}

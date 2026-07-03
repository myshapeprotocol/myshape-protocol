import type { Metadata } from "next";
import DevelopersClient from "./DevelopersClient";
import BreadcrumbList from "@/components/seo/BreadcrumbList";
import FaqJsonLd from "@/components/seo/FaqJsonLd";
import SoftwareAppJsonLd from "@/components/seo/SoftwareAppJsonLd";

export const metadata: Metadata = {
  title: "MyShape Developers — Build with Motion-Signature Identity",
  description:
    "Integrate sovereign identity verification into any application. Five lines of code. Zero data stored. Real human presence — AI-native identity protocol SDK and API reference.",
  keywords: [
    "identity API",
    "motion-signature SDK",
    "developer documentation",
    "identity verification API",
    "ZK-presence integration",
    "protocol SDK",
    "MyShape developers",
  ],
  alternates: { canonical: "https://www.myshape.com/developers" },
  openGraph: {
    title: "MyShape Developers — Build with Motion-Signature Identity",
    description:
      "Integrate sovereign identity verification. Five lines of code. Zero data stored. Real human presence.",
    url: "https://www.myshape.com/developers",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Developers — API Reference",
    description:
      "Read-only API for querying MyShape Protocol node identity and network statistics.",
    images: ["/og-image.png"],
  },
};

export default function DevelopersPage() {
  return (
    <>
      <BreadcrumbList
        items={[
          { name: "Home", href: "/" },
          { name: "Developers" },
        ]}
      />
      <FaqJsonLd
        mainEntityUrl="https://www.myshape.com/developers"
        questions={[
          {
            question: "How do I integrate MyShape identity verification into my app?",
            answer:
              "MyShape provides a read-only API for querying protocol node identity and network statistics. The motion-signature verification runs entirely on-device via the MyShape WASM engine. Integration requires five lines of code: import the SDK, initialize with your API key, call the verification endpoint, receive the ZK proof, and validate on your backend. Full SDK documentation and API reference are available on this page.",
          },
          {
            question: "What programming languages does the MyShape SDK support?",
            answer:
              "The MyShape SDK currently supports TypeScript/JavaScript (Node.js and browser) as the primary target. The core verification engine is compiled to WASM, making it portable to any language that can execute WebAssembly — including Python (via wasmtime), Rust, Go, and Java. REST API endpoints are language-agnostic.",
          },
          {
            question: "Is the MyShape Protocol open source?",
            answer:
              "Yes. The core protocol specification, the WASM verification engine, and the SDK are open source under the MyShape Protocol License. The SST topology, motion vector format, and PES algorithm are fully documented in the technical specification. The reference implementation is available on GitHub at github.com/myshapeprotocol.",
          },
          {
            question: "How do I verify a ZK-Presence proof on my backend?",
            answer:
              "Each ZK-Presence proof (~250 bytes) can be verified in under 10ms using the verification key published in the protocol specification. The proof asserts: 'PES > threshold AND motion was captured within the last 5 seconds AND the motion exhibits biological entropy characteristics.' Your backend receives the proof, runs the verification algorithm, and receives a binary valid/invalid response — no motion data, no biometric data, no PII.",
          },
        ]}
      />
      <SoftwareAppJsonLd
        name="MyShape Protocol SDK"
        description="Integrate sovereign identity verification into any application. Motion-signature verification engine, ZK-Presence proof validation, and protocol node API — all open source."
        applicationCategory="DeveloperApplication"
        operatingSystem="Web, Node.js, WASM"
        offersPrice="0"
      />
      <DevelopersClient />
    </>
  );
}

import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "MyShape Contact — Connect Nodes",
  description: "Establish a secure uplink with the MyShape Protocol team for partnerships and integration.",
  openGraph: {
    title: "MyShape Contact — Connect Nodes",
    description: "Establish a secure uplink with the MyShape Protocol team for partnerships and integration.",
    url: "https://www.myshape.com/contact",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Contact — Connect Nodes",
    description: "Establish a secure uplink with the MyShape Protocol team for partnerships and integration.",
    images: ["/og-image.png"],
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "ContactPage",
        "@id": "https://www.myshape.com/contact/#webpage",
        url: "https://www.myshape.com/contact",
        name: "MyShape Contact — Connect Nodes",
        description: "Establish a secure uplink with the MyShape Protocol team for partnerships and integration.",
        isPartOf: { "@type": "WebSite", "@id": "https://www.myshape.com/#website", name: "MyShape Protocol", url: "https://www.myshape.com" },
      }) }} />
      <ContactClient />
    </>
  );
}

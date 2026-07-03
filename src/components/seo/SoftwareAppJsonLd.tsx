/**
 * SoftwareAppJsonLd — Server Component
 *
 * Renders Schema.org SoftwareApplication structured data for developer tool pages.
 * Helps Google understand this is a software product with an API.
 *
 * Usage in page.tsx (Server Component):
 *
 *   <SoftwareAppJsonLd
 *     name="MyShape Protocol SDK"
 *     description="Integrate sovereign identity verification into any application."
 *     applicationCategory="DeveloperApplication"
 *     operatingSystem="Web"
 *     offersPrice="0"
 *   />
 */

interface SoftwareAppJsonLdProps {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offersPrice?: string; // "0" for free
  url?: string;
}

export default function SoftwareAppJsonLd({
  name,
  description,
  applicationCategory = "DeveloperApplication",
  operatingSystem = "Web",
  offersPrice = "0",
  url = "https://www.myshape.com/developers",
}: SoftwareAppJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory,
    operatingSystem,
    url,
    offers: {
      "@type": "Offer",
      price: offersPrice,
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      "@id": "https://www.myshape.com/#organization",
      name: "MyShape Protocol",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

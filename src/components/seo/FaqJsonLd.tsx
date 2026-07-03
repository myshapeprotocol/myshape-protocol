/**
 * FaqJsonLd — Server Component
 *
 * Renders Schema.org FAQPage structured data for:
 * - Traditional SEO: Google FAQ rich results (expandable Q&A in SERPs)
 * - GEO: AI Overviews / ChatGPT frequently cite FAQ content verbatim
 *
 * Usage in page.tsx (Server Component):
 *
 *   <FaqJsonLd
 *     questions={[
 *       { question: "What is MyShape Protocol?", answer: "MyShape is..." },
 *       { question: "How does motion-signature work?", answer: "..." },
 *     ]}
 *   />
 */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqJsonLdProps {
  questions: FaqItem[];
  /** Optional: URL of the page containing the FAQ */
  mainEntityUrl?: string;
}

export default function FaqJsonLd({
  questions,
  mainEntityUrl,
}: FaqJsonLdProps) {
  if (questions.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    ...(mainEntityUrl && {
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": mainEntityUrl,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

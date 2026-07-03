/**
 * ArticleJsonLd — Server Component
 *
 * Renders Schema.org Article (BlogPosting) structured data for:
 * - Traditional SEO: Google rich results, "Top stories" eligibility
 * - GEO: AI crawlers (GPTBot, Claude-Web) use Article schema to cite content
 *
 * Usage: Import in any page.tsx (Server Component) and render alongside the
 * client component.
 *
 *   <ArticleJsonLd
 *     headline="Why Identity Is Not Enough"
 *     description="Identity proves existence. Continuity proves evolution."
 *     url="https://www.myshape.com/blog/..."
 *     datePublished="2026-07-02"
 *     authorName="MyShape Protocol"
 *   />
 */

export interface ArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  imageUrl?: string;
  /** Defaults to "BlogPosting". Use "Article" for papers, "TechArticle" for specs. */
  articleType?: "BlogPosting" | "Article" | "TechArticle";
  tags?: string[];
}

export default function ArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName = "MyShape Protocol",
  authorUrl = "https://www.myshape.com",
  imageUrl = "https://www.myshape.com/og-image.png",
  articleType = "BlogPosting",
  tags,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": articleType,
    headline,
    description,
    url,
    datePublished,
    ...(dateModified && { dateModified }),
    author: {
      "@type": "Organization",
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.myshape.com/#organization",
      name: "MyShape Protocol",
    },
    image: imageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(tags && tags.length > 0 && { keywords: tags.join(", ") }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

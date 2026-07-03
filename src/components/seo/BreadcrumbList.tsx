/**
 * BreadcrumbList — Server Component
 *
 * Renders Schema.org BreadcrumbList structured data for:
 * - Traditional SEO: Google breadcrumb rich results in SERPs
 * - GEO: AI crawlers use breadcrumbs to understand page hierarchy
 * - UX: Optional visual breadcrumb rendering
 *
 * Usage in page.tsx (Server Component):
 *
 *   <BreadcrumbList
 *     items={[
 *       { name: "Home", href: "/" },
 *       { name: "Blog", href: "/blog" },
 *       { name: "Why Identity Is Not Enough" },
 *     ]}
 *   />
 *
 * The last item should typically omit `href` (it's the current page).
 */

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbListProps {
  items: BreadcrumbItem[];
  /** Set to true to render a visual breadcrumb bar alongside the JSON-LD */
  showVisual?: boolean;
}

export default function BreadcrumbList({
  items,
  showVisual = false,
}: BreadcrumbListProps) {
  if (items.length === 0) return null;

  const baseUrl = "https://www.myshape.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href && { item: `${baseUrl}${item.href}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {showVisual && (
        <nav aria-label="Breadcrumb" className="text-white/30 text-[9px] tracking-[0.2em] uppercase font-mono py-4 px-4 md:px-6 max-w-3xl mx-auto">
          <ol className="flex flex-wrap items-center gap-1.5">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-white/10">/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-[#90c8ff]/60 transition-colors"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className="text-[#90c8ff]/50">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </>
  );
}

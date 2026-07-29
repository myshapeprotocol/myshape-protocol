import "./globals.css";
import "@/styles/animations.css";
import React from "react";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans, GeistMono } from "geist/font";
import PageTransition from "@/components/transition/PageTransition";
import ScrollTop from "@/components/ui/ScrollTop";
import HeroVisualLoader from "@/components/hero/HeroVisualLoader";
import SearchDialog from "@/components/search/SearchDialog";

/* -------------------------------
   全站 SEO metadata（首页 · myshape.com 默认）
   注：thecontinuitylab.org 在组件内动态覆写
-------------------------------- */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  metadataBase: new URL("https://www.myshape.com"),
  title: "MyShape Protocol — CPS-0001 · Engine-Independent Continuity Verification",
  description:
    "CPS-0001 defines the Continuity Receipt — an open protocol object for verifying that sensor evidence is continuous, unbroken, and untampered. Engine-independent. Implementation-agnostic. Research by The Continuity Lab.",
  icons: {
    icon: [
      { url: "/identity-sigil.jpg", sizes: "256x256", type: "image/jpeg" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
  },
  openGraph: {
    title: "MyShape Protocol — CPS-0001 · Engine-Independent Continuity Verification",
    description:
      "CPS-0001 defines the Continuity Receipt — an open protocol object for verifiable continuity assertions. Engine-independent. Implementation-agnostic.",
    url: "https://www.myshape.com",
    siteName: "MyShape Protocol",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — CPS-0001 · Engine-Independent Continuity Verification",
    description:
      "CPS-0001 defines the Continuity Receipt — an open protocol object for verifiable continuity assertions.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isContinuityLab = host.includes("thecontinuitylab");

  const seo = isContinuityLab
    ? {
        title: "The Continuity Lab — Open Research on Continuity Infrastructure",
        description:
          "Independent research lab studying continuity as a verifiable property of the digital world. Home of CPS-0001, the engine-independent Continuity Receipt protocol. We publish limitations before we publish claims.",
        ogTitle: "The Continuity Lab — Open Research on Continuity Infrastructure",
        ogDescription:
          "Independent research lab studying continuity as a verifiable property. CPS-0001 · Forgery Cost framework · 576 experiments · 4 engines. All data open.",
        ogUrl: "https://thecontinuitylab.org",
        ogSiteName: "The Continuity Lab",
        canonical: "https://thecontinuitylab.org",
      }
    : {
        title: "MyShape Protocol — CPS-0001 · Engine-Independent Continuity Verification",
        description:
          "CPS-0001 defines the Continuity Receipt — an open protocol object for verifying that sensor evidence is continuous, unbroken, and untampered. Engine-independent. Implementation-agnostic. Research by The Continuity Lab.",
        ogTitle: "MyShape Protocol — CPS-0001 · Engine-Independent Continuity Verification",
        ogDescription:
          "CPS-0001 defines the Continuity Receipt — an open protocol object for verifiable continuity assertions. Engine-independent. Implementation-agnostic.",
        ogUrl: "https://www.myshape.com",
        ogSiteName: "MyShape Protocol",
        canonical: "https://www.myshape.com",
      };

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Domain-aware SEO override */}
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <link rel="canonical" href={seo.canonical} />
        <meta property="og:title" content={seo.ogTitle} />
        <meta property="og:description" content={seo.ogDescription} />
        <meta property="og:url" content={seo.ogUrl} />
        <meta property="og:site_name" content={seo.ogSiteName} />

        {/* Performance: preconnect to critical origins */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://vwqytyipwzazxdtbnzne.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />

        {/* Performance: preload critical font */}
        <link rel="preload" href="/_next/static/media/geist-sans-*.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#02040a" />

        {/* -------------------------------
            Schema.org 结构化数据 — 传统 SEO + GEO 双优化

            若访问 thecontinuitylab.org：注入 ResearchOrganization
            否则（myshape.com）：注入 Organization + WebSite + DefinedTerm
        -------------------------------- */}
        {isContinuityLab ? (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "ResearchOrganization",
                  "@id": "https://thecontinuitylab.org/#organization",
                  "name": "The Continuity Lab",
                  "url": "https://thecontinuitylab.org",
                  "description": "Independent research lab studying continuity as a verifiable property of the digital world. Home of CPS-0001, the engine-independent Continuity Receipt protocol. We publish limitations before we publish claims.",
                  "foundingDate": "2026",
                  "parentOrganization": {
                    "@type": "Organization",
                    "name": "MyShape Protocol",
                    "url": "https://www.myshape.com",
                  },
                  "sameAs": [
                    "https://github.com/myshapeprotocol",
                    "https://x.com/myshapeprotocol",
                    "https://huggingface.co/ContinuityLab-Org",
                  ],
                  "knowsAbout": [
                    "Continuity Proof",
                    "Continuity Receipt",
                    "CPS-0001",
                    "Forgery Cost Framework",
                    "Presence Entropy Score",
                    "Cross-Modal Binding",
                    "Motion-Signature Verification",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://thecontinuitylab.org/#website",
                  "url": "https://thecontinuitylab.org",
                  "name": "The Continuity Lab",
                  "description": "Independent research lab. Open protocol, open data, open questions.",
                  "publisher": { "@id": "https://thecontinuitylab.org/#organization" },
                  "inLanguage": "en-US",
                },
              ],
            })}
          </script>
        ) : (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.myshape.com/#organization",
                  "name": "MyShape Protocol",
                  "alternateName": "MYSHAPE PROTOCOL",
                  "url": "https://www.myshape.com",
                  "description": "The Sovereign 3D Identity Layer for the Decentralized Human. An AI-native identity protocol built on ethereal data energy, wireframe anatomy, and non-binary aesthetic — enabling zero-knowledge, cross-platform identity through motion-signature verification.",
                  "foundingDate": "2026",
                  "logo": "https://www.myshape.com/identity-sigil.jpg",
                  "sameAs": [
                    "https://x.com/myshapeprotocol",
                    "https://github.com/myshapeprotocol",
                    "https://discord.gg/zr8Tczard",
                  ],
                  "knowsAbout": [
                    "AI-Native Identity",
                    "Zero-Knowledge Presence",
                    "Motion-Signature Verification",
                    "Presence Entropy Score",
                    "Sovereign Data-Body",
                    "Ethereal Data Energy",
                    "Non-Binary Aesthetic",
                    "Genesis Cohort",
                  ],
                },
                {
                  "@type": "ResearchOrganization",
                  "@id": "https://thecontinuitylab.org/#organization",
                  "name": "The Continuity Lab",
                  "url": "https://thecontinuitylab.org",
                  "description": "Independent research arm of MyShape Protocol. Studying continuity as a verifiable property.",
                  "parentOrganization": { "@id": "https://www.myshape.com/#organization" },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.myshape.com/#website",
                  "url": "https://www.myshape.com",
                  "name": "MyShape Protocol",
                  "description": "The Sovereign 3D Identity Layer for the Decentralized Human.",
                  "publisher": { "@id": "https://www.myshape.com/#organization" },
                  "inLanguage": "en-US",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.myshape.com/search?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "DefinedTermSet",
                  "@id": "https://www.myshape.com/#defined-terms",
                  "name": "MyShape Protocol Core Concepts",
                  "description": "The foundational terminology defining the MyShape Protocol identity layer, motion-signature verification system, and sovereign data-body architecture.",
                  "hasDefinedTerm": [
                    {
                      "@type": "DefinedTerm",
                      "name": "Motion-Signature",
                      "description": "A 128-dimensional vector extracted from real-time 3D pose sequences across four independent feature groups. The irreducible gap between human biological motion and AI-generated synthetic motion is detectable via the entropy gap theorem.",
                      "url": "https://www.myshape.com/protocol/motion-pipeline",
                    },
                    {
                      "@type": "DefinedTerm",
                      "name": "Sovereign Data-Body",
                      "description": "A decentralized, non-corporeal digital identity representation controlled solely by the user, visualized as dynamic ethereal particle geometry.",
                      "url": "https://www.myshape.com/identity",
                    },
                    {
                      "@type": "DefinedTerm",
                      "name": "Presence Entropy Score (PES)",
                      "description": "A 4-dimensional biological noise analysis engine that distinguishes human sensor data from synthetic simulation. Cohen's d = 2.1, AUC = 0.94.",
                      "url": "https://www.myshape.com/motion-demo",
                    },
                    {
                      "@type": "DefinedTerm",
                      "name": "Continuity Receipt",
                      "description": "An engine-independent cryptographic object (CPS-0001) that proves continuous presence over time. Ed25519-signed, SHA-256 hash-chained.",
                      "url": "https://www.myshape.com/research/notes/008-continuity-protocol-core",
                    },
                  ],
                },
              ],
            })}
          </script>
        )}

      </head>

      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          padding: 0,
          overflowX: "clip",
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 背景视觉层 — 星空墙 */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <HeroVisualLoader showCore={false} />
        </div>


        {/* Page content */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", flex: 1 }}>
          {children}
        </div>
        <SearchDialog />
        <Analytics />
        <ScrollTop />
      </body>
    </html>
  );
}

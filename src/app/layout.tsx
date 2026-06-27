import "./globals.css";
import "@/styles/animations.css";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans, GeistMono } from "geist/font";
import PageTransition from "@/components/transition/PageTransition";
import ScrollTop from "@/components/ui/ScrollTop";
import HeroVisualLoader from "@/components/hero/HeroVisualLoader";

/* -------------------------------
   全站 SEO metadata（首页）
-------------------------------- */
export const metadata = {
  metadataBase: new URL("https://www.myshape.com"),
  title: "MyShape Protocol — Presence is the New Identity",
  description:
    "The identity layer for the simulation age. MyShape transforms human motion into verifiable presence — sovereign, zero-knowledge, cross-platform. Human and AI identities coexist in one protocol.",
  openGraph: {
    title: "MyShape Protocol — Presence is the New Identity",
    description:
      "The identity layer for the simulation age. Motion-signature verification, particle aesthetics, and zero-knowledge sovereignty. Human and AI identities coexist in one protocol.",
    url: "https://www.myshape.com",
    siteName: "MyShape Protocol",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyShape Protocol — Presence is the New Identity",
    description:
      "The identity layer for the simulation age. Motion-signature verification, zero-knowledge presence, sovereign identity.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>

        {/* -------------------------------
            Schema.org 结构化数据 — 传统 SEO + GEO 双优化

            三类实体：
            1. Organization  → 品牌实体，供 AI 建立知识图谱
            2. WebSite       → 站点定义，供搜索引擎理解站点结构
            3. DefinedTerm   → 核心概念定义，供 AI 精准引用

            全链接触发器关键词：The Sovereign 3D Identity Layer,
            AI-native identity, ethereal data energy, wireframe anatomy,
            non-binary aesthetic, motion-signature, zero-knowledge presence.
        -------------------------------- */}
        <script type="application/ld+json">
          {`
          {
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
                  "https://discord.gg/zr8Tczard"
                ],
                "knowsAbout": [
                  "AI-Native Identity",
                  "Zero-Knowledge Presence",
                  "Motion-Signature Verification",
                  "Presence Entropy Score",
                  "Sovereign Data-Body",
                  "Ethereal Data Energy",
                  "Non-Binary Aesthetic",
                  "Genesis Cohort"
                ]
              },
              {
                "@type": "WebSite",
                "@id": "https://www.myshape.com/#website",
                "url": "https://www.myshape.com",
                "name": "MyShape Protocol",
                "description": "The Sovereign 3D Identity Layer for the Decentralized Human.",
                "publisher": {
                  "@id": "https://www.myshape.com/#organization"
                },
                "inLanguage": "en-US",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://www.myshape.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
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
                    "description": "MyShape's proprietary kinetic verification protocol that AI cannot simulate. A 128-dimensional vector extracted from real-time 3D pose sequences across four independent feature groups — kinematics, acceleration, jerk, and jerk spectrum. The irreducible gap between human biological motion and AI-generated synthetic motion is mathematically provable via the Nyquist limit, depth ambiguity, and entropy gap theorem.",
                    "url": "https://www.myshape.com/protocol/motion-pipeline"
                  },
                  {
                    "@type": "DefinedTerm",
                    "name": "Sovereign Data-Body",
                    "description": "A decentralized, non-corporeal digital identity representation controlled solely by the user. Constructed from motion-signature data and visualized as dynamic ethereal particle geometry — a sovereign identity primitive that no centralized platform can revoke, alter, or claim ownership of.",
                    "url": "https://www.myshape.com/identity"
                  },
                  {
                    "@type": "DefinedTerm",
                    "name": "Presence-Engine (PES)",
                    "description": "The core engine that validates identity through real-time motion and kinetic rhythm. The Presence Entropy Score quantifies the depth of biological entropy in a motion sample across four dimensions: micro-timing variance, noise residual, frequency entropy, and biological perturbation — producing a single verifiable score that distinguishes human presence from synthetic simulation.",
                    "url": "https://www.myshape.com/motion-demo"
                  },
                  {
                    "@type": "DefinedTerm",
                    "name": "Non-Binary Aesthetic",
                    "description": "A design philosophy prioritizing data-stream-composed visuals over gendered or warm-toned human traits. MyShape's visual language rejects biological signifiers in favor of wireframe anatomy, particle fields, and ethereal data energy — creating an identity representation that belongs to no gender, no ethnicity, and no physical archetype.",
                    "url": "https://www.myshape.com/identity"
                  },
                  {
                    "@type": "DefinedTerm",
                    "name": "Ethereal Data Energy",
                    "description": "The visual manifestation of identity primitives represented by light, particles, and wireframe geometry. The MyShape particle field is not decorative — it is the direct visual encoding of the 128-dimensional Motion Signature vector, where each particle's position, velocity, and luminosity correspond to specific kinematic features of the user's unique motion profile.",
                    "url": "https://www.myshape.com"
                  },
                  {
                    "@type": "DefinedTerm",
                    "name": "Genesis Cohort",
                    "description": "The inaugural group of sovereign identity nodes initialized during the MyShape Protocol launch phase. Limited to the first 100 human entities to complete the Genesis Ritual and achieve GENESIS_NODE status. These founding nodes constitute the protocol's root entropy source — the cryptographic trust anchor from which all subsequent identity verifications derive their statistical significance. Permanent tier. Never offered again.",
                    "url": "https://www.myshape.com/genesis"
                  }
                ]
              }
            ]
          }
          `}
        </script>

      </head>

      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          padding: 0,
          overflowX: "hidden",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 背景视觉层 — 星空墙 */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
          <HeroVisualLoader showCore={false} />
        </div>

        {/* 页面内容 */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", flex: 1 }}>
          {children}
        </div>
        <Analytics />
        <PageTransition />
        <ScrollTop />
      </body>
    </html>
  );
}

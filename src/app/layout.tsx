import "./globals.css";
import "@/styles/animations.css";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans, GeistMono } from "geist/font";
import HeroVisual from "@/components/hero/HeroVisual";
import PageTransition from "@/components/transition/PageTransition";
import ScrollTop from "@/components/ui/ScrollTop";

/* -------------------------------
   全站 SEO metadata（首页）
-------------------------------- */
export const metadata = {
  metadataBase: new URL("https://www.myshape.com"),
  title: "MyShape Protocol — AI-Native Identity for the Post-Human Era",
  description:
    "MyShape is the identity protocol for the AI-native era. A particle-based data-body system enabling sovereign, zero-knowledge, cross-platform identity. Body is data. Data is sovereignty.",
  openGraph: {
    title: "MyShape Protocol — Identity for the AI-Native Future",
    description:
      "A new identity standard built on data-body architecture, halo scan, particle aesthetics, and zero-knowledge sovereignty. Enter the Genesis era.",
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
    title: "MyShape Protocol — AI-Native Identity",
    description:
      "A particle-based identity protocol for the AI-native era. Presence is data. Data is sovereignty.",
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
                  "https://x.com"
                ],
                "knowsAbout": [
                  "AI-Native Identity",
                  "Zero-Knowledge Presence",
                  "Motion-Signature Authentication",
                  "Decentralized Identity Mesh",
                  "3D Sovereign Identity Layer",
                  "Ethereal Data Energy",
                  "Non-Corporeal Kinetic Verification"
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
                "@type": "DefinedTerm",
                "name": "Data-Body",
                "description": "A particle-based, non-corporeal identity representation for the AI-native era. Constructed from motion-signature data, visualized as ethereal particle geometry without physical or gendered attributes.",
                "url": "https://www.myshape.com/identity",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "Particle Body",
                "description": "The visual manifestation of the Data-Body using dynamic particle fields. A pure data-energy structure devoid of biological form or physical attributes — embodying the non-binary aesthetic of MyShape.",
                "url": "https://www.myshape.com/identity",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "Halo Scan",
                "description": "A non-corporeal, non-contact scanning layer that activates or updates the Data-Body through kinetic motion analysis. Employs circular deep-sense halo scan technology without capturing physical identifiers.",
                "url": "https://www.myshape.com/identity",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "Energy Field",
                "description": "The ambient identity layer representing trust, state, and presence in the AI-native environment. An ethereal data-energy aura that communicates sovereignty without revealing identity.",
                "url": "https://www.myshape.com/identity",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "Genesis Ritual",
                "description": "The initialization sequence that activates a sovereign Data-Body. A non-corporeal, kinetic activation establishing the user's first link to the decentralized identity mesh through motion-signature verification.",
                "url": "https://www.myshape.com/genesis",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "AI-Native Identity",
                "description": "An identity architecture designed for interoperability across AI systems, agents, and generative environments. Not a static representation, but a sovereign, verifiable data-body that traverses platforms without losing integrity.",
                "url": "https://www.myshape.com/identity",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              },
              {
                "@type": "DefinedTerm",
                "name": "Zero-Knowledge Presence",
                "description": "Cryptographic proof of presence that verifies existence without revealing identity, physical identifiers, or personal data. The core privacy primitive of the MyShape Protocol identity layer.",
                "url": "https://www.myshape.com/protocol/zk",
                "inDefinedTermSet": {
                  "@id": "https://www.myshape.com/#organization"
                }
              }
            ]
          }
          `}
        </script>

        {/* Mediapipe 注入 */}
        <script 
          src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" 
          type="text/javascript"
        ></script>

      </head>

      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#02040a",
          overflowX: "hidden",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 背景视觉层 */}
        <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}>
          <HeroVisual showCore={false} />
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

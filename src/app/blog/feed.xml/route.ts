import { type NextRequest } from "next/server";
import { POSTS } from "@/app/blog/posts";

/**
 * RSS 2.0 Feed for MyShape Protocol Blog
 *
 * Served at /blog/feed.xml
 * - Traditional SEO: RSS discovery for feed readers, Google News
 * - GEO: AI crawlers (GPTBot, Claude-Web) consume RSS for content indexing
 */

const BASE_URL = "https://www.myshape.com";
const SITE_TITLE = "MyShape Protocol — Protocol Log";
const SITE_DESCRIPTION =
  "Technical essays on sovereign identity, presence verification, and the protocol layer for verifiable digital continuity.";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateRss(): string {
  const items = POSTS.map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}${post.slug}</guid>
      <description>${escapeXml(post.subtitle)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>protocol@myshape.com (MyShape Protocol)</author>
      ${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>MyShape Protocol — Next.js App Router</generator>
    <image>
      <url>${BASE_URL}/og-image.png</url>
      <title>${escapeXml(SITE_TITLE)}</title>
      <link>${BASE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>`;
}

export async function GET(_request: NextRequest): Promise<Response> {
  const rss = generateRss();
  return new Response(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      // Allow cross-origin access for feed readers
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ISR: regenerate at most once per hour
export const revalidate = 3600;

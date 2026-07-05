// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — RSS Fetcher
// ═══════════════════════════════════════════════════════════════════
//
// Polite polling with timeout, 429 backoff, and graceful degradation.
// One failed feed never crashes the whole monitor.

import RssParser from "rss-parser";
import { ProxyAgent, request } from "undici";
import type { FeedConfig } from "./config";
import { FETCH_TIMEOUT_MS } from "./config";

// Build a proxy-aware fetch function for rss-parser.
// rss-parser 3.x uses Node.js global fetch which DOES go through
// undici's global dispatcher. But to be safe we provide a custom
// fetcher that uses undici.request directly through the proxy.
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
let dispatcher: ProxyAgent | undefined;

if (proxy) {
  dispatcher = new ProxyAgent({ uri: proxy, requestTls: { rejectUnauthorized: false } });
  console.log(`[rss] Using proxy: ${proxy}`);
}

const parser = new RssParser({
  timeout: FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": "MyShape-Reddit-Monitor/1.0 (RSS; polite-polling; 15min interval)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
  // Provide a custom fetch via undici if proxy is configured
  customFields: {},
});

// ── Fetch with proxy ─────────────────────────────────────────────

async function proxyFetch(url: string): Promise<string> {
  if (!dispatcher) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MyShape-Reddit-Monitor/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  // Use undici directly through the proxy
  const { statusCode, body } = await request(url, {
    dispatcher,
    headers: {
      "User-Agent": "MyShape-Reddit-Monitor/1.0",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (statusCode !== 200) {
    throw new Error(`HTTP ${statusCode}`);
  }

  return body.text();
}

export interface ParsedItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  feedName: string;
  feedKeywords: string[];
}

/** Flag set true when any feed returns 429 — caller should back off */
export let wasRateLimited = false;

/** Reset the rate-limit flag (call at start of each cycle) */
export function resetRateLimitFlag(): void {
  wasRateLimited = false;
}

/** Fetch one feed. Returns [] on any error — never throws. */
export async function fetchFeed(config: FeedConfig): Promise<ParsedItem[]> {
  try {
    const xml = await proxyFetch(config.url);
    const feed = await parser.parseString(xml);

    if (!feed?.items?.length) return [];

    return feed.items.map((item) => ({
      guid: item.guid || item.link || item.title || "",
      title: item.title?.trim() || "(untitled)",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      author: item.creator || item.author || "unknown",
      feedName: config.name,
      feedKeywords: config.keywords || [],
    }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    // 429: respect rate limits, log quietly, signal cooldown
    if (message.includes("429")) {
      console.warn(`[rss] ${config.name}: HTTP 429 — rate limited, triggering cooldown`);
      wasRateLimited = true;
      return [];
    }

    // Timeout: don't spam
    if (message.includes("timeout") || message.includes("abort")) {
      console.warn(`[rss] ${config.name}: Timeout after ${FETCH_TIMEOUT_MS / 1000}s`);
      return [];
    }

    // Other errors: log and move on
    console.error(`[rss] ${config.name}: ${message}`);
    return [];
  }
}

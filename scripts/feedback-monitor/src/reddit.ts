// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — Reddit Mention Search
// ═══════════════════════════════════════════════════════════════════
//
// Uses Reddit's public search RSS to find posts mentioning MyShape.
// This covers r/all, not just our configured subreddits.

import RssParser from "rss-parser";
import { ProxyAgent, request } from "undici";
import { SEARCH_KEYWORDS, TITLE_FILTER, PROXY_URI } from "./config";

export interface RedditMention {
  guid: string;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  subreddit: string;
}

let dispatcher: ProxyAgent | undefined;
if (PROXY_URI) {
  dispatcher = new ProxyAgent({ uri: PROXY_URI, requestTls: { rejectUnauthorized: false } });
}

async function proxyFetch(url: string): Promise<string> {
  if (!dispatcher) {
    const res = await fetch(url, {
      headers: { "User-Agent": "MyShape-Monitor/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  const { statusCode, body } = await request(url, {
    dispatcher,
    headers: { "User-Agent": "MyShape-Monitor/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (statusCode !== 200) throw new Error(`HTTP ${statusCode}`);
  return body.text();
}

export async function searchReddit(since: Date): Promise<RedditMention[]> {
  const all: RedditMention[] = [];
  const seen = new Set<string>();

  const parser = new RssParser({
    timeout: 10_000,
    headers: { "User-Agent": "MyShape-Monitor/1.0" },
  });

  // Search specific keywords — Reddit RSS rate-limits aggressively
  for (const kw of SEARCH_KEYWORDS.slice(0, 3)) {
    try {
      const url = `https://www.reddit.com/search.rss?q=${encodeURIComponent(kw)}&sort=new&restrict_sr=off`;
      const xml = await proxyFetch(url);
      const feed = await parser.parseString(xml);

      for (const item of feed.items || []) {
        const guid = item.guid || item.link || "";
        if (!guid || seen.has(guid)) continue;
        seen.add(guid);

        const pubDate = new Date(item.pubDate || "");
        if (pubDate < since) continue;

        // Extract subreddit from URL: /r/subreddit/comments/...
        const subMatch = item.link?.match(/\/r\/([^/]+)\//);
        const subreddit = subMatch?.[1] || "unknown";

        all.push({
          guid,
          title: item.title?.trim() || "(untitled)",
          link: item.link || "",
          author: item.creator || item.author || "unknown",
          pubDate: (item.pubDate || item.isoDate || new Date().toISOString()),
          subreddit,
        });
      }
    } catch (err) {
      console.error(`[reddit] search "${kw}":`, err instanceof Error ? err.message : err);
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }

  // Post-filter: only keep items with relevant titles
  // Also exclude known false-positive subreddits/authors
  const NOISE_SUBS = ["TikTokDocQuackORNot", "backtickbot", "BeatsNRhymes", "alphabetfriends", "FitnessDE", "powerpoint", "TrackMania", "adventofcode", "cpp_questions", "excel", "vba", "haskell", "StanleyMOV"];
  const NOISE_AUTHORS = ["myshapetimes", "Myshap"];

  const filtered = all.filter((item) => {
    if (NOISE_SUBS.includes(item.subreddit)) return false;
    if (NOISE_AUTHORS.some((a) => item.author.toLowerCase().includes(a.toLowerCase()))) return false;

    const text = `${item.title} ${item.subreddit}`.toLowerCase();
    return TITLE_FILTER.some((kw) => text.includes(kw.toLowerCase()));
  });

  console.log(`[reddit] ${filtered.length} relevant (${all.length} raw)`);
  return filtered;
}

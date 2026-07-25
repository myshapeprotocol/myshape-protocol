// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — Discord Formatter
// ═══════════════════════════════════════════════════════════════════

import { getDiscordWebhookUrl } from "./config";
import type { HnMatch } from "./hn";
import type { GitHubEvent, GitHubStats } from "./github";

const ROLE_PING = ""; // Set to "<@&ROLE_ID>" to ping a Discord role

interface Embed {
  title: string;
  url?: string;
  description: string;
  color: number;
  timestamp?: string;
  footer?: { text: string };
  author?: { name: string; icon_url?: string };
}

const COLORS = {
  hn: 0xff6600,       // HN orange
  github: 0x6e40c9,   // GitHub purple
  reddit: 0xff4500,    // Reddit orangered
  summary: 0x90c8ff,  // MyShape ice blue
};

// ── HN ───────────────────────────────────────────────────────────────

export function formatHnMatches(items: HnMatch[]): Embed[] {
  return items.map((item) => {
    const isComment = item.type === "comment";
    const emoji = isComment ? "💬" : "📰";
    const label = isComment ? "Comment" : "Post";

    const snippet = item.comment_text
      ? item.comment_text.slice(0, 200).replace(/\n/g, " ") + (item.comment_text.length > 200 ? "..." : "")
      : "";

    return {
      title: `${emoji} ${label} on HN: ${item.story_title || item.title}`,
      url: `https://news.ycombinator.com/item?id=${item.objectID}`,
      description: [
        `👤 **${item.author}**`,
        snippet ? `> ${snippet}` : "",
        `🔗 [View on HN](https://news.ycombinator.com/item?id=${item.objectID})`,
      ].filter(Boolean).join("\n"),
      color: COLORS.hn,
      timestamp: item.created_at,
      footer: { text: "Hacker News" },
      author: { name: `▲ HN` },
    };
  });
}

// ── GitHub ────────────────────────────────────────────────────────────

export function formatGitHubStats(stats: GitHubStats[]): Embed {
  const totalStars = stats.reduce((s, r) => s + r.stars, 0);
  const totalForks = stats.reduce((s, r) => s + r.forks, 0);

  return {
    title: "📊 GitHub Stats Update",
    description: stats.map((r) =>
      `**${r.repo}**\n⭐ ${r.stars} stars · 🍴 ${r.forks} forks · 📝 ${r.openIssues} open issues`
    ).join("\n\n"),
    color: COLORS.github,
    footer: { text: `Total: ${totalStars} stars · ${totalForks} forks` },
  };
}

export function formatGitHubEvents(events: GitHubEvent[]): Embed[] {
  const icon: Record<string, string> = {
    star: "⭐",
    issue: "📝",
    pr: "🔀",
    fork: "🍴",
    comment: "💬",
    discussion: "🗣️",
    discussion_comment: "💬",
  };

  return events.map((e) => ({
    title: `${icon[e.type] || "•"} [${e.repo}] ${e.title || e.type}`,
    url: e.url,
    description: `👤 **${e.author}** · ${e.type.toUpperCase()}`,
    color: COLORS.github,
    timestamp: e.created_at,
    footer: { text: `GitHub · ${e.repo}` },
    author: { name: `🐙 GitHub` },
  }));
}

// ── Reddit RSS mentions ──────────────────────────────────────────────

export interface RedditMention {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  subreddit: string;
}

export function formatRedditMentions(items: RedditMention[]): Embed[] {
  return items.map((item) => ({
    title: `🔴 r/${item.subreddit}: ${item.title}`,
    url: item.link,
    description: `👤 u/${item.author} · posted in r/${item.subreddit}`,
    color: COLORS.reddit,
    timestamp: item.pubDate,
    footer: { text: `Reddit · r/${item.subreddit}` },
    author: { name: `🔴 Reddit` },
  }));
}

// ── Send ──────────────────────────────────────────────────────────────

const MAX_EMBEDS_PER_CALL = 10;

export async function sendToDiscord(embeds: Embed[], label: string, webhookUrlOverride?: string): Promise<void> {
  if (embeds.length === 0) return;

  const webhookUrl = webhookUrlOverride || getDiscordWebhookUrl();
  let sent = 0;

  for (let i = 0; i < embeds.length; i += MAX_EMBEDS_PER_CALL) {
    const batch = embeds.slice(i, i + MAX_EMBEDS_PER_CALL);
    const payload = {
      content: ROLE_PING || undefined,
      embeds: batch,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[discord] ${label}: ${res.status} ${text.slice(0, 200)}`);
        continue;
      }

      sent += batch.length;
      if (i + MAX_EMBEDS_PER_CALL < embeds.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`[discord] ${label}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[discord] ${label}: sent ${sent}/${embeds.length}`);
}

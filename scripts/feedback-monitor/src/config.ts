// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — Configuration
// ═══════════════════════════════════════════════════════════════════

/** Keywords to search for across all platforms.
 *  Tier 1 (specific): used for HN + Reddit search
 *  Tier 2 (broad): used for Reddit mentions (filtered post-fetch) */
export const SEARCH_KEYWORDS = ["myshape", "myshapeprotocol", "presence entropy", "motion-signature"];

/** Title filter — only keep items whose title contains one of these */
export const TITLE_FILTER = [
  "myshape",
  "presence entropy",
  "motion entropy",
  "motion-signature",
  "pes benchmark",
  "kinetic verification",
  "ai-generated motion",
  "ai motion",
  "biological entropy",
  "cohen",
  "deepfake detection",
  "mediapipe pose",
  "pose estimation",
  "human motion",
  "motion detection",
  "identity verification",
  "zero-knowledge presence",
];

/** GitHub repos to monitor */
export const GITHUB_REPOS = [
  { owner: "myshapeprotocol", repo: "myshape-protocol" },
  { owner: "ContinuityLab-Org", repo: "continuity-protocol" },
  { owner: "RaymondHWu", repo: "myshape-site" },
];

/** Polling interval in minutes */
export const POLL_INTERVAL_MINUTES = 30;

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/** State file — persists last-seen timestamps */
export const STATE_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "seen.json",
);

/** Read a value from process.env, falling back to .env.local in project root */
function getEnv(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const envPath = path.resolve(__dirname, "..", "..", "..", ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const t = line.trim();
      if (t.startsWith(`${key}=`)) return t.slice(key.length + 1);
    }
  } catch {}
  throw new Error(`${key} not set`);
}

/** Discord webhook URL — #vision (HN, Reddit, API alerts) */
export function getDiscordWebhookUrl(): string {
  return getEnv("DISCORD_WEBHOOK_URL");
}

/** Discord webhook URL — #dev-logs (GitHub only) */
export function getDevLogsWebhookUrl(): string {
  return getEnv("DISCORD_WEBHOOK_DEVLOGS");
}

/** Proxy URI for restricted networks */
export const PROXY_URI = (() => {
  const p = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return p || null;
})();

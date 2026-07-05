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

/** Discord webhook URL */
export function getDiscordWebhookUrl(): string {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) throw new Error("DISCORD_WEBHOOK_URL not set");
  return url;
}

/** Proxy URI for restricted networks */
export const PROXY_URI = (() => {
  const p = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  return p || null;
})();

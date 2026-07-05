// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — Main Loop
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   npx tsx src/index.ts          → run once and exit
//   npx tsx src/index.ts --daemon → run every 15 minutes
//   npx tsx src/test-feeds.ts     → dry-run: fetch without sending
//
// Environment:
//   DISCORD_WEBHOOK_URL — Discord webhook endpoint (required)
//   HTTPS_PROXY          — HTTP(S) proxy for restricted networks (optional)

import { ProxyAgent, setGlobalDispatcher } from "undici";

// Route all Node.js fetch calls through proxy if configured
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  setGlobalDispatcher(new ProxyAgent({ uri: proxy, requestTls: { rejectUnauthorized: false } }));
}

import cron from "node-cron";
import { FEEDS, POLL_INTERVAL_MINUTES, INTER_FEED_DELAY_MS, RATE_LIMIT_COOLDOWN_MINUTES } from "./config";
import { fetchFeed, type ParsedItem, wasRateLimited, resetRateLimitFlag } from "./rss";
import { isSeen, markSeen, flush } from "./dedup";
import { sendToDiscord } from "./discord";

// ── 429 cooldown state ────────────────────────────────────────────
let cooldownUntil: number | null = null;

// ── Core Loop ──────────────────────────────────────────────────────

async function runOnce(): Promise<number> {
  // If we're in 429 cooldown, skip this cycle
  if (cooldownUntil !== null && Date.now() < cooldownUntil) {
    const remaining = Math.ceil((cooldownUntil - Date.now()) / 60000);
    console.log(`[monitor] Skipping cycle — rate-limit cooldown (${remaining} min remaining)`);
    return 0;
  }

  console.log(`\n[monitor] Checking ${FEEDS.length} feed(s) at ${new Date().toISOString()}`);

  const allNew: ParsedItem[] = [];
  resetRateLimitFlag();

  // Rate-limit guard: N-second pause between feeds to avoid Reddit 429
  let first = true;
  for (const feedConfig of FEEDS) {
    if (!first) await new Promise((r) => setTimeout(r, INTER_FEED_DELAY_MS));
    first = false;

    const items = await fetchFeed(feedConfig);

    // If any feed gets 429, stop processing remaining feeds and enter cooldown
    if (wasRateLimited) {
      cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MINUTES * 60_000;
      console.warn(`[monitor] Entering ${RATE_LIMIT_COOLDOWN_MINUTES}min cooldown due to 429`);
      break;
    }

    if (items.length === 0) continue;

    // Filter: only unseen items
    const fresh: ParsedItem[] = [];
    for (const item of items) {
      if (!item.guid) continue;
      if (await isSeen(item.guid)) continue;
      fresh.push(item);
      await markSeen(item.guid);
    }

    if (fresh.length > 0) {
      console.log(`[monitor] ${feedConfig.name}: ${fresh.length} new (${items.length} total)`);
      allNew.push(...fresh);
    } else {
      console.log(`[monitor] ${feedConfig.name}: no new items`);
    }
  }

  // Persist dedup state
  await flush();

  // Send to Discord
  if (allNew.length > 0) {
    await sendToDiscord(allNew);
  } else {
    console.log("[monitor] Nothing new to push");
  }

  return allNew.length;
}

// ── Entry ──────────────────────────────────────────────────────────

const isDaemon = process.argv.includes("--daemon");

if (isDaemon) {
  const cronExpr = `*/${POLL_INTERVAL_MINUTES} * * * *`;
  console.log(`[monitor] Starting daemon — every ${POLL_INTERVAL_MINUTES} minutes`);
  console.log(`[monitor] Watching: ${FEEDS.map((f) => f.name).join(", ")}`);

  // Fire immediately, then on schedule
  runOnce().catch(console.error);

  cron.schedule(cronExpr, () => {
    runOnce().catch((err) => console.error("[monitor] Cycle error:", err));
  });
} else {
  // Single run
  runOnce()
    .then((count) => {
      console.log(`[monitor] Done — ${count} new item(s) pushed`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[monitor] Fatal:", err);
      process.exit(1);
    });
}

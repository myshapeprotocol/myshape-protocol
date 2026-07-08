// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — First Node Alert Daemon
// ═══════════════════════════════════════════════════════════════════
//
// Monitors the protocol node count and sends a Discord notification
// when the first Genesis Node joins the network.
//
// Usage:
//   npx tsx daemon.cjs              → run once and exit
//   npx tsx daemon.cjs --daemon 60  → poll every 60 seconds
//
// Environment:
//   DISCORD_WEBHOOK_URL        — Discord webhook endpoint (required)
//   FIRST_NODE_API_URL         — override API endpoint
//                                (default: https://www.myshape.com/api/nodes/status)
//   FIRST_NODE_STATE_FILE      — override state file path
//                                (default: ./first-node-state.json)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import cron from "node-cron";

const API_URL =
  process.env.FIRST_NODE_API_URL ||
  "https://www.myshape.com/api/nodes/status";
const STATE_FILE =
  process.env.FIRST_NODE_STATE_FILE ||
  `${__dirname}/first-node-state.json`;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const POLL_INTERVAL_SEC = 60;

// ── State ───────────────────────────────────────────────────────

interface State {
  lastKnownCount: number;
  firstNodeDetected: boolean;
  firstNodeTimestamp: string | null;
}

function loadState(): State {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as State;
    }
  } catch { /* corrupt — start fresh */ }
  return { lastKnownCount: 0, firstNodeDetected: false, firstNodeTimestamp: null };
}

function saveState(state: State): void {
  const dir = dirname(STATE_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// ── Discord ──────────────────────────────────────────────────────

async function sendDiscordAlert(state: State, currentCount: number): Promise<void> {
  if (!WEBHOOK_URL) {
    console.error("[first-node] DISCORD_WEBHOOK_URL not set — cannot send alert");
    return;
  }

  const isFirstEver = !state.firstNodeDetected && state.lastKnownCount === 0 && currentCount > 0;

  const color = isFirstEver ? 0xd2991d : 0x3fb950; // gold for first-ever, green for subsequent
  const title = isFirstEver
    ? "◈ GENESIS NODE #1 — The Protocol is Alive"
    : `📊 Node Count Update: ${currentCount}`;

  const description = isFirstEver
    ? [
        "**The first Genesis Node has joined MyShape Protocol.**",
        "",
        `Total nodes: **${currentCount}**`,
        `Timestamp: ${new Date().toISOString()}`,
        "",
        "The root entropy source is now active. The State Chain of Subject Evolution has begun.",
        "",
        `[View Dashboard](https://www.myshape.com/dashboard) · [Protocol Status](https://www.myshape.com/protocol)`,
      ].join("\n")
    : [
        `Node count changed: **${state.lastKnownCount}** → **${currentCount}**`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n");

  const body = {
    embeds: [
      {
        title,
        color,
        description,
        footer: { text: `MyShape First-Node Monitor · ${new Date().toISOString()}` },
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[first-node] Discord webhook returned ${res.status}: ${await res.text()}`);
    } else {
      console.log(`[first-node] Alert sent: ${currentCount} node(s)`);
    }
  } catch (err) {
    console.error("[first-node] Discord webhook failed:", (err as Error).message);
  }
}

// ── Milestone thresholds for celebration alerts ──────────────────

const MILESTONES = [1, 5, 10, 25, 50, 75, 100];

function isMilestone(prevCount: number, newCount: number): number | null {
  for (const m of MILESTONES) {
    if (prevCount < m && newCount >= m) return m;
  }
  return null;
}

async function sendMilestoneAlert(milestone: number, currentCount: number): Promise<void> {
  if (!WEBHOOK_URL) return;

  const body = {
    embeds: [
      {
        title: `🎯 Genesis Cohort: ${milestone} Nodes`,
        color: 0xd2991d,
        description: [
          `**${milestone} Genesis Nodes have joined MyShape Protocol.**`,
          "",
          `Total nodes: **${currentCount}**`,
          `Milestone: ${milestone}/100`,
          `Progress: ${"█".repeat(Math.floor(milestone / 10))}${"░".repeat(10 - Math.floor(milestone / 10))} ${milestone}%`,
          "",
          `[View Dashboard](https://www.myshape.com/dashboard)`,
        ].join("\n"),
        footer: { text: `MyShape First-Node Monitor · ${new Date().toISOString()}` },
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`[first-node] Milestone alert sent: ${milestone} nodes`);
    }
  } catch (err) {
    console.error("[first-node] Milestone alert failed:", (err as Error).message);
  }
}

// ── Poll ─────────────────────────────────────────────────────────

async function poll(): Promise<void> {
  const state = loadState();

  let response: any;
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      console.error(`[first-node] API returned ${res.status}`);
      return;
    }
    response = await res.json();
  } catch (err) {
    console.error(`[first-node] API fetch failed: ${(err as Error).message}`);
    return;
  }

  const currentCount: number = response?.total_nodes ?? 0;
  console.log(`[first-node] Poll: ${currentCount} node(s) (was ${state.lastKnownCount})`);

  // First node ever detected
  if (currentCount > 0 && !state.firstNodeDetected) {
    console.log(`[first-node] 🎉 FIRST NODE DETECTED!`);
    state.firstNodeDetected = true;
    state.firstNodeTimestamp = new Date().toISOString();
    await sendDiscordAlert(state, currentCount);
    state.lastKnownCount = currentCount;
    saveState(state);
    return;
  }

  // Count changed
  if (currentCount !== state.lastKnownCount) {
    // Check for milestones
    const milestone = isMilestone(state.lastKnownCount, currentCount);
    if (milestone) {
      await sendMilestoneAlert(milestone, currentCount);
    } else if (currentCount > 0) {
      await sendDiscordAlert(state, currentCount);
    }
    state.lastKnownCount = currentCount;
    saveState(state);
    return;
  }

  // No change — heartbeat log (every 10th poll to avoid noise)
  const pollCount = parseInt(process.env.FIRST_NODE_POLL_COUNT || "0", 10) + 1;
  process.env.FIRST_NODE_POLL_COUNT = String(pollCount);
  if (pollCount % 10 === 0) {
    console.log(`[first-node] Heartbeat: ${currentCount} node(s) — no change`);
  }
}

// ── Entry ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDaemon = args.includes("--daemon");
const intervalSec = parseInt(args[args.indexOf("--daemon") + 1] || String(POLL_INTERVAL_SEC), 10);

console.log(`[first-node] MyShape First-Node Alert Monitor`);
console.log(`[first-node] API: ${API_URL}`);
console.log(`[first-node] Mode: ${isDaemon ? `daemon (${intervalSec}s)` : "once"}`);
console.log(`[first-node] Discord: ${WEBHOOK_URL ? "configured ✓" : "NOT CONFIGURED ✗"}`);
console.log("");

poll().catch(console.error);

if (isDaemon) {
  cron.schedule(`*/${Math.max(1, Math.floor(intervalSec / 60))} * * * *`, () => {
    poll().catch((err) => console.error("[first-node] Poll error:", err));
  });
}

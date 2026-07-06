// ═══════════════════════════════════════════════════════════════════
// MyShape API Monitor — Dev endpoint error watcher
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   npx tsx index.ts              → scan once and push to Discord
//   npx tsx index.ts --daemon 60  → scan every 60 seconds
//
// Watches PM2 logs for [dev/register] and [dev/activate] errors.
// Deduplicates by error message within a 10-minute window.
// Pushes alerts to Discord via DISCORD_WEBHOOK_URL.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STATE_FILE = `${__dirname}/seen.json`;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface SeenEntry {
  key: string;
  lastSeen: number;
}

function loadSeen(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    if (existsSync(STATE_FILE)) {
      const entries: SeenEntry[] = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      for (const e of entries) {
        if (Date.now() - e.lastSeen < DEDUP_WINDOW_MS) map.set(e.key, e.lastSeen);
      }
    }
  } catch { /* fresh start */ }
  return map;
}

function saveSeen(map: Map<string, number>): void {
  const dir = dirname(STATE_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const entries: SeenEntry[] = [];
  for (const [key, lastSeen] of map) entries.push({ key, lastSeen });
  writeFileSync(STATE_FILE, JSON.stringify(entries, null, 2));
}

async function sendDiscordAlert(title: string, lines: string[]): Promise<void> {
  if (!WEBHOOK_URL) {
    console.error("[api-monitor] DISCORD_WEBHOOK_URL not set — cannot send alert");
    return;
  }

  const body = {
    embeds: [
      {
        title,
        color: 0xef4444, // red
        description: lines.map((l) => `\`\`\`\n${l.slice(0, 500)}\n\`\`\``).join("\n"),
        footer: { text: `MyShape API Monitor · ${new Date().toISOString()}` },
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
      console.error(`[api-monitor] Discord webhook returned ${res.status}`);
    }
  } catch (err) {
    console.error("[api-monitor] Discord webhook failed:", (err as Error).message);
  }
}

function fetchLogs(): string {
  try {
    // Get last 80 lines from all PM2 processes
    return execSync("npx pm2 logs --nostream --lines 80 --raw 2>&1", {
      encoding: "utf-8",
      timeout: 10_000,
      windowsHide: true,
    });
  } catch {
    return "";
  }
}

const ERROR_PATTERNS = [
  /\[dev\/register\]\s+Crash:/i,
  /\[dev\/activate\]\s+Crash:/i,
  /REGISTRATION_FAILED/i,
  /ACTIVATION_FAILED/i,
  /SERVER_CONFIG_ERROR/i,
];

async function scan(): Promise<void> {
  const logs = fetchLogs();
  if (!logs) return;

  const seen = loadSeen();
  const alerts: Array<{ title: string; lines: string[] }> = [];

  for (const line of logs.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pattern of ERROR_PATTERNS) {
      if (pattern.test(trimmed)) {
        const key = trimmed.slice(0, 80); // dedup by first 80 chars
        if (!seen.has(key)) {
          seen.set(key, Date.now());

          const context = extractContext(logs, trimmed);
          alerts.push({
            title: "🚨 Dev API Error Detected",
            lines: context,
          });
        }
        break;
      }
    }
  }

  saveSeen(seen);

  for (const alert of alerts) {
    console.error(`[api-monitor] ALERT: ${alert.lines[0]}`);
    await sendDiscordAlert(alert.title, alert.lines);
  }

  if (alerts.length === 0) {
    console.log(`[api-monitor] Scan complete — no new errors (${new Date().toISOString()})`);
  }
}

function extractContext(logs: string, matchLine: string): string[] {
  const lines = logs.split("\n");
  const idx = lines.findIndex((l) => l.includes(matchLine.slice(0, 60)));
  if (idx === -1) return [matchLine];
  const start = Math.max(0, idx - 2);
  const end = Math.min(lines.length, idx + 3);
  return lines.slice(start, end);
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDaemon = args.includes("--daemon");
  const intervalSec = parseInt(args[args.indexOf("--daemon") + 1] || "60", 10);

  console.log(`[api-monitor] Started${isDaemon ? ` (daemon, ${intervalSec}s interval)` : " (once)"}`);

  await scan();

  if (isDaemon) {
    setInterval(() => scan(), intervalSec * 1000);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[api-monitor] Fatal:", err);
  process.exit(1);
});

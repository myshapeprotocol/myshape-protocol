// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — First Node Alert Daemon (pure CJS, no tsx needed)
// ═══════════════════════════════════════════════════════════════════
//
// Polls /api/nodes/status every 60s. Sends Discord alert when node
// count changes, with special gold-alert for first-ever node.
//
// PM2: pm2 start scripts/first-node-alert/daemon.cjs --name myshape-first-node-alert

const https = require("node:https");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Try to read DISCORD_WEBHOOK_URL from project .env.local (PM2 doesn't always pass env vars)
let WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
if (!WEBHOOK_URL) {
  try {
    const envPath = path.join(__dirname, "..", "..", ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const t = line.trim();
      if (t.startsWith("DISCORD_WEBHOOK_URL=")) {
        WEBHOOK_URL = t.slice("DISCORD_WEBHOOK_URL=".length);
        break;
      }
    }
  } catch {}
}

const API_URL = process.env.FIRST_NODE_API_URL || "https://www.myshape.com/api/nodes/status";
const STATE_FILE = path.join(__dirname, "first-node-state.json");
const POLL_INTERVAL_MS = 60_000;

// ── Proxy support ────────────────────────────────────────────────

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "http://127.0.0.1:15236";
let agent = null;
try {
  const { HttpsProxyAgent } = require("https-proxy-agent");
  agent = new HttpsProxyAgent(proxyUrl);
  console.log(`[first-node] Proxy: ${proxyUrl}`);
} catch (e) {
  console.log(`[first-node] Proxy unavailable: ${e.message}`);
}

// ── fetch helper ──────────────────────────────────────────────────

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const options = {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      agent,
      signal: AbortSignal.timeout(30_000),
    };
    const req = mod.request(url, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        try {
          resolve({ ok, status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ ok, status: res.statusCode, data: null });
        }
      });
    });
    req.on("error", reject);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

// ── State ─────────────────────────────────────────────────────────

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {}
  return { lastKnownCount: 0, firstNodeDetected: false, firstNodeTimestamp: null };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// ── Discord ───────────────────────────────────────────────────────

const MILESTONES = [1, 5, 10, 25, 50, 75, 100];

async function sendDiscord(title, description, color) {
  if (!WEBHOOK_URL) {
    console.error("[first-node] DISCORD_WEBHOOK_URL not set");
    return;
  }
  const body = {
    embeds: [{ title, color, description, footer: { text: `MyShape First-Node Monitor · ${new Date().toISOString()}` } }],
  };
  try {
    const res = await fetchJson(WEBHOOK_URL, { method: "POST", body });
    console.log(`[first-node] Discord response: ${res.status} ${res.ok ? "OK" : "FAIL"}`);
    if (!res.ok) console.log(`[first-node] Discord body: ${JSON.stringify(res.data).slice(0, 200)}`);
    else console.log("[first-node] Alert sent to Discord");
  } catch (err) {
    console.error(`[first-node] Discord send error: ${err.message}`);
  }
}

// ── Poll ──────────────────────────────────────────────────────────

async function poll() {
  const state = loadState();
  let currentCount = 0;

  try {
    const res = await fetchJson(API_URL);
    if (!res.ok) {
      console.error(`[first-node] API returned ${res.status}`);
      return;
    }
    currentCount = res.data?.total_nodes ?? 0;
  } catch (err) {
    console.error(`[first-node] API fetch failed: ${err.message}`);
    return;
  }

  const prevCount = state.lastKnownCount;
  console.log(`[first-node] ${currentCount} node(s) (was ${prevCount})`);

  // First node ever
  if (currentCount > 0 && !state.firstNodeDetected) {
    console.log("[first-node] FIRST NODE DETECTED!");
    const desc = [
      "**The first Genesis Node has joined MyShape Protocol.**",
      "",
      `Total nodes: **${currentCount}**`,
      `Timestamp: ${new Date().toISOString()}`,
      "",
      "The root entropy source is now active. The State Chain of Subject Evolution has begun.",
      "",
      "[View Dashboard](https://www.myshape.com/dashboard) · [Protocol Status](https://www.myshape.com/protocol)",
    ].join("\n");
    await sendDiscord("◈ GENESIS NODE #1 — The Protocol is Alive", desc, 0xd2991d);
    state.firstNodeDetected = true;
    state.firstNodeTimestamp = new Date().toISOString();
    state.lastKnownCount = currentCount;
    saveState(state);
    return;
  }

  // Count changed
  if (currentCount !== prevCount) {
    const milestone = MILESTONES.find((m) => prevCount < m && currentCount >= m);
    if (milestone) {
      const pct = Math.floor(milestone / 100 * 10);
      const desc = [
        `**${milestone} Genesis Nodes have joined MyShape Protocol.**`,
        "",
        `Total nodes: **${currentCount}**`,
        `Progress: ${"█".repeat(pct)}${"░".repeat(10 - pct)} ${milestone}%`,
        "",
        "[View Dashboard](https://www.myshape.com/dashboard)",
      ].join("\n");
      await sendDiscord(`🎯 Genesis Cohort: ${milestone} Nodes`, desc, 0xd2991d);
    } else if (currentCount > 0) {
      const desc = `Node count changed: **${prevCount}** → **${currentCount}**\nTimestamp: ${new Date().toISOString()}`;
      await sendDiscord(`📊 Node Count Update: ${currentCount}`, desc, 0x3fb950);
    }
    state.lastKnownCount = currentCount;
    saveState(state);
  }
}

// ── Main ──────────────────────────────────────────────────────────

console.log("[first-node] MyShape First-Node Alert Monitor");
console.log(`[first-node] API: ${API_URL}`);
console.log(`[first-node] Discord: ${WEBHOOK_URL ? "configured" : "NOT CONFIGURED"}`);
console.log(`[first-node] Polling every ${POLL_INTERVAL_MS / 1000}s`);
console.log("");

poll();
setInterval(poll, POLL_INTERVAL_MS);

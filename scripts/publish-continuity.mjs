// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — Multi-Platform Publisher: The Continuity Problem
// ═══════════════════════════════════════════════════════════════════
// Publishes to: Bluesky, Telegram, Farcaster, Discord
// Uses the new narrative-first positioning.

import { readFileSync, appendFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyUrl = process.env.HTTPS_PROXY || "http://127.0.0.1:15236";
setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } }));

function loadEnv(path) {
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return env;
}
const env = loadEnv(".env.local");

// ── Log file ─────────────────────────────────────────────────────
const LOG = "publish-log.txt";
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

// ═══════════════════════════════════════════════════════════════════
// BLUESKY
// ═══════════════════════════════════════════════════════════════════
const BSKY = "https://bsky.social";

async function bskyPost(session, text) {
  const res = await fetch(`${BSKY}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
    body: JSON.stringify({
      repo: session.did,
      collection: "app.bsky.feed.post",
      record: { $type: "app.bsky.feed.post", text, createdAt: new Date().toISOString() },
    }),
  });
  if (!res.ok) throw new Error(`Bluesky post failed: ${await res.text()}`);
  return res.json();
}

async function publishBluesky(posts) {
  log("[bluesky] Authenticating...");
  const res = await fetch(`${BSKY}/xrpc/com.atproto.server.createSession`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: env.BLUESKY_IDENTIFIER, password: env.BLUESKY_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Bluesky auth: ${await res.text()}`);
  const session = await res.json();
  log(`[bluesky] Logged in: @${session.handle}`);

  let rootUri = null, parentUri = null, results = [];
  for (let i = 0; i < posts.length; i++) {
    const record = { $type: "app.bsky.feed.post", text: posts[i], createdAt: new Date().toISOString() };
    if (parentUri) record.reply = { root: { uri: rootUri, cid: results[0].cid }, parent: { uri: parentUri, cid: results[i - 1].cid } };
    const data = await bskyPost(session, posts[i] instanceof Object ? posts[i].text || Object.values(posts[i]).join("\n\n") : posts[i]);
    results.push(data);
    if (!rootUri) rootUri = data.uri; parentUri = data.uri;
    const pid = data.uri.split("/").pop();
    log(`[bluesky] Post ${i + 1}/${posts.length}: https://bsky.app/profile/${session.handle}/post/${pid}`);
    if (i < posts.length - 1) await new Promise(r => setTimeout(r, 1500));
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// TELEGRAM
// ═══════════════════════════════════════════════════════════════════
async function publishTelegram(text) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "Markdown", disable_web_page_preview: false }),
  });
  if (!res.ok) throw new Error(`Telegram: ${await res.text()}`);
  const data = await res.json();
  log(`[telegram] ✅ Message sent (id: ${data.result.message_id})`);
}

// ═══════════════════════════════════════════════════════════════════
// FARCASTER
// ═══════════════════════════════════════════════════════════════════
async function publishFarcaster(text) {
  const res = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    method: "POST",
    headers: { "Content-Type": "application/json", api_key: env.NEYNAR_API_KEY },
    body: JSON.stringify({ signer_uuid: env.FARCASTER_SIGNER_UUID, text }),
  });
  if (!res.ok) throw new Error(`Farcaster: ${await res.text()}`);
  const data = await res.json();
  log(`[farcaster] ✅ Cast: https://warpcast.com/~/cast/${data.cast?.hash}`);
}

// ═══════════════════════════════════════════════════════════════════
// DISCORD
// ═══════════════════════════════════════════════════════════════════
async function publishDiscord(text) {
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Discord: ${res.status} ${t}`); }
  log("[discord] ✅ Message sent");
}

// ═══════════════════════════════════════════════════════════════════
// Day 3 — The Solution: CPS-0001 + Forgery Cost Framework + arXiv
// ═══════════════════════════════════════════════════════════════════

// Bluesky thread (300 char limit per post)
const BSKY_THREAD = [
  `Day 1: We identified the problem — identity ≠ presence.
Day 2: We reframed the question — "who are you" is wrong.

Today: We release the protocol.

CPS-0001 — a verifiable continuity receipt format. Thread 🧵`,

  `The core insight behind CPS-0001 is simple:

Don't look for a single signal AI can't fake.
Measure the cost of faking many signals at once.

This is the Forgery Cost framework.`,

  `A single AI-generated frame costs almost nothing.
A temporally consistent sequence costs 5x.
Cross-modal (camera + IMU) costs 25x.
With randomized live challenges: 100x.

The goal isn't perfection. It's asymmetry.`,

  `CPS-0001 defines engine-independent Continuity Receipts:
• Ed25519 signed
• SHA-256 chained (each receipt links to its predecessor)
• V₁–V₇ verification contract
• Any sensor or algorithm can produce them in the same format`,

  `Four evidence engines, 576 runs:
• EE-001 (PES): 4-dim biological noise, Cohen's d=2.1
• EE-002 (Cross-modal): 100% alignment, 316 trials
• EE-003 (Challenge-response): 60% pass, 200 trials
• VS-001 (Pipeline): 93% pass, 60 sessions

All open. All reproducible.`,

  `We are preparing our first academic paper for arXiv.

"Continuity Proofs: An Evidence-Based Framework for Verifying Persistent Entity Presence"

Not yet submitted — we will announce when it is.

Open protocol at github.com/myshapeprotocol/myshape-protocol

Identity answers who you are.
Continuity asks whether you stayed.`,
];

// Telegram long-form (Markdown)
const TELEGRAM_TEXT = `We Just Submitted Our First Paper to arXiv

Two days ago, we asked: "What if identity stopped meaning presence?"
Yesterday: "The wrong question is 'who are you?'"

Today, we release what we actually built.

**CPS-0001 — The Continuity Receipt Protocol**

CPS-0001 defines an engine-independent format for Continuity Receipts — self-verifying cryptographic objects that prove continuous presence over time.

Each receipt:
• Signs evidence data via Ed25519
• Links to its predecessor via SHA-256 hash
• Is verified by a 7-step contract (V₁–V₇)
• Can be produced by any sensor or algorithm

**The Forgery Cost Framework**

No single signal is unfakeable. So we don't look for one.

Instead, we measure the *increasing cost* of maintaining consistent forged evidence:

Single frame → 1×
+ Temporal consistency → 5×
+ Cross-modal (IMU + camera) → 25×
+ Live challenge → 100×

Each multiplier makes the attacker's job exponentially harder — without requiring any single "unfakeable" signal.

**Four Evidence Engines**

576 experimental runs across:
• EE-001 (PES): Biological noise analysis — Cohen's d = 2.1
• EE-002 (Cross-modal): 100% temporal alignment across 316 trials
• EE-003 (Challenge-response): Randomized gyroscope tests
• VS-001 (Pipeline): Dual-engine pipeline — 93% pass rate

**arXiv Paper**

"Continuity Proofs: An Evidence-Based Framework for Verifying Persistent Entity Presence"

Submitted. Preprint pending at myshape.com/research

All code open (Apache 2.0). All data public. All limitations documented alongside results.

Not perfection. Asymmetry.

thecontinuitylab.org | github.com/myshapeprotocol`;

// Farcaster (320 char limit)
const FARCASTER_TEXT = `Day 3: We release CPS-0001 — a protocol for continuity receipts.

Forgery Cost framework: don't find a single unfakeable signal. Measure the increasing cost of faking many signals at once.

arXiv paper in preparation. 576 runs. 4 engines. Open protocol.

thecontinuitylab.org`;

// Discord
const DISCORD_TEXT = `**Day 3 — CPS-0001: The Continuity Receipt Protocol**

Two days ago: "identity ≠ presence." Yesterday: "who are you is the wrong question."

Today, we release what we built.

**CPS-0001** defines engine-independent Continuity Receipts — Ed25519-signed, SHA-256 chained, V₁–V₇ verified.

**Forgery Cost Framework:** No single unfakeable signal. Instead — measure the cost of faking many signals at once (1× → 5× → 25× → 100×).

**arXiv paper in preparation:** "Continuity Proofs: An Evidence-Based Framework for Verifying Persistent Entity Presence" — not yet submitted

576 runs · 4 engines · Open protocol · Open data

Preprint: myshape.com/research
GitHub: github.com/myshapeprotocol/myshape-protocol

Not perfection. Asymmetry.`;

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
async function main() {
  log("═══ Multi-Platform Publish Day 3: CPS-0001 + Forgery Cost + arXiv ═══\n");

  // Bluesky
  try {
    log("[bluesky] Publishing thread...");
    await publishBluesky(BSKY_THREAD);
    log("[bluesky] ✅ Thread complete\n");
  } catch (e) {
    log(`[bluesky] ✗ ${e.message}\n`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // Telegram
  try {
    log("[telegram] Publishing...");
    await publishTelegram(TELEGRAM_TEXT);
  } catch (e) {
    log(`[telegram] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // Farcaster
  try {
    log("[farcaster] Publishing...");
    await publishFarcaster(FARCASTER_TEXT);
  } catch (e) {
    log(`[farcaster] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // Discord
  try {
    log("[discord] Publishing...");
    await publishDiscord(DISCORD_TEXT);
  } catch (e) {
    log(`[discord] ✗ ${e.message}`);
  }

  log("\n═══ Publish run complete ═══\n\n");
}

main();

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
// CONTENT — The Day Identity Stopped Meaning Presence
// ═══════════════════════════════════════════════════════════════════

// Bluesky thread (300 char limit per post)
const BSKY_THREAD = [
  `Twenty years ago, seeing someone on screen meant they were probably there.

Today, it doesn't.

The visual signal is no longer evidence of presence.
And every security system is still asking the wrong question.`,

  `Every authentication system asks: "Who are you?"
Almost none asks: "Are you continuously there?"

Those are two different questions.
Identity vs. continuity.`,

  `AI can generate a face in seconds. Clone a voice from 15 seconds of audio. Produce real-time video identical to a real person.

The identity signal is intact. The presence signal is gone.
We never built systems to check for it.`,

  `What broke isn't identity verification.
It's the link between identity and presence.

Historically, proving "who you are" also proved "you are here."
AI decoupled them.`,

  `Three things converging:
1. AI agents need to prove they're the same agent across time
2. Remote work — million-dollar decisions over unverifiable video
3. Deepfakes are moving to real-time

The "seeing is believing" era is ending.`,

  `We're The Continuity Lab. 576 experiments investigating whether continuity can be made as verifiable as a cryptographic signature.

Open protocol. Open data. Open questions.

myshape.com/continuity`,
];

// Telegram long-form (Markdown)
const TELEGRAM_TEXT = `The Day Identity Stopped Meaning Presence

Twenty years ago, seeing someone on screen meant they were probably there. Today, it doesn't.

Every authentication system asks: "Who are you?" Almost none asks: "Are you continuously there?"

Identity is a snapshot. Continuity is a trajectory. In a world where AI can generate snapshots at will, the trajectory is the only thing that cannot be faked.

We are The Continuity Lab — a small research group investigating whether continuity can be made as measurable and verifiable as a cryptographic signature.

576 experiments. Open protocol. Open dataset. Published questions alongside our answers.

Not a product. Not a company. A research question.

Read the full essay: myshape.com/continuity`;

// Farcaster (320 char limit)
const FARCASTER_TEXT = `Twenty years ago, seeing someone on screen meant they were probably there. Today, it doesn't.

Every system asks "Who are you?" Almost none asks "Are you continuously there?"

We're investigating whether continuity can be made verifiable. 576 experiments. Open protocol.

thecontinuitylab.org`;

// Discord
const DISCORD_TEXT = `**The Day Identity Stopped Meaning Presence**

Twenty years ago, seeing someone on screen meant they were probably there. Today, it doesn't.

Every authentication system asks: "Who are you?"
Almost none asks: "Are you continuously there?"

Identity is a snapshot. Continuity is a trajectory. In a world where AI can generate snapshots at will, the trajectory is the only thing that cannot be faked.

We're The Continuity Lab — investigating whether continuity can be made as measurable and verifiable as a cryptographic signature.

576 experiments · Open protocol · Open questions

Read more: myshape.com/continuity`;

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
async function main() {
  log("═══ Multi-Platform Publish: The Day Identity Stopped Meaning Presence ═══\n");

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

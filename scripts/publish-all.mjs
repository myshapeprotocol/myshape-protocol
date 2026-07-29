// ═══════════════════════════════════════════════════════════════════════
// MyShape Protocol — All-Platform Publisher
// Phase 1: Become Visible — Multi-platform daily content syndicator
// ═══════════════════════════════════════════════════════════════════════
// Platforms: X (Twitter), LinkedIn, Bluesky, Telegram, Discord, GitHub, HF
// ═══════════════════════════════════════════════════════════════════════

import { readFileSync, appendFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { TwitterApi } from "twitter-api-v2";

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

// ── Log ──────────────────────────────────────────────────────────
const LOG = "publish-log.txt";
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

// ═══════════════════════════════════════════════════════════════════════
// 1. X (Twitter) — via twitter-api-v2 (OAuth 1.0a)
// ═══════════════════════════════════════════════════════════════════════

async function publishX(posts) {
  const client = new TwitterApi({
    appKey: env.X_API_KEY,
    appSecret: env.X_API_SECRET,
    accessToken: env.X_ACCESS_TOKEN,
    accessSecret: env.X_ACCESS_SECRET,
  });

  // Post thread (reply chain)
  let prevId = null;
  const results = [];
  for (let i = 0; i < posts.length; i++) {
    const tweet = prevId
      ? await client.v2.reply(posts[i], prevId)
      : await client.v2.tweet(posts[i]);
    results.push(tweet.data.id);
    prevId = tweet.data.id;
    log(`[x] Post ${i + 1}/${posts.length}: https://x.com/myshapeprotocol/status/${tweet.data.id}`);
    if (i < posts.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  log(`[x] ✅ Thread complete (${posts.length} posts)`);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. LinkedIn — via OAuth 2.0 user token (ugcPosts API)
// ═══════════════════════════════════════════════════════════════════════
async function publishLinkedIn(text) {
  // First get the user's LinkedIn profile ID
  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${env.LINKEDIN_USER_ACCESS_TOKEN}` },
  });
  if (!meRes.ok) throw new Error(`LinkedIn profile: ${meRes.status} ${await meRes.text()}`);
  const me = await meRes.json();
  const author = `urn:li:person:${me.sub}`;

  // Post as a UGC post
  const body = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LINKEDIN_USER_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LinkedIn post: ${res.status} ${await res.text()}`);
  const data = await res.json();
  log(`[linkedin] ✅ Post created: ${data.id}`);
}

// ═══════════════════════════════════════════════════════════════════════
// 3. Bluesky — AT Protocol (existing)
// ═══════════════════════════════════════════════════════════════════════
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
  log(`[bluesky] ✅ Thread complete`);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 4. Telegram
// ═══════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════
// 5. Discord
// ═══════════════════════════════════════════════════════════════════════
async function publishDiscord(text) {
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: text }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`Discord: ${res.status} ${t}`); }
  log("[discord] ✅ Message sent");
}

// ═══════════════════════════════════════════════════════════════════════
// 6. GitHub — Discussion
// ═══════════════════════════════════════════════════════════════════════
async function publishGitHubDiscussion(title, body) {
  const GITHUB = "https://api.github.com";
  const repoId = "R_kgDOTFMrJg";       // myshapeprotocol/myshape-protocol repo node ID
  const categoryId = "DIC_kwDOTFMrJs4DA5L7";  // Announcements

  // GitHub Discussions creation requires GraphQL
  const query = `mutation {
    createDiscussion(input: {
      repositoryId: "${repoId}",
      categoryId: "${categoryId}",
      title: ${JSON.stringify(title)},
      body: ${JSON.stringify(body)}
    }) { discussion { url } }
  }`;

  const res = await fetch(`${GITHUB}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(`GitHub: ${data.errors.map(e => e.message).join(", ")}`);
  const url = data.data?.createDiscussion?.discussion?.url;
  if (!url) throw new Error(`GitHub: no URL in response ${JSON.stringify(data).substring(0, 200)}`);
  log(`[github] ✅ Discussion: ${url}`);
  return url;
}

// ═══════════════════════════════════════════════════════════════════════
// 7. HuggingFace — Discussion
// ═══════════════════════════════════════════════════════════════════════
async function publishHuggingFace(title, body) {
  const HF = "https://huggingface.co/api";
  const REPO = "ContinuityLab-Org/cps-0001-benchmark";

  const res = await fetch(`${HF}/datasets/${REPO}/discussions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description: body }),
  });
  if (!res.ok) throw new Error(`HuggingFace: ${res.status} ${await res.text()}`);
  const data = await res.json();
  log(`[huggingface] ✅ Discussion created: ${data.url || data.num}`);
  return data;
}

// ═══════════════════════════════════════════════════════════════════════
// CONTENT — Day 5: Forgery Cost Deep Dive (The Math Behind CPS-0001)
// ═══════════════════════════════════════════════════════════════════════

// X / Bluesky thread (6 posts)
const THREAD = [
  `Most anti-AI verification tries to find one signal AI can't fake.

That's a losing strategy. AI gets better every month.

We took a different approach: measure the cost of faking everything at once.`,

  `The Forgery Cost framework:

A single AI-generated frame → almost free

But to maintain a convincing lie across TIME, MODALITIES, and CHALLENGES?

The cost multiplies. Not linearly. Exponentially.`,

  `Single frame: 1× cost
+ Temporal consistency: 5×
+ Cross-modal (camera + IMU): 25×
+ Live randomized challenge: 100×

The attacker doesn't need to fail at any single signal.
They just need the total cost to exceed the attack's value.`,

  `This is why CPS-0001 is engine-independent.

You don't need one perfect sensor. You need an architecture where adding more evidence channels makes forgery exponentially harder while verification stays cheap.

That's asymmetry.`,

  `Four engines, same protocol:
• EE-001: Passive biological noise (Cohen's d=2.1)
• EE-002: Cross-modal binding (100%)
• EE-003: Active challenge (60% pass)
• VS-001: Pipeline (93%)

Each adds a cost multiplier. No single one is perfect. Together they change the economics of forgery.`,

  `The goal isn't to stop all forgery.
The goal is to make forgery not worth it.

Open protocol. Open data. Open questions.

thecontinuitylab.org | github.com/myshapeprotocol`,
];

// LinkedIn / Telegram / Discord long-form (Markdown)
const LONG_TEXT = `**Forgery Cost: Why We Stopped Looking for Unfakeable Signals**

The conventional approach to AI verification is a search for the holy grail: a signal that AI cannot reproduce.

We think this strategy is structurally flawed. Not because these signals are weak — but because the approach assumes a static technological advantage that never holds.

We stopped looking for an unfakeable signal. Instead, we built a framework around something more durable: cost asymmetry.

**The framework:**

A single AI-generated video frame costs essentially nothing. But an attacker who needs to produce a convincing lie must maintain consistency across multiple dimensions:

— Temporal: each frame must be consistent with the one before it (5× cost)
— Cross-modal: camera and IMU data must tell the same story (25× cost)
— Interactive: responses to randomized real-time challenges must be correct (100× cost)

Each multiplier is structural, not temporary. They exist because maintaining a consistent lie across independent evidence channels is fundamentally harder than generating a single plausible output.

**Why this changes the game:**

The protocol doesn't need any single signal to be perfect. EE-001 has a Cohen's d of 2.1 — a strong separation, but not infallible. EE-003 passes only 60% of the time.

But combine them in a pipeline (VS-001), and the pass rate reaches 93%. The sum is stronger than any individual part because the attacker faces multiple independent tests.

**The architectural consequence:**

CPS-0001 is engine-independent by design. When a new evidence channel emerges — or when an existing one is compromised — you don't change the protocol. You swap the engine.

We don't claim to have found the one signal that ends forgery. We claim that's the wrong goal. The right goal is to make the cost of maintaining forgery exceed the value of the attack.

Open protocol: github.com/myshapeprotocol/myshape-protocol
Research hub: thecontinuitylab.org`;

// GitHub / HF discussion title + body
const DISCUSSION_TITLE = "Day 5: Forgery Cost — The Math Behind CPS-0001";
const DISCUSSION_BODY = `**Why we stopped looking for unfakeable signals and started measuring forgery cost instead.**

The conventional approach assumes a static technological advantage. We think that's a losing strategy. Instead, CPS-0001 uses cost asymmetry: making forgery exponentially more expensive as you add evidence channels.

Single frame: 1× → + Temporal: 5× → + Cross-modal: 25× → + Live challenge: 100×

Four engines, same protocol:
- EE-001 (PES): Cohen's d = 2.1
- EE-002 (Cross-modal): 100% temporal alignment
- EE-003 (Challenge-response): 60% pass rate
- VS-001 (Pipeline): 93% pass rate

Each adds a cost multiplier. Together they change the economics of forgery.

Open protocol (Apache 2.0): github.com/myshapeprotocol/myshape-protocol`;

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  const day = process.argv[2] || "5";  // Default to Day 5
  log(`═══ Multi-Platform Publish — Day ${day}: Forgery Cost Deep Dive ═══\n`);

  // 1. X (Twitter)
  try {
    log("[x] Publishing thread...");
    await publishX(THREAD);
  } catch (e) {
    log(`[x] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 2. LinkedIn
  try {
    log("[linkedin] Publishing...");
    await publishLinkedIn(LONG_TEXT);
  } catch (e) {
    log(`[linkedin] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 3. Bluesky
  try {
    log("[bluesky] Publishing thread...");
    await publishBluesky(THREAD);
  } catch (e) {
    log(`[bluesky] ✗ ${e.message}\n`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // 4. Telegram
  try {
    log("[telegram] Publishing...");
    await publishTelegram(LONG_TEXT);
  } catch (e) {
    log(`[telegram] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 5. Discord
  try {
    log("[discord] Publishing...");
    await publishDiscord(LONG_TEXT);
  } catch (e) {
    log(`[discord] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 6. GitHub Discussion
  try {
    log("[github] Creating discussion...");
    await publishGitHubDiscussion(DISCUSSION_TITLE, DISCUSSION_BODY);
  } catch (e) {
    log(`[github] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 7. HuggingFace Discussion
  try {
    log("[huggingface] Creating discussion...");
    await publishHuggingFace(DISCUSSION_TITLE, DISCUSSION_BODY);
  } catch (e) {
    log(`[huggingface] ✗ ${e.message}`);
  }

  log(`\n═══ Day ${day} publish complete ═══\n\n`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });

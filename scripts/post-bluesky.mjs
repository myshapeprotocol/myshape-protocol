// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — Bluesky Post Publisher
// ═══════════════════════════════════════════════════════════════════
// Posts to Bluesky via AT Protocol. Uses app password from .env.local.

import { readFileSync } from "node:fs";
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
const IDENTIFIER = env.BLUESKY_IDENTIFIER;
const PASSWORD = env.BLUESKY_PASSWORD;

const BSKY = "https://bsky.social";

async function createSession() {
  const res = await fetch(`${BSKY}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: IDENTIFIER, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Session failed: ${await res.text()}`);
  return res.json();
}

async function postThread(session, posts) {
  // Bluesky doesn't have native threads like X — we post with reply references
  let rootUri = null;
  let parentUri = null;
  const results = [];

  for (let i = 0; i < posts.length; i++) {
    const record = {
      $type: "app.bsky.feed.post",
      text: posts[i],
      createdAt: new Date().toISOString(),
    };

    if (parentUri && rootUri) {
      record.reply = {
        root: { uri: rootUri, cid: results[0].cid },
        parent: { uri: parentUri, cid: results[results.length - 1].cid },
      };
    }

    const res = await fetch(`${BSKY}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record,
      }),
    });

    if (!res.ok) {
      throw new Error(`Post ${i + 1} failed: ${await res.text()}`);
    }

    const data = await res.json();
    results.push(data);

    if (!rootUri) {
      rootUri = data.uri;
    }
    parentUri = data.uri;

    const postUrl = `https://bsky.app/profile/${session.handle}/post/${data.uri.split("/").pop()}`;
    console.log(`  ✓ Post ${i + 1}/${posts.length} — ${postUrl}`);

    if (i < posts.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return results;
}

// ── Posts: Bluesky gets a condensed 4-post thread (300 char limit) ─

const posts = [
  // Post 1 — Hook
  `We wrote 3,282 lines of snapshot tests so the protocol can't silently lie to its nodes.

MyShape Protocol passed its Genesis Stability Audit. 309 tests. 0 errors. Zero critical findings.

🧵`,

  // Post 2 — Stress test proof
  `We modified a genesis threshold from 0.80 → 0.78. All 172 unit tests passed — silent drift.

Snapshot CI caught it in <300ms. BLOCKED.

That's the difference between "it compiled" and "it kept its promises to node operators."`,

  // Post 3 — Covenant + CTA
  `The Protocol Covenant:
1. Numerical stability > feature velocity
2. Contract breaks require advance notice
3. Tests are the living spec (3,282 lines)
4. All approximations & bias ceilings are public
5. Genesis 100 is permanent. No downgrade, no expiry.

We're recruiting 100 Genesis Nodes.`,

  // Post 4 — Close
  `Not a product. Not an app.

A protocol with enforceable numerical contracts, backed by CI-enforced snapshot testing.

Join the Founding Cohort: myshape.com/genesis
Full audit: github.com/myshapeprotocol/myshape-protocol`,
];

// ── Publish ──────────────────────────────────────────────────────

console.log(`[bluesky] Authenticating as ${IDENTIFIER}...`);
const session = await createSession();
console.log(`[bluesky] Logged in: @${session.handle}\n`);
console.log(`[bluesky] Publishing ${posts.length}-post thread...\n`);

await postThread(session, posts);

console.log(`\n[bluesky] ✅ Thread live: https://bsky.app/profile/${session.handle}`);

// Post RN #001 announcement to Bluesky
import { readFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new ProxyAgent({ uri: process.env.HTTPS_PROXY || "http://127.0.0.1:15236", requestTls: { rejectUnauthorized: false } }));

function loadEnv(path) {
  const c = readFileSync(path, "utf-8"), env = {};
  for (const l of c.split("\n")) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const eq = t.indexOf("="); if (eq === -1) continue; env[t.slice(0, eq)] = t.slice(eq + 1); }
  return env;
}
const env = loadEnv(".env.local");

const BSKY = "https://bsky.social";
const session = await fetch(`${BSKY}/xrpc/com.atproto.server.createSession`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier: env.BLUESKY_IDENTIFIER, password: env.BLUESKY_PASSWORD }),
}).then(r => r.json());

const posts = [
  `Today we're launching The Continuity Lab.

Research Note #001 — The Continuity Problem:

Why proving "I am still me" may become the missing cryptographic primitive of the AI era.

🧵`,

  `Part 1: The world has solved Identity.
Passports. FaceID. DIDs. zkPassports.

All answer: "Who are you?"

Part 2: The AI era creates a new problem.
Agent replacement. Session hijacking. Credential replay. Digital twin drift.

All succeed against identity. All fail against continuity.`,

  `Part 3: Our hypothesis.

Continuity can be anchored by measurable presence signals that form an unbroken chain.

We're not claiming to have proven it. We're claiming it's the right question.

Part 4: Research roadmap — RN #001 → #006, from PES Benchmark to Agent Continuity.`,

  `Not a product. Not a protocol. A research lab investigating whether continuity can become a verifiable property of digital existence.

Read RN #001: myshape.com/research/notes/001-the-continuity-problem
Research hub: myshape.com/research`,
];

async function postThread(session, posts) {
  let rootUri = null, parentUri = null, results = [];
  for (let i = 0; i < posts.length; i++) {
    const record = { $type: "app.bsky.feed.post", text: posts[i], createdAt: new Date().toISOString() };
    if (parentUri) record.reply = { root: { uri: rootUri, cid: results[0].cid }, parent: { uri: parentUri, cid: results[i - 1].cid } };
    const res = await fetch(`${BSKY}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
      body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
    });
    const data = await res.json(); results.push(data);
    if (!rootUri) rootUri = data.uri; parentUri = data.uri;
    console.log(`  ✓ Post ${i + 1}/${posts.length} — https://bsky.app/profile/${session.handle}/post/${data.uri.split("/").pop()}`);
    if (i < posts.length - 1) await new Promise(r => setTimeout(r, 1000));
  }
}

console.log(`[bluesky] Logged in: @${session.handle}\n`);
await postThread(session, posts);
console.log(`\n[bluesky] ✅ https://bsky.app/profile/${session.handle}`);

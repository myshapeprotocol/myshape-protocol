// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — X/Twitter Thread Publisher
// ═══════════════════════════════════════════════════════════════════
// Raw OAuth 1.0a + native fetch (respects undici global dispatcher).

import { readFileSync } from "node:fs";
import { createHmac, randomBytes } from "node:crypto";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// ── Proxy ────────────────────────────────────────────────────────

const proxyUrl = process.env.HTTPS_PROXY || "http://127.0.0.1:15236";
setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } }));
console.log(`[x-post] Proxy: ${proxyUrl}\n`);

// ── Load .env.local ─────────────────────────────────────────────

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

const CONSUMER_KEY = env.X_API_KEY;
const CONSUMER_SECRET = env.X_API_SECRET;
const ACCESS_TOKEN = env.X_ACCESS_TOKEN;
const ACCESS_SECRET = env.X_ACCESS_SECRET;

// ── OAuth 1.0a signing ───────────────────────────────────────────

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function oauthHeader(method, url, params = {}) {
  const oauthParams = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_nonce: randomBytes(16).toString("base64url"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
    ...params,
  };

  // Build parameter string
  const allParams = { ...oauthParams };
  const paramStr = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  // Signature base string
  const baseStr = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramStr),
  ].join("&");

  // Signing key
  const signingKey = `${percentEncode(CONSUMER_SECRET)}&${percentEncode(ACCESS_SECRET)}`;
  const signature = createHmac("sha1", signingKey).update(baseStr).digest("base64");

  oauthParams.oauth_signature = signature;

  // Build header
  return (
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ")
  );
}

// ── Post tweet ────────────────────────────────────────────────────

async function postTweet(text, replyToId = null) {
  const url = "https://api.x.com/2/tweets";
  const body = JSON.stringify(
    replyToId
      ? { text, reply: { in_reply_to_tweet_id: replyToId } }
      : { text },
  );
  const auth = oauthHeader("POST", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`X API ${res.status}: ${JSON.stringify(err)}`);
  }

  return res.json();
}

// ── Thread ────────────────────────────────────────────────────────

const tweets = [
  `We wrote 3,282 lines of snapshot tests so the protocol can't silently lie to its nodes.\n\nMyShape Protocol just passed its Genesis Stability Audit. Zero critical findings. 309 tests. CI-enforced numerical contracts.\n\nHere's why that matters for digital identity. 🧵`,

  `When AI can generate your face, voice, and behavior, "who are you?" stops being the right question.\n\nThe right question: who continues to be you?\n\nMyShape verifies the evolutionary trajectory of digital subjects — cryptographic presence receipts linked across time.`,

  `We ran a stress test. Modified a genesis threshold from 0.80 → 0.78.\n\nResult: 172 unit tests passed. All green. Silent drift.\n\nSnapshot CI caught it in <300ms. BLOCKED.\n\nThat's the difference between "it compiled" and "it kept its promises."`,

  `The Protocol Covenant — 5 non-negotiable promises every Genesis Node operator can verify:\n\n1. Numerical stability > feature velocity\n2. Contract breaks require advance notice\n3. Tests are the living specification\n4. All approximations and bias ceilings are public\n5. Genesis 100 status is permanent and inalienable`,

  `We're recruiting the first 100 Genesis Nodes.\n\nThese 100 identities define the root entropy source. Like Bitcoin's early nodes — founding entity status is immutable protocol-level metadata. Never offered again.`,

  `Not a product. Not an app.\n\nA protocol with enforceable numerical contracts, backed by CI-enforced snapshot testing, designed to survive from Genesis cohort to open protocol at scale.\n\nJoin the Founding Cohort (first 100 only):\nmyshape.com/genesis\n\nFull technical brief:\ngithub.com/myshapeprotocol/myshape-protocol/blob/master/docs/genesis-100-recruitment.md`,
];

async function publishThread() {
  console.log(`[x-post] Publishing ${tweets.length}-tweet thread...\n`);

  let lastId = null;

  for (let i = 0; i < tweets.length; i++) {
    try {
      const { data } = await postTweet(tweets[i], lastId);
      lastId = data.id;
      console.log(`  ✓ Tweet ${i + 1}/${tweets.length} — https://x.com/i/status/${data.id}`);
    } catch (err) {
      console.error(`  ✗ Tweet ${i + 1}: ${err.message}`);
      process.exit(1);
    }

    if (i < tweets.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  console.log(`\n[x-post] ✅ Thread live: https://x.com/i/status/${lastId}`);
}

publishThread();

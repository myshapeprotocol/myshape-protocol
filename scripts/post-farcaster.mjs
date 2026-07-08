// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — Farcaster Cast Publisher
// ═══════════════════════════════════════════════════════════════════
// Posts to Farcaster via Neynar API.

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
const API_KEY = env.NEYNAR_API_KEY;
const SIGNER_UUID = env.FARCASTER_SIGNER_UUID;

// Farcaster has a 320 char limit. Condensed version.
const text = `MyShape Protocol passed its Genesis Stability Audit.

309 tests. 0 errors. 3-layer anti-drift CI protection.

We modified a threshold 0.80→0.78. 172 unit tests passed (silent drift). Snapshot CI caught it in <300ms. BLOCKED.

We're recruiting the first 100 Genesis Nodes — permanent, immutable, never offered again.

myshape.com/genesis`;

async function post() {
  const res = await fetch("https://api.neynar.com/v2/farcaster/cast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api_key": API_KEY,
    },
    body: JSON.stringify({
      signer_uuid: SIGNER_UUID,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Neynar ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const hash = data.cast?.hash;
  console.log(`[farcaster] ✅ Cast published: https://warpcast.com/~/cast/${hash}`);
}

console.log(`[farcaster] Publishing cast (${text.length} chars)...\n`);
await post();

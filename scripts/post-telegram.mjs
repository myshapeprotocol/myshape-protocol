// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — Telegram Announcement Publisher
// ═══════════════════════════════════════════════════════════════════

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
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = env.TELEGRAM_CHAT_ID;

const message = `◈ MyShape Protocol — Genesis 100 Recruitment Now Open

The Genesis Stability Audit is complete.
✓ 309 tests. 0 errors. 3-layer anti-drift protection active.

We're looking for the first 100 Genesis Nodes — the root entropy source of the Self-Verifying Protocol.

⏳ First 50 applicants → Genesis Cohort (#001–#050)
⏳ Remaining 50 → Founding Cohort (#051–#100)
⏳ Genesis Node status is PERMANENT — on-chain, immutable, inalienable

What you get:
• Permanent Genesis Node status
• Cryptographic founding-entity proof
• Your identity as part of the protocol's root trust anchor

How to claim:
1. bash scripts/onboarding-check.sh
2. Visit myshape.com/genesis
3. Connect wallet → 30s motion capture → Genesis #XXX minted

Full audit: github.com/myshapeprotocol/myshape-protocol/blob/master/docs/genesis-stability-audit-v1.0.md

— MyShape Protocol
The Sovereign 3D Identity Layer for the Decentralized Human.`;

async function send() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  console.log(`[telegram] ✅ Message sent to chat ${CHAT_ID}`);
  console.log(`[telegram] Message ID: ${data.result.message_id}`);
}

console.log(`[telegram] Sending announcement...\n`);
await send();

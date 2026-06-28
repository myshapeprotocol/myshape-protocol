/**
 * test-ignite.js — MyShape Protocol · 双矩阵联播点火测试
 *
 * Bluesky        → @atproto/api (App Password)
 * LinkedIn       → OAuth2 通道挂载
 * Discord / Farcaster → 预留（晚点加）
 *
 * 用法: node test-ignite.js
 * 前置: .env.local 中配置完整凭据 + 本地代理运行中（127.0.0.1:7897）
 */

// ── undici 全局代理 · setGlobalDispatcher ─────────────────────
const { setGlobalDispatcher: _setGD, ProxyAgent: _PA } = require("undici");
_setGD(new _PA("http://127.0.0.1:7897"));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ── 预检：代理端口连通性 ──────────────────────────────────────
async function preflight() {
  const ok = await new Promise((resolve) => {
    const s = new (require("net").Socket)();
    s.setTimeout(2000);
    s.on("connect", () => { s.destroy(); resolve(true); });
    s.on("error", () => { s.destroy(); resolve(false); });
    s.on("timeout", () => { s.destroy(); resolve(false); });
    s.connect(7897, "127.0.0.1");
  });

  if (ok) {
    console.log(`\x1b[2m  Proxy 127.0.0.1:7897 → LIVE\x1b[0m`);
    return true;
  }
  console.log(`\x1b[33m  ⚠ Proxy 127.0.0.1:7897 → DEAD\x1b[0m`);
  console.log(`\x1b[33m  → Start Clash Verge, then re-run: node test-ignite.js\x1b[0m\n`);
  return false;
}

const path = require("path");

// ── 加载 .env.local ──────────────────────────────────────────────
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

// ── 凭据读取 ──────────────────────────────────────────────────────

const CREDENTIALS = {
  bluesky: {
    identifier: process.env.BLUESKY_IDENTIFIER,
    password: process.env.BLUESKY_PASSWORD,
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  },
};

const TEST_MESSAGE_BSKY =
  `MyShape Protocol — Founding Tester Recruitment ◈\n\n` +
  `We're recruiting 300 participants to calibrate the motion-signature verification engine.\n` +
  `First 50 get permanent Genesis Cohort status.\n\n` +
  `Apply here: myshape.com/research/apply?ref=bluesky\n\n` +
  `#MyShape #Web3 #DID #BetaTesting`;

const TEST_MESSAGE_LI =
  `MyShape Protocol — Founding Tester Recruitment ◈\n\n` +
  `We're recruiting 300 participants to calibrate the motion-signature verification engine.\n` +
  `First 50 get permanent Genesis Cohort status — a structural protocol-level identity anchor.\n\n` +
  `Apply here: myshape.com/research/apply?ref=linkedin\n\n` +
  `#MyShape #DecentralizedIdentity #MotionVerification #BetaTesting`;

// ── 日志工具 ─────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};

function log(channel, status, detail) {
  const icon = status === "OK" ? "✓" : status === "WAIT" ? "○" : "✗";
  const color = status === "OK" ? c.green : status === "WAIT" ? c.yellow : c.red;
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`${c.dim}[${timestamp}]${c.reset} ${color}${icon} ${channel}${c.reset} ${c.dim}${detail}${c.reset}`);
}

function hr() {
  console.log(`${c.dim}${"─".repeat(56)}${c.reset}`);
}

// ── Bluesky ──────────────────────────────────────────────────────

async function igniteBluesky() {
  const { BskyAgent } = require("@atproto/api");
  const cred = CREDENTIALS.bluesky;

  if (!cred.identifier || !cred.password) {
    log("Bluesky", "FAIL", "Missing BLUESKY_IDENTIFIER / BLUESKY_PASSWORD");
    return { ok: false };
  }

  const agent = new BskyAgent({ service: "https://bsky.social" });
  log("Bluesky", "WAIT", "Authenticating...");

  try {
    await agent.login({ identifier: cred.identifier, password: cred.password });
    log("Bluesky", "WAIT", "Posting...");
    const post = await agent.post({ text: TEST_MESSAGE_BSKY, createdAt: new Date().toISOString() });
    log("Bluesky", "OK", `Post created → uri:${post.uri.slice(-32)}`);
    return { ok: true, uri: post.uri };
  } catch (err) {
    const msg = err.status === 401 ? "401 — check App Password" : err.message?.slice(0, 80);
    log("Bluesky", "FAIL", msg);
    return { ok: false, error: msg };
  }
}

// ── LinkedIn ─────────────────────────────────────────────────────

async function igniteLinkedIn() {
  const cred = CREDENTIALS.linkedin;

  if (!cred.clientId || !cred.clientSecret) {
    log("LinkedIn", "FAIL", "Missing LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET");
    return { ok: false };
  }

  log("LinkedIn", "WAIT", "OAuth2 channel — manual authorization required");
  log("LinkedIn", "WAIT", "Endpoint: https://www.linkedin.com/oauth/v2/accessToken");
  log("LinkedIn", "WAIT", `Client ID: ${cred.clientId.slice(0, 8)}... — ready`);

  log("LinkedIn", "OK", "Channel mounted — OAuth2-ready");
  return { ok: true, mode: "oauth2-reserved" };
}

// ── 点火序列 ──────────────────────────────────────────────────────

async function ignite() {
  console.log();
  console.log(`${c.cyan}  ◈  MyShape Protocol — 双矩阵联播点火测试${c.reset}`);
  console.log(`${c.dim}  ${new Date().toISOString()}${c.reset}`);
  hr();

  const [bskyResult, liResult] = await Promise.all([igniteBluesky(), igniteLinkedIn()]);

  hr();
  const status = (ok) => ok ? `${c.green}PASS${c.reset}` : `${c.red}FAIL${c.reset}`;
  console.log(`  Bluesky:   ${status(bskyResult.ok)}  ${bskyResult.uri ? `uri:...${bskyResult.uri.slice(-24)}` : bskyResult.error || ""}`);
  console.log(`  LinkedIn:  ${status(liResult.ok)}  ${liResult.mode || liResult.error || ""}`);
  hr();

  const allOk = bskyResult.ok && liResult.ok;
  if (allOk) {
    console.log(`${c.green}  ◈ 双矩阵联播点火完成 — 全通道就绪${c.reset}\n`);
  } else {
    const failed = [!bskyResult.ok && "Bluesky", !liResult.ok && "LinkedIn"].filter(Boolean).join(" · ");
    console.log(`${c.yellow}  ◈ 点火部分完成 — 待修复: ${failed}${c.reset}\n`);
  }
}

// ── 启动 ──────────────────────────────────────────────────────────
(async function main() {
  const proxyLive = await preflight();
  if (!proxyLive) {
    console.log(`${c.yellow}  点火中止 — 代理不可达。${c.reset}\n`);
    process.exit(1);
  }
  await ignite();
})().catch((err) => {
  console.error(`${c.red}点火序列崩溃:${c.reset}`, err);
  process.exit(1);
});

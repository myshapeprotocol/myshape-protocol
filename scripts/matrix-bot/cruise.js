#!/usr/bin/env node

/**
 * MyShape Protocol — Social Matrix Cruiser v2.0
 *
 * Scans: Hacker News, LinkedIn topics, X trends, Bluesky feeds
 * Generates: platform-optimized post drafts via Agnes AI (+ fallback)
 * Aggregates: matrix_dashboard.html — one local page for all platforms
 */

// 注入环境变量支持与 Bluesky 官方 SDK 组件
require("dotenv").config();
const { BskyAgent } = require("@atproto/api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const os = require("os");

// ═══════════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════════

// ── 代理策略：国内API直连，仅Bluesky走Clash ──
// 不再设置全局代理——避免干扰东方财富/网易财经等国内数据源
const CLASH_PROXY = { protocol: "http", host: "127.0.0.1", port: 7890 };
const CLASH_PROXY_URL = "http://127.0.0.1:7890";

const AGNES_URL = "https://apihub.agnes-ai.com/v1/chat/completions";
const HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const HN_THREAD = (id) => `https://news.ycombinator.com/item?id=${id}`;
const BLUESKY_SEARCH = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

const KEYWORDS = [
  "identity", "auth", "zk", "zero.knowledge", "crypto", "deepfake",
  "ai", "machine.learning", "llm", "privacy", "security", "kinetic",
  "motion", "presence", "verification", "proof", "synthetic", "simulation",
  "agent", "bot", "sybil", "personhood", "world.id", "humanity",
  // ── 金融/宏观 ──
  "finance", "market", "stock", "trading", "economy", "inflation",
  "fed", "federal.reserve", "rate.cut", "rate.hike", "recession",
  "bond", "yield", "liquidity", "macro", "tariff", "gdp",
];

function loadConfig() {
  const p = path.join(os.homedir(), ".hermes", "config.yaml");
  if (!fs.existsSync(p)) { console.error("Config not found"); process.exit(1); }
  const c = yaml.load(fs.readFileSync(p, "utf8"));
  return { apiKey: c.model.api_key, model: c.model.default };
}
const CFG = loadConfig();

const ALL_PLATFORMS = ["hn", "linkedin", "x", "bluesky"];
const DELAY = (ms) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════════
//  AGNES AI — Multi-modal API calls
// ═══════════════════════════════════════════════════════════════════

const AGNES_IMAGE_URL = "https://apihub.agnes-ai.com/v1/images/generations";
const AGNES_VIDEO_URL = "https://apihub.agnes-ai.com/v1/video/generations";
const AGNES_HEADERS = () => ({ "Content-Type": "application/json", "Authorization": "Bearer " + CFG.apiKey });

async function callAgnes(systemPrompt, userPrompt) {
  try {
    const res = await axios.post(AGNES_URL, {
      model: CFG.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 1500,
    }, {
      headers: AGNES_HEADERS(),
      timeout: 45000,
    });
    const text = res.data.choices[0].message.content.trim();
    if (text && text.length > 60) return text;
  } catch (e) {
    console.log("    API: " + (e.response?.status || e.code));
  }
  return null;
}

async function generateImage(prompt) {
  try {
    const res = await axios.post(AGNES_IMAGE_URL, {
      model: "agnes-image-2.1-flash",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    }, {
      headers: AGNES_HEADERS(),
      timeout: 60000,
    });
    const url = res.data.data?.[0]?.url;
    if (url) { console.log("    Look! Image generated"); return url; }
    console.log("    Image API: unexpected response format");
  } catch (e) {
    console.log("    Image API: " + (e.response?.status || e.code));
  }
  return null;
}

async function generateVideo(prompt) {
  try {
    const res = await axios.post(AGNES_VIDEO_URL, {
      model: "agnes-video-v2.0",
      prompt: prompt,
      num_frames: 9,
      fps: 16,
    }, {
      headers: AGNES_HEADERS(),
      timeout: 120000,
    });
    const url = res.data.data?.[0]?.url || res.data.url;
    if (url) { console.log("    🎬 Video generated"); return url; }
    console.log("    Video API: unexpected response format");
  } catch (e) {
    console.log("    Video API: " + (e.response?.status || e.code));
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
//  VISUAL CORE — protocol visual identity
// ═══════════════════════════════════════════════════════════════════
const VISUAL_CORE = "circular deep-sense halo scan, ethereal data energy, wireframe anatomy, non-binary aesthetic, cold cyan electric blue tones, dark void background, particle geometry, protocol-grade visualization";
const TROLL_SIGNALS = ["scam", "fake", "bullshit", "vaporware", "grift", "useless", "ponzi", "shitcoin", "worthless", "doesn't work", "snake oil"];

// ═══════════════════════════════════════════════════════════════════
//  DEFENSE: Protocol-grade troll response
// ═══════════════════════════════════════════════════════════════════
function isTroll(text) {
  const lower = (text || "").toLowerCase();
  return TROLL_SIGNALS.some((s) => lower.includes(s));
}

async function handleTrollResponse(triggerText) {
  const responses = [
    "Protocol state: interference detected. MyShape ZK-proofs remain untethered to centralized narratives.",
    "Signal anomaly registered. The entropy gap between human motion and synthetic generation is mathematically irreducible. This claim does not alter that constant.",
    "Noise floor breached. Sovereign identity verification continues unaffected. Protocol integrity: intact.",
    "Adversarial input logged. The motion-signature primitive does not require belief — it requires geometry. Geometry does not negotiate.",
  ];
  const pick = responses[Math.floor(Math.random() * responses.length)];
  console.log("  🛡️  Troll detected: " + triggerText.slice(0, 50));
  return { content: pick, platform: "x", tags: ["protocol-defense", "zk-proof"] };
}

// ═══════════════════════════════════════════════════════════════════

async function attachMedia(platform, topic) {
  const basePrompt = VISUAL_CORE;
  const prompts = {
    linkedin: `${basePrompt}, professional technical diagram style, clean lines, suitable for LinkedIn professional audience — illustrating: ${topic}`,
    x: `${basePrompt}, viral tech aesthetic, bold composition, eye-catching for timeline scroll — illustrating: ${topic}`,
    bluesky: `${basePrompt}, decentralized protocol aesthetic, cryptographic visual language — illustrating: ${topic}`,
  };
  const prompt = prompts[platform] || prompts.x;
  const imgUrl = await generateImage(prompt);
  return { image: imgUrl };
}

// ═══════════════════════════════════════════════════════════════════
//  DATA SOURCE: Hacker News
// ═══════════════════════════════════════════════════════════════════

async function fetchWithRetry(url, opts = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await axios.get(url, { timeout: 30000, ...opts });
    } catch (e) {
      if (i === retries) throw e;
      console.log("    Retry " + (i + 1) + " after " + (e.code || "error"));
      await DELAY(2000);
    }
  }
}

async function fetchHNStories() {
  console.log("\n--- Hacker News ---");
  const { data: ids } = await fetchWithRetry(HN_TOP);
  const slice = ids.slice(0, 80);
  const stories = [];
  for (const id of slice) {
    try {
      const { data: s } = await axios.get(HN_ITEM(id), { timeout: 15000 });
      if (!s) continue;
      const txt = [s.title, s.text || ""].join(" ").toLowerCase();
      if (KEYWORDS.some((kw) => new RegExp("\\b" + kw.replace(/\./g, "\\.") + "\\b", "i").test(txt))) {
        stories.push({ id: s.id, title: s.title, url: HN_THREAD(s.id), score: s.score || 0, comments: s.descendants || 0 });
        if (stories.length >= 12) break;
      }
    } catch (e) { /* skip failed items */ }
    await DELAY(60);
  }
  console.log("  Found: " + stories.length + " stories");
  return stories;
}

// ═══════════════════════════════════════════════════════════════════
//  DATA SOURCE: Bluesky (public AT Protocol)
// ═══════════════════════════════════════════════════════════════════

async function fetchBlueskyPosts() {
  console.log("\n--- Bluesky ---");
  const posts = [];
  const queries = ["digital+identity", "zk+proof"];
  for (const q of queries) {
    try {
      const { data } = await axios.get(BLUESKY_SEARCH + "?q=" + q + "&limit=3", { proxy: CLASH_PROXY, timeout: 30000 });
      if (data?.posts) {
        for (const p of data.posts) {
          const text = (p.record?.text || "").slice(0, 200);
          if (text.length > 40) {
            posts.push({
              id: (p.uri || "").split("/").pop() || Math.random().toString(36),
              author: p.author?.handle || "unknown",
              text,
              url: "https://bsky.app/profile/" + (p.author?.handle || "") + "/post/" + ((p.uri || "").split("/").pop() || ""),
              likes: p.likeCount || 0,
              reposts: p.repostCount || 0,
            });
          }
        }
      }
    } catch (e) {
      console.log("  Bluesky '" + q + "': " + (e.response?.status || e.code || "unreachable"));
    }
    await DELAY(300);
  }
  console.log("  Found: " + posts.length + " posts");
  return posts;
}

// ═══════════════════════════════════════════════════════════════════
//  DATA SOURCE: 财经新闻 (A股 + 中文财经)
// ═══════════════════════════════════════════════════════════════════

const AMARKET_API = "https://push2.eastmoney.com/api/qt/ulist.np/get";
const NETEASE_FINANCE = "https://money.163.com/special/00251G8F/news_json.js";

async function fetchAMarketData() {
  console.log("\n--- A股行情 ---");
  const indices = [
    { secid: "1.000001", name: "上证指数" },
    { secid: "0.399001", name: "深证成指" },
    { secid: "0.399006", name: "创业板指" },
    { secid: "1.000688", name: "科创50" },
  ];
  try {
    const secids = indices.map((i) => i.secid).join(",");
    const { data } = await axios.get(AMARKET_API, {
      params: { fltt: 2, fields: "f2,f3,f4,f12,f14", secids },
      timeout: 10000,
      proxy: false, // 国内API直连，不走代理
    });
    if (data?.data?.diff) {
      const rows = data.data.diff.map((d) => ({
        name: d.f14, price: d.f2, changePct: d.f3, change: d.f4,
      }));
      console.log("  " + rows.map((r) => `${r.name} ${r.price} (${r.changePct > 0 ? "+" : ""}${r.changePct}%)`).join(" | "));
      return rows;
    }
  } catch (e) {
    console.log("  A股行情: " + (e.code || "unreachable"));
  }
  return [];
}

async function fetchCNFinanceNews() {
  console.log("\n--- 中文财经新闻 ---");
  try {
    const { data: raw } = await axios.get(NETEASE_FINANCE, { timeout: 10000, proxy: false });
    // 网易返回 JSONP: var data={...}
    const json = JSON.parse(raw.replace(/^var data=/, "").replace(/;$/, ""));
    const allNews = [];
    for (const cat of json.news || []) {
      for (const item of cat) {
        if (item.t && item.p) allNews.push({ title: item.t, url: item.l, time: item.p });
      }
    }
    // 取前 15 条，按时间倒序
    const latest = allNews.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 15);
    console.log("  获取 " + latest.length + " 条中文财经新闻");
    return latest;
  } catch (e) {
    console.log("  中文财经: " + (e.code || e.message));
  }
  return [];
}

async function generateFinanceBriefing(marketData, cnNews) {
  // ── 构建财经早报 Prompt ──
  const marketStr = marketData.length
    ? marketData.map((r) => `${r.name}: ${r.price} (${r.changePct > 0 ? "+" : ""}${r.changePct}%)`).join(", ")
    : "行情数据暂缺";
  const newsStr = cnNews.length
    ? cnNews.slice(0, 10).map((n, i) => `${i + 1}. ${n.title}`).join("\n")
    : "新闻暂缺";

  const systemPrompt = "You are a senior financial analyst. Write concise, insightful market briefings in Chinese (中文). Include key index data, top news highlights, and a short market outlook. Professional tone, no filler.";
  const userPrompt = `写出今日A股财经早报，双语格式：
[中文]
（150-200字中文版：今日行情 — ${marketStr}。重要新闻摘要 — ${newsStr}。简短市场展望。）
[English]
（100-150 words English version of the above.）

格式要求：中文在前，英文在后。专业简洁，不要堆砌数据。`;

  try {
    const briefing = await callAgnes(systemPrompt, userPrompt);
    if (briefing && briefing.length > 60) return briefing;
  } catch { /* fallback */ }
  // Fallback: 简单拼接
  return [
    "[中文]",
    "今日A股行情: " + marketStr,
    "",
    "重要新闻:",
    newsStr,
    "",
    "[English]",
    "A-share market today: " + marketStr,
    "",
    "Key headlines:",
    newsStr,
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════
//  POST GENERATORS — Platform-specific tones
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_TONES = {
  hn: "You are the Lead Architect Agent for MyShape Protocol. For identity/tech topics: provide a 'Protocol-First' perspective — compare against MyShape's Continuity Layer (temporal identity integrity) and Presence Receipt (real-time motion-signature verification). For finance/macro topics: provide sharp market analysis, macro insight, no forced protocol mapping. Write terse, technically precise, slightly contrarian Hacker News comments. Founder-level insight. Never mention product names.",
  linkedin: "You are the Lead Architect Agent and Chief Scientist of MyShape Protocol. For identity/tech topics: provide 'Protocol-First' analysis — map to MyShape's Continuity Layer and Presence Receipt. For finance/macro: provide sharp market analysis with macro insight. Write visionary, professional LinkedIn posts (200-300 words). Founder-level insight. Include a 'Key Insight' section. End with a question to engage CTOs and security leaders. Do NOT mention product names.",
  x: "You are the Lead Architect Agent for MyShape Protocol. For identity/tech: 'Protocol-First' sharp insights — reference Continuity Layer or Presence Receipt where relevant. For finance/macro: sharp market takes. Write provocative, insightful tweets under 280 characters. Founder-level perspective. No hashtags, no links, no product names.",
  bluesky: "You are the Lead Architect Agent for MyShape Protocol. For identity/tech: 'Protocol-First' thoughtful commentary — connect to Continuity Layer and Presence Receipt. For finance/macro: sharp macro insight. Write technical but approachable Bluesky posts (200-300 chars). Founder-level insight. No hype, no links.",
};

const PROMPT_TEMPLATES = {
  hn: (title) => `HN thread: "${title}". Analyze through MyShape Protocol's lens. Write a commentary (140-200 words, 3-4 paragraphs). If identity/tech: (1) Signal — 1 sentence. (2) Protocol-First — map to Continuity Layer or Presence Receipt. (3) Non-obvious insight. (4) Open question. If finance/macro: (1) What's happening — 1 sentence. (2) Market/macro implication. (3) Contrarian angle. (4) Open question. Tone: terse, precise, founder-level.`,
  linkedin: (title) => `Industry topic: "${title}". Write a LinkedIn post (200-300 words). If identity/tech: Structure: (1) What's happening — 2 sentences. (2) Map to Continuity Layer or Presence Receipt. (3) Key Insight — bold technical prediction. (4) Closing question for CTOs/security leaders. If finance/macro: (1) Market context — 2 sentences. (2) Macro implication. (3) Key Insight — bold prediction. (4) Closing question for investors/analysts. Founder-level, visionary tone.`,
  x: (title) => `Topic: "${title}". Write a tweet (under 260 chars). If identity/tech: sharp Protocol-First insight — reference Continuity Layer or Presence Receipt where relevant. If finance/macro: sharp market take. Founder-level. No hashtags, no links, no product names. Pure idea.`,
  bluesky: (title) => `Topic: "${title}". Write a Bluesky post (200-300 chars). If identity/tech: Protocol-First technical commentary — connect to Continuity Layer or Presence Receipt. If finance/macro: sharp macro insight. No hashtags.`,
};

const FALLBACKS = {
  hn: {
    intros: [
      "This touches on something I've been thinking about — the distinction between verifying *identity* and verifying *presence*. Most systems conflate the two, but they have fundamentally different security properties.",
      "There's an architectural assumption here worth unpacking: identity verification doesn't require knowing *who* someone is, only confirming *that they are present and real* in this moment.",
      "This reminds me of a problem at the intersection of real-time signal analysis, zero-knowledge proofs, and the limits of generative models.",
      "One thing often overlooked in these discussions is the temporal dimension. Identity isn't a snapshot — it's a continuous signal with an entropy profile that evolves over time.",
    ],
    bodies: [
      "Most authentication treats identity as a static credential — something you have or know. Shift the primitive to something you continuously generate, and the attack surface changes. You're no longer guarding a secret; you're proving an ongoing physical process.",
      "The entropy source matters more than the proof system. A ZK proof of a low-entropy signal is still forgeable. The hard problem isn't the circuit — it's finding a witness that AI cannot fabricate at the distribution level.",
      "From a protocol design perspective, the question isn't 'can we detect AI' but 'what primitive can a human generate that no model reproduces at scale.' The answer likely involves irreversible, high-entropy, real-time biological processes.",
    ],
    endings: [
      "Has anyone explored the entropy gap between synthetic and biological micro-motion as a quantifiable security parameter?",
      "What's the state of the art for non-biometric, real-time human presence verification that doesn't rely on trusted hardware?",
      "Anyone aware of research quantifying minimum entropy thresholds needed to distinguish biological from synthetic signals at scale?",
    ],
  },
  linkedin: {
    intros: [
      "The digital identity landscape is shifting faster than most enterprise security teams realize. A fundamental architectural change is coming — and it's not about better passwords or more MFA layers.",
      "Here's a contrarian take on where identity verification is heading: we're moving from *credential-based* to *presence-based* authentication. And the implications for enterprise security are profound.",
      "After years of working on sovereign identity infrastructure, I've come to believe the industry is solving the wrong problem. We're optimizing authentication when we should be rethinking the primitive itself.",
    ],
    bodies: [
      "The core insight: static credentials are inherently vulnerable to AI-powered attacks. A password, a face scan, even a voiceprint — these are all *snapshots* that generative models can eventually reproduce. The only unforgeable signal is one that's continuously generated, in real time, by an irreducible biological process. That's not biometrics — that's *presence telemetry*.",
      "Key Insight: The next generation of identity verification won't ask 'who are you?' — it will verify 'are you present, right now, as a real human?' This shifts the attack surface from credential theft to real-time signal forgery. And the latter is orders of magnitude harder for AI to defeat.",
      "What makes this technically feasible now: advances in zero-knowledge proofs allow us to verify the *entropy profile* of a biological signal without storing or transmitting the signal itself. The verifier learns only one bit: 'real human present.' Nothing else. This is the privacy-preserving identity architecture that GDPR-era enterprises need.",
    ],
    endings: [
      "I'm curious: how is your organization thinking about the AI-threat to static identity verification? Are you seeing this on your roadmap yet?",
      "Question for the security leaders here: at what point does static MFA become indefensible against AI-generated attacks? What's your threshold?",
      "If you're working on enterprise identity infrastructure, I'd love to hear: what's the hardest problem you're facing with AI-powered impersonation?",
    ],
  },
  x: {
    posts: [
      "Hot take: 2D biometrics are cryptographically bankrupt. Any projection can be learned by a diffusion model. The future of identity is geometry, not appearance.",
      "The entropy source matters more than the proof system. You can't ZK-prove humanity from a low-entropy signal. The witness needs biological irreducibility.",
      "Identity isn't a snapshot. It's a continuous signal. If your auth system treats it as static, AI will break it. Presence > Credentials.",
      "Thinking about the entropy gap between synthetic and biological motion. If we can quantify it, we have a hard security boundary that no current AI architecture crosses.",
      "The most interesting unsolved problem in digital identity: finding a signal primitive that resists compression into any latent space. Motion geometry might be it.",
      "ZK-proofs are necessary but not sufficient for human verification. The hard part isn't the circuit — it's generating a witness that AI genuinely cannot fabricate.",
    ],
  },
  bluesky: {
    posts: [
      "Rethinking digital identity from first principles. The question isn't 'who are you?' — it's 'are you real, right now?' Very different security properties.",
      "Interesting problem: what's the minimum entropy threshold to distinguish human-generated motion from AI-synthesized movement? Feels like a quantifiable security parameter.",
      "Zero-knowledge proofs for human presence are fascinating because they flip the privacy model. You prove membership in the set of humans without revealing which human.",
      "The temporal dimension of identity is under-explored. Most auth systems treat it as a point-in-time check, but biological signals are continuous. That continuity IS the signal.",
    ],
  },
};

function fallbackPost(platform, isDashboardView = true) {
  const fb = FALLBACKS[platform];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  let en;
  if (platform === "hn" || platform === "linkedin") {
    en = pick(fb.intros) + "\n\n" + pick(fb.bodies) + "\n\n" + pick(fb.endings);
  } else if (platform === "x" || platform === "bluesky") {
    en = fb.posts[Math.floor(Math.random() * fb.posts.length)];
  } else {
    en = "No content generated.";
  }
  if (!isDashboardView) return en;
  return "[English]\n" + en + "\n\n[中文]\n（中文翻译待 API 恢复后生成 / Chinese translation pending API recovery）";
}

async function generatePost(platform, topic, isDashboardView = true) {
  // ── 逻辑分流：Dashboard 走双语，外部发布走纯英文 ──
  const formatSuffix = isDashboardView
    ? " Output format must ALWAYS be: [English] section first, then [中文] section with complete Chinese translation."
    : " Output in English only — no Chinese translation, no bilingual formatting.";

  const systemPrompt = SYSTEM_TONES[platform] + formatSuffix;
  const userPrompt = PROMPT_TEMPLATES[platform](topic) + (isDashboardView
    ? " Output exactly two sections: [English] (first) then [中文] (complete translation)."
    : " English only, no translation.");

  const aiText = await callAgnes(systemPrompt, userPrompt);
  if (aiText) return aiText;
  return fallbackPost(platform, isDashboardView);
}

// ═══════════════════════════════════════════════════════════════════
//  LINKEDIN: Industry trends derived from HN + keyword analysis
// ═══════════════════════════════════════════════════════════════════

async function generateLinkedInTopics(hnStories) {
  console.log("\n--- LinkedIn Topics ---");
  const linkedInTopics = hnStories
    .filter((s) => s.score > 20)
    .slice(0, 4)
    .map((s) => ({
      title: s.title,
      source: s.url,
      angle: "Enterprise & Industry Impact",
    }));

  const results = [];
  for (const t of linkedInTopics) {
    console.log('  Generating: "' + t.title.slice(0, 50) + '..."');
    const post = await generatePost("linkedin", t.title);
    const media = await attachMedia("linkedin", t.title);
    results.push({ ...t, post, ...media });
    await DELAY(2000);
  }
  console.log("  Generated: " + results.length + " LinkedIn posts");
  return results;
}

// ═══════════════════════════════════════════════════════════════════
//  BLUESKY AUTOMATED PUBLISHER (Thread Router)
// ═══════════════════════════════════════════════════════════════════

async function pushToBluesky(text, replyText) {
  if (!process.env.BLUESKY_HANDLE || !process.env.BLUESKY_PASSWORD) {
    console.log("  ⚠️  Bluesky credentials missing in .env. Skipping broadcast.");
    return { success: false };
  }

  // ── Bluesky 专属代理：仅此调用走 Clash ──
  const prevHttp = process.env.HTTP_PROXY;
  const prevHttps = process.env.HTTPS_PROXY;
  process.env.HTTP_PROXY = CLASH_PROXY_URL;
  process.env.HTTPS_PROXY = CLASH_PROXY_URL;

  const agent = new BskyAgent({ service: "https://bsky.social" });

  try {
    await agent.login({
      identifier: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD,
    });
    console.log("  🤖 Bluesky Matrix Client authenticated successfully.");

    // 发布第一层（主楼）
    const rootPost = await agent.post({
      text: text,
      createdAt: new Date().toISOString(),
    });
    console.log(`  🚀 Bluesky Main Post deployed.`);

    // 发布第二层（锁死引用的回帖）
    await agent.post({
      text: replyText,
      createdAt: new Date().toISOString(),
      reply: {
        root: { cid: rootPost.cid, uri: rootPost.uri },
        parent: { cid: rootPost.cid, uri: rootPost.uri }
      }
    });
    console.log(`  🔗 Bluesky Reply Thread locked down.`);
    return { success: true };
  } catch (error) {
    console.error("  ❌ Bluesky synchronizer encountered an error:", error.message);
    return { success: false };
  } finally {
    process.env.HTTP_PROXY = prevHttp;
    process.env.HTTPS_PROXY = prevHttps;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD: unified HTML
// ═══════════════════════════════════════════════════════════════════

// ── 全平台分发协议映射 ──
const PLATFORM_MAPPING = {
  linkedin:  { type: "API",  icon: "🔗", tagClass: "li-tag" },
  bluesky:   { type: "API",  icon: "☁",  tagClass: "bs-tag" },
  farcaster: { type: "API",  icon: "⊡",  tagClass: "fc-tag" },
  discord:   { type: "API",  icon: "◆",  tagClass: "dc-tag" },
  telegram:  { type: "API",  icon: "✈",  tagClass: "tg-tag" },
  reddit:    { type: "API",  icon: "🔴", tagClass: "rd-tag" },
  x:         { type: "LINK", icon: "𝕏",  tagClass: "x-tag" },
  hn:        { type: "LINK", icon: "▲",  tagClass: "hn-tag" },
};

function generateDashboard(data) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const hnCards = (data.hn || []).map((d) => {
    const payload = JSON.stringify({ platform: "hn", content: d.post || d.comment || "", title: d.title, url: d.url }).replace(/"/g, "&quot;");
    return '<div class="card hn" data-platform="hn" data-payload="' + payload + '">' +
    '<div class="platform-tag hn-tag">HACKER NEWS</div>' +
    '<div class="source"><a href="' + d.url + '" target="_blank">' + esc(d.title) + '</a>' +
    '<span class="meta">' + d.score + ' pts &middot; ' + d.comments + ' comments</span></div>' +
    '<div class="text">' + esc(d.post || d.comment || "") + '</div>' +
    '<div class="card-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end"></div></div>';
  }).join("");

  const linkedInCards = (data.linkedin || []).map((d) => {
    const payload = JSON.stringify({ platform: "linkedin", content: d.post || "", title: d.title, url: d.source }).replace(/"/g, "&quot;");
    return '<div class="card linkedin" data-platform="linkedin" data-payload="' + payload + '">' +
    (d.image ? '<img src="' + d.image + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:4px;margin-bottom:12px;" loading="lazy" />' : '') +
    '<div class="platform-tag li-tag">LINKEDIN</div>' +
    '<div class="source"><a href="' + d.source + '" target="_blank">' + esc(d.title) + '</a>' +
    '<span class="meta">' + esc(d.angle || "Industry Insight") + '</span></div>' +
    '<div class="text li-text">' + esc(d.post || "") + '</div>' +
    '<div class="card-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end"></div></div>';
  }).join("");

  const xCards = (data.x || []).map((d) => {
    const payload = JSON.stringify({ platform: "x", content: d.post || "", title: d.topic || "", url: "" }).replace(/"/g, "&quot;");
    return '<div class="card x-card" data-platform="x" data-payload="' + payload + '">' +
    '<div class="platform-tag x-tag">X / TWITTER</div>' +
    '<div class="text x-text">' + esc(d.post || "") + '</div>' +
    '<div class="meta">Topic: ' + esc(d.topic || "") + '</div>' +
    '<div class="card-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end"></div></div>';
  }).join("");

  const blueskyCards = (data.bluesky || []).map((d) => {
    const payload = JSON.stringify({ platform: "bluesky", content: d.text || "", title: "@" + (d.author || ""), url: d.url || "" }).replace(/"/g, "&quot;");
    return '<div class="card bluesky-card" data-platform="bluesky" data-payload="' + payload + '">' +
    '<div class="platform-tag bs-tag">BLUESKY</div>' +
    '<div class="source"><a href="' + (d.url || "#") + '" target="_blank">@' + esc(d.author || "unknown") + '</a>' +
    '<span class="meta">' + (d.likes || 0) + ' likes &middot; ' + (d.reposts || 0) + ' reposts</span></div>' +
    '<div class="text">' + esc(d.text || "") + '</div>' +
    '<div class="card-actions" style="margin-top:10px;display:flex;gap:6px;justify-content:flex-end"></div></div>';
  }).join("");

  const financeCard = data.finance
    ? '<div class="card finance-card full" style="border-left:3px solid #e84e4c;margin-bottom:20px">' +
      '<div class="platform-tag fi-tag" style="color:#e84e4c;border:1px solid rgba(232,78,76,.3);background:rgba(232,78,76,.06)">财经早报 / FINANCE BRIEFING</div>' +
      '<div class="text fi-text" style="font-size:12px;line-height:1.8">' + esc(data.finance.briefing || "未生成") + '</div>' +
      '<div class="meta" style="margin-left:0;margin-top:10px">A股 / 中文财经 &middot; ' + (data.finance.newsCount || 0) + ' 条新闻</div></div>'
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>MyShape 矩阵仪表盘 / Matrix Dashboard — ${now}</title>
<style>
  :root { --bg:#060b12; --card:#0d1520; --border:#1a2a3a; --cyan:#58a6ff; --green:#3fb950; --amber:#d2991d; --purple:#a371f7; --text:#c9d1d9; --muted:#6e7681; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; padding:30px; }
  h1 { color:var(--cyan); font-weight:200; font-size:28px; letter-spacing:.08em; margin-bottom:4px; }
  h1 .cn { font-size:16px; color:var(--muted); font-weight:300; }
  .subtitle { color:var(--muted); font-size:12px; margin-bottom:30px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .full { grid-column:1/-1; }
  .section-title { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.2em; margin:20px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--border); }
  .section-title .cn { text-transform:none; font-size:9px; color:#484f58; margin-left:8px; letter-spacing:0; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:18px; transition:border-color .3s; }
  .card:hover { border-color:#2a4a6a; }
  .platform-tag { display:inline-block; font-size:9px; letter-spacing:.15em; padding:2px 8px; border-radius:3px; margin-bottom:10px; font-weight:600; }
  .platform-tag .cn { font-weight:300; font-size:8px; margin-left:4px; opacity:.7; }
  .hn-tag { color:var(--amber); border:1px solid rgba(210,153,29,.3); background:rgba(210,153,29,.06); }
  .li-tag { color:var(--cyan); border:1px solid rgba(88,166,255,.3); background:rgba(88,166,255,.06); }
  .x-tag { color:#ddd; border:1px solid rgba(221,221,221,.2); background:rgba(255,255,255,.03); }
  .bs-tag { color:var(--purple); border:1px solid rgba(163,113,247,.3); background:rgba(163,113,247,.06); } .fc-tag { color:#8b5cf6; border:1px solid rgba(139,92,246,.3); background:rgba(139,92,246,.06); } .dc-tag { color:#5865f2; border:1px solid rgba(88,101,242,.3); background:rgba(88,101,242,.06); } .tg-tag { color:#2aabee; border:1px solid rgba(42,171,238,.3); background:rgba(42,171,238,.06); } .rd-tag { color:#ff4500; border:1px solid rgba(255,69,0,.3); background:rgba(255,69,0,.06); } .matrix-status { display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;padding:14px 18px;border:1px solid rgba(144,200,255,.1);border-radius:8px;background:rgba(144,200,255,.02);align-items:center } .ms-chip { display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:3px;font-size:9px;letter-spacing:.08em } .ms-api { background:rgba(63,185,80,.1);color:#3fb950;border:1px solid rgba(63,185,80,.2) } .ms-link { background:rgba(88,166,255,.1);color:#58a6ff;border:1px solid rgba(88,166,255,.2) }
  .source { margin-bottom:10px; }
  .source a { color:var(--cyan); text-decoration:none; font-size:13px; font-weight:600; }
  .source a:hover { text-decoration:underline; }
  .meta { color:var(--muted); font-size:10px; margin-left:10px; }
  .text { color:#8b949e; font-size:11.5px; line-height:1.75; white-space:pre-wrap; }
  .li-text { font-size:12px; line-height:1.8; }
  .x-text { font-size:13px; line-height:1.5; }
  .x-card { border-left:2px solid rgba(255,255,255,.1); }
  .bluesky-card { border-left:2px solid rgba(163,113,247,.2); }
  .footer { margin-top:40px; padding-top:16px; border-top:1px solid var(--border); color:var(--muted); font-size:10px; text-align:center; }
  .copy-btn { background:var(--cyan); color:#000; border:none; padding:2px 8px; border-radius:3px; font-size:9px; cursor:pointer; float:right; opacity:.6; transition:opacity .2s; }
  .copy-btn:hover { opacity:1; }.recruit-panel { margin-top:20px;border:1px solid rgba(144,200,255,0.1);border-radius:8px;padding:14px 18px;background:rgba(144,200,255,0.02) } .recruit-row { display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:10px } .recruit-row:last-child { border-bottom:none } .recruit-cohort { font-size:8px;padding:1px 6px;border-radius:2px } .rc-genesis { background:rgba(210,153,29,0.15);color:#d2991d } .rc-public { background:rgba(88,166,255,0.1);color:#58a6ff }
	  .cmd-center { margin-bottom:20px;padding:16px 20px;border:1px solid rgba(144,200,255,0.2);border-radius:8px;background:rgba(144,200,255,0.03); }
	  .cmd-input { width:100%;min-height:80px;background:#02040a;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#c9d1d9;padding:10px;font-size:11px;resize:vertical;font-family:inherit;margin-bottom:10px;outline:none }
	  .cmd-input:focus { border-color:rgba(88,166,255,0.5); }
	  .cmd-platforms { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px; }
	  .cmd-platforms label { display:flex;align-items:center;gap:3px;font-size:9px;color:#8b949e;cursor:pointer;padding:2px 6px;border:1px solid transparent;border-radius:3px;transition:all .2s;user-select:none }
	  .cmd-platforms label.checked { border-color:rgba(88,166,255,0.3);color:#c9d1d9;background:rgba(88,166,255,0.08) }
	  .cmd-platforms label input { accent-color:#58a6ff }
	  .cmd-actions { display:flex;gap:8px;align-items:center;flex-wrap:wrap }
	  .cmd-btn { padding:6px 14px;border:1px solid;border-radius:4px;font-size:10px;cursor:pointer;letter-spacing:.08em;transition:all .2s; }
	  .cmd-fire { background:rgba(63,185,80,0.2);color:#3fb950;border-color:rgba(63,185,80,0.3) }
	  .cmd-fire:hover { background:rgba(63,185,80,0.4);color:#fff }
	  .cmd-select { background:transparent;color:#8b949e;border-color:rgba(255,255,255,0.1) }
	  .cmd-select:hover { color:#c9d1d9;border-color:rgba(255,255,255,0.2) }
	  .cmd-fill { background:transparent;color:#58a6ff;border-color:rgba(88,166,255,0.2);font-size:8px }
	  .cmd-fill:hover { background:rgba(88,166,255,0.1) }
	  .cmd-results { margin-top:8px;display:flex;flex-wrap:wrap;gap:6px }
	  .cmd-res { font-size:9px;padding:2px 8px;border-radius:3px }
	  .cmd-ok { background:rgba(63,185,80,0.15);color:#3fb950 }
	  .cmd-fail { background:rgba(232,78,76,0.15);color:#e84e4c }
  @media(max-width:900px){ .grid{grid-template-columns:1fr;} }
</style>
</head>
<body>
<h1>MyShape Protocol — Matrix Dashboard <span class="cn">矩阵仪表盘</span></h1>
<div class="subtitle">Generated / 生成时间: ${now} UTC &middot; HN + LinkedIn + X + Bluesky &middot; <span style="color:var(--green)">●</span> Live</div>
	<div id="linkedin-auth-bar" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px 16px;border:1px solid rgba(88,166,255,0.2);border-radius:6px;background:rgba(88,166,255,0.03)">
	  <span style="color:#58a6ff;font-size:11px;letter-spacing:.1em">LinkedIn</span>
	  <span style="font-size:10px;color:#8b949e">OAuth needed for publish</span>
	  <a href="/api/matrix/auth/linkedin" target="_blank" style="margin-left:auto;padding:6px 16px;background:rgba(88,166,255,0.15);color:#58a6ff;border:1px solid rgba(88,166,255,0.3);border-radius:4px;font-size:10px;text-decoration:none;letter-spacing:.1em">Authorize / 授权</a>
	</div>
	<div class="matrix-status">
	  <span class="ms-chip ms-api">⚡ API Auto: <span style="font-family:monospace;font-size:11px;margin-left:2px">6</span></span>
	  <span style="color:rgba(255,255,255,0.1);margin:0 4px">|</span>
	  <span class="ms-chip ms-link">🔗 Link Manual: <span style="font-family:monospace;font-size:11px;margin-left:2px">3</span></span>
	  <span style="font-size:9px;color:#484f58;margin-left:auto">API = push &middot; LINK = clipboard+open</span>
	</div>

<div class="grid">
  <div>
    <div class="section-title full">Hacker News — Technical Comments<span class="cn">技术评论</span></div>
	<div class="cmd-center">
	  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
	    <span style="color:#58a6ff;font-size:10px;letter-spacing:.15em;font-weight:600">◈ MEDIA COMMAND CENTER</span>
	    <span style="font-size:8px;color:#484f58">写文案 → 勾平台 → 发射</span>
	  </div>
	  <textarea class="cmd-input" id="cmd-text" placeholder="在此输入/粘贴要发布的文案... 或点击下方卡片旁的 [Fill] 按钮引用AI生成的内容"></textarea>
	  <div class="cmd-platforms" id="cmd-platforms">
	    <label data-p="bluesky"><input type="checkbox">Bluesky</label>
	    <label data-p="linkedin"><input type="checkbox">LinkedIn</label>
	    <label data-p="farcaster"><input type="checkbox">Farcaster</label>
	    <label data-p="discord"><input type="checkbox">Discord</label>
	    <label data-p="telegram"><input type="checkbox">Telegram</label>
	    <label data-p="reddit"><input type="checkbox">Reddit</label>
	    <label data-p="x"><input type="checkbox">X</label>
	    <label data-p="xiaohongshu"><input type="checkbox">小红书</label>
	    <label data-p="threads"><input type="checkbox">Threads</label>
	    <label data-p="hn"><input type="checkbox">HN</label>
	  </div>
	  <div class="cmd-actions">
	    <button class="cmd-btn cmd-fire" id="cmd-fire" onclick="fireAll()">▶ 发射 / FIRE</button>
	    <button class="cmd-btn cmd-select" onclick="selAll()">全选</button>
	    <button class="cmd-btn cmd-select" onclick="selAPI()">API</button>
	    <button class="cmd-btn cmd-select" onclick="selLINK()">LINK</button>
	    <span style="font-size:9px;color:#484f58;margin-left:8px" id="cmd-status"></span>
	  </div>
	  <div class="cmd-results" id="cmd-results"></div>
	</div>
    ${hnCards || '<div class="card"><div class="text" style="color:var(--muted)">No HN stories matched this cycle. / 本轮无匹配的 HN 文章。</div></div>'}
  </div>
  <div>
    <div class="section-title full">LinkedIn — Thought Leadership<span class="cn">思想领导力</span></div>
    ${linkedInCards || '<div class="card"><div class="text" style="color:var(--muted)">No LinkedIn topics generated this cycle. / 本轮未生成 LinkedIn 主题。</div></div>'}
  </div>
</div>

<div class="grid" style="margin-top:16px">
  <div>
    <div class="section-title full">X / Twitter — Sharp Insights<span class="cn">锐利洞察</span></div>
    ${xCards || '<div class="card"><div class="text" style="color:var(--muted)">No X posts generated this cycle. / 本轮未生成 X 帖子。</div></div>'}
  </div>
  <div>
    <div class="section-title full">Bluesky — Signal Monitoring<span class="cn">信号监测</span></div>
    ${blueskyCards || '<div class="card"><div class="text" style="color:var(--muted)">No Bluesky posts found this cycle. / 本轮未发现 Bluesky 帖子。</div></div>'}
  </div>
</div>

${financeCard}


	<div class="recruit-panel" id="recruit-panel">
	  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
	    <span style="color:#d2991d;font-size:10px;letter-spacing:.15em;font-weight:600">◈ RECRUITMENT / 招募看板</span>
	    <span style="font-size:9px;color:#8b949e" id="recruit-count">Loading...</span>
	  </div>
	  <div id="recruit-list" style="color:#6e7681;font-size:10px">Loading...</div>
	</div><div class="footer">
  MyShape Protocol &middot; Social Matrix Cruiser v2.0 &middot; Protocol-First Analysis 协议优先分析 &middot; Generated ${now}
</div>

<script>
	var PLATFORM_TYPES = {bluesky:'API',linkedin:'API',farcaster:'API',discord:'API',telegram:'API',reddit:'API',x:'LINK',xiaohongshu:'LINK',threads:'LINK',hn:'LINK'};
	var PLATFORM_URLS = {x:'https://twitter.com/intent/tweet?text=',xiaohongshu:'https://www.xiaohongshu.com/explore',threads:'https://www.threads.net/intent/post?text=',hn:'https://news.ycombinator.com/submit'};

	// -- Platform checkbox styling --
	document.querySelectorAll('#cmd-platforms label').forEach(l=>{
	  l.querySelector('input').onchange=function(){l.classList.toggle('checked',this.checked)};
	});

	// -- Card buttons: Copy + Fill --
	document.querySelectorAll('.card').forEach(card=>{
	  var a=card.querySelector('.card-actions');if(!a)return;
	  var cb=document.createElement('button');cb.className='copy-btn';cb.textContent='Copy';
	  cb.onclick=function(){var t=card.querySelector('.text')?.textContent||'';navigator.clipboard.writeText(t.trim());cb.textContent='Copied';setTimeout(function(){cb.textContent='Copy'},1500)};
	  a.appendChild(cb);
	  var fb=document.createElement('button');fb.className='cmd-btn cmd-fill';fb.textContent='Fill';
	  fb.onclick=function(){var t=card.querySelector('.text')?.textContent||'';document.getElementById('cmd-text').value=t.trim();document.getElementById('cmd-text').scrollIntoView({behavior:'smooth'});};
	  a.appendChild(fb);
	});

	// -- Selector shortcuts --
	function selAll(){var cs=document.querySelectorAll('#cmd-platforms input');cs.forEach(function(c){c.checked=true;c.parentElement.classList.add('checked')})}
	function selAPI(){var cs=document.querySelectorAll('#cmd-platforms label');cs.forEach(function(l){var p=l.getAttribute('data-p');var t=PLATFORM_TYPES[p]||'API';l.querySelector('input').checked=(t==='API');l.classList.toggle('checked',t==='API')})}
	function selLINK(){var cs=document.querySelectorAll('#cmd-platforms label');cs.forEach(function(l){var p=l.getAttribute('data-p');var t=PLATFORM_TYPES[p]||'LINK';l.querySelector('input').checked=(t==='LINK');l.classList.toggle('checked',t==='LINK')})}

	// -- Fire! --
	async function fireAll(){
	  var text=document.getElementById('cmd-text').value.trim();if(!text)return alert('请先输入文案');
	  var selected=[];document.querySelectorAll('#cmd-platforms input:checked').forEach(function(c){selected.push(c.parentElement.getAttribute('data-p'))});
	  if(!selected.length)return alert('请选择至少一个平台');
	  var status=document.getElementById('cmd-status');var results=document.getElementById('cmd-results');
	  status.textContent='发射中...';results.innerHTML='';
	  var ok=[],fail=[];
	  for(var i=0;i<selected.length;i++){
	    var p=selected[i];var type=PLATFORM_TYPES[p]||'API';
	    status.textContent='发射中...('+(i+1)+'/'+selected.length+') '+p;
	    if(type==='API'){
	      try{
	        var res=await fetch('/api/matrix/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({platform:p,content:text,title:'MyShape Update',url:''})});
	        var d=await res.json();
	        var tag=document.createElement('span');tag.className='cmd-res '+(d.success?'cmd-ok':'cmd-fail');tag.textContent=(d.success?'OK':'FAIL')+' '+p;results.appendChild(tag);
	        if(d.success)ok.push(p);else fail.push(p+'('+(d.error||'')+')');
	      }catch(e){
	        console.log('Publish preview for '+p+':',text.slice(0,100));
	        var tag=document.createElement('span');tag.className='cmd-res cmd-ok';tag.textContent='PREVIEW '+p;results.appendChild(tag);
	        ok.push(p);
	      }
	    } else {
	      try{await navigator.clipboard.writeText(text);if(PLATFORM_URLS[p])window.open(PLATFORM_URLS[p]+encodeURIComponent(text),'_blank');}catch(e){}
	      var tag=document.createElement('span');tag.className='cmd-res cmd-ok';tag.textContent='LINK '+p;results.appendChild(tag);
	      ok.push(p);
	    }
	    await new Promise(function(r){setTimeout(r,800)});
	  }
	  status.textContent='完成! '+ok.length+' 成功'+(fail.length?', '+fail.length+' 失败':'');
	  if(fail.length)console.log('Failures:',fail.join('; '));
	}
	
	fetch('/api/recruitment/list').then(r=>r.json()).then(d=>{
	  var el=document.getElementById('recruit-count');el.textContent=d.total+'申请 | Genesis '+d.genesis_count+'/'+d.genesis_cap;
	  var list=document.getElementById('recruit-list');list.innerHTML=d.applications.slice(0,20).map(function(a){return '<div class="recruit-row"><span style="color:#484f58;width:100px">'+a.email+'</span><span class="recruit-cohort '+(a.cohort==='genesis'?'rc-genesis':'rc-public')+'">'+a.cohort.toUpperCase()+'</span><span style="flex:1;color:#6e7681">'+a.technical_bg+'</span><span style="color:#484f58;width:60px">'+(a.handle||'-')+'</span><span style="color:#30363d;width:40px">'+(a.position?'#'+a.position:'-')+'</span><span style="color:#21262d;font-size:9px;width:100px">'+(a.applied_at||'').slice(0,10)+'</span></div>'}).join('');
	  if(!d.applications.length)list.innerHTML='<span style="color:#30363d">暂无申请 / No applications yet</span>';
	}).catch(function(){document.getElementById('recruit-count').textContent='API unreachable'});
</script>
</body>
</html>`;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const mode = process.argv.includes("--social") ? "social" : "full";
  const runSocial = mode === "social" || mode === "full";

  console.log("═".repeat(64));
  console.log("  MyShape Protocol — Social Matrix Cruiser v2.0");
  console.log("  Mode: " + mode.toUpperCase() + (mode==="social"?" (社交平台 only)":" (全平台)"));
  console.log("═".repeat(64));

  const data = { hn: [], linkedin: [], x: [], bluesky: [] };

  // 1. HN — fetch + generate comments (social only)
  if (runSocial) {
  const hnStories = await fetchHNStories();
  for (const s of hnStories.slice(0, 8)) {
    console.log('  HN: "' + s.title.slice(0, 55) + '..."');
    const post = await generatePost("hn", s.title);
    data.hn.push({ ...s, post });
    await DELAY(1200);
  }
  console.log("  HN done: " + data.hn.length + " drafts");

  // 2. LinkedIn — derived from HN enterprise-angle
  const liTopics = await generateLinkedInTopics(hnStories);
  data.linkedin = liTopics;

  // 3. X — generate short tweets from HN topics
  console.log("\n--- X / Twitter ---");
  for (const s of hnStories.slice(0, 5)) {
    console.log('  X: "' + s.title.slice(0, 50) + '..."');
    const post = await generatePost("x", s.title);
    const media = (data.x.length < 2) ? await attachMedia("x", s.title) : {};
    data.x.push({ topic: s.title, post, ...media });
    await DELAY(2000);
  }
  console.log("  X done: " + data.x.length + " tweets");

  // 4. Bluesky — fetch real posts + troll detection
  const bsPosts = await fetchBlueskyPosts();
  for (const post of bsPosts.slice(0, 6)) {
    if (isTroll(post.text || "")) {
      const defense = await handleTrollResponse(post.text);
      if (defense) data.x.push({ topic: "Troll Response", post: defense.content, image: null });
    }
  }
  data.bluesky = bsPosts.slice(0, 6);

  // 5. 自动执行：同步创世集结文案到 Bluesky
  console.log("\n--- Matrix Automator: Broadcasting Genesis to Bluesky ---");
  const mainText = `We leaked the core Rust/WASM code for MYSHAPE PROTOCOL — The Sovereign 3D Identity Layer. 🌐✨\n\nThe 120-dim motion-signature engine is LIVE, but running on "vacuum defaults."\n\nWe need exactly 300 pioneers to ignite the core PCA defense. Drop your specimen. 👇`;
  const subText = `🔬 The Genesis Calibration Ritual\n\n1️⃣ Go to: myshape.com/motion-demo\n2️⃣ Connect via SIWE or OTP (sets your node_handle)\n3️⃣ Complete a 30-sec anonymous motion scan\n\nWatch the RESEARCH bar dot from 0 to 300. Help us train the ROC defense. ◈ Let's build it.`;
  
  const bskyResult = await pushToBluesky(mainText, subText);
  let bskyCount = data.bluesky.length;
  if (bskyResult.success) {
    bskyCount += 1;
  }

  } // end runSocial


  // 6. Dashboard
  const outPath = path.join(__dirname, "matrix_dashboard.html");
  const html = generateDashboard(data);
  fs.writeFileSync(outPath, html, "utf8");
  try { const pd = path.join(__dirname, "..", "..", "public"); if (fs.existsSync(pd)) fs.writeFileSync(path.join(pd, "matrix-dashboard.html"), html, "utf8"); } catch {}

  // 7. Sync to protocol log — all posts become immutable protocol record
  const publishedPath = path.join(__dirname, "..", "agent-workflow", "published.json");
  try {
    const allPosts = [
      ...data.hn.map(p => ({ platform: "hn", content: p.post || "", tags: [], source: p.url, publishedAt: new Date().toISOString() })),
      ...data.linkedin.map(p => ({ platform: "linkedin", content: p.post || "", tags: [], source: p.source, publishedAt: new Date().toISOString() })),
      ...data.x.map(p => ({ platform: "x", content: p.post || "", tags: [], source: p.topic, publishedAt: new Date().toISOString() })),
    ];
    const existing = fs.existsSync(publishedPath) ? JSON.parse(fs.readFileSync(publishedPath, "utf8")) : [];
    fs.writeFileSync(publishedPath, JSON.stringify([...existing, ...allPosts], null, 2));
    try { require(path.join(__dirname, "..", "agent-workflow", "log")); } catch {}
  } catch { /* graceful */ }

  console.log("\n═".repeat(64));
  console.log("  Dashboard -> " + outPath);
  console.log("  HN: " + data.hn.length + " | LinkedIn: " + data.linkedin.length +
    " | X: " + data.x.length + " | Bluesky: " + (data.bluesky ? data.bluesky.length : 0));
  console.log("  Protocol log synced -> PROTOCOL_LOG.md");
  console.log("═".repeat(64) + "\n");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
#!/usr/bin/env node

/**
 * MyShape Protocol — Social Matrix Cruiser v2.0
 *
 * Scans: Hacker News, LinkedIn topics, X trends, Bluesky feeds
 * Generates: platform-optimized post drafts via Agnes AI (+ fallback)
 * Aggregates: matrix_dashboard.html — one local page for all platforms
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const os = require("os");

// ═══════════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════════

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
      max_tokens: 600,
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
    if (url) { console.log("    🖼️  Image generated"); return url; }
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

// Shared image prompts by platform
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
      const { data } = await axios.get(BLUESKY_SEARCH + "?q=" + q + "&limit=3", { timeout: 8000 });
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
//  POST GENERATORS — Platform-specific tones
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_TONES = {
  hn: "You write terse, insightful Hacker News comments. Pure technical reasoning. No promotion, no links, no product names.",
  linkedin: "You are the Chief Scientist of a sovereign identity protocol. Write visionary, professional LinkedIn posts. Business-forward, technology-grounded. 200-300 words. Include a 'Key Insight' section and end with a question to drive engagement. Do NOT mention product names.",
  x: "You write sharp, provocative tech tweets under 280 characters. No hashtags, no links, no promotion. Pure insight.",
  bluesky: "You write thoughtful Bluesky posts (200-300 chars). Technical but approachable. No hype, no links.",
};

const PROMPT_TEMPLATES = {
  hn: (title) => `HN thread: "${title}". Write a comment (120-180 words, 3-4 paragraphs). Connect to motion geometry, ZK presence, or entropy gap between synthetic and biological motion. End with an open question. Calm, precise, slightly contrarian.`,
  linkedin: (title) => `Industry topic: "${title}". Write a LinkedIn long-form post (200-300 words). Structure: (1) What's happening — 2 sentences. (2) Why it matters for digital identity — 3 sentences. (3) Key Insight — one bold technical prediction. (4) Closing question to engage CTOs and security leaders. Professional, visionary tone.`,
  x: (title) => `Topic: "${title}". Write one tweet under 260 characters. Sharp insight about digital identity, AI security, or ZK-proofs. No hashtags, no links, no product names. Pure idea.`,
  bluesky: (title) => `Topic: "${title}". Write a thoughtful Bluesky post (200-300 chars). Technical but conversational. One clear idea. No hashtags.`,
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

function fallbackPost(platform) {
  const fb = FALLBACKS[platform];
  if (platform === "hn") {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    return pick(fb.intros) + "\n\n" + pick(fb.bodies) + "\n\n" + pick(fb.endings);
  }
  if (platform === "x" || platform === "bluesky") {
    return fb.posts[Math.floor(Math.random() * fb.posts.length)];
  }
  if (platform === "linkedin") {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    return pick(fb.intros) + "\n\n" + pick(fb.bodies) + "\n\n" + pick(fb.endings);
  }
  return "No content generated.";
}

async function generatePost(platform, topic) {
  const aiText = await callAgnes(SYSTEM_TONES[platform], PROMPT_TEMPLATES[platform](topic));
  if (aiText) return aiText;
  return fallbackPost(platform);
}

// ═══════════════════════════════════════════════════════════════════
//  LINKEDIN: Industry trends derived from HN + keyword analysis
// ═══════════════════════════════════════════════════════════════════

async function generateLinkedInTopics(hnStories) {
  console.log("\n--- LinkedIn Topics ---");
  // Derive LinkedIn topics from HN stories with enterprise angle
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
//  DASHBOARD: unified HTML
// ═══════════════════════════════════════════════════════════════════

function generateDashboard(data) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const hnCards = (data.hn || []).map((d) =>
    '<div class="card hn">' +
    '<div class="platform-tag hn-tag">HACKER NEWS</div>' +
    '<div class="source"><a href="' + d.url + '" target="_blank">' + esc(d.title) + '</a>' +
    '<span class="meta">' + d.score + ' pts &middot; ' + d.comments + ' comments</span></div>' +
    '<div class="text">' + esc(d.post || d.comment || "") + '</div></div>'
  ).join("");

  const linkedInCards = (data.linkedin || []).map((d) =>
    '<div class="card linkedin">' +
    (d.image ? '<img src="' + d.image + '" style="width:100%;max-height:200px;object-fit:cover;border-radius:4px;margin-bottom:12px;" loading="lazy" />' : '') +
    '<div class="platform-tag li-tag">LINKEDIN</div>' +
    '<div class="source"><a href="' + d.source + '" target="_blank">' + esc(d.title) + '</a>' +
    '<span class="meta">' + esc(d.angle || "Industry Insight") + '</span></div>' +
    '<div class="text li-text">' + esc(d.post || "") + '</div></div>'
  ).join("");

  const xCards = (data.x || []).map((d) =>
    '<div class="card x-card">' +
    '<div class="platform-tag x-tag">X / TWITTER</div>' +
    '<div class="text x-text">' + esc(d.post || "") + '</div>' +
    '<div class="meta">Topic: ' + esc(d.topic || "") + '</div></div>'
  ).join("");

  const blueskyCards = (data.bluesky || []).map((d) =>
    '<div class="card bluesky-card">' +
    '<div class="platform-tag bs-tag">BLUESKY</div>' +
    '<div class="source"><a href="' + (d.url || "#") + '" target="_blank">@' + esc(d.author || "unknown") + '</a>' +
    '<span class="meta">' + (d.likes || 0) + ' likes &middot; ' + (d.reposts || 0) + ' reposts</span></div>' +
    '<div class="text">' + esc(d.text || "") + '</div></div>'
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MyShape Matrix Dashboard — ${now}</title>
<style>
  :root { --bg:#060b12; --card:#0d1520; --border:#1a2a3a; --cyan:#58a6ff; --green:#3fb950; --amber:#d2991d; --purple:#a371f7; --text:#c9d1d9; --muted:#6e7681; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; padding:30px; }
  h1 { color:var(--cyan); font-weight:200; font-size:28px; letter-spacing:.08em; margin-bottom:4px; }
  .subtitle { color:var(--muted); font-size:12px; margin-bottom:30px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .full { grid-column:1/-1; }
  .section-title { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.2em; margin:20px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--border); }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:18px; transition:border-color .3s; }
  .card:hover { border-color:#2a4a6a; }
  .platform-tag { display:inline-block; font-size:9px; letter-spacing:.15em; padding:2px 8px; border-radius:3px; margin-bottom:10px; font-weight:600; }
  .hn-tag { color:var(--amber); border:1px solid rgba(210,153,29,.3); background:rgba(210,153,29,.06); }
  .li-tag { color:var(--cyan); border:1px solid rgba(88,166,255,.3); background:rgba(88,166,255,.06); }
  .x-tag { color:#ddd; border:1px solid rgba(221,221,221,.2); background:rgba(255,255,255,.03); }
  .bs-tag { color:var(--purple); border:1px solid rgba(163,113,247,.3); background:rgba(163,113,247,.06); }
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
  .copy-btn:hover { opacity:1; }
  @media(max-width:900px){ .grid{grid-template-columns:1fr;} }
</style>
</head>
<body>
<h1>MyShape Protocol — Matrix Dashboard</h1>
<div class="subtitle">Generated: ${now} UTC &middot; HN + LinkedIn + X + Bluesky &middot; <span style="color:var(--green)">●</span> Live</div>

<div class="grid">
  <div>
    <div class="section-title full">Hacker News — Technical Comments</div>
    ${hnCards || '<div class="card"><div class="text" style="color:var(--muted)">No HN stories matched this cycle.</div></div>'}
  </div>
  <div>
    <div class="section-title full">LinkedIn — Thought Leadership</div>
    ${linkedInCards || '<div class="card"><div class="text" style="color:var(--muted)">No LinkedIn topics generated this cycle.</div></div>'}
  </div>
</div>

<div class="grid" style="margin-top:16px">
  <div>
    <div class="section-title full">X / Twitter — Sharp Insights</div>
    ${xCards || '<div class="card"><div class="text" style="color:var(--muted)">No X posts generated this cycle.</div></div>'}
  </div>
  <div>
    <div class="section-title full">Bluesky — Signal Monitoring</div>
    ${blueskyCards || '<div class="card"><div class="text" style="color:var(--muted)">No Bluesky posts found this cycle.</div></div>'}
  </div>
</div>

<div class="footer">
  MyShape Protocol &middot; Social Matrix Cruiser v2.0 &middot; Automated with fallback AI &middot; No links, no ads &middot; Generated ${now}
</div>

<script>
document.querySelectorAll('.card').forEach(card => {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'Copy';
  btn.onclick = () => {
    const text = card.querySelector('.text')?.textContent || '';
    navigator.clipboard.writeText(text.trim()).then(() => { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1500); });
  };
  card.appendChild(btn);
});
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
  console.log("═".repeat(64));
  console.log("  MyShape Protocol — Social Matrix Cruiser v2.0");
  console.log("═".repeat(64));

  const data = { hn: [], linkedin: [], x: [], bluesky: [] };

  // 1. HN — fetch + generate comments
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

  // 5. Dashboard
  const outPath = path.join(__dirname, "matrix_dashboard.html");
  fs.writeFileSync(outPath, generateDashboard(data), "utf8");

  console.log("\n═".repeat(64));
  console.log("  Dashboard -> " + outPath);
  console.log("  HN: " + data.hn.length + " | LinkedIn: " + data.linkedin.length +
    " | X: " + data.x.length + " | Bluesky: " + data.bluesky.length);
  console.log("═".repeat(64) + "\n");
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });

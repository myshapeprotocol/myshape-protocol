// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — HuggingFace + GitHub Discussion Publisher
// ═══════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";
const proxyUrl = process.env.HTTPS_PROXY || "http://127.0.0.1:15236";
setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } }));

function loadEnv(path) {
  const c = readFileSync(path, "utf-8"), env = {};
  for (const l of c.split("\n")) { const t = l.trim(); if (!t || t.startsWith("#")) continue; const eq = t.indexOf("="); if (eq === -1) continue; env[t.slice(0, eq)] = t.slice(eq + 1); }
  return env;
}
const env = loadEnv(".env.local");

// ── GitHub Discussion ─────────────────────────────────────────────
async function publishGitHubDiscussion() {
  const GITHUB = "https://api.github.com";
  const REPO = "myshapeprotocol/myshape-protocol";
  const CATEGORY_ID = "DIC_kwDOTFMrJs4CRVHw"; // 💡 Ideas & Suggestions — adjust if wrong

  const body = `## The Day Identity Stopped Meaning Presence

Twenty years ago, seeing someone on screen meant they were probably there. Today, it doesn't.

Every authentication system asks: "Who are you?" Almost none asks: "Are you continuously there?"

Identity is a snapshot. Continuity is a trajectory. In a world where AI can generate snapshots at will, the trajectory is the only thing that cannot be faked.

### What broke

The link between identity and presence. Historically, proving identity also proved presence. AI decoupled them.

### Why now

1. AI agents with signing authority need to prove they are the *same agent* across time
2. Remote work is permanent — million-dollar decisions over unverifiable video
3. Deepfakes are moving to real-time

### What we are doing

We are The Continuity Lab — investigating whether continuity can be made as measurable and verifiable as a cryptographic signature. We have run 576 experiments across 4 independent evidence engines. All specifications are open. All code is Apache 2.0.

This is not a product. It is a research question.

We would love to hear your thoughts — especially if you have encountered the continuity problem in your own work.

Read the full essay: https://www.myshape.com/continuity`;

  const res = await fetch(`${GITHUB}/repos/${REPO}/discussions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title: "The Day Identity Stopped Meaning Presence",
      body,
      category_id: CATEGORY_ID,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // If category is wrong, try another common one
    if (res.status === 422) {
      // Try without category — let API auto-assign
      const res2 = await fetch(`${GITHUB}/repos/${REPO}/discussions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title: "The Day Identity Stopped Meaning Presence",
          body,
        }),
      });
      if (!res2.ok) throw new Error(`GitHub Discussion (retry): ${res2.status} ${await res2.text()}`);
      const d2 = await res2.json();
      console.log(`[github] ✅ Discussion: ${d2.html_url}`);
      return d2.html_url;
    }
    throw new Error(`GitHub Discussion: ${res.status} ${err}`);
  }

  const data = await res.json();
  console.log(`[github] ✅ Discussion: ${data.html_url}`);
  return data.html_url;
}

// ── HuggingFace Discussion ────────────────────────────────────────
async function publishHuggingFace() {
  const HF = "https://huggingface.co/api";
  const REPO = "TheContinuityLab/myshape-576";

  const body = `## The Day Identity Stopped Meaning Presence

Twenty years ago, seeing someone on screen meant they were probably there. Today, it doesn't.

Every authentication system asks: "Who are you?" Almost none asks: "Are you continuously there?"

Identity is a snapshot. Continuity is a trajectory. In a world where AI can generate snapshots at will, the trajectory is the only thing that cannot be faked.

### What we are investigating

We are The Continuity Lab. We have run 576 experiments across 4 evidence engines, and this dataset contains the raw results. Our question: can continuity — the property that the same entity has been continuously present — be made as verifiable as a cryptographic signature?

The dataset includes IMU samples, camera samples, metadata, and engine-specific logs from all 576 runs.

All specifications are open. CPS-0001 is published at https://www.myshape.com/research/notes/008-continuity-protocol-core

Read the full narrative: https://www.myshape.com/continuity`;

  const res = await fetch(`${HF}/discussions/${REPO}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "The Day Identity Stopped Meaning Presence",
      description: body,
    }),
  });

  if (!res.ok) throw new Error(`HuggingFace: ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log(`[huggingface] ✅ Discussion: ${data.url || data._id || "created"}`);
  return data;
}

// ── MAIN ──────────────────────────────────────────────────────────
async function main() {
  // GitHub
  try {
    console.log("[github] Creating discussion...");
    await publishGitHubDiscussion();
  } catch (e) {
    console.log(`[github] ✗ ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 2000));

  // HuggingFace
  try {
    console.log("[huggingface] Creating discussion...");
    await publishHuggingFace();
  } catch (e) {
    console.log(`[huggingface] ✗ ${e.message}`);
  }
}

main();

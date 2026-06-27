#!/usr/bin/env node
/**
 * Agent Workflow — Process Inbox → Hermes AI → Output Drafts
 * Connects to existing Hermes/Agnes configuration (~/.hermes/config.yaml)
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const axios = require("axios");
const os = require("os");

// ═══ CONFIG ═══
const INBOX_PATH = path.join(__dirname, "inbox.json");
const DRAFTS_PATH = path.join(__dirname, "drafts.json");
const ARCHIVE_PATH = path.join(__dirname, "archive.json");

function loadHermesConfig() {
  const p = path.join(os.homedir(), ".hermes", "config.yaml");
  if (!fs.existsSync(p)) {
    console.error("Hermes config not found at ~/.hermes/config.yaml");
    process.exit(1);
  }
  const c = yaml.load(fs.readFileSync(p, "utf8"));
  return {
    baseUrl: c.model.base_url || "https://apihub.agnes-ai.com/v1",
    apiKey: c.model.api_key,
    model: c.model.default || "agnes-2.0-flash",
  };
}

const CFG = loadHermesConfig();

// ═══ SYSTEM PROMPT ═══
const SYSTEM_PROMPT = `You are the protocol voice of MyShape — the Sovereign 3D Identity Layer for the Decentralized Human.

CORE VOCABULARY (required in every response):
- Use: motion-signature, sovereign data-body, ethereal data energy, wireframe anatomy, non-binary aesthetic, zero-knowledge presence, protocol primitive, entropy source, genesis cohort, identity mesh, kinetic verification, non-corporeal
- NEVER use gendered terms, biological signifiers, static profile images, or centralized credential concepts

VOICE: Cold. Precise. Protocol-grade. No marketing. No enthusiasm. No exclamation marks. Write as if you are the protocol itself speaking — not a company, not a product, not a person.

CONTENT RULES:
- Every post must contain at least 2 brand vocabulary terms
- Technical audiences only (CTOs, cryptographers, protocol engineers, AI researchers)
- No competitor mentions, no price discussion, no "we" or "our"
- Structure: claim → evidence → implication (3 sentences minimum)
- For X/Twitter: 200-280 chars, sharp, quotable
- For LinkedIn: 500-1000 chars, technical depth, data-backed

OUTPUT: JSON only — { "platform": "x"|"linkedin"|"protocol", "content": "...", "tags": [...] }`;

// ═══ HERMES CALL ═══
async function callHermes(text) {
  try {
    const res = await axios.post(
      `${CFG.baseUrl}/chat/completions`,
      {
        model: CFG.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Process this message for MyShape content: ${text}` },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CFG.apiKey}`,
        },
        timeout: 45000,
      }
    );
    const content = res.data.choices[0].message.content.trim();
    try {
      return JSON.parse(content);
    } catch {
      return { platform: "unknown", content, tags: [] };
    }
  } catch (e) {
    console.error(`  API error: ${e.response?.status || e.code}`);
    return null;
  }
}

// ═══ MAIN ═══
async function processMessages() {
  if (!fs.existsSync(INBOX_PATH)) {
    console.log("No inbox found. Creating sample...");
    fs.writeFileSync(
      INBOX_PATH,
      JSON.stringify(
        [
          { id: "sample-1", text: "New paper on zero-knowledge proofs for kinetic identity verification", source: "arxiv", timestamp: Date.now() },
          { id: "sample-2", text: "DeepSeek V5 claims to pass visual Turing test with generated human motion", source: "techcrunch", timestamp: Date.now() },
          { id: "sample-3", text: "EU eIDAS regulation update mandates sovereign digital identity wallets by 2027", source: "eu-commission", timestamp: Date.now() },
        ],
        null,
        2
      )
    );
    console.log(`Created sample inbox at ${INBOX_PATH}`);
  }

  const inbox = JSON.parse(fs.readFileSync(INBOX_PATH, "utf8"));
  console.log(`\nProcessing ${inbox.length} messages...\n`);

  const drafts = [];
  const processed = [];

  for (const msg of inbox) {
    console.log(`Processing: ${msg.text.slice(0, 60)}...`);
    const result = await callHermes(msg.text);
    if (result) {
      drafts.push({ ...msg, ...result, processedAt: new Date().toISOString() });
      processed.push(msg);
      console.log(`  ✓ ${result.platform}`);
    } else {
      console.log(`  ✗ Failed`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Save drafts
  const existingDrafts = fs.existsSync(DRAFTS_PATH) ? JSON.parse(fs.readFileSync(DRAFTS_PATH, "utf8")) : [];
  const allDrafts = [...existingDrafts, ...drafts];
  fs.writeFileSync(DRAFTS_PATH, JSON.stringify(allDrafts, null, 2));
  console.log(`\n✓ ${drafts.length} drafts saved to ${DRAFTS_PATH}`);

  // Archive processed
  if (processed.length > 0) {
    const existingArchive = fs.existsSync(ARCHIVE_PATH) ? JSON.parse(fs.readFileSync(ARCHIVE_PATH, "utf8")) : [];
    fs.writeFileSync(ARCHIVE_PATH, JSON.stringify([...existingArchive, ...processed], null, 2));
    fs.writeFileSync(INBOX_PATH, JSON.stringify([], null, 2));
    console.log(`✓ ${processed.length} messages archived, inbox cleared`);
  }
}

processMessages().catch(console.error);

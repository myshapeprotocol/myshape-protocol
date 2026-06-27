#!/usr/bin/env node
/**
 * MyShape Protocol — Publish Agent
 * Reads drafts.json → confirms each → publishes via Aitoearn API
 * Archive: moves published drafts to published.json
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Sentry — error tracking for protocol operations
let Sentry = null;
try { Sentry = require("@sentry/node"); } catch { /* optional */ }

const DRAFTS_PATH = path.join(__dirname, "drafts.json");
const PUBLISHED_PATH = path.join(__dirname, "published.json");

// ═══ CONFIG ═══
// Replace with your Aitoearn API endpoint when ready
const AITOEARN_API = process.env.AITOEARN_API_URL || null;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim().toLowerCase()); }));
}

async function publishOne(draft) {
  console.log(`\n📡 PUBLISH: ${draft.platform}`);
  console.log(`   ${draft.content.slice(0, 120)}...`);
  console.log(`   Tags: ${(draft.tags || []).join(", ")}`);

  const answer = await ask("\n⚡ Publish this? [y]es / [n]o / [e]dit tags / [q]uit: ");

  if (answer === "y" || answer === "yes") {
    if (AITOEARN_API) {
      try {
        const res = await fetch(AITOEARN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: draft.platform, content: draft.content, tags: draft.tags }),
        });
        if (res.ok) {
          console.log("   ✓ Published via Aitoearn");
        } else {
          console.log(`   ⚠ Aitoearn returned ${res.status} — marked as published anyway`);
        }
      } catch (err) {
        console.log("   ⚠ Aitoearn unreachable — marked as published locally");
        if (Sentry) Sentry.captureException(err, { tags: { workflow: "publish", platform: draft.platform } });
      }
    } else {
      console.log("   💾 Dry run — marked as published (AITOEARN_API_URL not set)");
    }
    return true;
  } else if (answer === "e" || answer === "edit") {
    console.log("   (edit tags in drafts.json and re-run)");
    return false;
  } else if (answer === "q" || answer === "quit") {
    console.log("   ✗ Aborted");
    process.exit(0);
  } else {
    console.log("   ✗ Skipped");
    return false;
  }
}

async function main() {
  if (!fs.existsSync(DRAFTS_PATH)) {
    console.log("No drafts found. Run process_inbox.js first.");
    return;
  }

  const drafts = JSON.parse(fs.readFileSync(DRAFTS_PATH, "utf8"));
  if (drafts.length === 0) {
    console.log("Drafts file is empty. Run process_inbox.js first.");
    return;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  MyShape Protocol — Publish Review`);
  console.log(`  ${drafts.length} drafts pending`);
  console.log(`═══════════════════════════════════════`);

  const published = [];
  const remaining = [];

  for (const draft of drafts) {
    const ok = await publishOne(draft);
    if (ok) {
      draft.publishedAt = new Date().toISOString();
      published.push(draft);
    } else {
      remaining.push(draft);
    }
  }

  // Save published
  if (published.length > 0) {
    const existing = fs.existsSync(PUBLISHED_PATH) ? JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf8")) : [];
    fs.writeFileSync(PUBLISHED_PATH, JSON.stringify([...existing, ...published], null, 2));
    fs.writeFileSync(DRAFTS_PATH, JSON.stringify(remaining, null, 2));
    console.log(`\n✓ ${published.length} published → published.json`);
    console.log(`  ${remaining.length} remaining in drafts.json`);

    // Auto-generate protocol changelog
    try { require("./log"); } catch { console.log("  (log.js not found, skipping)"); }
  } else {
    console.log(`\n  No drafts published.`);
  }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * MyShape Protocol — Publish Logger
 * Converts published.json → PROTOCOL_LOG.md changelog
 */

const fs = require("fs");
const path = require("path");

const PUBLISHED_PATH = path.join(__dirname, "published.json");
const LOG_PATH = path.join(__dirname, "..", "..", "PROTOCOL_LOG.md");

function generate() {
  if (!fs.existsSync(PUBLISHED_PATH)) {
    console.log("No published.json found. Run publish.js first.");
    return;
  }

  const entries = JSON.parse(fs.readFileSync(PUBLISHED_PATH, "utf8"));
  if (entries.length === 0) {
    console.log("No published entries to log.");
    return;
  }

  // Group by date
  const byDate = {};
  for (const e of entries) {
    const date = (e.publishedAt || e.processedAt || "").slice(0, 10);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(e);
  }

  // Build markdown
  let md = `# MyShape Protocol — Transmission Log\n\n`;
  md += `> Auto-generated from published.json. Each entry records a protocol-grade content transmission.\n\n`;
  md += `---\n\n`;

  const dates = Object.keys(byDate).sort().reverse();
  for (const date of dates) {
    md += `## ${date}\n\n`;
    for (const e of byDate[date]) {
      const time = (e.publishedAt || e.processedAt || "").slice(11, 19) || "??:??:??";
      md += `### \`${time} UTC\` — ${e.platform}\n\n`;
      md += `> ${e.content}\n\n`;
      if (e.tags?.length) {
        md += `**Tags:** ${e.tags.map((t) => `\`${t}\``).join(" ")}\n\n`;
      }
      if (e.source) md += `*Source: ${e.source}*\n\n`;
      md += `---\n\n`;
    }
  }

  // Append to existing log
  const existing = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "";
  const header = "# MyShape Protocol — Transmission Log\n\n";
  const existingBody = existing.startsWith(header) ? existing.slice(header.length) : existing;
  fs.writeFileSync(LOG_PATH, header + md.slice(header.length) + existingBody);

  console.log(`✓ Log updated: ${LOG_PATH}`);
  console.log(`  ${entries.length} entries across ${dates.length} dates`);
}

generate();

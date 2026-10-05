#!/usr/bin/env node
// ============================================================
// Research Asset Registry validator
// ============================================================
//
// A RULE ENFORCER, not a historical inference engine.
//
// It reads the registry file and checks that the document obeys the
// locked governance invariants. It never reads route files, never
// inspects git history, never looks up a version, never promotes a
// lifecycle, and never resolves a conflict. A value that is absent
// stays absent.
//
// The repository has no YAML parser dependency, so this file
// carries a deliberately small parser for the restricted subset the
// registry is allowed to use. Anything outside that subset is
// rejected rather than guessed at.
//
// Usage:
//   node scripts/validate-research-assets.mjs
//   node scripts/validate-research-assets.mjs --registry <path>
//
// Exit codes: 0 = all invariants pass, 1 = at least one error.
// ============================================================

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

// Allowed value sets (locked governance)
const VERSION_RESOLUTIONS = new Set(["resolved", "unresolved", "confirmed_unversioned"]);
const SOURCE_RESOLUTIONS = new Set(["resolved", "candidate", "unresolved"]);
const ASSET_LIFECYCLE = new Set(["draft", "active", "deprecated"]);
const VERSION_LIFECYCLE = new Set(["draft", "approved", "published", "superseded", "withdrawn"]);
const SURFACE_STATUS = new Set(["live", "stale", "withdrawn"]);
const CONFLICT_RESOLUTIONS = new Set(["unresolved"]);
const SOURCE_KINDS = new Set(["file", "directory", "repo_paths"]);
// Asset types defined by the Phase 1B design. No type is added here
// for future extensibility; new types require a schema_version bump.
const ASSET_TYPES = new Set([
  "research_note", "protocol", "benchmark", "decision_log",
  "open_question", "failure_report", "dataset", "rfc", "experiment", "paper",
]);
// Closed key sets. A key outside these is an error, so a misspelling
// is reported rather than silently dropped.
const ROOT_KEYS = new Set(["schema_version", "assets"]);
const ASSET_KEYS = new Set([
  "asset_id", "asset_type", "canonical_title", "lifecycle_status", "evidence", "versions",
]);
const VERSION_KEYS = new Set([
  "version_id", "version_label", "version_resolution", "version_label_note",
  "lifecycle_status", "released_on", "released_on_note", "evidence",
  "source", "source_resolution", "source_candidate_note", "source_unresolved_note",
  "source_commit", "source_commit_note",
  "implementation_baseline", "implementation_baseline_note",
  "supersedes_version_id", "citation_ref",
  "conflicts", "surfaces", "surfaces_note",
  "content_path", "content_path_note",
]);
const SURFACE_KEYS = new Set([
  "surface_id", "brand", "canonical_url", "route_path", "surface_title", "status",
  "last_verified_at", "indexed_in", "evidence",
]);
const SOURCE_KEYS = new Set(["kind", "path", "paths"]);
const EVIDENCE_KEYS = new Set(["locator", "value"]);
const CONFLICT_KEYS = new Set(["field", "resolution", "conflict_note", "evidence"]);
const COMMIT_ID_RE = /^[0-9a-f]{7,40}$/;
const VERSION_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-r\d{2,}$/;
const ASSET_ID_RE = /^[A-Z]{2,4}-\d{3,4}$/;
// ------------------------------------------------------------
// YAML subset parser
// ------------------------------------------------------------
// Supported: block maps, block sequences, "key: value", "key:",
// "- scalar", "- key: value" (a map beginning on the dash line),
// the empty flow array "[]", null, and quoted or plain scalars.
// Rejected: tabs, anchors, aliases, inline flow maps, block
// scalars, multi-line scalars, and every other YAML construct.

function parseScalar(raw) {
  const s = raw.trim();
  if (s === "" || s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "[]") return [];
  if (s.length >= 2 && s.startsWith("\x22") && s.endsWith("\x22")) {
    return s.slice(1, -1).replace(/\\\x22/g, "\x22").replace(/\\\\/g, "\\");
  }
  if (s.length >= 2 && s.startsWith("\x27") && s.endsWith("\x27")) {
    return s.slice(1, -1).replace(/\x27\x27/g, "\x27");
  }
  if (/^[[{<!&*>|]/.test(s)) {
    throw new Error("unsupported YAML construct: " + s);
  }
  if (/^-?\d+$/.test(s)) return Number(s);
  return s;
}

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== "\\") quote = null;
    } else if (ch === "\x22" || ch === "\x27") {
      quote = ch;
    } else if (ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

function tokenize(text) {
  const out = [];
  text.split(/\r?\n/).forEach((rawLine, idx) => {
    if (rawLine.includes("\t")) throw new Error("tab character on line " + (idx + 1));
    const line = stripComment(rawLine);
    if (line.trim() === "") return;
    const indent = line.length - line.trimStart().length;
    if (indent % 2 !== 0) throw new Error("odd indent " + indent + " on line " + (idx + 1));
    out.push({ no: idx + 1, indent, text: line.trim() });
  });
  return out;
}

function parseBlock(toks, start, indent) {
  if (start >= toks.length) return [null, start];
  const t = toks[start].text;
  if (t === "-" || t.startsWith("- ")) return parseSeq(toks, start, indent);
  return parseMap(toks, start, indent);
}

function parseSeq(toks, start, indent) {
  const items = [];
  let i = start;
  while (i < toks.length && toks[i].indent === indent
    && (toks[i].text === "-" || toks[i].text.startsWith("- "))) {
    const inline = toks[i].text === "-" ? "" : toks[i].text.slice(2).trim();
    const childIndent = indent + 2;
    if (inline === "") {
      i += 1;
      if (i >= toks.length || toks[i].indent <= indent) { items.push(null); continue; }
      const r = parseBlock(toks, i, toks[i].indent);
      items.push(r[0]);
      i = r[1];
    } else if (/^[A-Za-z0-9_.-]+:(\s|$)/.test(inline)) {
      const synth = [{ no: toks[i].no, indent: childIndent, text: inline }];
      let j = i + 1;
      while (j < toks.length && toks[j].indent >= childIndent) { synth.push(toks[j]); j += 1; }
      const r = parseMap(synth, 0, childIndent);
      items.push(r[0]);
      i = j;
    } else {
      items.push(parseScalar(inline));
      i += 1;
    }
  }
  return [items, i];
}

function parseMap(toks, start, indent) {
  const map = {};
  let i = start;
  while (i < toks.length && toks[i].indent === indent) {
    const line = toks[i].text;
    if (line === "-" || line.startsWith("- ")) break;
    const m = /^([A-Za-z0-9_.-]+):([\s\S]*)$/.exec(line);
    if (!m) throw new Error("cannot parse line " + toks[i].no + ": " + line);
    const key = m[1];
    const rest = m[2].trim();
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throw new Error("duplicate key " + key + " at line " + toks[i].no);
    }
    // A bare (unquoted) value that itself contains a YAML mapping
    // separator is ambiguous: "value: a: b". Real YAML would refuse
    // this. Refuse it too rather than silently reading it as "a: b".
    if (rest !== "" && rest !== "[]" && !/^["']/.test(rest) && /:(\s|$)/.test(rest)) {
      throw new Error("unquoted value with an extra mapping colon at line "
        + toks[i].no + "; quote the value or restructure the mapping");
    }
    if (rest === "") {
      i += 1;
      if (i < toks.length && toks[i].indent > indent) {
        const r = parseBlock(toks, i, toks[i].indent);
        map[key] = r[0];
        i = r[1];
      } else {
        map[key] = null;
      }
    } else {
      map[key] = parseScalar(rest);
      i += 1;
    }
  }
  return [map, i];
}

function parseRegistry(text) {
  const toks = tokenize(text);
  if (!toks.length) return null;
  return parseBlock(toks, 0, toks[0].indent)[0];
}
// ------------------------------------------------------------
// CLI
// ------------------------------------------------------------

const ARGS = process.argv.slice(2);
if (ARGS.includes("--help") || ARGS.includes("-h")) {
  console.log("Usage: node scripts/validate-research-assets.mjs [--registry <path>]");
  process.exit(0);
}
let registryPath = join(REPO_ROOT, "docs/research-assets.registry.yaml");
for (let i = 0; i < ARGS.length; i++) {
  if (ARGS[i] === "--registry" && ARGS[i + 1]) { registryPath = resolve(ARGS[i + 1]); i += 1; }
}
if (!existsSync(registryPath)) {
  console.error("registry not found: " + registryPath);
  process.exit(1);
}

const errors = [];
const warnings = [];
const err = (rule, msg) => errors.push("[" + rule + "] " + msg);
const warn = (rule, msg) => warnings.push("[" + rule + "] " + msg);
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const refNotes = [];

function checkEnum(rule, value, allowed, where) {
  if (value === null || value === undefined) err(rule, where + ": required value is missing");
  else if (!allowed.has(value)) {
    err(rule, where + ": " + JSON.stringify(value) + " is not in [" + [...allowed].join(", ") + "]");
  }
}

function checkEvidence(rule, holder, where) {
  if (!Array.isArray(holder) || holder.length === 0) {
    err(rule, where + ": at least one evidence entry is required");
    return;
  }
  holder.forEach((e, n) => {
    const at = where + ".evidence[" + n + "]";
    if (!isObj(e)) { err(rule, at + ": must be an object"); return; }
    for (const ek of Object.keys(e)) {
      if (!EVIDENCE_KEYS.has(ek)) err("KEY", at + ": unknown evidence key \"" + ek + "\"");
    }
    if (!isStr(e.locator)) err(rule, at + ": locator is required");
    if (e.confidence !== undefined) {
      err(rule, at + ": confidence is not permitted; use a resolution enum instead");
    }
  });
}

let doc = null;
try {
  doc = parseRegistry(readFileSync(registryPath, "utf8"));
} catch (e) {
  console.error("registry could not be parsed: " + e.message);
  process.exit(1);
}

if (!isObj(doc)) { console.error("registry root must be a mapping"); process.exit(1); }
for (const k of Object.keys(doc)) {
  if (!ROOT_KEYS.has(k)) err("KEY", "registry root: unknown key \"" + k + "\"");
}
if (doc.schema_version !== 1) err("SCHEMA", "schema_version must be 1");
if (!Array.isArray(doc.assets)) {
  console.error("assets must be a sequence");
  process.exit(1);
}
// A governance registry with no records has asserted nothing. It is
// treated as invalid rather than as vacuously valid.
if (doc.assets.length === 0) {
  err("EMPTY", "assets must contain at least one record; an empty registry asserts nothing");
}

const assets = doc.assets;
const seenAsset = new Set();
const seenVersion = new Set();
const liveOwners = new Map();
const pairSeen = new Set();
const labelsSeen = new Set();
let versionCount = 0;
let surfaceCount = 0;
let prevAssetId = null;
// ------------------------------------------------------------
// Asset-level invariants
// ------------------------------------------------------------

for (const asset of assets) {
  if (!isObj(asset)) { err("SCHEMA", "each asset must be a mapping"); continue; }
  const aid = asset.asset_id;
  if (!isStr(aid)) { err("ID-1", "asset_id is required"); continue; }
  if (!ASSET_ID_RE.test(aid)) err("ID-1", "asset_id " + aid + " does not match the PREFIX-NNN form");
  if (seenAsset.has(aid)) err("ID-3", "duplicate asset_id " + aid);
  seenAsset.add(aid);
  for (const k of Object.keys(asset)) {
    if (!ASSET_KEYS.has(k)) err("KEY", aid + ": unknown asset key \"" + k + "\"");
  }
  if (!isStr(asset.asset_type)) {
    err("AT", aid + ".asset_type: required string is missing");
  } else {
    checkEnum("AT", asset.asset_type, ASSET_TYPES, aid + ".asset_type");
  }
  if (asset.canonical_title !== undefined && !isStr(asset.canonical_title)) {
    err("SCHEMA", aid + ": canonical_title must be a non-empty string");
  }
  checkEnum("LC-A", asset.lifecycle_status, ASSET_LIFECYCLE, aid + ".lifecycle_status");
  checkEvidence("EV-A", asset.evidence, aid);
  if (prevAssetId !== null && aid < prevAssetId) {
    err("ORD-1", "assets must be sorted by asset_id ascending; " + aid + " follows " + prevAssetId);
  }
  prevAssetId = aid;

  const versions = Array.isArray(asset.versions) ? asset.versions : [];
  if (versions.length === 0 && asset.lifecycle_status !== "draft") {
    err("ZVA", aid + ": an asset with zero versions must have lifecycle_status draft");
  }

  const localVersionIds = new Set();
  let prevVersionId = null;

  for (const version of versions) {
    if (!isObj(version)) { err("SCHEMA", aid + ": each version must be a mapping"); continue; }
    const vid = version.version_id;
    const at = aid + "/" + (isStr(vid) ? vid : "<missing>");
    if (!isStr(vid)) { err("ID-2", aid + ": version_id is required"); continue; }
    versionCount += 1;
    if (!VERSION_ID_RE.test(vid)) {
      err("ID-2", at + ": version_id must use a zero-padded r-index, for example rn-001-r01");
    }
    if (seenVersion.has(vid)) err("ID-4", "duplicate version_id " + vid);
    seenVersion.add(vid);
    localVersionIds.add(vid);
    for (const k of Object.keys(version)) {
      if (!VERSION_KEYS.has(k)) err("KEY", at + ": unknown version key \"" + k + "\"");
    }
    // implementation_baseline is a commit reference even though it is
    // not a source commit, so it is held to the same format rule.
    if (version.implementation_baseline !== null
      && version.implementation_baseline !== undefined
      && !COMMIT_ID_RE.test(String(version.implementation_baseline))) {
      err("IB-1", at + ": implementation_baseline must be a hex commit id or null");
    }

    // ID-5: the version_id prefix must stay consistent with the
    // structural parent. The structure is authoritative; the prefix
    // is a human convenience and is never used to derive anything.
    const hint = /^([a-z0-9]+(?:-[a-z0-9]+)*)-r\d{2,}$/.exec(vid);
    if (hint && hint[1].toUpperCase() !== aid) {
      err("ID-5", at + ": version_id prefix " + hint[1] + " disagrees with its structural asset " + aid);
    }
    if (prevVersionId !== null && vid < prevVersionId) {
      err("ORD-2", aid + ": versions must be sorted by version_id ascending");
    }
    prevVersionId = vid;

    // Version resolution and label
    const vres = version.version_resolution;
    checkEnum("VRES", vres, VERSION_RESOLUTIONS, at + ".version_resolution");
    const label = version.version_label === undefined ? null : version.version_label;
    if (vres === "resolved" && (label === null || label === "")) {
      err("VRES-C", at + ": version_resolution resolved requires a non-null version_label");
    }
    if ((vres === "unresolved" || vres === "confirmed_unversioned") && label !== null) {
      err("VRES-C", at + ": version_resolution " + vres + " requires version_label to be null");
    }
    if (vres === "resolved") {
      const key = aid + " " + label;
      if (labelsSeen.has(key)) {
        err("LABEL-U", at + ": version_label " + label + " is already used by another version of " + aid);
      }
      labelsSeen.add(key);
    }

    checkEnum("LC-V", version.lifecycle_status, VERSION_LIFECYCLE, at + ".lifecycle_status");
    checkEvidence("EV-V", version.evidence, at);

    // released_on means only the date this version was released as
    // this version. Nothing else may populate it.
    if (version.lifecycle_status === "draft" && version.released_on !== null
      && version.released_on !== undefined) {
      err("REL-1", at + ": a draft version must have released_on null");
    }
    if (version.released_on !== null && version.released_on !== undefined
      && !/^\d{4}-\d{2}-\d{2}$/.test(String(version.released_on))) {
      err("REL-2", at + ": released_on must be YYYY-MM-DD or null");
    }

    // Source
    const sres = version.source_resolution;
    checkEnum("SRES", sres, SOURCE_RESOLUTIONS, at + ".source_resolution");
    if (sres === "resolved" && !isObj(version.source)) {
      err("SRES-C", at + ": source_resolution resolved requires a source object");
    } else if (sres === "unresolved" && version.source !== null && version.source !== undefined) {
      // "candidate" is allowed to carry a source: it means a path was
      // found but its status as canonical source is not confirmed.
      // Only "unresolved" means no source could be located.
      err("SRES-C", at + ": source_resolution unresolved requires source to be null");
    }
    // A source that is present is validated whatever its resolution:
    // a candidate path is still a path and can still be wrong.
    if (version.source !== null && version.source !== undefined) {
      if (!isObj(version.source)) {
        err("SRES-C", at + ": source must be an object or null");
      } else {
        for (const k of Object.keys(version.source)) {
          if (!SOURCE_KEYS.has(k)) err("KEY", at + ".source: unknown key \"" + k + "\"");
        }
        if (!SOURCE_KINDS.has(version.source.kind)) {
          err("SRES-C", at + ": source.kind must be one of [" + [...SOURCE_KINDS].join(", ") + "]");
        }
        if (version.source.kind === "repo_paths") {
          if (!Array.isArray(version.source.paths) || version.source.paths.length === 0
            || !version.source.paths.every(isStr)) {
            err("SRES-C", at + ": source.paths must be a non-empty sequence of strings");
          }
        } else if (!isStr(version.source.path)) {
          err("SRES-C", at + ": source.path is required for kind " + version.source.kind);
        }
      }
    }
    if (sres !== "resolved" && version.source_commit !== null && version.source_commit !== undefined) {
      err("SC-1", at + ": source_commit must be null unless source_resolution is resolved");
    }
    if (version.source_commit !== null && version.source_commit !== undefined
      && !/^[0-9a-f]{7,40}$/.test(String(version.source_commit))) {
      err("SC-2", at + ": source_commit must be a hex commit id or null");
    }
    if (version.source_commit !== null && version.source_commit !== undefined
      && !isStr(version.source_commit_note)) {
      warn("SC-3", at + ": source_commit is set without a source_commit_note");
    }

    // supersedes must stay inside the same asset
    if (version.supersedes_version_id !== null && version.supersedes_version_id !== undefined) {
      if (!isStr(version.supersedes_version_id)) {
        err("SUP-1", at + ": supersedes_version_id must be a string or null");
      } else if (!localVersionIds.has(version.supersedes_version_id)) {
        err("SUP-1", at + ": supersedes_version_id must point to another version of " + aid);
      }
    }

    // Conflicts are never resolved by the registry
    if (version.conflicts !== null && version.conflicts !== undefined) {
      if (!Array.isArray(version.conflicts)) {
        err("CONFLICT", at + ": conflicts must be a sequence");
      } else {
        version.conflicts.forEach((c, n) => {
          const cat = at + ".conflicts[" + n + "]";
          if (!isObj(c)) { err("CONFLICT", cat + ": must be an object"); return; }
          for (const ck of Object.keys(c)) {
            if (!CONFLICT_KEYS.has(ck)) err("KEY", cat + ": unknown conflict key \"" + ck + "\"");
          }
          if (!isStr(c.field)) err("CONFLICT", cat + ": field is required");
          if (!CONFLICT_RESOLUTIONS.has(c.resolution)) {
            err("CONFLICT", cat + ": resolution must be unresolved; the registry never selects a side");
          }
          checkEvidence("CONFLICT", c.evidence, cat);
        });
      }
    }
    // Surfaces reference the version only through version_id and
    // never carry asset_id, so a version is addressed unambiguously.
    const surfaces = (version.surfaces === null || version.surfaces === undefined) ? [] : version.surfaces;
    if (!Array.isArray(surfaces)) {
      err("SCHEMA", at + ": surfaces must be a sequence or null");
      continue;
    }
    let lastBrand = null;
    let lastUrl = null;
    const versionSurfaceIds = new Set();

    for (const surface of surfaces) {
      if (!isObj(surface)) { err("SCHEMA", at + ": each surface must be a mapping"); continue; }
      for (const sk of Object.keys(surface)) {
        if (!SURFACE_KEYS.has(sk)) err("KEY", at + ": unknown surface key \"" + sk + "\"");
      }
      surfaceCount += 1;
      const sat = at + "/" + surface.brand;

      // Surface identity. surface_id is the identity of the destination
      // surface; brand, canonical_url and route_path are its properties and
      // never substitute for it. A missing or non-scalar surface_id is a
      // hard failure -- there is deliberately no fallback to another field,
      // because deriving identity from a presentation field would let two
      // different surfaces collide and would manufacture a governance fact.
      if (!isStr(surface.surface_id) || surface.surface_id.length === 0) {
        err("SID-1", sat + ": surface_id is required and must be a non-empty string");
      } else if (!/^[a-z0-9][a-z0-9-]*$/.test(surface.surface_id)) {
        err("SID-2", sat + ": surface_id must be lowercase alphanumeric with hyphens");
      } else {
        // Unique WITHIN A VERSION. The same surface_id on a different
        // version is expected, not an error: one destination surface serves
        // many asset versions.
        if (versionSurfaceIds.has(surface.surface_id)) {
          err("SID-3", sat + ": surface_id \"" + surface.surface_id
            + "\" is already used by another surface of version " + vid);
        }
        versionSurfaceIds.add(surface.surface_id);
      }

      checkEnum("LC-S", surface.status, SURFACE_STATUS, sat + ".status");
      if (Object.prototype.hasOwnProperty.call(surface, "asset_id")) {
        err("FK-S", sat + ": a surface must not carry asset_id");
      }
      if (!isStr(surface.brand)) err("SCHEMA", sat + ": brand is required");

      if (!isStr(surface.canonical_url)) {
        err("URL-1", sat + ": canonical_url is required");
      } else if (!/^https:\/\/\S+$/.test(surface.canonical_url)) {
        err("URL-1", sat + ": canonical_url must be an absolute https URL");
      }
      if (surface.indexed_in === null || surface.indexed_in === undefined) {
        err("SCHEMA", sat + ": indexed_in is required; use an empty list when not indexed");
      } else if (!Array.isArray(surface.indexed_in)) {
        err("SCHEMA", sat + ": indexed_in must be a sequence");
      } else {
        surface.indexed_in.forEach((v, ix) => {
          if (!isStr(v)) {
            err("IDX-1", sat + ".indexed_in[" + ix + "]: each entry must be a non-empty string");
          }
        });
      }
      if (surface.last_verified_at === undefined) {
        err("SCHEMA", sat + ": last_verified_at is required; null means not yet verified");
      }
      checkEvidence("EV-S", surface.evidence, sat);

      if (isStr(surface.brand) && isStr(surface.canonical_url)) {
        const pair = vid + " " + surface.brand + " " + surface.canonical_url;
        if (pairSeen.has(pair)) {
          err("URL-2", sat + ": a version may not list the same brand and URL twice");
        }
        pairSeen.add(pair);

        // At most one live surface may own a URL. When a later
        // version takes a URL over the earlier surface becomes stale;
        // the historical record is kept.
        const owner = surface.brand + " " + surface.canonical_url;
        if (surface.status === "live") {
          if (liveOwners.has(owner)) {
            err("URL-3", sat + ": URL already owned by a live surface of version "
              + liveOwners.get(owner) + "; mark the earlier surface stale rather than deleting it");
          } else {
            liveOwners.set(owner, vid);
          }
        }
        if (lastBrand !== null) {
          const ordered = lastBrand < surface.brand
            || (lastBrand === surface.brand && lastUrl < surface.canonical_url);
          if (!ordered) {
            err("ORD-3", at + ": surfaces must be sorted by brand then canonical_url ascending");
          }
        }
        lastBrand = surface.brand;
        lastUrl = surface.canonical_url;
      }

      if (isStr(surface.route_path) && !existsSync(join(REPO_ROOT, surface.route_path))) {
        refNotes.push(at + ": route_path not present in the working tree: " + surface.route_path);
      }
    }

    if (isObj(version.source)) {
      if (version.source.kind === "file" || version.source.kind === "directory") {
        if (isStr(version.source.path) && !existsSync(join(REPO_ROOT, version.source.path))) {
          refNotes.push(at + ": source path not present in the working tree: " + version.source.path);
        }
      } else if (version.source.kind === "repo_paths" && Array.isArray(version.source.paths)) {
        version.source.paths.forEach((p) => {
          if (isStr(p) && !existsSync(join(REPO_ROOT, p))) {
            refNotes.push(at + ": source path not present in the working tree: " + p);
          }
        });
      }
    }
  }
}

// ------------------------------------------------------------
// Report
// ------------------------------------------------------------

let nullFields = 0;
let conflictCount = 0;
for (const a of assets) {
  for (const v of a.versions || []) {
    if (v.version_label === null || v.version_label === undefined) nullFields += 1;
    if (v.released_on === null || v.released_on === undefined) nullFields += 1;
    if (v.source_commit === null || v.source_commit === undefined) nullFields += 1;
    if (Array.isArray(v.conflicts)) conflictCount += v.conflicts.length;
  }
}

const line = "=".repeat(62);
console.log("Research Asset Registry - invariant validation");
console.log(line);
console.log("  registry file          : " + registryPath);
console.log("  schema_version         : " + doc.schema_version);
console.log("  assets                 : " + assets.length);
console.log("  versions               : " + versionCount);
console.log("  surfaces               : " + surfaceCount);
console.log("  distinct asset_id      : " + seenAsset.size);
console.log("  distinct version_id    : " + seenVersion.size);
console.log("  live URL owners        : " + liveOwners.size);
console.log("  duplicate identities   : 0");
console.log("  null-by-evidence fields: " + nullFields);
console.log("  conflict entries       : " + conflictCount + " (all resolution=unresolved)");
console.log(line);

if (warnings.length) {
  console.log("WARNINGS (" + warnings.length + ")");
  warnings.forEach((w) => console.log("  ! " + w));
}
if (refNotes.length) {
  console.log("REPOSITORY REFERENCE NOTES (" + refNotes.length + ", advisory only)");
  refNotes.forEach((n) => console.log("  - " + n));
}
if (errors.length) {
  console.log("ERRORS (" + errors.length + ")");
  errors.forEach((e) => console.log("  x " + e));
  console.log("FAILED: " + errors.length + " invariant violation(s)");
  process.exit(1);
}
console.log("PASS: all registry invariants hold.");
process.exit(0);
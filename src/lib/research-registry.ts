/**
 * Research Asset Registry — RN-002 pilot reader.
 *
 * Phase 1.5 scope: read the identity metadata declared for a single pilot
 * asset. This module is intentionally NOT a content store. It resolves a
 * registry record and nothing else — no publication state, no approval
 * state, no canonical URL, no research content.
 *
 * Ownership (Phase 1.4D):
 *   - research content      -> canonical research source (see canonical_source)
 *   - asset identity        -> this registry record
 *   - human approval        -> separate approval record (not implemented)
 *   - distribution state    -> research_publication table (not implemented)
 *
 * Path pattern is deliberately `path.join(process.cwd(), "research-assets")`
 * resolved at module scope, matching src/lib/mdx.ts. Next/Turbopack NFT traces
 * a statically scoped cwd subfolder into the importing route bundle; a dynamic
 * or statically-hidden read (new Function / require) would not be traced. Do
 * not replace this with a computed or indirect lookup — see B4.5.
 */
import fs from "fs";
import path from "path";

const ASSETS_DIR = path.join(process.cwd(), "research-assets");
const REGISTRY_DIR = path.join(ASSETS_DIR, "registry");

/**
 * Semantic asset types currently supported. This is an open-but-strict set:
 * adding a type is a governance decision, not a code change. A record whose
 * asset_type is absent from this list fails closed.
 *
 * Values are semantic rather than ID prefixes on purpose — `asset_id` already
 * carries the prefix, so a prefix-valued asset_type would be fully derivable
 * from asset_id and would add no information.
 */
export const SUPPORTED_ASSET_TYPES = ["research_note", "benchmark"] as const;

/** The only declarable states. Approval is never declared here. */
export const DECLARED_STATES = ["DRAFT", "IN_REVIEW"] as const;

export type SupportedAssetType = (typeof SUPPORTED_ASSET_TYPES)[number];
export type DeclaredState = (typeof DECLARED_STATES)[number];

export interface ResearchRegistryRecord {
  asset_id: string;
  asset_type: SupportedAssetType;
  canonical_source: string;
  version: string;
  declared_state: DeclaredState;
}

/** Asset IDs are opaque slugs; anything else is rejected before path building. */
const ASSET_ID_PATTERN = /^[A-Za-z0-9-]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate a parsed JSON payload against the Phase 1.4D contract.
 * Returns null on any deviation — the reader never repairs or coerces input.
 */
export function parseRegistryRecord(
  raw: unknown,
): ResearchRegistryRecord | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (!isNonEmptyString(r.asset_id)) return null;
  if (!isNonEmptyString(r.canonical_source)) return null;
  if (!isNonEmptyString(r.version)) return null;

  if (!SUPPORTED_ASSET_TYPES.includes(r.asset_type as SupportedAssetType)) {
    return null;
  }
  if (!DECLARED_STATES.includes(r.declared_state as DeclaredState)) {
    return null;
  }

  return {
    asset_id: r.asset_id,
    asset_type: r.asset_type as SupportedAssetType,
    canonical_source: r.canonical_source,
    version: r.version,
    declared_state: r.declared_state as DeclaredState,
  };
}

/**
 * Resolve one registry record by asset ID.
 *
 * Returns null when the ID is malformed, the file is absent, the file is not
 * valid JSON, or the payload fails contract validation. Callers cannot
 * distinguish these cases, which keeps the failure surface uniform.
 */
export function getRegistryRecord(
  assetId: string,
): ResearchRegistryRecord | null {
  if (!ASSET_ID_PATTERN.test(assetId)) return null;

  const filePath = path.join(REGISTRY_DIR, `${assetId}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    return parseRegistryRecord(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    return null;
  }
}

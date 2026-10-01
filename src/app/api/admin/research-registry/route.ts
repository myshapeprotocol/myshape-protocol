/**
 * GET /api/admin/research-registry
 *
 * Phase 1.5.3 — temporary Node-runtime verification consumer for the
 * research asset registry (B4.5 runtime accessibility check).
 *
 * Purpose is deliberately narrow: prove that a Node-runtime server context
 * can reach `process.cwd()/research-assets/registry/RN-002.json` through
 * src/lib/research-registry.ts. This endpoint returns identity metadata
 * only — never research content, title, URL, publication state or approval
 * information.
 *
 * Authentication mirrors src/app/api/admin/calibration/run: ADMIN_SECRET via
 * the x-admin-secret header, open only in development when unset.
 *
 * This is verification scaffolding. Delete once B4.5 deployment evidence is
 * obtained.
 */

import { NextResponse } from "next/server";
import { getRegistryRecord } from "@/lib/research-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Admin Auth ────────────────────────────────────────────────────

function validateAdminAuth(request: Request): boolean {
  const secret = request.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    // If ADMIN_SECRET is not configured, allow in development only
    return process.env.NODE_ENV === "development";
  }
  return secret === expected;
}

export async function GET(request: Request): Promise<Response> {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const record = getRegistryRecord("RN-002");
  if (!record) {
    return NextResponse.json(
      { error: "REGISTRY_RECORD_UNRESOLVED", asset_id: "RN-002" },
      { status: 404 },
    );
  }

  // Field-by-field projection. The record is never spread wholesale, so a
  // future contract addition cannot silently widen this endpoint's surface.
  return NextResponse.json({
    asset_id: record.asset_id,
    asset_type: record.asset_type,
    version: record.version,
    canonical_source: record.canonical_source,
    declared_state: record.declared_state,
    runtime: "nodejs",
  });
}

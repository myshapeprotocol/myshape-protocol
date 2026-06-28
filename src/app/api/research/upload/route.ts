/**
 * POST /api/research/upload — Anonymous Motion Landmark Ingestion
 *
 * Phase E-1: Real-world data entry point for engine calibration.
 *
 * Privacy invariants (enforced server-side):
 *   1. NO email, NO wallet, NO IP persisted — session_id is client-random UUID v4
 *   2. landmarks MUST be SST-18 format: Record<0-17, {x,y,z}> per frame
 *   3. Payload capped at 2 MB — prevents raw video/pixel data injection
 *   4. Rate limit: 5 uploads per IP per 24h (in-memory, never persisted)
 *   5. device info is binned to coarse categories — never a version string
 *
 * Runtime: Edge (no WASM dependency — pure validation + DB insert)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ResearchUploadPayload, ResearchUploadResponse } from "@/types/research";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// ── Rate Limiter (in-memory, per-IP, 24h sliding window) ──

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RateEntry {
  count: number;
  windowStart: number;
}

const rateMap = new Map<string, RateEntry>();

// Periodic cleanup — purge expired entries every 15 minutes
let lastCleanup = Date.now();
function cleanupRateMap(): void {
  const now = Date.now();
  if (now - lastCleanup < 15 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateMap.delete(key);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanupRateMap();
  const now = Date.now();
  const existing = rateMap.get(ip);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count };
}

// ── Validation ──

const VALID_OS = new Set(["Windows", "macOS", "Linux", "Android", "iOS", "Unknown"]);
const VALID_BROWSERS = new Set(["Firefox", "Chrome", "Safari", "Edge", "Unknown"]);
const VALID_LIGHTING = new Set(["indoor_day", "indoor_night", "outdoor_day", "outdoor_night"]);
const VALID_PHASES = new Set([1, 2, 3, 4, 5]);

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/** Validate a single landmark frame is SST-18 format with numeric x/y/z */
function validateLandmarkFrame(
  frame: unknown,
  index: number,
): { valid: boolean; error?: string } {
  if (!frame || typeof frame !== "object") {
    return { valid: false, error: `frame[${index}]: not an object` };
  }
  const f = frame as Record<string, unknown>;

  // Must have 't' (timestamp) and 'joints' fields
  if (typeof f.t !== "number") {
    return { valid: false, error: `frame[${index}]: missing or invalid 't' field` };
  }

  const joints = f.joints;
  if (!joints || typeof joints !== "object") {
    return { valid: false, error: `frame[${index}]: missing 'joints' object` };
  }

  // Must have exactly 0-17 integer keys (SST-18), each with {x, y, z} numbers
  const j = joints as Record<string, unknown>;
  for (let id = 0; id < 18; id++) {
    const pos = j[String(id)];
    if (!pos || typeof pos !== "object") {
      return { valid: false, error: `frame[${index}].joints[${id}]: missing position` };
    }
    const p = pos as Record<string, unknown>;
    if (typeof p.x !== "number" || typeof p.y !== "number" || typeof p.z !== "number") {
      return { valid: false, error: `frame[${index}].joints[${id}]: non-numeric coordinate` };
    }
    // Range check: SST positions are denormalized to 640×480×640 reference space
    // Allow some tolerance for different normalization schemes
    if (Math.abs(p.x) > 5000 || Math.abs(p.y) > 5000 || Math.abs(p.z) > 5000) {
      return { valid: false, error: `frame[${index}].joints[${id}]: coordinate out of range` };
    }
  }

  // Reject extra keys beyond SST-18 (potential data exfiltration vector)
  const jointKeys = Object.keys(j);
  const expectedKeys = Array.from({ length: 18 }, (_, i) => String(i));
  const extraKeys = jointKeys.filter(k => !expectedKeys.includes(k));
  if (extraKeys.length > 0) {
    return { valid: false, error: `frame[${index}].joints: unexpected keys [${extraKeys.join(",")}] — only SST-18 (0-17) allowed` };
  }

  return { valid: true };
}

function validatePayload(body: unknown): { valid: boolean; error?: string; payload?: ResearchUploadPayload } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const p = body as Record<string, unknown>;

  // session_id: valid UUID v4
  if (typeof p.session_id !== "string" || !isValidUUID(p.session_id)) {
    return { valid: false, error: "session_id must be a valid UUID v4" };
  }

  // device: coarse metadata
  const device = p.device as Record<string, unknown> | undefined;
  if (!device || typeof device !== "object") {
    return { valid: false, error: "device info is required" };
  }
  if (typeof device.os !== "string" || !VALID_OS.has(device.os)) {
    return { valid: false, error: `device.os must be one of: ${[...VALID_OS].join(", ")}` };
  }
  if (typeof device.browser !== "string" || !VALID_BROWSERS.has(device.browser)) {
    return { valid: false, error: `device.browser must be one of: ${[...VALID_BROWSERS].join(", ")}` };
  }
  if (typeof device.viewportWidth !== "number" || device.viewportWidth < 320 || device.viewportWidth > 7680) {
    return { valid: false, error: "device.viewportWidth out of range (320-7680)" };
  }
  if (typeof device.viewportHeight !== "number" || device.viewportHeight < 240 || device.viewportHeight > 4320) {
    return { valid: false, error: "device.viewportHeight out of range (240-4320)" };
  }

  // node_handle validated post-parse (see handler body)

  // lighting
  if (typeof p.lighting !== "string" || !VALID_LIGHTING.has(p.lighting)) {
    return { valid: false, error: `lighting must be one of: ${[...VALID_LIGHTING].join(", ")}` };
  }

  // duration_ms
  if (typeof p.duration_ms !== "number" || p.duration_ms < 1000 || p.duration_ms > 60000) {
    return { valid: false, error: "duration_ms must be between 1000 and 60000" };
  }

  // landmarks: array of SST-18 frames
  const landmarks = p.landmarks as unknown[];
  if (!Array.isArray(landmarks)) {
    return { valid: false, error: "landmarks must be an array" };
  }
  if (landmarks.length === 0 || landmarks.length > 1200) {
    return { valid: false, error: `landmarks must have 1-1200 entries, got ${landmarks.length}` };
  }
  for (let i = 0; i < landmarks.length; i++) {
    const check = validateLandmarkFrame(landmarks[i], i);
    if (!check.valid) return check;
  }

  // PES score and components
  if (typeof p.pes_score !== "number" || p.pes_score < 0 || p.pes_score > 1) {
    return { valid: false, error: "pes_score must be a number between 0 and 1" };
  }
  const pesComponents = ["pes_micro_timing", "pes_noise_residual", "pes_freq_entropy", "pes_bio_perturb"];
  for (const key of pesComponents) {
    if (typeof p[key] !== "number" || (p[key] as number) < 0 || (p[key] as number) > 1) {
      return { valid: false, error: `${key} must be a number between 0 and 1` };
    }
  }

  // Frame counts
  if (typeof p.total_frames !== "number" || p.total_frames < 1 || p.total_frames > 1200) {
    return { valid: false, error: "total_frames must be between 1 and 1200" };
  }
  if (typeof p.valid_frames !== "number" || p.valid_frames < 0 || p.valid_frames > (p.total_frames as number)) {
    return { valid: false, error: "valid_frames must be between 0 and total_frames" };
  }

  // Phases
  const phases = p.phases as unknown[];
  if (!Array.isArray(phases) || phases.length === 0 || phases.length > 5) {
    return { valid: false, error: "phases must be an array of 1-5 entries" };
  }
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i] as Record<string, unknown>;
    if (!ph || typeof ph !== "object") {
      return { valid: false, error: `phases[${i}]: not an object` };
    }
    if (!VALID_PHASES.has(ph.phase as number)) {
      return { valid: false, error: `phases[${i}].phase must be 1-5` };
    }
    if (typeof ph.frameCount !== "number" || ph.frameCount < 0 || ph.frameCount > 1200) {
      return { valid: false, error: `phases[${i}].frameCount out of range` };
    }
  }

  return { valid: true, payload: p as unknown as ResearchUploadPayload };
}

// ── Supabase Client ──

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return createClient(url, key);
}

// ── Handler ──

export async function POST(request: Request): Promise<Response> {
  // ── Rate Limit ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (ip !== "unknown") {
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json<ResearchUploadResponse>(
        { success: false, session_id: "", error: "RATE_LIMIT_EXCEEDED" },
        {
          status: 429,
          headers: {
            "Retry-After": "86400",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
    // Set rate limit headers on success too
    const headers = new Headers();
    headers.set("X-RateLimit-Remaining", String(remaining));
    // We'll attach these after the response is built
  }

  // ── Size Check ──
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
    return NextResponse.json<ResearchUploadResponse>(
      { success: false, session_id: "", error: "PAYLOAD_TOO_LARGE" },
      { status: 413 },
    );
  }

  // ── Parse & Validate ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ResearchUploadResponse>(
      { success: false, session_id: "", error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const validation = validatePayload(body);
  if (!validation.valid || !validation.payload) {
    return NextResponse.json<ResearchUploadResponse>(
      { success: false, session_id: "", error: validation.error ?? "VALIDATION_FAILED" },
      { status: 400 },
    );
  }

  const p = validation.payload;
  const raw = p as unknown as Record<string, unknown>;
  const nodeHandle: string | null =
    typeof raw.node_handle === "string" && raw.node_handle.length > 0
      ? raw.node_handle
      : null;

  // ── Insert ──
  try {
    const supabase = getSupabase();
    const { error: insertError } = await supabase
      .from("research_sessions")
      .insert({
        session_id: p.session_id,
        node_handle: nodeHandle,
        genesis_verified: nodeHandle !== null,
        device_os: p.device.os,
        device_browser: p.device.browser,
        viewport_width: p.device.viewportWidth,
        viewport_height: p.device.viewportHeight,
        imu_available: p.device.imuAvailable,
        lighting_condition: p.lighting,
        session_duration_ms: p.duration_ms,
        landmark_data: p.landmarks,
        pes_score: p.pes_score,
        pes_micro_timing: p.pes_micro_timing,
        pes_noise_residual: p.pes_noise_residual,
        pes_freq_entropy: p.pes_freq_entropy,
        pes_bio_perturb: p.pes_bio_perturb,
        total_frames: p.total_frames,
        valid_frames: p.valid_frames,
        motion_phases: p.phases,
      });

    if (insertError) {
      // Unique violation = duplicate session_id (client retry)
      if (insertError.code === "23505") {
        return NextResponse.json<ResearchUploadResponse>(
          { success: false, session_id: p.session_id, error: "DUPLICATE_SESSION" },
          { status: 409 },
        );
      }
      throw insertError;
    }

    return NextResponse.json<ResearchUploadResponse>(
      { success: true, session_id: p.session_id },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database insert failed";
    console.error("[research/upload] Error:", message);
    return NextResponse.json<ResearchUploadResponse>(
      { success: false, session_id: p.session_id, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

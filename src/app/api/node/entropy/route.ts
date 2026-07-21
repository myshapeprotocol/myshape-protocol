import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  computeEntropyGain,
  getLevelProgress,
  type EntropyState,
} from "@/engine/entropy-growth";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SERVER_CONFIGURATION_INCOMPLETE: Missing Supabase credentials");
  }
  return createClient(url, key);
}

// POST — calculate entropy after a motion scan
export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { allowed, remaining } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT" },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": String(remaining) },
      },
    );
  }

  const { email, pesScore, pesTiming, pesNoise, pesFrequency, pesBiological } = await request.json();
  if (!email || typeof pesScore !== "number") {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const clampedPes = Math.min(1, Math.max(0, pesScore));
  const pesComponents = {
    timing: typeof pesTiming === "number" ? pesTiming : 0,
    noise: typeof pesNoise === "number" ? pesNoise : 0,
    frequency: typeof pesFrequency === "number" ? pesFrequency : 0,
    biological: typeof pesBiological === "number" ? pesBiological : 0,
  };

  try {
    // Read current entropy state + scan_count
    const { data: node, error: readErr } = await getSupabase()
      .from("protocol_nodes")
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count, status, sovereign_key")
      .eq("email", email)
      .single();

    if (readErr) {
      // PGRST116 = no rows found — legitimate not-found
      if (readErr.code === "PGRST116") {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      console.error("[/api/node/entropy POST] Supabase error:", readErr.code, readErr.message);
      return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
    }
    if (!node) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    const currentState: EntropyState = {
      entropyScore: node.entropy_score ?? 0,
      particleLevel: node.particle_level ?? 1,
      streakDays: node.streak_days ?? 0,
      streakMultiplier: node.streak_multiplier ?? 1.0,
      bestPes: node.best_pes ?? 0,
      lastEntropyDate: node.last_entropy_date ?? "",
    };

    const { entropyGain, newState, leveledUp, decayApplied, spikeTriggered } = computeEntropyGain(clampedPes, pesComponents, currentState);

    // ── Genesis Badge Minting ──────────────────────────────────────────
    // Upgrades qualifying nodes to GENESIS_NODE (first 100 with PES > 0.5).
    //
    // Eligible statuses: anything EXCEPT already-minted (GENESIS_NODE),
    // AI agents (AGENT_ACTIVE), and sandbox test accounts (TEST_ACCOUNT).
    //
    // OTP-verified users (ACTIVE) ARE eligible — they reach this route
    // before doing a motion scan, and the scan is what proves sovereignty.
    const currentStatus = node.status ?? "PENDING_VERIFICATION";
    const isFirstVerification = !["GENESIS_NODE", "AGENT_ACTIVE", "TEST_ACCOUNT"].includes(currentStatus);
    let badgeMinted: string | null = null;
    let genesisKey: string | null = node.sovereign_key ?? null;
    let cohortFull = false;
    let slotsRemaining = 0;

    if (isFirstVerification && clampedPes > 0.5) {
      // Count existing verified nodes to determine tier
      const { count: verifiedCount } = await getSupabase()
        .from("protocol_nodes")
        .select("*", { count: "exact", head: true })
        .in("status", ["GENESIS_NODE", "ACTIVE", "AGENT_ACTIVE"]);

      const currentVerified = verifiedCount ?? 0;
      const newNodeStatus = currentVerified < 100 ? "GENESIS_NODE" : "ACTIVE";
      slotsRemaining = Math.max(0, 100 - currentVerified);
      cohortFull = currentVerified >= 100;
      badgeMinted = newNodeStatus;

      const updates: Record<string, unknown> = {
        entropy_score: newState.entropyScore,
        particle_level: newState.particleLevel,
        streak_days: newState.streakDays,
        streak_multiplier: newState.streakMultiplier,
        best_pes: newState.bestPes,
        last_entropy_date: newState.lastEntropyDate,
        scan_count: (node.scan_count ?? 0) + 1,
        status: newNodeStatus,
      };

      if (newNodeStatus === "GENESIS_NODE") {
        genesisKey = `GK_${randomUUID()}`;
        updates.sovereign_key = genesisKey;
      }

      // Preserve sovereign_key if already minted (GENESIS_NODE → GENESIS_NODE is impossible here,
      // but belt-and-suspenders: if somehow reached, don't overwrite the key)
      if (node.sovereign_key && newNodeStatus === "GENESIS_NODE") {
        updates.sovereign_key = node.sovereign_key;
        genesisKey = node.sovereign_key;
      }

      const { error: writeErr } = await getSupabase()
        .from("protocol_nodes")
        .update(updates)
        .eq("email", email);

      if (writeErr) {
        return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
      }
    } else {
      // Regular update — no badge change
      const { error: writeErr } = await getSupabase()
        .from("protocol_nodes")
        .update({
          entropy_score: newState.entropyScore,
          particle_level: newState.particleLevel,
          streak_days: newState.streakDays,
          streak_multiplier: newState.streakMultiplier,
          best_pes: newState.bestPes,
          last_entropy_date: newState.lastEntropyDate,
          scan_count: (node.scan_count ?? 0) + 1,
        })
        .eq("email", email);

      if (writeErr) {
        return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
      }
    }

    const progress = getLevelProgress(newState.entropyScore);

    return NextResponse.json({
      success: true,
      entropyGain,
      ...newState,
      progress,
      leveledUp,
      decayApplied,
      spikeTriggered,
      badge_minted: badgeMinted,
      sovereign_key: genesisKey,
      cohort_full: cohortFull,
      slots_remaining: slotsRemaining,
      status: badgeMinted ?? currentStatus,
    });
  } catch (err) {
    console.error("Entropy calculation failed:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// GET — read current entropy state
export async function GET(request: Request) {
  const ip = getClientIP(request);
  const { allowed, remaining } = apiLookupLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT" },
      {
        status: 429,
        headers: { "X-RateLimit-Remaining": String(remaining) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabase()
      .from("protocol_nodes")
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count, status, sovereign_key")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
      }
      console.error("[/api/node/entropy GET] Supabase error:", error.code, error.message);
      return NextResponse.json({ error: "DATABASE_ERROR" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "NODE_NOT_FOUND" }, { status: 404 });
    }

    const progress = getLevelProgress(data.entropy_score ?? 0);

    return NextResponse.json({
      entropyScore: data.entropy_score ?? 0,
      particleLevel: data.particle_level ?? 1,
      streakDays: data.streak_days ?? 0,
      streakMultiplier: data.streak_multiplier ?? 1.0,
      bestPes: data.best_pes ?? 0,
      lastEntropyDate: data.last_entropy_date ?? "",
      scanCount: data.scan_count ?? 0,
      progress,
      genesisKey: data.sovereign_key ?? null,
      status: data.status ?? null,
    });
  } catch (err) {
    console.error("Entropy read failed:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

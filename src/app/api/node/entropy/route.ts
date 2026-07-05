import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count, status")
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

    // ── Genesis Badge Minting: first PES scan that passes threshold unlocks identity tier ──
    const currentStatus = node.status ?? "PENDING_VERIFICATION";
    const isFirstVerification = !["GENESIS_NODE", "ACTIVE", "AGENT_ACTIVE"].includes(currentStatus);
    let badgeMinted: string | null = null;

    if (isFirstVerification && clampedPes > 0.5) {
      // Count existing verified nodes to determine tier
      const { count: verifiedCount } = await getSupabase()
        .from("protocol_nodes")
        .select("*", { count: "exact", head: true })
        .in("status", ["GENESIS_NODE", "ACTIVE", "AGENT_ACTIVE"]);

      const newNodeStatus = (verifiedCount ?? 0) < 100 ? "GENESIS_NODE" : "ACTIVE";
      badgeMinted = newNodeStatus;

      // Update status along with entropy
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
          status: newNodeStatus,
        })
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
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count, status")
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
    });
  } catch (err) {
    console.error("Entropy read failed:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

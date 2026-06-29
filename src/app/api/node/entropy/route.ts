import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  computeEntropyGain,
  getLevelProgress,
  type EntropyState,
} from "@/engine/entropy-growth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST — calculate entropy after a motion scan
export async function POST(request: Request) {
  const { email, pesScore } = await request.json();
  if (!email || typeof pesScore !== "number") {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  const clampedPes = Math.min(1, Math.max(0, pesScore));

  try {
    // Read current entropy state + scan_count
    const { data: node, error: readErr } = await supabase
      .from("protocol_nodes")
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count")
      .eq("email", email)
      .single();

    if (readErr || !node) {
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

    const { entropyGain, newState, leveledUp } = computeEntropyGain(clampedPes, currentState);

    // Write back
    const { error: writeErr } = await supabase
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

    const progress = getLevelProgress(newState.entropyScore);

    return NextResponse.json({
      success: true,
      entropyGain,
      ...newState,
      progress,
      leveledUp,
    });
  } catch (err) {
    console.error("Entropy calculation failed:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// GET — read current entropy state
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("protocol_nodes")
      .select("entropy_score, particle_level, streak_days, streak_multiplier, best_pes, last_entropy_date, scan_count")
      .eq("email", email)
      .single();

    if (error || !data) {
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

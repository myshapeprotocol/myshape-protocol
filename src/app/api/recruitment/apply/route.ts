/**
 * POST /api/recruitment/apply — Recruitment Application Handler
 *
 * Auto-tagging logic:
 *   1. Count existing applications
 *   2. If < 50 → cohort = 'genesis'
 *   3. If ≥ 50 → cohort = 'public'
 *   4. Email dedup: if already applied, return existing cohort (no double-count)
 *   5. Store application
 *
 * Request:  { email, technical_bg?, handle? }
 * Response: { success, cohort, position, redirect_to }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const GENESIS_CAP = 50;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SERVER_CONFIGURATION_INCOMPLETE");
  return createClient(url, key);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { email: rawEmail, technical_bg, handle, source } = await request.json();
    const email = (rawEmail || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Check if already applied
    const { data: existing } = await supabase
      .from("recruitment_applications")
      .select("cohort, applied_at")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        cohort: existing.cohort,
        position: existing.cohort === "genesis" ? "founding_tester" : "applicant",
        already_applied: true,
        redirect_to: "/motion-demo",
      });
    }

    // 2. Count current applications to determine cohort
    const { count } = await supabase
      .from("recruitment_applications")
      .select("*", { count: "exact", head: true });

    const currentCount = count ?? 0;
    const cohort = currentCount < GENESIS_CAP ? "genesis" : "public";

    // 3. Insert
    const { error: insertError } = await supabase
      .from("recruitment_applications")
      .insert({
        email,
        technical_bg: (technical_bg || "").slice(0, 200),
        handle: (handle || "").slice(0, 100),
        source: (source || "direct").slice(0, 50),
        cohort,
      });

    if (insertError) {
      // Race condition: another request inserted same email between check and insert
      if (insertError.code === "23505") {
        const { data: raceCheck } = await supabase
          .from("recruitment_applications")
          .select("cohort")
          .eq("email", email)
          .single();

        return NextResponse.json({
          success: true,
          cohort: raceCheck?.cohort || "public",
          position: raceCheck?.cohort === "genesis" ? "founding_tester" : "applicant",
          already_applied: true,
          redirect_to: "/motion-demo",
        });
      }
      throw insertError;
    }

    // 4. Response
    const remaining = Math.max(0, GENESIS_CAP - (currentCount + 1));
    const position = cohort === "genesis" ? "founding_tester" : "applicant";

    return NextResponse.json({
      success: true,
      cohort,
      position,
      position_number: currentCount + 1,
      genesis_slots_remaining: remaining,
      already_applied: false,
      redirect_to: "/motion-demo",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Application failed";
    console.error("[recruitment/apply]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

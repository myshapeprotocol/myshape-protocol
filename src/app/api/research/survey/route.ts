import { NextResponse } from "next/server";

// Store survey responses in Supabase if available, otherwise just log.
// This is a research instrument — no auth required, no rate limit needed.

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Try Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/discovery_survey`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            domain: body.domain || null,
            role: body.role || null,
            other_domain: body.otherDomain || null,
            has_sensor_data: body.hasSensorData || null,
            frequency: body.freq || null,
            duration: body.duration || null,
            data_flow: body.dataFlow || null,
            provenance: body.provenance || null,
            pain_point: body.pain || null,
            solution: body.solution || null,
            standard_wish: body.standard || null,
            interest: body.interest || null,
            contact: body.contact || null,
          }),
        });
        if (res.ok) return NextResponse.json({ ok: true });
      } catch {
        // Supabase failed — fall through to log
      }
    }

    // Fallback: log to console (visible in Vercel logs)
    console.log("[survey]", JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}

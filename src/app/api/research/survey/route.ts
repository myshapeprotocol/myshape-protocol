import { NextResponse } from "next/server";
import { RateLimiter, getClientIP } from "@/lib/rate-limiter";

// ═════════════════════════════════════════════════════════════════════
// POST /api/research/survey — Discovery Survey intake (P0 fix)
//
// Semantics:
//   Persistence  = source of truth. { ok: true } is returned ONLY after a
//                  confirmed Supabase insert. Insert failure → real 5xx,
//                  never a silent success.
//   Notification = secondary side effect. A Discord failure NEVER fails the
//                  user response (no re-submit → no duplicate insert); it is
//                  logged via [survey-notify-failed] (non-PII) so it stays
//                  detectable in server logs.
//   Privacy      = contact / other_domain are persisted to Supabase only —
//                  never logged, never sent to Discord. Discord receives a
//                  contact present yes/no boolean plus enum-only fields.
//
// Rate limit: 5 submissions per IP per hour (Phase 1; same in-memory
// RateLimiter class as /api/subscribe and /api/research/upload).
//
// No auth — research instrument. Table RLS (supabase/migrations/
// 20260722_discovery_survey.sql) allows anon INSERT only; anon has no
// SELECT, hence Prefer: return=minimal (a representation return would
// require anon SELECT and fail under RLS).
// ═════════════════════════════════════════════════════════════════════

const surveySubmitLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000 });

const MAX_BODY_BYTES = 8 * 1024; // selects + short free text only
const MAX_ENUM_LEN = 200;        // option-string fields
const MAX_FREETEXT_LEN = 300;    // other_domain / contact

// The 13 client fields (snake_case — mirrors discovery_survey columns).
// Unknown keys are rejected; every value is trimmed and length-capped.
const FIELD_LIMITS = {
  domain: MAX_ENUM_LEN,
  role: MAX_ENUM_LEN,
  other_domain: MAX_FREETEXT_LEN,
  has_sensor_data: MAX_ENUM_LEN,
  frequency: MAX_ENUM_LEN,
  duration: MAX_ENUM_LEN,
  data_flow: MAX_ENUM_LEN,
  provenance: MAX_ENUM_LEN,
  pain_point: MAX_ENUM_LEN,
  solution: MAX_ENUM_LEN,
  standard_wish: MAX_ENUM_LEN,
  interest: MAX_ENUM_LEN,
  contact: MAX_FREETEXT_LEN,
} as const;

type SurveyFieldKey = keyof typeof FIELD_LIMITS;
const FIELD_KEYS = Object.keys(FIELD_LIMITS) as SurveyFieldKey[];

// The three questions the form marks as required (SurveyClient).
const REQUIRED_FIELDS: SurveyFieldKey[] = ["domain", "has_sensor_data", "pain_point"];

type SurveyFields = Record<SurveyFieldKey, string | null>;

function sanitizeSurveyPayload(
  raw: unknown,
): { ok: true; fields: SurveyFields } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid payload" };
  }
  const obj = raw as Record<string, unknown>;

  // Unknown keys are not accepted.
  const unknownKeys = Object.keys(obj).filter((k) => !(k in FIELD_LIMITS));
  if (unknownKeys.length > 0) {
    return { ok: false, error: "Unknown fields are not accepted" };
  }

  const fields = {} as SurveyFields;
  for (const key of FIELD_KEYS) {
    const value = obj[key];
    if (value === undefined || value === null) {
      fields[key] = null;
      continue;
    }
    if (typeof value !== "string") {
      return { ok: false, error: `Field "${key}" must be a string` };
    }
    const trimmed = value.trim();
    if (trimmed.length > FIELD_LIMITS[key]) {
      return { ok: false, error: `Field "${key}" is too long` };
    }
    fields[key] = trimmed.length > 0 ? trimmed : null;
  }

  for (const key of REQUIRED_FIELDS) {
    if (!fields[key]) {
      return { ok: false, error: `Field "${key}" is required` };
    }
  }

  return { ok: true, fields };
}

// ── Discord notification (secondary side effect — never fails the request) ──
// Enum-only summary. The contact value and other_domain free text are NEVER
// included; contact is reduced to a presence boolean. Humans follow up via
// the Supabase row (service-role / dashboard).

function buildSurveyEmbed(fields: SurveyFields, ref: string, timestamp: string) {
  const line = (label: string, value: string | null) => `**${label}**: ${value ?? "—"}`;
  return {
    title: "🔬 New Discovery Survey",
    color: 0x90c8ff,
    timestamp,
    description: [
      `${line("Domain", fields.domain)} · ${line("Role", fields.role)}`,
      `${line("Sensor data", fields.has_sensor_data)} · ${line("Pain point", fields.pain_point)}`,
      `${line("Wants a standard", fields.standard_wish)} · ${line("Interest", fields.interest)}`,
      "",
      `📬 Contact provided: **${fields.contact ? "yes" : "no"}**`,
      `🔖 Ref: ${ref}`,
    ].join("\n"),
    footer: { text: "Discovery Survey · thecontinuitylab.org/lab/discovery-survey" },
  };
}

async function sendSurveyNotification(
  fields: SurveyFields,
  ref: string,
  timestamp: string,
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("[survey-notify-failed]", { ref, reason: "webhook not configured" });
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [buildSurveyEmbed(fields, ref, timestamp)] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[survey-notify-failed]", { ref, status: res.status, body: text.slice(0, 200) });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[survey-notify-failed]", {
      ref,
      error: err instanceof Error ? err.message : "unknown error",
    });
    return false;
  }
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = surveySubmitLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  // ── Size guard ──
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  // ── Parse ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // ── Validate ──
  const sanitized = sanitizeSurveyPayload(raw);
  if (!sanitized.ok) {
    return NextResponse.json({ ok: false, error: sanitized.error }, { status: 400 });
  }
  const fields = sanitized.fields;
  const contactPresent = Boolean(fields.contact);

  // ── Persistence — the source of truth ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    // Honest failure: without persistence there is nothing to confirm.
    console.error("[survey] persistence unavailable: Supabase env missing", {
      domain: fields.domain,
      contact_present: contactPresent,
    });
    return NextResponse.json(
      { ok: false, error: "Submission could not be saved. Please try again." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/discovery_survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      // Honest failure — NEVER report { ok: true } without a confirmed insert.
      console.error("[survey] insert failed", {
        domain: fields.domain,
        contact_present: contactPresent,
        supabase_status: res.status,
      });
      return NextResponse.json(
        { ok: false, error: "Submission could not be saved. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[survey] insert error", {
      domain: fields.domain,
      contact_present: contactPresent,
      error: err instanceof Error ? err.message : "network error",
    });
    return NextResponse.json(
      { ok: false, error: "Submission could not be saved. Please try again." },
      { status: 502 },
    );
  }

  // ── Notification — secondary side effect ──
  // Persistence has succeeded, so the user response below is 200 {ok:true}
  // regardless of the notification outcome. No retry, no second insert.
  const timestamp = new Date().toISOString();
  const ref = `survey@${timestamp}`;
  await sendSurveyNotification(fields, ref, timestamp);

  return NextResponse.json({ ok: true });
}

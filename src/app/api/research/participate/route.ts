import { NextResponse } from "next/server";
import { RateLimiter, getClientIP } from "@/lib/rate-limiter";

// ═════════════════════════════════════════════════════════════════════
// POST /api/research/participate — Research Participation intake
//
// Semantics mirror POST /api/research/survey (Patch 1/2):
//   Persistence  = source of truth. { ok: true } is returned ONLY after a
//                  confirmed insert. Insert failure → real 5xx, never a
//                  silent success.
//   Validation   = strict allow-list. Unknown keys are rejected outright,
//                  enum values are checked against the exact accepted set,
//                  every string is trimmed and length-capped.
//   Consent      = required. consent_version must name wording this server
//                  supports; consent_at is generated here, never read from
//                  the request.
//   Contact      = optional follow-up contact only. Not a participant ID, an
//                  account, an enrollment, or a recruitment entry.
//
// What this is NOT: product registration, an account, a participant ID,
// Genesis 100 / recruitment application, EV-000 enrollment, proof of
// humanity, or identity verification. No such mechanism exists here.
//
// Rate limit: 5 submissions per IP per hour.
// ═════════════════════════════════════════════════════════════════════

const participateLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60 * 60 * 1000 });

const MAX_BODY_BYTES = 4 * 1024;
const MAX_ENUM_LEN = 64;
const MAX_CONTACT_LEN = 300;
const MAX_WORKING_ON_LEN = 300;
const MAX_ARRAY_ITEMS = 12;

// Accepted enum values. Anything outside these sets is rejected rather than
// coerced, so a stored row can only hold wording this form actually offers.
const ROLES = ["researcher", "developer", "founder", "student", "other"] as const;
const AREAS = [
  "ai",
  "robotics",
  "sensors",
  "iot",
  "digital-twins",
  "crypto",
  "distributed-systems",
  "data-infra",
  "other",
] as const;
const PHYSICAL_WORLD = ["yes", "no", "not-directly"] as const;
const INTERESTS = [
  "learn",
  "test-cps-0001",
  "challenge-assumptions",
  "reproduce-experiments",
  "independent-implementation",
  "discuss-use-case",
  "other",
] as const;
const CONTACT_PREFERENCE = ["yes", "no"] as const;

const SUPPORTED_CONSENT_VERSIONS = ["participation-consent-v1"] as const;
type ConsentVersion = (typeof SUPPORTED_CONSENT_VERSIONS)[number];

type ParticipationFields = {
  role: string;
  areas: string[];
  physical_world: string;
  interests: string[];
  working_on: string | null;
  wants_contact: string;
  contact: string | null;
  consent_version: ConsentVersion;
};

const ALLOWED_KEYS = new Set([
  "role",
  "areas",
  "physical_world",
  "interests",
  "working_on",
  "wants_contact",
  "contact",
  "consent_version",
]);

type Invalid = { ok: false; error: string };
type Valid<T> = { ok: true; value: T };

/** Validate an array-of-enum field. Missing is allowed; malformed is not. */
function validateEnumArray(
  value: unknown,
  allowed: readonly string[],
  field: string,
): Valid<string[]> | Invalid {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, error: `Field "${field}" must be an array` };
  if (value.length > MAX_ARRAY_ITEMS) {
    return { ok: false, error: `Field "${field}" has too many items` };
  }
  const values: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return { ok: false, error: `Field "${field}" must contain strings` };
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length > MAX_ENUM_LEN) {
      return { ok: false, error: `Field "${field}" has a value that is too long` };
    }
    if (!allowed.includes(trimmed)) {
      return { ok: false, error: `Unrecognised value for "${field}"` };
    }
    if (!values.includes(trimmed)) values.push(trimmed);
  }
  return { ok: true, value: values };
}

function validateEnum(
  value: unknown,
  allowed: readonly string[],
  field: string,
): Valid<string> | Invalid {
  if (typeof value !== "string") return { ok: false, error: `Field "${field}" must be a string` };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { ok: false, error: `Field "${field}" is required` };
  if (trimmed.length > MAX_ENUM_LEN) return { ok: false, error: `Field "${field}" is too long` };
  if (!allowed.includes(trimmed)) {
    return { ok: false, error: `Unrecognised value for "${field}"` };
  }
  return { ok: true, value: trimmed };
}

function sanitizeParticipationPayload(
  raw: unknown,
): { ok: true; fields: ParticipationFields } | Invalid {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid payload" };
  }
  const obj = raw as Record<string, unknown>;

  const unknownKeys = Object.keys(obj).filter((k) => !ALLOWED_KEYS.has(k));
  if (unknownKeys.length > 0) {
    return { ok: false, error: "Unknown fields are not accepted" };
  }

  const role = validateEnum(obj.role, ROLES, "role");
  if (!role.ok) return role;

  const areas = validateEnumArray(obj.areas, AREAS, "areas");
  if (!areas.ok) return areas;

  const physicalWorld = validateEnum(obj.physical_world, PHYSICAL_WORLD, "physical_world");
  if (!physicalWorld.ok) return physicalWorld;

  const interests = validateEnumArray(obj.interests, INTERESTS, "interests");
  if (!interests.ok) return interests;
  if (interests.value.length === 0) {
    return { ok: false, error: 'Field "interests" is required' };
  }

  const wantsContact = validateEnum(obj.wants_contact, CONTACT_PREFERENCE, "wants_contact");
  if (!wantsContact.ok) return wantsContact;

  const consentVersion = validateEnum(
    obj.consent_version,
    SUPPORTED_CONSENT_VERSIONS,
    "consent_version",
  );
  if (!consentVersion.ok) return consentVersion;

  // Optional short free text.
  let workingOn: string | null = null;
  if (obj.working_on !== undefined && obj.working_on !== null) {
    if (typeof obj.working_on !== "string") {
      return { ok: false, error: 'Field "working_on" must be a string' };
    }
    const trimmed = obj.working_on.trim();
    if (trimmed.length > MAX_WORKING_ON_LEN) {
      return { ok: false, error: 'Field "working_on" is too long' };
    }
    workingOn = trimmed.length > 0 ? trimmed : null;
  }

  // Optional follow-up contact. Only meaningful when the person asked to be
  // contacted; sending both is a client error rather than something to drop.
  let contact: string | null = null;
  if (obj.contact !== undefined && obj.contact !== null) {
    if (typeof obj.contact !== "string") {
      return { ok: false, error: 'Field "contact" must be a string' };
    }
    const trimmed = obj.contact.trim();
    if (trimmed.length > MAX_CONTACT_LEN) {
      return { ok: false, error: 'Field "contact" is too long' };
    }
    if (trimmed.length > 0) {
      if (wantsContact.value !== "yes") {
        return {
          ok: false,
          error: 'Field "contact" is only accepted when "wants_contact" is "yes"',
        };
      }
      contact = trimmed;
    }
  }

  return {
    ok: true,
    fields: {
      role: role.value,
      areas: areas.value,
      physical_world: physicalWorld.value,
      interests: interests.value,
      working_on: workingOn,
      wants_contact: wantsContact.value,
      contact,
      consent_version: consentVersion.value as ConsentVersion,
    },
  };
}

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const { allowed } = participateLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const sanitized = sanitizeParticipationPayload(raw);
  if (!sanitized.ok) {
    return NextResponse.json({ ok: false, error: sanitized.error }, { status: 400 });
  }
  const fields = sanitized.fields;
  const contactPresent = Boolean(fields.contact);

  // Server-generated consent evidence. consent_at is not an accepted client
  // key, so a client that tries to send it is rejected by the allow-list above.
  const consentAt = new Date().toISOString();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("[participate] persistence unavailable: Supabase env missing", {
      role: fields.role,
      contact_present: contactPresent,
    });
    return NextResponse.json(
      { ok: false, error: "Submission could not be saved. Please try again." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/research_participation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ...fields, consent_at: consentAt }),
    });

    if (!res.ok) {
      console.error("[participate] insert failed", {
        role: fields.role,
        contact_present: contactPresent,
        supabase_status: res.status,
      });
      return NextResponse.json(
        { ok: false, error: "Submission could not be saved. Please try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[participate] insert error", {
      role: fields.role,
      contact_present: contactPresent,
      error: err instanceof Error ? err.message : "network error",
    });
    return NextResponse.json(
      { ok: false, error: "Submission could not be saved. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

// ============================================================
// POST /api/ev000/enroll — create an EV-000 enrollment
//
// Implements canonical §2, §3 and §15A.2.
//
// WHAT THIS ROUTE RETURNS
//
// The raw Participant Ref, exactly once. Canonical §3: it is shown to the
// participant at the moment of enrollment and never again, and no retrieval
// endpoint exists. There is deliberately no GET on this path.
//
// The response does NOT include the internal enrollment_id, the ref hash, or
// the retention deadline. Canonical §15A.2 requires only the ref; the rest
// is server-side state the participant has no need to see.
//
// THE RAW REF IS NEVER LOGGED
//
// Nothing in this file, or in the store it calls, writes the ref to a log,
// an error message, an analytics event, or a URL. The request carries no
// participant data at all — enrollment accepts no payload, so there is
// nothing for a caller to leak.
//
// CONSENT
//
// The version is not client-supplied. The route asserts the frozen constant
// from the store, so a client cannot enroll under a version of its choosing,
// and cannot enroll at all without the frozen text having been presented by
// the /ev000 page first.
// ============================================================

import { NextResponse } from "next/server";
import { getClientIP, RateLimiter } from "@/lib/rate-limiter";
import {
  createEv000EnrollmentStoreFromEnv,
  EV000_CONSENT_VERSION,
  EV000_RETENTION_DAYS,
  EV000_WITHDRAWAL_CONTACT,
} from "@/lib/ev000/enrollment-store";

/** Enrollment is anonymous and cheap; this bounds abuse, not identity. */
const enrollLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const runtime = "nodejs";

const MAX_BODY_BYTES = 512;

/** The only key this endpoint accepts. */
const CONSENT_KEY = "consent_version";

type ConsentFailure =
  | "invalid_request"
  | "consent_version_required"
  | "consent_version_mismatch";

/**
 * Validate the consent assertion in the request payload.
 *
 * WHAT THIS PROVES, PRECISELY
 *
 * That the request explicitly asserted acceptance of the currently frozen
 * consent version. It does NOT prove a human read anything. Presentation of
 * the frozen text is the /ev000 page's responsibility (canonical §15A.2);
 * this function is the server-side half of that rule and nothing more.
 *
 * WHY UNKNOWN KEYS ARE REJECTED
 *
 * A payload carrying anything besides the consent version is refused outright.
 * That follows the repository convention in
 * `src/app/api/research/survey/route.ts` ("Unknown fields are not
 * accepted"), and it makes it structurally impossible to smuggle a name,
 * email, wallet, interaction_kind, or Participant Ref into an enrollment
 * request. Canonical §2.2 forbids collecting those; rejecting unknown keys
 * means they cannot even be offered.
 *
 * WHY THE CANONICAL CONSTANT IS WHAT GETS STORED
 *
 * A client-supplied string is never persisted. The value written to the
 * database is EV000_CONSENT_VERSION, imported server-side and pinned by a
 * CHECK constraint on the table. The client's value is used only to decide
 * whether to proceed at all.
 */
function readConsentAssertion(raw: unknown): {
  ok: true;
} | {
  ok: false;
  code: ConsentFailure;
  message: string;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      code: "invalid_request",
      message: "The enrollment request could not be read.",
    };
  }

  const payload = raw as Record<string, unknown>;
  const keys = Object.keys(payload);

  if (keys.length !== 1 || keys[0] !== CONSENT_KEY) {
    // Covers a missing key, extra keys, and a wrong key name alike.
    return {
      ok: false,
      code: keys.includes(CONSENT_KEY) ? "invalid_request" : "consent_version_required",
      message:
        `The request must contain exactly one field, "${CONSENT_KEY}", ` +
        `whose value is "${EV000_CONSENT_VERSION}".`,
    };
  }

  const supplied = payload[CONSENT_KEY];
  if (typeof supplied !== "string" || supplied.length === 0) {
    return {
      ok: false,
      code: "consent_version_required",
      message: `The consent version must be sent as the string "${EV000_CONSENT_VERSION}".`,
    };
  }

  // Exact match against the frozen server-side constant. A near-miss, a
  // different version, or a placeholder is refused.
  if (supplied !== EV000_CONSENT_VERSION) {
    return {
      ok: false,
      code: "consent_version_mismatch",
      message: `The consent version "${EV000_CONSENT_VERSION}" must be accepted to enrol.`,
    };
  }

  return { ok: true };
}

export async function POST(request: Request): Promise<Response> {
  const { allowed, resetAt } = enrollLimiter.check(getClientIP(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many enrollment attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(resetAt / 1000)) } },
    );
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "The enrollment request was not accepted." },
      { status: 400 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    // Malformed JSON is a client error, and nothing has been created.
    return NextResponse.json(
      {
        ok: false,
        error: "The enrollment request could not be read.",
        consent_version: EV000_CONSENT_VERSION,
      },
      { status: 400 },
    );
  }

  const consent = readConsentAssertion(raw);
  if (!consent.ok) {
    // No store is constructed and no Participant Ref is generated on this
    // path, so a rejected request leaves nothing behind to clean up.
    return NextResponse.json(
      {
        ok: false,
        error: consent.message,
        consent_version: EV000_CONSENT_VERSION,
      },
      { status: 400 },
    );
  }

  let store: Awaited<ReturnType<typeof createEv000EnrollmentStoreFromEnv>>;
  try {
    store = await createEv000EnrollmentStoreFromEnv();
  } catch {
    // No enrollment record exists, so there is nothing to report as done.
    return NextResponse.json(
      { ok: false, error: "Enrollment is not available right now." },
      { status: 503 },
    );
  }

  const now = new Date().toISOString();
  const result = await store.enroll(now);

  if (!result.ok) {
    // detail is server-generated and never contains the ref.
    console.error("[ev000-enroll] failed", { reason: result.detail });
    return NextResponse.json(
      { ok: false, error: "Enrollment could not be completed." },
      { status: 500 },
    );
  }

  // The ONLY place the raw ref leaves the server. Returned once.
  return NextResponse.json(
    {
      ok: true,
      participantRef: result.participantRef,
      consentVersion: EV000_CONSENT_VERSION,
      enrolledAt: result.enrollment.enrolledAt,
      retentionDays: EV000_RETENTION_DAYS,
      withdrawalContact: EV000_WITHDRAWAL_CONTACT,
      notice:
        "This is the only time your Participant Ref will be shown. " +
        "Keep it somewhere safe — you need it to withdraw.",
    },
    { status: 201 },
  );
}
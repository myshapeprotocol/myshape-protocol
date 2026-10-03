// ============================================================
// MyShape Protocol — EV-000 enrollment store
//
// Implements ONLY the enrollment/withdrawal lifecycle frozen in
// docs/EV-000-canonical-definition.md §15A and §17.2.
//
// WHY A SEPARATE MODULE
//
// EV-000 governs a person. The research stores (`discovery_survey`,
// `research_sessions`, `continuity_receipts`) govern measurements or
// cryptographic proofs. Canonical §14 classifies each of them as CONNECT or
// LEAVE INDEPENDENT, and none may acquire a participant-identity column.
// Keeping enrollment in its own module makes that boundary structural.
//
// THE RAW PARTICIPANT REF NEVER REACHES STORAGE
//
// enroll() generates it, hashes it, and returns it. Only the hash is
// persisted, and no retrieval path exists that could return it again.
//
// NO PAYLOAD EXISTS IN THIS SLICE
//
// Canonical §9 step 4 requires withdrawal to remove participant payload.
// The table has no payload column, so there is nothing to purge. That is
// stated rather than papered over with a placeholder column.
//
// NO INTERACTION, NO LINKAGE
//
// Canonical §4 and §16.B keep interaction taxonomy deferred. Nothing here
// records an interaction, requires an interaction_kind, or links to
// `research_sessions`. Enrollment is valid with zero interactions.
// ============================================================

import { sha256Hex } from "@/lib/hash";

export const EV000_TABLE = "ev000_enrollment";

/** 90 days, frozen by canonical §11. */
export const EV000_RETENTION_DAYS = 90;

/**
 * The frozen consent version. Pinned by canonical §15A and by a CHECK
 * constraint on the table, so a second version cannot appear by accident.
 */
export const EV000_CONSENT_VERSION = "EV-000-CONSENT-1.0";

/** The confirmed participant-facing withdrawal contact (canonical §9.2). */
export const EV000_WITHDRAWAL_CONTACT = "dev@myshape.com";

/** Bytes of entropy in a Participant Ref — 256 bits. */
export const EV000_REF_BYTES = 32;

/** Canonical §8, restricted to the two states this slice can reach. */
export type Ev000LifecycleState = "ENROLLED" | "WITHDRAWN";

export interface Ev000EnrollmentRecord {
  enrollmentId: string;
  participantRefHash: string;
  consentVersion: string;
  enrolledAt: string;
  retentionUntil: string;
  lifecycleState: Ev000LifecycleState;
  withdrawnAt: string | null;
}

export type EnrollFailure = "ENROLLMENT_ERROR";
export type WithdrawFailure = "WITHDRAWAL_ERROR";

export interface Ev000Store {
  enroll(now: string): Promise<
    | { ok: true; participantRef: string; enrollment: Ev000EnrollmentRecord }
    | { ok: false; code: EnrollFailure; detail: string }
  >;
  withdraw(
    participantRef: string,
    now: string,
  ): Promise<
    | { ok: true; withdrawnAt: string }
    | { ok: false; code: WithdrawFailure; detail: string }
  >;
}

/**
 * Generate a Participant Ref: 256 bits from the platform CSPRNG, hex
 * encoded.
 *
 * `crypto.getRandomValues` is mandatory. If unavailable this throws rather
 * than falling back to `Math.random`, mirroring `cps0001.ts:136` — a
 * capability that protects withdrawal must never degrade to a predictable
 * value.
 */
export function generateParticipantRef(): string {
  const g = globalThis.crypto;
  if (typeof g === "undefined" || typeof g.getRandomValues !== "function") {
    throw new Error("CSPRNG unavailable: crypto.getRandomValues is required");
  }
  const bytes = new Uint8Array(EV000_REF_BYTES);
  g.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/** SHA-256 hex of a Participant Ref. Reuses the project's single hash helper. */
export function hashParticipantRef(participantRef: string): string {
  return sha256Hex(participantRef);
}

/**
 * Retention deadline for an enrollment. Derived from `enrolledAt` alone, so
 * later activity cannot move it (canonical §11).
 */
export function retentionUntilFrom(
  enrolledAt: string,
  days: number = EV000_RETENTION_DAYS,
): string {
  const base = new Date(enrolledAt);
  if (Number.isNaN(base.getTime())) {
    throw new Error(`invalid enrolledAt: ${enrolledAt}`);
  }
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

const HEX64 = /^[0-9a-f]{64}$/;

/**
 * Shape validation only. It cannot establish that a ref is genuine; that is
 * the hash lookup's job. Nothing here reveals whether a well-formed ref
 * belongs to anyone.
 */
export function isWellFormedRef(value: unknown): value is string {
  return typeof value === "string" && HEX64.test(value);
}
// ---------------------------------------------------------
// Supabase client shape
//
// Declared structurally and narrowly: only the methods this store uses are
// present, so the module cannot express an arbitrary mutation.
// ---------------------------------------------------------

export interface Ev000QueryBuilder {
  select(columns: string): Ev000QueryBuilder;
  eq(column: string, value: string): Ev000QueryBuilder;
  insert(values: Record<string, unknown>): Ev000InsertBuilder;
  update(values: Record<string, unknown>): Ev000UpdateBuilder;
  single(): PromiseLike<Ev000Result>;
  maybeSingle(): PromiseLike<Ev000Result>;
}

export interface Ev000InsertBuilder {
  select(columns: string): Ev000SingleBuilder;
}

export interface Ev000UpdateBuilder {
  eq(column: string, value: string): Ev000UpdateBuilder;
  select(columns: string): Ev000SingleBuilder;
}

export interface Ev000SingleBuilder {
  single(): PromiseLike<Ev000Result>;
}

export interface Ev000Result {
  data: unknown;
  error: unknown;
}

export interface Ev000Client {
  from(table: string): Ev000QueryBuilder;
}

const RECORD_COLUMNS =
  "enrollment_id,participant_ref_hash,consent_version," +
  "enrolled_at,retention_until,lifecycle_state,withdrawn_at";

function toError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function mapRow(row: unknown): Ev000EnrollmentRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const state = r.lifecycle_state;
  if (
    typeof r.enrollment_id !== "string" ||
    typeof r.participant_ref_hash !== "string" ||
    typeof r.consent_version !== "string" ||
    typeof r.enrolled_at !== "string" ||
    typeof r.retention_until !== "string" ||
    (state !== "ENROLLED" && state !== "WITHDRAWN")
  ) {
    return null;
  }
  return {
    enrollmentId: r.enrollment_id,
    participantRefHash: r.participant_ref_hash,
    consentVersion: r.consent_version,
    enrolledAt: r.enrolled_at,
    retentionUntil: r.retention_until,
    lifecycleState: state,
    withdrawnAt: typeof r.withdrawn_at === "string" ? r.withdrawn_at : null,
  };
}
/**
 * Build the store over an existing client.
 *
 * Exported separately from the factory so tests can drive the real mapping
 * and the real persistence sequence with a plain object double.
 */
export function createEv000EnrollmentStore(
  client: Ev000Client,
): Ev000Store {
  return {
    async enroll(now: string) {
      let participantRef: string;
      try {
        participantRef = generateParticipantRef();
      } catch (err) {
        return {
          ok: false as const,
          code: "ENROLLMENT_ERROR" as const,
          detail: `could not generate a participant ref: ${toError(err)}`,
        };
      }

      // The raw ref goes no further than this line. Only its hash is written.
      const participantRefHash = hashParticipantRef(participantRef);
      const retentionUntil = retentionUntilFrom(now);

      const { data, error } = await client
        .from(EV000_TABLE)
        .insert({
          participant_ref_hash: participantRefHash,
          consent_version: EV000_CONSENT_VERSION,
          enrolled_at: now,
          retention_until: retentionUntil,
          lifecycle_state: "ENROLLED",
        })
        .select(RECORD_COLUMNS)
        .single();

      if (error) {
        // The ref is intentionally NOT part of this message.
        return {
          ok: false as const,
          code: "ENROLLMENT_ERROR" as const,
          detail: `could not persist the enrollment: ${toError(error)}`,
        };
      }

      const enrollment = mapRow(data);
      if (!enrollment) {
        return {
          ok: false as const,
          code: "ENROLLMENT_ERROR" as const,
          detail: "the enrollment row could not be read back",
        };
      }

      return { ok: true as const, participantRef, enrollment };
    },

    async withdraw(participantRef: string, now: string) {
      if (!isWellFormedRef(participantRef)) {
        // Reported without the supplied value. An invalid ref is never echoed.
        return {
          ok: false as const,
          code: "WITHDRAWAL_ERROR" as const,
          detail: "the participant ref is not a valid EV-000 participant ref",
        };
      }

      const participantRefHash = hashParticipantRef(participantRef);

      // Look up by hash. The raw ref is never part of a query string.
      const { data: found, error: findError } = await client
        .from(EV000_TABLE)
        .select(RECORD_COLUMNS)
        .eq("participant_ref_hash", participantRefHash)
        .maybeSingle();

      if (findError) {
        return {
          ok: false as const,
          code: "WITHDRAWAL_ERROR" as const,
          detail: `could not read the enrollment: ${toError(findError)}`,
        };
      }

      const enrollment = mapRow(found);
      if (!enrollment) {
        // No such enrollment. Deliberately indistinguishable from any other
        // unresolvable ref.
        return {
          ok: false as const,
          code: "WITHDRAWAL_ERROR" as const,
          detail: "no active enrollment matches that participant ref",
        };
      }

      if (enrollment.lifecycleState === "WITHDRAWN") {
        // Already withdrawn. Success would lie about a new transition; a
        // distinct error would leak that this ref once existed. The route
        // maps both to one opaque response.
        return {
          ok: false as const,
          code: "WITHDRAWAL_ERROR" as const,
          detail: "that enrollment has already been withdrawn",
        };
      }

      // ONE atomic, guarded UPDATE performs the whole withdrawal.
      //
      // Canonical §9 step 4 requires the participant payload to be removed.
      // The stored Participant Ref hash IS that payload: it is the stored
      // form of the withdrawal capability and, under canonical §11.3, it is
      // Participant Data rather than governance metadata. It is therefore
      // nulled in the SAME statement that transitions the lifecycle, so the
      // row is never observable in a WITHDRAWN state while still holding a
      // capability — the state the database constraint
      // ev000_enrollment_withdrawn_capability_removed forbids.
      //
      // This is NOT retention. Retention expiry is a separate removal cause,
      // performed by purge_expired_ev000_participant_data(), which also
      // records retention_purged_at. Withdrawal deliberately does NOT set
      // that column: a row withdrawn before expiry is a different fact from
      // a row purged because 90 days elapsed.
      //
      // Nothing here touches enrolled_at, retention_until, consent_version or
      // retention_purged_at, so the 90-day clock cannot move (§11.1). The
      // existing .eq("lifecycle_state", "ENROLLED") guard is preserved, so a
      // repeated withdrawal can never re-enter this statement.
      const { error: updateError } = await client
        .from(EV000_TABLE)
        .update({
          lifecycle_state: "WITHDRAWN",
          withdrawn_at: now,
          participant_ref_hash: null,
        })
        .eq("participant_ref_hash", participantRefHash)
        .eq("lifecycle_state", "ENROLLED")
        .select("enrollment_id")
        .single();

      if (updateError) {
        return {
          ok: false as const,
          code: "WITHDRAWAL_ERROR" as const,
          detail: `could not withdraw the enrollment: ${toError(updateError)}`,
        };
      }

      // Canonical §9 step 4 is satisfied by the participant_ref_hash = NULL
      // above: that column held the entire participant payload this slice
      // stores. No other payload column exists, so nothing else is removed
      // here. See the module header.
      return { ok: true as const, withdrawnAt: now };
    },
  };
}

/** Factory: service-role credentials, same convention as the other stores. */
export async function createEv000EnrollmentStoreFromEnv(): Promise<Ev000Store> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase environment not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createEv000EnrollmentStore(
    createClient(url, key) as unknown as Ev000Client,
  );
}
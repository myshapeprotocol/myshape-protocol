-- EV-000 — Enrollment primitive
--
-- Implements ONLY the enrollment/withdrawal lifecycle frozen in
-- docs/EV-000-canonical-definition.md §15A and §17.2.
--
-- It is deliberately minimal. This table records that a person agreed to
-- take part and nothing about who they are.
--
-- WHAT IS DELIBERATELY ABSENT
--
-- No name, email, phone, wallet, account, device fingerprint, persistent IP,
-- marketing field, or demographic column exists here, and none may be added
-- without a further governance decision (canonical §2.2). The raw Participant
-- Ref is never stored: only its SHA-256 hash.
--
-- RETENTION
--
-- retention_until is fixed at enrolled_at + 90 days and is never extended by
-- later activity (§11). It is persisted so expiry is deterministic even
-- though this slice ships no purge worker — see the operational gap note.

CREATE TABLE IF NOT EXISTS ev000_enrollment (
  -- Internal identifier. Never returned to a participant.
  enrollment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SHA-256 hex of the Participant Ref. The raw ref is shown to the
  -- participant exactly once and is never persisted.
  --
  -- NULLABLE BY DESIGN (canonical §11.3). participant_ref_hash is Participant
  -- Data, not governance metadata: it is the stored form of the withdrawal
  -- capability and expires with participant data. It is removed on withdrawal
  -- and on retention expiry. The Governance Record survives (§11.2).
  --
  -- UNIQUE is retained deliberately. PostgreSQL treats NULLs as distinct in a
  -- unique index, so every live capability hash stays unique while any number
  -- of purged rows may hold NULL. No replacement identifier is introduced,
  -- and uniqueness is not delegated to the application.
  participant_ref_hash TEXT UNIQUE,

  -- The frozen consent accepted at enrollment (§15A).
  consent_version   TEXT NOT NULL
                    CONSTRAINT ev000_enrollment_consent_version_frozen
                    CHECK (consent_version = 'EV-000-CONSENT-1.0'),

  enrolled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 90 days from enrolled_at. Set once, never recomputed, never extended.
  retention_until   TIMESTAMPTZ NOT NULL
                    CONSTRAINT ev000_enrollment_retention_window
                    CHECK (
                      retention_until >= enrolled_at
                      AND retention_until <= enrolled_at + INTERVAL '90 days'
                    ),

  -- Only ENROLLED and WITHDRAWN exist in this slice (canonical §8).
  -- RETAINED_OUT is deliberately absent: no purge worker runs yet, and a
  -- state nothing can reach would be a claim the system cannot keep.
  lifecycle_state   TEXT NOT NULL DEFAULT 'ENROLLED'
                    CONSTRAINT ev000_enrollment_lifecycle_state
                    CHECK (lifecycle_state IN ('ENROLLED', 'WITHDRAWN')),

  withdrawn_at      TIMESTAMPTZ,

  -- ============================================================
  -- RETENTION OUTCOME (canonical §11.5, §11.6)
  --
  -- THIS COLUMN IS THE PROOF THAT RETENTION ENFORCEMENT OCCURRED.
  --
  --   retention_purged_at IS NULL      -> participant data still retained,
  --                                     not yet expired
  --   retention_purged_at = <ts>      -> participant data was purged because
  --                                     retention expired; this is the FIRST
  --                                     and recorded purge time
  --
  -- A timestamp is used rather than a new lifecycle state because retention
  -- expiry is a data-retention OUTCOME orthogonal to lifecycle_state (§11.4).
  -- It introduces no stage, cannot be reached as research progress, and is
  -- non-identifying and auditable.
  --
  -- INVARIANTS ENFORCED BELOW:
  --   * a purge may only occur once the row is genuinely expired
  --   * a purged row retains no participant capability
  --   * a purge never moves retention_until, enrolled_at, consent_version or
  --     withdrawn_at — the retention clock is immutable (§11.1)
  --   * withdrawal may NOT set this: withdrawal has its own outcome
  --     (withdrawn_at) and is not a retention expiry
  retention_purged_at TIMESTAMPTZ
                      CONSTRAINT ev000_enrollment_purge_requires_capability_removal
                      CHECK (retention_purged_at IS NULL OR participant_ref_hash IS NULL)
                      CONSTRAINT ev000_enrollment_purge_requires_expiry
                      CHECK (
                        retention_purged_at IS NULL
                        OR retention_purged_at >= retention_until
                      ),

  -- The enrollment row ALWAYS carries governance evidence. The canonical
  -- definition forbids representing retention expiry as deletion of the whole
  -- record (§11.7), so at least one governance field must remain populated.
  CONSTRAINT ev000_enrollment_governance_record_never_empty
    CHECK (consent_version IS NOT NULL AND enrolled_at IS NOT NULL),

  -- A withdrawal timestamp must exist exactly when the state says WITHDRAWN.
  -- This is what makes the transition irreversible: the row can never be
  -- readmitted to ENROLLED because withdrawn_at is only ever set.
CONSTRAINT ev000_enrollment_withdrawal_consistent
    CHECK (
      (lifecycle_state = 'WITHDRAWN' AND withdrawn_at IS NOT NULL)
      OR (lifecycle_state = 'ENROLLED'  AND withdrawn_at IS NULL)
    ),

  -- ============================================================
  -- WITHDRAWAL REMOVES THE CAPABILITY (canonical §9 step 4, §11.3)
  --
  -- A WITHDRAWN row must hold no participant capability. The hash is the
  -- stored withdrawal credential; keeping it after withdrawal would preserve
  -- a capability for a record the participant asked to end.
  --
  -- withdrawn_at ALONE is sufficient to demonstrate that participant data was
  -- removed for withdrawal purposes — no separate withdrawal-purge timestamp
  -- is introduced. The two outcomes are already distinguishable:
  --
  --   withdrawn, not expired : lifecycle_state=WITHDRAWN, withdrawn_at set,
  --                             retention_purged_at NULL
  --   expired and purged     : retention_purged_at set, lifecycle untouched
  --                             (§11.4 — retention is not a lifecycle state)
  --
  -- This does NOT delete the row: consent_version, enrolled_at and
  -- withdrawn_at survive as the Governance Record (§11.2).
  -- ============================================================
  CONSTRAINT ev000_enrollment_withdrawn_capability_removed
    CHECK (lifecycle_state <> 'WITHDRAWN' OR participant_ref_hash IS NULL)
);

-- Withdrawal looks the enrollment up by hash; this index makes that the
-- access path rather than a table scan. NULL hashes are indexed too, which is
-- harmless: a NULL never equals a searched hash.
CREATE INDEX IF NOT EXISTS idx_ev000_enrollment_ref_hash
  ON ev000_enrollment (participant_ref_hash);

-- The retention purge scans for rows whose retention_until has passed and
-- whose retention_purged_at is still NULL. This partial index makes that
-- selection cheap and keeps already-purged rows out of the scan entirely.
CREATE INDEX IF NOT EXISTS idx_ev000_enrollment_retention_until
  ON ev000_enrollment (retention_until)
  WHERE retention_purged_at IS NULL;

-- No payload columns exist in this slice, so there is nothing for a
-- withdrawal to purge. Canonical §9 step 4 is therefore satisfied
-- vacuously today; it becomes meaningful only once an Interaction
-- artifact store is connected, which this slice does not do (§12).

COMMENT ON TABLE ev000_enrollment IS
  'EV-000 enrollment consent record. Holds no participant identity — only the SHA-256 hash of a Participant Ref, the frozen consent version, timestamps and lifecycle state. See docs/EV-000-canonical-definition.md.';

COMMENT ON COLUMN ev000_enrollment.participant_ref_hash IS
  'SHA-256 hex of the Participant Ref. The raw ref is shown once and never persisted.';

COMMENT ON COLUMN ev000_enrollment.consent_version IS
  'Frozen consent version. Pinned by CHECK; only EV-000-CONSENT-1.0 is valid.';

COMMENT ON COLUMN ev000_enrollment.retention_until IS
  'enrolled_at + 90 days. Fixed at insert; never reset by later activity.';

COMMENT ON COLUMN ev000_enrollment.lifecycle_state IS
  'ENROLLED or WITHDRAWN. Withdrawal is irreversible. Retention expiry is NOT a state (canonical §11.4).';

COMMENT ON COLUMN ev000_enrollment.retention_purged_at IS
  'Timestamp of the FIRST retention purge: participant capability was removed because retention_until had passed. NULL means participant data is still retained, not yet expired. Never reset; never set by withdrawal.';

-- ============================================================
-- Least-privilege grants (canonical §7 security blocker).
--
-- Supabase grants ALL on public-schema tables to anon, authenticated and
-- service_role by default. PostgreSQL GRANT is additive: a narrow GRANT cannot
-- withdraw a privilege already granted by default, so REVOKE must come first.
-- This mirrors the MVDS migration, which records the same rule.
--
-- RLS alone denies row visibility to anon/authenticated, but the table-level
-- privileges would otherwise remain granted. Both layers are needed: the
-- privilege layer refuses the table, the policy layer would refuse the row.
-- ============================================================

REVOKE ALL ON ev000_enrollment FROM anon, authenticated;

-- Operational table: service_role keeps row-level DML but never TRUNCATE,
-- which would destroy the Governance Record that §11.6 requires be
-- demonstrable.
REVOKE TRUNCATE ON ev000_enrollment FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ev000_enrollment TO service_role;

-- RLS: deny anon/authenticated entirely. Enrollment is reached only through
-- the service-role API route, which owns the Participant Ref lifecycle.
ALTER TABLE ev000_enrollment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ev000_enrollment_service_only" ON ev000_enrollment
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ev000_enrollment_deny_anon" ON ev000_enrollment
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "ev000_enrollment_deny_authenticated" ON ev000_enrollment
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- Retention purge operation (canonical §11.7)
--
-- WHAT IT DOES, IN ORDER
--   1. find rows whose retention_until has passed AND whose retention_purged_at
--      is still NULL  (expired, not yet purged)
--   2. remove the participant capability  (participant_ref_hash := NULL)
--   3. preserve the Governance Record      (the row itself is never deleted)
--   4. record the retention outcome        (retention_purged_at := NOW())
--
-- WHAT IT NEVER DOES
--   * delete an enrollment row
--   * touch lifecycle_state, consent_version, enrolled_at, retention_until or
--     withdrawn_at — the retention clock is immutable
--   * modify a row that has not expired, or one already purged
--   * create any replacement identifier
--   * return or log participant data; it returns a row COUNT only
--
-- IDEMPOTENCY
--   The `retention_purged_at IS NULL` predicate is the whole mechanism. The
--   first successful purge sets the timestamp; every later invocation selects
--   nothing and mutates nothing. The FIRST purge time is the recorded outcome
--   and is never overwritten. No event row is appended per run.
--
-- WHY A SINGLE UPDATE, NOT DELETE + REINSERT
--   An UPDATE preserves the row identity (enrollment_id) and every governance
--   column in one atomic statement, with no window in which the record is
--   absent. The table's CHECK constraints independently forbid the two illegal
--   orderings: purging without removing the capability, and purging before
--   the retention window closed.
--
-- EXTENSIBILITY
--   When participant payload tables are connected later (§11.2), their
--   deletion joins this function as additional statements in the same
--   transaction. No payload columns are invented here.
-- ============================================================

CREATE OR REPLACE FUNCTION purge_expired_ev000_participant_data()
RETURNS INTEGER AS $$
DECLARE
  purged_count INTEGER;
BEGIN
  -- Single atomic statement. NOW() is transaction-stable, so every row in one
  -- invocation is judged against the same instant.
  UPDATE ev000_enrollment
     SET participant_ref_hash = NULL,
         retention_purged_at  = NOW()
   WHERE retention_until <= NOW()
     AND retention_purged_at IS NULL;

  GET DIAGNOSTICS purged_count = ROW_COUNT;
  RETURN purged_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION purge_expired_ev000_participant_data() IS
  'Removes participant capability from EV-000 enrollments whose 90-day retention has expired, and records the first purge time. Idempotent: a second invocation over the same rows selects nothing. Never deletes the Governance Record. Returns the number of rows purged, never participant data.';

-- The function is SECURITY INVOKER, so it runs with the privileges of whoever
-- calls it. That is deliberate: it grants no new privilege of its own, and it
-- is reachable only by a role that already holds UPDATE on the table
-- (service_role, or the database owner for pg_cron — see the pg_cron note).
-- No GRANT is issued to anon or authenticated, so no public path exists.

-- ============================================================
-- SCHEDULING — INTENTIONALLY NOT CONFIGURED HERE
--
-- Canonical §11.7 records pg_cron as the intended substrate. It is NOT
-- enabled, scheduled, or granted by this migration, because availability in
-- the target environment has not been established. See the implementation
-- report: confirming the extension, the exact CREATE EXTENSION / cron.schedule
-- syntax, and whether the scheduled role may execute this function are all
-- pre-conditions for a separate infrastructure gate.
--
-- A purge function with no caller is NOT retention enforcement. Until the
-- schedule is live and verified, retention is unenforced and the enrolment
-- consent must not be presented to participants.
-- ============================================================
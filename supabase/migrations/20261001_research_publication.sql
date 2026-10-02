-- Migration: research publication distribution layer
--
-- Three tables: publication records, platform attempts, and append-only
-- approval events.
--
-- SSOT boundary: the Git/YAML Registry is the governance SSOT for asset /
-- version / surface identity. This database is a disposable operational
-- read model rebuilt from it; on conflict the Registry wins. Publication
-- governance evidence (who approved what, when, against which snapshot)
-- lives in research_publication_approval_event, NOT in the Registry and
-- NOT in a mutable column. research_publication.governance_state is a
-- derived operational cache only.
--
-- No foreign keys to Registry entities: asset_id / version_id / surface are
-- validated at application/sync time. registry_commit anchors the record
-- to the validated snapshot.
--
-- content_fingerprint = SHA-256(UTF8(JCS({content,title}))) per RFC 8785,
-- matching the frozen repo digest rule (CPS-0001 / CPS-0002). Computed by
-- the application layer before publication; this migration never computes it.
--
-- Safe to apply independently: no existing table is altered.

-- ==============================================================
-- 1. research_publication
-- ==============================================================
CREATE TABLE IF NOT EXISTS research_publication (
  publication_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  asset_id            TEXT NOT NULL,
  version_id          TEXT NOT NULL,
  surface             TEXT NOT NULL,
  brand               TEXT NOT NULL,
  platform            TEXT NOT NULL,
  content_fingerprint TEXT NOT NULL,
  registry_commit     TEXT NOT NULL,
  governance_state    TEXT NOT NULL DEFAULT 'DRAFT',
  delivery_state      TEXT NOT NULL DEFAULT 'NOT_ATTEMPTED',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_publication_fingerprint_hex
    CHECK (content_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT research_publication_registry_commit_hex
    CHECK (registry_commit ~ '^[0-9a-f]{7,40}$'),
  CONSTRAINT research_publication_governance_state_enum
    CHECK (governance_state IN ('DRAFT','AI_REVIEWED','HUMAN_APPROVED','WITHDRAWN')),
  CONSTRAINT research_publication_delivery_state_enum
    CHECK (delivery_state IN ('NOT_ATTEMPTED','IN_FLIGHT','PUBLISHED','FAILED')),
  CONSTRAINT research_publication_idempotency_key
    UNIQUE (version_id, surface, platform, content_fingerprint)
);

-- ==============================================================
-- 2. research_publication_attempt
-- ==============================================================
CREATE TABLE IF NOT EXISTS research_publication_attempt (
  attempt_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publication_id          BIGINT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'IN_FLIGHT',
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at            TIMESTAMPTZ,
  platform_post_id        TEXT,
  rendered_text           TEXT,
  error                   TEXT,
  reconciliation_required BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_publication_attempt_publication_fk
    FOREIGN KEY (publication_id)
    REFERENCES research_publication (publication_id)
    ON DELETE RESTRICT,
  CONSTRAINT research_publication_attempt_status_enum
    CHECK (status IN ('IN_FLIGHT','SUCCEEDED','FAILED','SKIPPED')),
  CONSTRAINT research_publication_attempt_completion_consistency
    CHECK (
      (status = 'IN_FLIGHT'  AND completed_at IS NULL)
      OR (status <> 'IN_FLIGHT' AND completed_at IS NOT NULL)
    )
);

-- ==============================================================
-- 3. research_publication_approval_event  (append-only)
-- ==============================================================
CREATE TABLE IF NOT EXISTS research_publication_approval_event (
  approval_event_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publication_id      BIGINT NOT NULL,
  decision            TEXT NOT NULL,
  approver_type       TEXT NOT NULL,
  approver_id         TEXT NOT NULL,
  approval_source     TEXT NOT NULL,
  approval_ref        TEXT NOT NULL,
  approved_at         TIMESTAMPTZ NOT NULL,
  content_fingerprint TEXT NOT NULL,
  registry_commit     TEXT NOT NULL,
  reason              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT research_publication_approval_event_publication_fk
    FOREIGN KEY (publication_id)
    REFERENCES research_publication (publication_id)
    ON DELETE RESTRICT,
  CONSTRAINT research_publication_approval_event_decision_enum
    CHECK (decision IN ('approved','rejected','exception_granted','withdrawn','noted')),
  CONSTRAINT research_publication_approval_event_approver_type_enum
    CHECK (approver_type IN ('HUMAN','AI_REVIEW','SYSTEM')),
  CONSTRAINT research_publication_approval_event_exception_reason
    CHECK (
      (decision = 'exception_granted' AND reason IS NOT NULL AND reason <> '')
      OR (decision <> 'exception_granted')
    ),
  CONSTRAINT research_publication_approval_event_fingerprint_hex
    CHECK (content_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT research_publication_approval_event_registry_commit_hex
    CHECK (registry_commit ~ '^[0-9a-f]{7,40}$')
);

-- ==============================================================
-- 4. Explicit least-privilege grants
-- ==============================================================
-- Supabase grants ALL on tables in the public schema to anon, authenticated
-- and service_role by default. These statements make the intended privilege
-- set explicit rather than inherited, so the tables remain correct if
-- platform defaults change.
--
-- PostgreSQL GRANT is additive: a narrow GRANT cannot withdraw a privilege
-- already granted by default. REVOKE and GRANT are therefore both required,
-- and REVOKE must come first.
--
-- No explicit sequence grants are added in this migration. The current
-- production ACL for identity sequences has not been directly verified.
-- Existing deployed identity-table patterns provide supporting evidence that
-- the project's current privilege model permits the required sequence
-- access. Production ACL verification remains a pre-application check.
--
-- Anon and authenticated receive no privileges at all; their access is
-- denied here as well as by the RLS policies below (defence in depth).

REVOKE ALL ON research_publication
  FROM anon, authenticated;

REVOKE ALL ON research_publication_attempt
  FROM anon, authenticated;

REVOKE ALL ON research_publication_approval_event
  FROM anon, authenticated;

-- Append-only governance evidence. TRUNCATE is revoked alongside UPDATE
-- and DELETE because it is a separate privilege, is included in GRANT ALL
-- ON TABLES, and does not fire ON DELETE triggers. Without this, the table
-- could be emptied without the trigger ever running.
REVOKE UPDATE, DELETE, TRUNCATE
  ON research_publication_approval_event FROM service_role;

-- Operational tables: service_role keeps row-level DML but never TRUNCATE,
-- which would destroy publication and delivery history.
REVOKE TRUNCATE
  ON research_publication, research_publication_attempt FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON research_publication TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON research_publication_attempt TO service_role;

GRANT SELECT, INSERT
  ON research_publication_approval_event TO service_role;

-- ==============================================================
-- 5. Append-only trigger (defence in depth)
-- ==============================================================
-- service_role holds BYPASSRLS, so RLS policies do not constrain it.
-- BYPASSRLS bypasses only row-level security POLICIES, not table-level
-- privileges; service_role is neither a superuser nor the owner of this
-- table, so the REVOKE above is genuinely effective.
-- This trigger is the second layer: it remains effective even if table
-- privileges are later re-granted.
-- INSERT is deliberately not triggered and continues to work.
-- TRUNCATE is closed at the privilege layer above; no BEFORE TRUNCATE
-- trigger is added, by design, to keep the trigger set minimal.
-- CREATE TRIGGER has no IF NOT EXISTS in PostgreSQL, so each trigger is
-- dropped if present before creation to keep re-runs idempotent.
CREATE OR REPLACE FUNCTION research_publication_approval_event_is_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'research_publication_approval_event is append-only governance evidence: % is not permitted. Record a new event instead.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS research_publication_approval_event_no_update
  ON research_publication_approval_event;
CREATE TRIGGER research_publication_approval_event_no_update
  BEFORE UPDATE ON research_publication_approval_event
  FOR EACH ROW EXECUTE FUNCTION research_publication_approval_event_is_append_only();

DROP TRIGGER IF EXISTS research_publication_approval_event_no_delete
  ON research_publication_approval_event;
CREATE TRIGGER research_publication_approval_event_no_delete
  BEFORE DELETE ON research_publication_approval_event
  FOR EACH ROW EXECUTE FUNCTION research_publication_approval_event_is_append_only();

-- ==============================================================
-- 6. Indexes (idempotency, lookup, reconciliation)
-- ==============================================================
-- idempotency is covered by the UNIQUE constraint (implicit index).
CREATE INDEX IF NOT EXISTS research_publication_version_idx
  ON research_publication (version_id);

CREATE INDEX IF NOT EXISTS research_publication_attempt_publication_idx
  ON research_publication_attempt (publication_id);

CREATE INDEX IF NOT EXISTS research_publication_attempt_inflight_idx
  ON research_publication_attempt (status)
  WHERE status = 'IN_FLIGHT';

CREATE INDEX IF NOT EXISTS research_publication_approval_event_history_idx
  ON research_publication_approval_event (publication_id, approved_at DESC);

-- ==============================================================
-- 7. RLS
-- ==============================================================
-- No anonymous or authenticated access to any of the three tables.
-- All access goes through server-side code using the service role.
ALTER TABLE research_publication ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_publication_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_publication_approval_event ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- 8. Policies
-- ==============================================================
-- Policy names are scoped per table in PostgreSQL, so the generic names
-- below match the existing repository convention.

CREATE POLICY "service_role_full_access" ON research_publication
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_all" ON research_publication
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_publication
  FOR ALL TO authenticated USING (false);

CREATE POLICY "service_role_full_access" ON research_publication_attempt
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_all" ON research_publication_attempt
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_publication_attempt
  FOR ALL TO authenticated USING (false);

-- Approval events: insert and select only. Combined with the REVOKE and
-- trigger above, UPDATE and DELETE are refused at the privilege, policy,
-- and trigger layers respectively.
CREATE POLICY "service_role_insert_approval" ON research_publication_approval_event
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_role_select_approval" ON research_publication_approval_event
  FOR SELECT TO service_role USING (true);

CREATE POLICY "deny_anon_all" ON research_publication_approval_event
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_publication_approval_event
  FOR ALL TO authenticated USING (false);

-- ==============================================================
-- 9. Comments
-- ==============================================================
COMMENT ON TABLE research_publication IS
  'Publication distribution record. Operational read model rebuilt from the Registry; the Registry wins on conflict.';
COMMENT ON COLUMN research_publication.registry_commit IS
  'Git commit anchoring this record to a validated Registry snapshot. No foreign key: the Registry is Git/YAML, validated at sync time.';
COMMENT ON COLUMN research_publication.content_fingerprint IS
  'SHA-256 hex of UTF-8(JCS({content,title})) per RFC 8785, computed by the application layer. Excludes platform, brand, surface, Registry metadata, and timestamps.';
COMMENT ON COLUMN research_publication.governance_state IS
  'Derived operational cache recomputed from research_publication_approval_event. DRAFT | AI_REVIEWED | HUMAN_APPROVED | WITHDRAWN. Not a governance SSOT; the Registry does not decide publication approval. Never PUBLISHING or PUBLISHED here.';
COMMENT ON COLUMN research_publication.delivery_state IS
  'Operational delivery state: NOT_ATTEMPTED | IN_FLIGHT | PUBLISHED | FAILED. Not a governance state.';

COMMENT ON TABLE research_publication_attempt IS
  'Operational record of one platform publish attempt.';
COMMENT ON COLUMN research_publication_attempt.status IS
  'IN_FLIGHT | SUCCEEDED | FAILED | SKIPPED. Uncertain external outcomes remain IN_FLIGHT with reconciliation_required = true.';
COMMENT ON COLUMN research_publication_attempt.platform_post_id IS
  'Platform post identifier when the platform provides one. NULL is normal and expected: the current Discord (webhook) and Telegram paths do not expose one. Success is determined by the publisher result, never by the presence of this column; a successful attempt with NULL here is SUCCEEDED and delivery_state is PUBLISHED.';
COMMENT ON COLUMN research_publication_attempt.rendered_text IS
  'The actual text handed to the platform during this attempt, retained for audit and reconciliation.';
COMMENT ON COLUMN research_publication_attempt.reconciliation_required IS
  'True when the external outcome is uncertain and needs reconciliation. Application-layer invariant relative to status; intentionally not DB-constrained.';

COMMENT ON TABLE research_publication_approval_event IS
  'Append-only publication governance evidence. UPDATE, DELETE and TRUNCATE are refused by explicit REVOKE from service_role; UPDATE and DELETE are additionally refused by BEFORE triggers.';
COMMENT ON FUNCTION research_publication_approval_event_is_append_only() IS
  'Rejects UPDATE and DELETE on research_publication_approval_event. Narrowly scoped to that single table.';
COMMENT ON COLUMN research_publication_approval_event.approver_type IS
  'HUMAN | AI_REVIEW | SYSTEM. service_role is a technical database authorization mechanism, not a governance approver identity.';
COMMENT ON COLUMN research_publication_approval_event.approver_id IS
  'Named governance actor, for example a GitHub login. Represents a named governance identity, not proof of biological humanity.';
COMMENT ON COLUMN research_publication_approval_event.approval_ref IS
  'Durable governance evidence reference, for example a GitHub pull request or review.';
COMMENT ON COLUMN research_publication_approval_event.content_fingerprint IS
  'Deliberately duplicated from the publication: immutable audit evidence of exactly which content was governed.';
COMMENT ON COLUMN research_publication_approval_event.registry_commit IS
  'Deliberately duplicated from the publication: immutable audit evidence of which Registry snapshot was in effect.';
COMMENT ON COLUMN research_publication_approval_event.reason IS
  'Required when decision = exception_granted.';

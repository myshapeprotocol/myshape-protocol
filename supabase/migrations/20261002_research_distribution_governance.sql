-- Migration: research distribution governance layer
-- ============================================================
-- Implements ADR-P2G-001 (Option B): the publication catalogue and the
-- distribution governance model are separate concerns.
--
-- Creates three NEW tables. It does not touch, reference, alter, grant,
-- revoke, or attach a policy to any pre-existing object. In particular no
-- statement in this file names research_publication,
-- research_publication_attempt, or research_publication_approval_event.
--
-- SSOT boundary
-- -------------
-- The Git/YAML Registry is the governance SSOT for asset / version /
-- surface identity. This database is a disposable operational read model
-- rebuilt from it; on conflict the Registry wins. Governance evidence
-- (who approved what, when, against which snapshot) lives in
-- research_distribution_event, NOT in the Registry and NOT in a mutable
-- column. research_distribution.governance_state is a derived operational
-- cache only.
--
-- No foreign keys to Registry entities: asset_id / version_id / surface are
-- validated at application/sync time. registry_commit anchors the record to
-- the validated snapshot.
--
-- content_fingerprint = SHA-256(UTF8(JCS({content,title}))) per RFC 8785,
-- matching the frozen repo digest rule (CPS-0001 / CPS-0002). Computed by
-- the application layer before publication; this migration never computes
-- it.
--
-- Locked decisions
-- ----------------
-- 1. Namespace is research_distribution*. The research_publication*
--    catalogue is a different domain and is deliberately left untouched.
-- 2. Singular naming retained.
-- 3. decision enum excludes 'noted'. Every remaining value resolves a
--    question; 'noted' observed without resolving and led nowhere.
-- 4. AI_REVIEWED is retained but never authorises publication. Enforced by
--    research_distribution_publish_requires_human_approval. The matching
--    application-layer requirement is specified in the review checklist and
--    must be implemented independently of this constraint.
-- 5. rendered_text is NOT NULL: an attempt row records intent before
--    execution, so a crash between record and send still preserves the
--    intended text.
-- 6. research_distribution_reconciliation_idx locates attempts whose
--    external outcome is uncertain.
--
-- Relationship to the quarantined artifact
-- ----------------------------------------
-- 20261001_research_publication.sql is retained at
-- supabase/quarantine/20261001_research_publication.sql and is deliberately
-- OUTSIDE the migration execution chain. It must not be applied against the
-- production database: its table names collide with the live catalogue and
-- its REVOKE statements would strip the catalogue's public read surface.
-- ============================================================


-- ============================================================
-- 1. research_distribution
-- ============================================================
-- Tables are created WITHOUT "IF NOT EXISTS" on purpose. The quarantined
-- artifact relied on IF NOT EXISTS and, against a database where the names
-- were already taken, silently skipped every table creation while still
-- applying its grants. Silent skip is the failure mode this migration
-- exists to avoid. If any of these names is already occupied, this
-- migration must fail loudly.
CREATE TABLE research_distribution (
  distribution_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
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

  CONSTRAINT research_distribution_fingerprint_hex
    CHECK (content_fingerprint ~ '^[0-9a-f]{64}$'),

  CONSTRAINT research_distribution_registry_commit_hex
    CHECK (registry_commit ~ '^[0-9a-f]{7,40}$'),

  CONSTRAINT research_distribution_governance_state_enum
    CHECK (governance_state IN
      ('DRAFT','AI_REVIEWED','HUMAN_APPROVED','WITHDRAWN')),

  CONSTRAINT research_distribution_delivery_state_enum
    CHECK (delivery_state IN
      ('NOT_ATTEMPTED','IN_FLIGHT','PUBLISHED','FAILED')),

  -- Locked decision 4. AI_REVIEWED must never authorise publishing.
  -- governance_state and delivery_state are both columns of THIS row, so the
  -- invariant is expressible as a single-row constraint. An application bug
  -- that sets PUBLISHED without HUMAN_APPROVED is rejected by the database
  -- rather than silently persisted. This constraint does not replace the
  -- application-layer check required by the review checklist.
  CONSTRAINT research_distribution_publish_requires_human_approval
    CHECK (delivery_state <> 'PUBLISHED'
        OR governance_state = 'HUMAN_APPROVED'),

  -- Idempotency boundary: one distribution record per content, per
  -- platform, per surface.
  CONSTRAINT research_distribution_idempotency_key
    UNIQUE (version_id, surface, platform, content_fingerprint)
);


-- ============================================================
-- 2. research_distribution_attempt
-- ============================================================
CREATE TABLE research_distribution_attempt (
  attempt_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  distribution_id         BIGINT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'IN_FLIGHT',
  started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at            TIMESTAMPTZ,
  rendered_text           TEXT NOT NULL,
  platform_post_id        TEXT,
  error                   TEXT,
  reconciliation_required BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT research_distribution_attempt_distribution_fk
    FOREIGN KEY (distribution_id)
    REFERENCES research_distribution (distribution_id)
    ON DELETE RESTRICT,

  CONSTRAINT research_distribution_attempt_status_enum
    CHECK (status IN ('IN_FLIGHT','SUCCEEDED','FAILED','SKIPPED')),

  CONSTRAINT research_distribution_attempt_completion_consistency
    CHECK (
      (status =  'IN_FLIGHT' AND completed_at IS NULL)
   OR (status <> 'IN_FLIGHT' AND completed_at IS NOT NULL)
    )
);


-- ============================================================
-- 3. research_distribution_event  (append-only)
-- ============================================================
CREATE TABLE research_distribution_event (
  event_id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  distribution_id     BIGINT NOT NULL,
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

  CONSTRAINT research_distribution_event_distribution_fk
    FOREIGN KEY (distribution_id)
    REFERENCES research_distribution (distribution_id)
    ON DELETE RESTRICT,

  -- Locked decision 3. 'noted' is excluded. An exception is never granted
  -- without a stated reason.
  CONSTRAINT research_distribution_event_decision_enum
    CHECK (decision IN
      ('approved','rejected','exception_granted','withdrawn')),

  CONSTRAINT research_distribution_event_approver_type_enum
    CHECK (approver_type IN ('HUMAN','AI_REVIEW','SYSTEM')),

  CONSTRAINT research_distribution_event_exception_reason
    CHECK (
      decision <> 'exception_granted'
   OR (reason IS NOT NULL AND reason <> '')
    ),

  -- Deliberate duplication from research_distribution: immutable audit
  -- evidence of exactly which content was governed.
  CONSTRAINT research_distribution_event_fingerprint_hex
    CHECK (content_fingerprint ~ '^[0-9a-f]{64}$'),

  -- Deliberate duplication: which Registry snapshot was in effect.
  CONSTRAINT research_distribution_event_registry_commit_hex
    CHECK (registry_commit ~ '^[0-9a-f]{7,40}$')
);


-- ============================================================
-- 4. Explicit least-privilege grants
-- ============================================================
-- Supabase grants ALL on public-schema tables to anon, authenticated and
-- service_role by default. These statements make the intended privilege set
-- explicit rather than inherited.
--
-- PostgreSQL GRANT is additive: a narrow GRANT cannot withdraw a privilege
-- already granted by default. REVOKE and GRANT are both required, and
-- REVOKE must come first.
--
-- No explicit sequence grants are added. The current production ACL for
-- identity sequences has not been directly verified. Existing deployed
-- identity-table patterns provide supporting evidence that the project's
-- current privilege model permits the required sequence access. Production
-- ACL verification remains a pre-application check.
--
-- Anon and authenticated receive no privileges at all; their access is
-- denied here as well as by the RLS policies in section 7.

REVOKE ALL ON research_distribution
  FROM anon, authenticated;

REVOKE ALL ON research_distribution_attempt
  FROM anon, authenticated;

REVOKE ALL ON research_distribution_event
  FROM anon, authenticated;

-- Append-only governance evidence. TRUNCATE is revoked alongside UPDATE
-- and DELETE because it is a separate privilege, is included in
-- GRANT ALL ON TABLES, and does not fire ON DELETE triggers. Without this,
-- the table could be emptied without the trigger ever running.
REVOKE UPDATE, DELETE, TRUNCATE
  ON research_distribution_event FROM service_role;

-- Operational tables: service_role keeps row-level DML but never TRUNCATE,
-- which would destroy distribution and delivery history.
REVOKE TRUNCATE
  ON research_distribution, research_distribution_attempt FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON research_distribution TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON research_distribution_attempt TO service_role;

GRANT SELECT, INSERT
  ON research_distribution_event TO service_role;


-- ============================================================
-- 5. Append-only trigger (defence in depth)
-- ============================================================
-- service_role holds BYPASSRLS, so RLS policies do not constrain it.
-- BYPASSRLS bypasses only row-level security POLICIES, not table-level
-- privileges; service_role is neither a superuser nor the owner of these
-- tables, so the REVOKE above is genuinely effective. This trigger is the
-- second layer: it remains effective even if table privileges are later
-- re-granted.
--
-- INSERT is deliberately not triggered and continues to work.
-- TRUNCATE is closed at the privilege layer above; no BEFORE TRUNCATE
-- trigger is added, by design, to keep the trigger set minimal.
--
-- CREATE TRIGGER has no IF NOT EXISTS in PostgreSQL, so each trigger is
-- dropped if present before creation to keep re-runs idempotent.
--
-- This function is deliberately NOT SECURITY DEFINER. It raises
-- unconditionally and touches no relation, so it requires no search_path
-- pinning and holds no privilege-escalation surface.
CREATE OR REPLACE FUNCTION research_distribution_event_is_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'research_distribution_event is append-only governance evidence: % is not permitted. Record a new event instead.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS research_distribution_event_no_update
  ON research_distribution_event;
CREATE TRIGGER research_distribution_event_no_update
  BEFORE UPDATE ON research_distribution_event
  FOR EACH ROW EXECUTE FUNCTION research_distribution_event_is_append_only();

DROP TRIGGER IF EXISTS research_distribution_event_no_delete
  ON research_distribution_event;
CREATE TRIGGER research_distribution_event_no_delete
  BEFORE DELETE ON research_distribution_event
  FOR EACH ROW EXECUTE FUNCTION research_distribution_event_is_append_only();


-- ============================================================
-- 6. Indexes (idempotency, lookup, reconciliation)
-- ============================================================
-- Indexes retain IF NOT EXISTS: rebuilding an index is idempotently safe,
-- unlike creating a table under a name that may already mean something
-- else. Idempotency lookup is covered by the UNIQUE constraint, which
-- provides an implicit index.

CREATE INDEX IF NOT EXISTS research_distribution_version_idx
  ON research_distribution (version_id);

CREATE INDEX IF NOT EXISTS research_distribution_attempt_distribution_idx
  ON research_distribution_attempt (distribution_id);

CREATE INDEX IF NOT EXISTS research_distribution_attempt_inflight_idx
  ON research_distribution_attempt (status)
  WHERE status = 'IN_FLIGHT';

-- Locked decision 6. Locates attempts whose external outcome is uncertain.
-- Keyed on distribution_id because the operational question is always
-- "which distribution does this unresolved attempt belong to, and may a
-- retry be opened for it".
CREATE INDEX IF NOT EXISTS research_distribution_reconciliation_idx
  ON research_distribution_attempt (distribution_id)
  WHERE reconciliation_required = true;

CREATE INDEX IF NOT EXISTS research_distribution_event_history_idx
  ON research_distribution_event (distribution_id, approved_at DESC);


-- ============================================================
-- 7. RLS
-- ============================================================
-- No anonymous or authenticated access to any of the three tables.
-- All access goes through server-side code using the service role.
ALTER TABLE research_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_distribution_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_distribution_event ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. Policies
-- ============================================================
-- Policy names are scoped per table in PostgreSQL. These match the existing
-- repository convention established by continuity_receipts.

CREATE POLICY "service_role_full_access" ON research_distribution
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_all" ON research_distribution
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_distribution
  FOR ALL TO authenticated USING (false);

CREATE POLICY "service_role_full_access" ON research_distribution_attempt
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "deny_anon_all" ON research_distribution_attempt
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_distribution_attempt
  FOR ALL TO authenticated USING (false);

-- Events: insert and select only. Combined with the REVOKE and the trigger
-- above, UPDATE and DELETE are refused at the privilege, policy and trigger
-- layers respectively.
CREATE POLICY "service_role_insert_approval" ON research_distribution_event
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "service_role_select_approval" ON research_distribution_event
  FOR SELECT TO service_role USING (true);

CREATE POLICY "deny_anon_all" ON research_distribution_event
  FOR ALL TO anon USING (false);

CREATE POLICY "deny_authenticated_all" ON research_distribution_event
  FOR ALL TO authenticated USING (false);


-- ============================================================
-- 9. Comments
-- ============================================================
COMMENT ON TABLE research_distribution IS
  'Distribution governance record. Operational read model rebuilt from the Registry; the Registry wins on conflict. Distinct from the publication catalogue, which this migration does not touch.';

COMMENT ON COLUMN research_distribution.registry_commit IS
  'Git commit anchoring this record to a validated Registry snapshot. No foreign key: the Registry is Git/YAML, validated at sync time.';

COMMENT ON COLUMN research_distribution.content_fingerprint IS
  'SHA-256 hex of UTF-8(JCS({content,title})) per RFC 8785, computed by the application layer. Excludes platform, brand, surface, Registry metadata, and timestamps.';

COMMENT ON COLUMN research_distribution.governance_state IS
  'Derived operational cache recomputed from research_distribution_event. DRAFT | AI_REVIEWED | HUMAN_APPROVED | WITHDRAWN. AI_REVIEWED is never sufficient to authorise publishing: only HUMAN_APPROVED may transition delivery_state to PUBLISHED. Enforced at the database layer by research_distribution_publish_requires_human_approval and independently required at the application layer.';

COMMENT ON COLUMN research_distribution.delivery_state IS
  'Operational delivery state: NOT_ATTEMPTED | IN_FLIGHT | PUBLISHED | FAILED. Not a governance state.';

COMMENT ON TABLE research_distribution_attempt IS
  'Operational record of one platform publish attempt.';

COMMENT ON COLUMN research_distribution_attempt.status IS
  'IN_FLIGHT | SUCCEEDED | FAILED | SKIPPED. Uncertain external outcomes remain IN_FLIGHT with reconciliation_required = true.';

COMMENT ON COLUMN research_distribution_attempt.rendered_text IS
  'The exact text handed to the platform during this attempt, retained for audit and reconciliation. NOT NULL: the attempt row records intent before execution, so a crash between record and send still leaves the intended text. Pre-flight rendering failures are not attempts and create no row.';

COMMENT ON COLUMN research_distribution_attempt.platform_post_id IS
  'Platform post identifier when the platform provides one. NULL is normal and expected: webhook-based platforms do not expose one. Success is determined by status, never by the presence of this column.';

COMMENT ON COLUMN research_distribution_attempt.reconciliation_required IS
  'True when the external outcome is uncertain and needs reconciliation. While true, no new attempt may be opened for the same distribution; that rule is an application-layer invariant, intentionally not database-constrained.';

COMMENT ON TABLE research_distribution_event IS
  'Append-only distribution governance evidence. UPDATE, DELETE and TRUNCATE are refused by explicit REVOKE from service_role; UPDATE and DELETE are additionally refused by BEFORE triggers.';

COMMENT ON FUNCTION research_distribution_event_is_append_only() IS
  'Rejects UPDATE and DELETE on research_distribution_event. Narrowly scoped to that single table.';

COMMENT ON COLUMN research_distribution_event.approver_type IS
  'HUMAN | AI_REVIEW | SYSTEM. service_role is a technical database authorization mechanism, not a governance approver identity.';

COMMENT ON COLUMN research_distribution_event.approver_id IS
  'Named governance actor, for example a GitHub login. Represents a named governance identity, not proof of biological humanity.';

COMMENT ON COLUMN research_distribution_event.approval_ref IS
  'Durable governance evidence reference, for example a GitHub pull request or review.';

COMMENT ON COLUMN research_distribution_event.content_fingerprint IS
  'Deliberately duplicated from the distribution record: immutable audit evidence of exactly which content was governed.';

COMMENT ON COLUMN research_distribution_event.registry_commit IS
  'Deliberately duplicated from the distribution record: immutable audit evidence of which Registry snapshot was in effect.';

COMMENT ON COLUMN research_distribution_event.reason IS
  'Required when decision = exception_granted.';
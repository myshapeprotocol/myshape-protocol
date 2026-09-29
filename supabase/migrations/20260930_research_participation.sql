-- Research Participation intake
--
-- A public, anonymous expression of interest in the research programme. It is
-- deliberately NOT:
--   * product registration or an account
--   * a participant ID or an enrollment identifier
--   * a Genesis 100 / recruitment application (see recruitment_applications)
--   * an EV-000 enrollment
--   * a proof of humanity or any identity verification
--
-- No unique constraint is placed on contact. Duplicate submissions are allowed
-- and are bounded by the API rate limiter, matching discovery_survey.
--
-- Governance is the same as the Discovery Questionnaire (see
-- docs/questionnaire-data-handling.md). The one framework, two instruments:
--   * consent_at is generated server-side; a client cannot supply it
--   * consent_version records which wording was accepted
--   * 180-day retention from submission, then deletion
--   * manual withdrawal with two distinct requests (stop contact / delete)
--
-- areas and interests are JSONB arrays of validated enum strings rather than
-- comma-joined text, so each entry stays an exact, individually checkable value.

CREATE TABLE IF NOT EXISTS research_participation (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  role            TEXT,        -- 'researcher' | 'developer' | 'founder' | 'student' | 'other'
  areas           JSONB,       -- array of area enum keys
  physical_world  TEXT,        -- 'yes' | 'no' | 'not-directly'
  interests       JSONB,       -- array of interest enum keys
  working_on      TEXT,        -- short free text

  wants_contact   TEXT,        -- 'yes' | 'no'
  contact         TEXT,        -- optional follow-up contact ONLY; NULL when wants_contact = 'no'

  consent_at      TIMESTAMPTZ, -- server-generated
  consent_version TEXT         -- e.g. 'participation-consent-v1'
);

ALTER TABLE research_participation ENABLE ROW LEVEL SECURITY;

-- Anonymous INSERT only. Same shape as discovery_survey; see the separate
-- security item on unconstrained anonymous inserts.
CREATE POLICY "allow_anon_insert" ON research_participation
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "allow_service_select" ON research_participation
  FOR SELECT TO service_role USING (true);

COMMENT ON TABLE research_participation IS
  'Public research participation intake. Interest only — not registration, enrollment, recruitment, or EV-000.';

COMMENT ON COLUMN research_participation.contact IS
  'Optional follow-up contact. Not a participant ID, enrollment identifier, or account. NULL when wants_contact = ''no''.';

COMMENT ON COLUMN research_participation.consent_at IS
  'Server-generated timestamp of consent acceptance. Never client-supplied, never backfilled.';

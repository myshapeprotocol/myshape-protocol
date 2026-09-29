-- Questionnaire consent evidence (Patch 2 — auditable research governance)
--
-- Adds two columns to discovery_survey so that consent is provable from the
-- database rather than inferred from the act of submitting.
--
-- Historical rows are deliberately left untouched:
--   * consent_at / consent_version stay NULL for every pre-existing row.
--   * created_at is NOT a consent timestamp and is never backfilled as one.
--   * No DEFAULT NOW() — that would fabricate a consent record for rows that
--     were submitted before any consent step existed.
-- A NULL consent_at therefore means exactly: "submitted before the consent step
-- was introduced; whether consent was obtained at the time cannot be proven."
--
-- consent_at is generated server-side on every accepted submission. A client
-- cannot supply it (the API never reads it from the request payload).
--
-- Retention: project governance decision for the current research phase is
-- 180 days from submission. This is a project policy, not a scientific
-- standard or a legal requirement. No automated cleanup job is created here;
-- enforcing the window is separate follow-up work.

ALTER TABLE discovery_survey
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

ALTER TABLE discovery_survey
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

COMMENT ON COLUMN discovery_survey.consent_at IS
  'Server-generated timestamp of consent acceptance. NULL for rows submitted before the consent step existed; never backfilled from created_at.';

COMMENT ON COLUMN discovery_survey.consent_version IS
  'Identifier of the consent wording accepted (e.g. survey-consent-v1). NULL for rows submitted before the consent step existed.';

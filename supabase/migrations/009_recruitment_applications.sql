-- Migration 009: Recruitment Applications
-- Phase E recruitment funnel — landing page → auto-tag → motion-demo
--
-- Cohort logic:
--   First 50 applicants → cohort = 'genesis' (founding testers)
--   After 50            → cohort = 'public'
--
-- Dedup: email is unique. Re-submissions are silently accepted
-- but don't consume a genesis slot.

CREATE TABLE IF NOT EXISTS recruitment_applications (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,                  -- unique applicant identifier
  technical_bg    TEXT,                                   -- e.g. "developer", "researcher", "designer", "community"
  handle           TEXT,                                   -- Bluesky / Discord / Farcaster handle
  source          TEXT,                                    -- UTM source: 'bluesky' | 'linkedin' | 'direct' | etc.
  cohort          TEXT NOT NULL DEFAULT 'public',         -- 'genesis' | 'public'
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cohort filtering
CREATE INDEX IF NOT EXISTS idx_recruitment_cohort
  ON recruitment_applications (cohort);

-- Index for time-series
CREATE INDEX IF NOT EXISTS idx_recruitment_applied
  ON recruitment_applications (applied_at DESC);

-- RLS: service_role for insert (via API), anon for count check
ALTER TABLE recruitment_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON recruitment_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_count_check" ON recruitment_applications
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON TABLE recruitment_applications IS 'Recruitment funnel applications. First 50 get genesis cohort.';
COMMENT ON COLUMN recruitment_applications.cohort IS 'genesis = first 50 founding testers | public = general applicants';

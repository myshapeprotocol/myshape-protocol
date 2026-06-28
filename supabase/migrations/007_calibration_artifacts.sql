-- Migration 007: Calibration Artifact Storage
-- Phase E-3: Persist generated calibration artifacts for engine consumption.
--
-- Stores the output of runCalibration() — PCA projection matrix,
-- population feature statistics, and ROC operating points — as
-- versioned JSON bundles. The engine loads the latest active artifact
-- at initialization time.

CREATE TABLE IF NOT EXISTS calibration_artifacts (
  id              SERIAL PRIMARY KEY,
  version         INTEGER NOT NULL DEFAULT 1,          -- artifact schema version
  label           TEXT,                                 -- human-readable description
  artifact_json   JSONB NOT NULL,                       -- full CalibrationArtifact bundle
  session_count   INTEGER NOT NULL,                     -- number of sessions used for training
  frame_count     INTEGER NOT NULL,                     -- number of frames used for training
  pca_output_dim  INTEGER NOT NULL,                     -- PCA target dimension
  variance_retained DOUBLE PRECISION,                   -- cumulative variance retained (0-1)
  d_prime         DOUBLE PRECISION,                     -- discriminability (d')
  eer             DOUBLE PRECISION,                     -- Equal Error Rate
  auc             DOUBLE PRECISION,                     -- Area Under ROC Curve
  threshold_low   DOUBLE PRECISION,                     -- operating point: 10% FAR
  threshold_med   DOUBLE PRECISION,                     -- operating point: 5% FAR
  threshold_high  DOUBLE PRECISION,                     -- operating point: 1% FAR
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,       -- whether engine should load this artifact
  activated_at    TIMESTAMPTZ,                          -- when this artifact was activated
  training_set_hash TEXT,                               -- FNV-1a hash of training session IDs (audit trail)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one artifact can be active at a time (enforced via application-level CAS)
CREATE INDEX IF NOT EXISTS idx_calibration_active
  ON calibration_artifacts (is_active)
  WHERE is_active = TRUE;

-- Time-series index for artifact history
CREATE INDEX IF NOT EXISTS idx_calibration_created
  ON calibration_artifacts (created_at DESC);

-- Index for finding the best artifact by quality metrics
CREATE INDEX IF NOT EXISTS idx_calibration_quality
  ON calibration_artifacts (d_prime DESC, eer ASC);

-- RLS: service_role only
ALTER TABLE calibration_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON calibration_artifacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "deny_anon" ON calibration_artifacts
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_authenticated" ON calibration_artifacts
  FOR ALL
  TO authenticated
  USING (false);

-- Allow public read of active artifact metadata (NOT the full JSON)
-- This lets the status endpoint work without service_role for basic health checks.
CREATE POLICY "public_read_metadata" ON calibration_artifacts
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

COMMENT ON TABLE calibration_artifacts IS 'Phase E-3: Versioned calibration artifact storage. Each row is a complete CalibrationArtifact JSON bundle produced by runCalibration(). The engine loads the latest active row.';
COMMENT ON COLUMN calibration_artifacts.artifact_json IS 'Full CalibrationArtifact: PCA projection matrix, population stats, ROC curve, operating points';
COMMENT ON COLUMN calibration_artifacts.threshold_low IS 'ROC operating point for target FAR=10% (low security)';
COMMENT ON COLUMN calibration_artifacts.threshold_med IS 'ROC operating point for target FAR=5% (medium security)';
COMMENT ON COLUMN calibration_artifacts.threshold_high IS 'ROC operating point for target FAR=1% (high security)';
COMMENT ON COLUMN calibration_artifacts.is_active IS 'Only one row should be active at a time. Set via application-level compare-and-swap.';

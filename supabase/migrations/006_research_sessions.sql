-- Migration 006: Anonymous Research Data Collection
-- Phase E-1: Real-world landmark ingestion — no PII, no raw video, no face imagery.
-- Fully anonymous by design: no email, no wallet, no IP stored server-side.
--
-- Privacy invariant:
--   - landmark_data contains ONLY 18-joint SST skeleton positions (x/y/z floats)
--   - No raw pixel data, no camera frames, no face crops
--   - session_id is a client-generated random UUID — unlinkable to any identity
--   - device_info is coarse (OS family + browser engine + viewport bins) — never fingerprintable
--   - IP address is NEVER persisted (rate-limit key is in-memory only, see API route)

CREATE TABLE IF NOT EXISTS research_sessions (
  session_id          UUID PRIMARY KEY,                          -- client-generated random UUID
  device_os           TEXT,                                      -- e.g. "Windows", "macOS", "Linux", "Android", "iOS"
  device_browser      TEXT,                                      -- e.g. "Firefox", "Chrome", "Safari", "Edge"
  viewport_width      INTEGER,                                   -- window.innerWidth at capture start
  viewport_height     INTEGER,                                   -- window.innerHeight at capture start
  imu_available       BOOLEAN DEFAULT FALSE,                     -- DeviceMotion API availability
  lighting_condition  TEXT,                                      -- user-reported: indoor_day | indoor_night | outdoor_day | outdoor_night
  session_duration_ms INTEGER NOT NULL,                          -- actual capture duration (ms)
  landmark_data       JSONB NOT NULL,                            -- Array<{ frame: SST-18 JointPosition[], timestamp: number }>
  pes_score           DOUBLE PRECISION,                          -- computed Presence Entropy Score (0-1)
  pes_micro_timing    DOUBLE PRECISION,                          -- §3.5.1 μTiming variance component
  pes_noise_residual  DOUBLE PRECISION,                          -- §3.5.2 noise residual component
  pes_freq_entropy    DOUBLE PRECISION,                          -- §3.5.3 frequency entropy component
  pes_bio_perturb     DOUBLE PRECISION,                          -- §3.5.4 biological perturbation component
  total_frames        INTEGER NOT NULL,                          -- number of captured SST frames
  valid_frames        INTEGER NOT NULL,                          -- frames where all 9 mandatory anchors were visible
  motion_phases       JSONB,                                     -- per-phase frame counts + avg velocities (for calibration)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Domain constraint: PES must be in valid range
  CONSTRAINT pes_range CHECK (pes_score IS NULL OR (pes_score >= 0 AND pes_score <= 1))
);

-- Index for time-series analysis (population calibration queries)
CREATE INDEX IF NOT EXISTS idx_research_sessions_created
  ON research_sessions (created_at);

-- Index for device/browser stratification
CREATE INDEX IF NOT EXISTS idx_research_sessions_device
  ON research_sessions (device_os, device_browser);

-- Index for lighting condition filtering
CREATE INDEX IF NOT EXISTS idx_research_sessions_lighting
  ON research_sessions (lighting_condition);

-- RLS: only service_role can read/write (all access via API routes with SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON research_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deny all access to anon/authenticated roles — this is research-only data
CREATE POLICY "deny_anon" ON research_sessions
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_authenticated" ON research_sessions
  FOR ALL
  TO authenticated
  USING (false);

COMMENT ON TABLE research_sessions IS 'Phase E-1: anonymous motion landmark research data. Fully anonymous by design — no PII, no video, no face. Used for population-level engine calibration.';
COMMENT ON COLUMN research_sessions.session_id IS 'Client-generated random UUID v4 — unlinkable to any identity or device fingerprint';
COMMENT ON COLUMN research_sessions.device_os IS 'Coarse OS family only (Windows/macOS/Linux/Android/iOS) — never a version or build number';
COMMENT ON COLUMN research_sessions.device_browser IS 'Browser engine family only (Firefox/Chrome/Safari/Edge) — never a version string';
COMMENT ON COLUMN research_sessions.viewport_width IS 'window.innerWidth at capture start — binned for analysis, not fingerprinting';
COMMENT ON COLUMN research_sessions.landmark_data IS 'SST-18 3D joint positions only (x/y/z floats per joint per frame). No raw video, no pixel data, no face.';
COMMENT ON COLUMN research_sessions.lighting_condition IS 'User-reported lighting category — indoor_day | indoor_night | outdoor_day | outdoor_night';
COMMENT ON COLUMN research_sessions.motion_phases IS 'Per-phase frame counts + mean velocities — used for population baseline calibration across devices';

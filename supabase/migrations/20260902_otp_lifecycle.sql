-- P0-HOTFIX-2: OTP Lifecycle Hardening
-- Adds TTL + single-use enforcement via conditional UPDATE consumption
-- Safe for existing rows: all new columns are nullable TIMESTAMPTZ

ALTER TABLE protocol_nodes
  ADD COLUMN IF NOT EXISTS otp_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS otp_used_at TIMESTAMPTZ;

-- Index to efficiently query for pending OTPs (for cleanup or status checks)
CREATE INDEX IF NOT EXISTS idx_protocol_nodes_pending_otp
  ON protocol_nodes (email)
  WHERE otp_code IS NOT NULL
  AND otp_used_at IS NULL;

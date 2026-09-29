-- P0-AUTH: SIWE Replay Protection — Server-Side Nonce Lifecycle
--
-- Dedicated table for EIP-4361 SIWE nonce issuance, persistence, expiration,
-- and single-use atomic consumption. Replaces the previous client-generated
-- Date.now() nonce that enabled indefinite replay of signed SIWE messages.
--
-- Safe to apply independently: no existing table is altered.

CREATE TABLE IF NOT EXISTS siwe_nonces (
  nonce       TEXT PRIMARY KEY,                     -- server-generated unique nonce (UUID v4)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- when the nonce was issued
  expires_at  TIMESTAMPTZ NOT NULL,                 -- when the nonce becomes invalid (TTL)
  used_at     TIMESTAMPTZ,                          -- NULL = unused; NOT NULL = atomically consumed
  address     TEXT,                                 -- optional: wallet address that used the nonce (audit)
  domain      TEXT NOT NULL,                        -- domain the nonce was issued for
  chain_id    INTEGER NOT NULL                      -- chain ID the nonce was issued for
);

-- Index for efficient expiration-based cleanup
CREATE INDEX IF NOT EXISTS idx_siwe_nonces_expires_at
  ON siwe_nonces (expires_at);

-- Index for efficient used-at lookups
CREATE INDEX IF NOT EXISTS idx_siwe_nonces_used_at
  ON siwe_nonces (used_at)
  WHERE used_at IS NULL;

-- Row-Level Security: NO public write/delete path.
ALTER TABLE siwe_nonces ENABLE ROW LEVEL SECURITY;

-- Service role (used by API routes) has full access and bypasses RLS.
CREATE POLICY "service_role_full_access_siwe_nonces"
  ON siwe_nonces FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonymous and authenticated clients may NOT directly access the table.
CREATE POLICY "deny_anon_all_siwe_nonces"
  ON siwe_nonces FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_authenticated_all_siwe_nonces"
  ON siwe_nonces FOR ALL
  TO authenticated
  USING (false);

-- Atomic single-use consumption function.
-- Returns the consumed nonce row on success, or raises if already used/expired.
CREATE OR REPLACE FUNCTION consume_siwe_nonce(
  p_nonce TEXT,
  p_address TEXT DEFAULT NULL
)
RETURNS siwe_nonces AS $$
DECLARE
  result siwe_nonces;
BEGIN
  UPDATE siwe_nonces
  SET used_at = NOW(),
      address = COALESCE(p_address, siwe_nonces.address)
  WHERE nonce = p_nonce
    AND used_at IS NULL
    AND expires_at > NOW()
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NONCE_INVALID_OR_CONSUMED';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function — removes expired/nonced entries older than retention period.
-- Call via pg_cron or scheduled edge function.
CREATE OR REPLACE FUNCTION cleanup_expired_siwe_nonces(retention_minutes INT DEFAULT 60)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM siwe_nonces
  WHERE expires_at < NOW() - (retention_minutes || ' minutes')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
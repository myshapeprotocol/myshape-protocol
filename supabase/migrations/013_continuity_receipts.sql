-- Migration: CPS-0001 V₇ trusted continuity receipt store
--
-- Dedicated, append-only persistence for VERIFIED ContinuityReceipts.
-- V₇ predecessor resolution (Model 3) reads from this table by the canonical
-- receipt_hash (SHA-256 over RFC 8785 JCS serialization). The UNSIGNED
-- previousReceiptHash pointer is only trustworthy because inserts are gated
-- by the trusted server-side writer (verify -> insert), never by clients.
--
-- Safe to apply independently: no existing table is altered.

CREATE TABLE IF NOT EXISTS continuity_receipts (
  receipt_hash    TEXT PRIMARY KEY,
  receipt         JSONB NOT NULL,
  subject_id      TEXT NOT NULL,
  issuer_id       TEXT NOT NULL,
  interval_start  TIMESTAMPTZ NOT NULL,
  interval_end    TIMESTAMPTZ NOT NULL,
  ingested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ingester        TEXT NOT NULL DEFAULT 'server',
  CONSTRAINT continuity_receipts_interval_order CHECK (interval_end > interval_start)
);

-- Indexes for predecessor resolution and subject-chain scans.
CREATE INDEX IF NOT EXISTS continuity_receipts_subject_idx ON continuity_receipts (subject_id);
CREATE INDEX IF NOT EXISTS continuity_receipts_issuer_idx ON continuity_receipts (issuer_id);
CREATE INDEX IF NOT EXISTS continuity_receipts_interval_idx ON continuity_receipts (interval_start, interval_end);

-- Row-Level Security: NO public write/delete path.
ALTER TABLE continuity_receipts ENABLE ROW LEVEL SECURITY;

-- Service role (used by API routes) has full access and bypasses RLS.
CREATE POLICY "service_role_full_access" ON continuity_receipts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anonymous and authenticated clients may NOT directly access the table.
-- All reads/writes go through server-side API routes using the service role.
CREATE POLICY "deny_anon_all" ON continuity_receipts
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "deny_authenticated_all" ON continuity_receipts
  FOR ALL
  TO authenticated
  USING (false);

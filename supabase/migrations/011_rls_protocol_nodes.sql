-- Migration: Row-Level Security for protocol_nodes
-- Enables RLS and creates policies so the anon/authenticated roles cannot
-- directly read emails, OTP codes, or wallet addresses.
-- Run AFTER 010_entropy_growth.sql

-- Enable RLS on the core identity table
ALTER TABLE protocol_nodes ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS entirely (API routes use this role)
CREATE POLICY "service_role_full_access" ON protocol_nodes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own row (matched by email = auth.email())
CREATE POLICY "authenticated_read_own_node" ON protocol_nodes
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Authenticated users can update their own row
CREATE POLICY "authenticated_update_own_node" ON protocol_nodes
  FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Anonymous users: deny all direct access
-- (public queries go through API routes which use the service role)
CREATE POLICY "deny_anon_all" ON protocol_nodes
  FOR ALL
  TO anon
  USING (false);

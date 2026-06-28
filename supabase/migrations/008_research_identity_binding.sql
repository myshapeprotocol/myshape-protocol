-- Migration 008: Research Identity Binding (Route C)
--
-- Adds optional node_handle to research_sessions, enabling
-- identity-aware ROC calibration with true genuine/impostor pairs.
--
-- Genuine pair:  same node_handle, different sessions
-- Impostor pair: different node_handle
-- Anonymous:     node_handle IS NULL (pseudo-labeling fallback)
--
-- Privacy: node_handle is a protocol-level identifier (not email, not wallet).
-- It is generated during Genesis and stored in protocol_nodes.node_handle.

ALTER TABLE research_sessions ADD COLUMN IF NOT EXISTS node_handle TEXT;
ALTER TABLE research_sessions ADD COLUMN IF NOT EXISTS genesis_verified BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN research_sessions.node_handle IS 'Protocol-level identity anchor from Genesis ritual. NULL = anonymous upload. Non-NULL = identity-bound for ROC calibration.';
COMMENT ON COLUMN research_sessions.genesis_verified IS 'Whether the Genesis ritual was completed before upload. Used for filtering identity-bound sessions.';

-- Index for identity-aware queries
CREATE INDEX IF NOT EXISTS idx_research_sessions_node_handle
  ON research_sessions (node_handle)
  WHERE node_handle IS NOT NULL;

-- Index for identity-bound session counting
CREATE INDEX IF NOT EXISTS idx_research_sessions_genesis
  ON research_sessions (genesis_verified)
  WHERE genesis_verified = TRUE;

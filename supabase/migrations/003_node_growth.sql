-- Migration: Node Growth — scan_count and data_contribution
-- Run AFTER 001 and 002

ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS data_contribution INTEGER DEFAULT 0;

COMMENT ON COLUMN protocol_nodes.scan_count IS 'Number of successful motion-signature verifications';
COMMENT ON COLUMN protocol_nodes.data_contribution IS 'Cumulative data contribution score for the node';

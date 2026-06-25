-- Migration: Daily scan rate limiting
-- Run AFTER 003_node_growth.sql

ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS last_scan_date TEXT;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS daily_scan_count INTEGER DEFAULT 0;

COMMENT ON COLUMN protocol_nodes.last_scan_date IS 'Date string (YYYY-MM-DD) of the most recent scan';
COMMENT ON COLUMN protocol_nodes.daily_scan_count IS 'Number of scans completed today';

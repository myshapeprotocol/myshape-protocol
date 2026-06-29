-- Migration: Entropy Growth System — particle levels & streak mechanics
-- Replaces the old "3/day × 100 days" with a non-linear entropy curve
-- Run AFTER 004_daily_scan_limit.sql

ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS entropy_score INTEGER DEFAULT 0;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS particle_level INTEGER DEFAULT 1;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS streak_multiplier REAL DEFAULT 1.0;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS best_pes REAL DEFAULT 0;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS last_entropy_date TEXT;

COMMENT ON COLUMN protocol_nodes.entropy_score IS 'Cumulative entropy — non-linear growth toward particle levels';
COMMENT ON COLUMN protocol_nodes.particle_level IS 'Current particle count (1-8), derived from entropy_score thresholds';
COMMENT ON COLUMN protocol_nodes.streak_days IS 'Consecutive days with at least one scan';
COMMENT ON COLUMN protocol_nodes.streak_multiplier IS 'Current entropy multiplier: 1.0 base, 1.5 after 7d, 2.0 after 30d';
COMMENT ON COLUMN protocol_nodes.best_pes IS 'Highest PES score ever achieved by this node';
COMMENT ON COLUMN protocol_nodes.last_entropy_date IS 'Date string (YYYY-MM-DD) of last entropy calculation';

-- Particle level thresholds (entropy_score required)
-- Level 1: 0       (Genesis)
-- Level 2: 100     (~1 week active)
-- Level 3: 300     (~3 weeks)
-- Level 4: 800     (~2 months)
-- Level 5: 2,000   (~5 months)
-- Level 6: 5,000   (~1 year)
-- Level 7: 12,000  (~2+ years)
-- Level 8: 30,000  (protocol elder — ~5% of nodes)

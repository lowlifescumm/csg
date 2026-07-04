-- Add transit_identity_hash column for application-level dedup tracking
ALTER TABLE transits ADD COLUMN IF NOT EXISTS transit_identity_hash VARCHAR(64);

COMMENT ON COLUMN transits.transit_identity_hash IS 'SHA-256 hash of (user_id, natal_chart_id, transiting_body, natal_point, aspect) for dedup';

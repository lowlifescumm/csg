-- Quick fix for missing is_primary columns
-- Run this against production database to fix compatibility/top API errors

BEGIN;

-- Add is_primary to birth_charts if missing
ALTER TABLE birth_charts
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- Add is_primary to natal_charts if missing
ALTER TABLE natal_charts
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_birth_charts_user_primary ON birth_charts(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_natal_charts_user_primary ON natal_charts(user_id, is_primary) WHERE is_primary = true;

-- Set existing records to primary if not set
UPDATE birth_charts SET is_primary = true WHERE is_primary IS NULL;
UPDATE natal_charts SET is_primary = true WHERE is_primary IS NULL;

COMMIT;


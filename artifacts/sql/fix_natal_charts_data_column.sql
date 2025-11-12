-- Fix missing 'data' column in natal_charts table
-- Run this against production database

BEGIN;

-- Add data column to natal_charts if missing
ALTER TABLE natal_charts
    ADD COLUMN IF NOT EXISTS data JSONB;

-- If the table exists but has a different column name, we might need to migrate
-- For now, just ensure 'data' column exists

COMMIT;


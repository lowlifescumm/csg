-- Migration: Create temp_readings table for free readings
-- Created: 2026-06-06

CREATE TABLE IF NOT EXISTS temp_readings (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_temp_readings_expires 
ON temp_readings(expires_at);

-- Index for lookup by ID
CREATE INDEX IF NOT EXISTS idx_temp_readings_id 
ON temp_readings(id);

-- Add comment
COMMENT ON TABLE temp_readings IS 'Temporary storage for free readings before user registration';

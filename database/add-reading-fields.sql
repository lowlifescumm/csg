-- Add richer fields to readings table
ALTER TABLE readings
  ADD COLUMN IF NOT EXISTS reading_type TEXT,
  ADD COLUMN IF NOT EXISTS raw_text TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB;

-- Index for user_id + created_at already exists; add index on reading_type for analytics
CREATE INDEX IF NOT EXISTS idx_readings_reading_type ON readings(reading_type);


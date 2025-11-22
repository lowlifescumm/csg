-- Reading Results Table
-- Stores output from AI generation jobs (tarot, charts, reports)

CREATE TABLE IF NOT EXISTS reading_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_job_id INTEGER REFERENCES reading_jobs(id) ON DELETE SET NULL,
  reading_type VARCHAR(100) NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url VARCHAR(500),
  status VARCHAR(40) NOT NULL DEFAULT 'processing',
  progress_percent INTEGER DEFAULT 0,
  progress_message TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_reading_results_user ON reading_results(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_results_job ON reading_results(reading_job_id);
CREATE INDEX IF NOT EXISTS idx_reading_results_status ON reading_results(status);
CREATE INDEX IF NOT EXISTS idx_reading_results_type ON reading_results(reading_type);
CREATE INDEX IF NOT EXISTS idx_reading_results_created ON reading_results(created_at DESC);

-- Add retry_count and max_retries to reading_jobs table
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
ALTER TABLE reading_jobs ADD COLUMN IF NOT EXISTS progress_message TEXT;

-- Update status enum values to include new states
-- Status can be: pending_validation, pending_charge, failed_charge, queued, running, succeeded, failed, completed

CREATE OR REPLACE FUNCTION touch_reading_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_reading_results ON reading_results;
CREATE TRIGGER trg_touch_reading_results
  BEFORE UPDATE ON reading_results
  FOR EACH ROW
  EXECUTE FUNCTION touch_reading_results_updated_at();


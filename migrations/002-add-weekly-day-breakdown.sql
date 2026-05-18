-- Add day-by-day breakdown for weekly forecasts
ALTER TABLE forecasts ADD COLUMN IF NOT EXISTS day_breakdown JSONB;

COMMENT ON COLUMN forecasts.day_breakdown IS 'Monday-Sunday breakdown with specific transit influences per day (for weekly forecasts)';

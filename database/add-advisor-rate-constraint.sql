-- Advisor Rate Validation Constraint
-- Adds CHECK constraint to enforce minimum per-minute rate at database level
-- Ensures data integrity even if API validation is bypassed

-- Add CHECK constraint to enforce minimum per-minute rate ($0.50 USD/min)
-- Allows NULL values (for profiles without rates set) but enforces minimum when rate is provided
ALTER TABLE advisor_profile 
ADD CONSTRAINT chk_advisor_profile_min_rate 
CHECK (per_minute_rate IS NULL OR per_minute_rate >= 0.50);

-- Update column comment to explicitly state USD and minimum rate
COMMENT ON COLUMN advisor_profile.per_minute_rate IS 
'Pricing rate in USD per minute for advisor consultations. Minimum rate: $0.50/min. Only USD currency is supported.';


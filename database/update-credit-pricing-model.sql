-- =============================================================================
-- Credit & Subscription Pricing Model Update
-- Migration: Update pricing model to new structure
-- =============================================================================

-- Update existing credits table to support new credit types
ALTER TABLE credits 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50), -- 'signup', 'daily', 'purchase', 'referral'
  ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'paid'; -- 'paid' or 'free'

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credits_user_type_expiry ON credits(user_id, credit_type, expires_at);

-- Add tracking for free Natal Chart on subscription
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS free_natal_chart_used BOOLEAN DEFAULT false;

-- Update existing credit records to be marked as 'paid'
UPDATE credits 
SET credit_type = 'paid' 
WHERE credit_type IS NULL;

COMMENT ON COLUMN users.free_natal_chart_used IS 'Tracks if user has used their free Natal Chart as part of subscription';
COMMENT ON COLUMN credits.expires_at IS 'Expiration time for credits (free credits expire after 24 hours)';
COMMENT ON COLUMN credits.source IS 'Origin of credits: signup, daily, purchase, referral';
COMMENT ON COLUMN credits.credit_type IS 'Type of credit: free (24hr expiry) or paid (no expiry)';






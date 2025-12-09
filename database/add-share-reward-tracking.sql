-- Add share reward tracking to users table
-- This migration adds the has_rewarded_share field to track if a user has claimed their first share reward

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_rewarded_share BOOLEAN DEFAULT false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_has_rewarded_share ON users(has_rewarded_share) WHERE has_rewarded_share = false;

-- Add comment for documentation
COMMENT ON COLUMN users.has_rewarded_share IS 'Tracks if user has claimed their first share reward (3 credits)';







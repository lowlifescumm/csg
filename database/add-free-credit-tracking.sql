-- Add next_free_credit_issue_at column to users table
-- This tracks when each user is eligible for their next free credit issuance
-- Uses UTC for server logic (timezone handling documented in code)

ALTER TABLE users ADD COLUMN IF NOT EXISTS next_free_credit_issue_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Initialize next_free_credit_issue_at for existing users based on their account creation
-- This ensures existing users get their first free credits immediately
UPDATE users 
SET next_free_credit_issue_at = COALESCE(next_free_credit_issue_at, created_at)
WHERE next_free_credit_issue_at IS NULL;

-- Create index for efficient querying of users eligible for free credits
CREATE INDEX IF NOT EXISTS idx_users_next_free_credit_issue_at 
ON users(next_free_credit_issue_at) 
WHERE next_free_credit_issue_at IS NOT NULL;




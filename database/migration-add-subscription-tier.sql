-- Add subscription_tier column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT NULL;

-- Add premium_credits_cap column to users table (for Mystic Premium fair use cap)
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_credits_cap INTEGER DEFAULT 0;

-- Add monthly_credits_reset_date column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_credits_reset_date TIMESTAMP DEFAULT NULL;

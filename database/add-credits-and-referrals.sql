-- Add Credits System and Referrals
-- This migration adds support for:
-- 1. Daily free credits (3 credits that refresh daily)
-- 2. Paid credits (additional credits purchased)
-- 3. Credit prioritization (paid credits used before free credits)
-- 4. Referral system (10 credits bonus for referrer and referee)

-- Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_free_credit_refresh TIMESTAMP DEFAULT NOW();

-- Create referral_redemptions table to track who used whose code
CREATE TABLE IF NOT EXISTS referral_redemptions (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    referrer_rewarded BOOLEAN DEFAULT false,
    referred_rewarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Update credits table to support credit types
ALTER TABLE credits ADD COLUMN IF NOT EXISTS credit_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE credits ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS source VARCHAR(50); -- 'daily', 'purchase', 'referral', 'signup'

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credits_user_type ON credits(user_id, credit_type);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Generate referral codes for existing users
UPDATE users 
SET referral_code = UPPER(SUBSTRING(MD5(email || id::text), 1, 8))
WHERE referral_code IS NULL;

COMMENT ON COLUMN users.referral_code IS 'Unique referral code for users to share';
COMMENT ON COLUMN users.referred_by IS 'User ID of the person who referred this user';
COMMENT ON COLUMN users.last_free_credit_refresh IS 'Last time free credits were refreshed (daily)';
COMMENT ON COLUMN credits.credit_type IS 'Type of credit: free or paid';
COMMENT ON COLUMN credits.expires_at IS 'When the credit expires (NULL for paid credits)';
COMMENT ON COLUMN credits.source IS 'Where the credit came from: daily, purchase, referral, signup';




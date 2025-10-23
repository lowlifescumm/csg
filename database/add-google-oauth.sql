-- Add Google OAuth columns to users table
-- Run this migration to enable Google Sign-In

-- Add google_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'google_id'
  ) THEN
    ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
  END IF;
END $$;

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add email_verified column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Allow password_hash to be NULL for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID (sub claim)';
COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL from OAuth provider';
COMMENT ON COLUMN users.email_verified IS 'Whether the user email has been verified';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last user record update';


-- QUICK FIX: Add password_hash column back to users table
-- This is safe - it will only add the column if it doesn't exist
-- Existing OAuth users won't have a password_hash (will be NULL)

-- Step 1: Add the column (nullable to support OAuth users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Done! The column is nullable by default, so OAuth users can have NULL

-- Step 3: You'll need to reset your password since you lost it
-- After running this, go to /reset-password and set a new password for your account

-- VERIFICATION: Check if it worked
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

-- This should return:
-- column_name: password_hash
-- data_type: character varying
-- is_nullable: YES


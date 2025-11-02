-- EMERGENCY FIX: Add password_hash column and set default admin password
-- Run this in your production database to restore login immediately

-- Step 1: Add password_hash column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

-- Step 3: Set password for admin@cosmicguide.com (password: admin123)
-- This is the default admin account that should exist
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'admin@cosmicguide.com';

-- Step 4: If you want to set password for your account, replace with your email:
-- UPDATE users 
-- SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
--     updated_at = NOW()
-- WHERE email = 'your-email@example.com';

-- Step 5: Verify users have passwords
SELECT id, email, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password' END as password_status,
       role
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- DONE! You can now login at https://cosmicspiritguide.com/login
-- Email: admin@cosmicguide.com
-- Password: admin123


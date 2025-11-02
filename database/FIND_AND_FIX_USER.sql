-- Find your actual users and set password for them

-- Step 1: Add password_hash column (if not already done)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: See ALL users in the database
SELECT id, email, first_name, last_name, role, created_at
FROM users
ORDER BY created_at DESC;

-- Step 3: Now update the password for YOUR account
-- Replace 'ethan.fitzhenry@gmail.com' with your actual email from Step 2
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'ethan.fitzhenry@gmail.com';

-- Step 4: Verify it worked
SELECT id, email, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has Password ✓' ELSE 'No Password ✗' END as password_status,
       role
FROM users
WHERE email = 'ethan.fitzhenry@gmail.com';

-- Step 5: Try to login at https://cosmicspiritguide.com/login
-- Email: ethan.fitzhenry@gmail.com
-- Password: admin123


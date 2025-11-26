-- Fix user account: mazatlanexpatit@gmail.com
-- Run this in Render's PostgreSQL database console

-- Step 1: Check current user status
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  role,
  created_at,
  CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'OAuth Only' END as password_status,
  CASE WHEN email != LOWER(TRIM(email)) THEN 'Not Normalized' ELSE 'Normalized' END as email_status
FROM users 
WHERE LOWER(email) = 'mazatlanexpatit@gmail.com';

-- Step 2: Normalize email if needed
UPDATE users 
SET email = LOWER(TRIM(email)), updated_at = NOW()
WHERE LOWER(email) = 'mazatlanexpatit@gmail.com'
  AND email != LOWER(TRIM(email))
RETURNING id, email;

-- Step 3: Verify the fix
SELECT 
  id, 
  email, 
  first_name, 
  last_name,
  CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'OAuth Only' END as password_status,
  CASE WHEN email != LOWER(TRIM(email)) THEN 'Not Normalized' ELSE 'Normalized' END as email_status
FROM users 
WHERE LOWER(email) = 'mazatlanexpatit@gmail.com';

-- Step 4: Check for any duplicate emails (case variations)
SELECT 
  LOWER(email) as normalized_email,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as email_variations
FROM users 
WHERE LOWER(email) = 'mazatlanexpatit@gmail.com'
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;



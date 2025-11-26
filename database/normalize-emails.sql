-- Normalize all user emails to lowercase
-- This fixes case-sensitivity issues with login/registration
-- Run this script to update existing user emails

UPDATE users 
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- Verify the update
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    created_at,
    CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status
FROM users 
ORDER BY created_at DESC 
LIMIT 10;



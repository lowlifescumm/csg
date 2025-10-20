-- Make ethan.fitzhenry@gmail.com an admin user
-- Run this SQL script on your database

-- First, check if the user exists
SELECT id, email, first_name, last_name, role 
FROM users 
WHERE email = 'ethan.fitzhenry@gmail.com';

-- Update the user role to admin (if user exists)
UPDATE users 
SET role = 'admin' 
WHERE email = 'ethan.fitzhenry@gmail.com';

-- Ensure the user has credits
INSERT INTO credits (user_id, credits)
SELECT id, 1000 FROM users WHERE email = 'ethan.fitzhenry@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(credits, 1000);

-- Verify the changes
SELECT u.id, u.email, u.first_name, u.last_name, u.role, c.credits
FROM users u
LEFT JOIN credits c ON u.id = c.user_id
WHERE u.email = 'ethan.fitzhenry@gmail.com';

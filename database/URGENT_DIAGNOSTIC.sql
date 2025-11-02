-- URGENT: Diagnostic Queries for Password Hash Issue
-- Run these in your production database to understand the problem

-- Query 1: Check if password_hash column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Query 2: See what the users table structure actually looks like
SELECT column_name, 
       data_type, 
       character_maximum_length,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Query 3: Check if users table exists and get all columns
SELECT * FROM information_schema.columns WHERE table_name = 'users';

-- Query 4: See actual user records (if any exist)
SELECT id, email, first_name, last_name, role, created_at
FROM users
LIMIT 10;

-- Query 5: Check all columns by trying to describe the table
SELECT 
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS is_not_null,
    '' AS default_value
FROM pg_catalog.pg_attribute a
WHERE a.attrelid = 'users'::regclass
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;


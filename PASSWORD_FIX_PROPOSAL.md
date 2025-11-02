# Critical Fix: Missing password_hash Column

## The Issue

Your production database is missing the `password_hash` column entirely. This breaks ALL local authentication.

**Error**: `column "password_hash" does not exist`

## What Likely Happened

Someone (or some migration) either:
1. Dropped and recreated the users table WITHOUT password_hash
2. Ran a schema migration that removed the column
3. The database was reinitialized from scratch

## The Fix

We need to **add the password_hash column back** to the users table. But we need to be careful because:
- Existing OAuth users won't have passwords (should be NULL)
- New local users MUST have passwords
- We don't want to break anything else

## Proposed Solution

### Step 1: Add password_hash column (nullable)

```sql
-- Add password_hash column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Make it nullable to support OAuth users
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;
```

### Step 2: Add check constraint

We could add a constraint that ensures:
- If user has a password_hash, they can login with password
- If user has a google_id, they login with OAuth
- At least one must be set

```sql
ALTER TABLE users 
ADD CONSTRAINT users_auth_check 
CHECK (
  (password_hash IS NOT NULL) OR 
  (google_id IS NOT NULL)
);
```

**BUT WAIT** - This might fail if you have existing users without either! Let's check first.

## Before We Execute

**I need you to run this query in your database:**

```sql
SELECT 
  id, 
  email, 
  password_hash, 
  google_id,
  role
FROM users;
```

This will show:
1. How many users you have
2. Which ones have passwords
3. Which ones have google_id
4. If any users have NEITHER (broken state)

## My Proposed Fix (Safe Version)

Since I don't know the state of your users, here's the safest fix:

```sql
-- Step 1: Add the column (nullable by default)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Step 2: DO NOT add constraint yet - let's see what data exists first
```

Then run diagnostics to see if everything works.

## Alternative: Complete Recovery Script

If the database schema is completely broken, we might need to restore from backup or rebuild. But let's try the simple fix first.

## Next Steps

1. **You run the diagnostic queries** I provided
2. **Share the results** with me
3. **I propose the exact fix** based on what we find
4. **You review and approve** before I create the migration
5. **We execute together** with a rollback plan

## ⚠️ IMPORTANT

DO NOT run any migrations until we see what's in your database. Making changes blind could:
- Lock you out permanently
- Delete user data
- Break OAuth logins
- Cause data loss

Let's be surgical about this fix.


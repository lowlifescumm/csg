# Password Authentication Issue - Diagnosis

## Problem

You're getting an error that "password hash doesn't exist" when trying to:
1. Login with local credentials
2. Create new local user accounts

## Root Cause

When we added Google OAuth support, the migration script (`database/add-google-oauth.sql`) made the `password_hash` column nullable to allow OAuth users (who don't have passwords):

```sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

This was the **correct** database change. However, there might be a logic issue in the authentication code.

## Current Authentication Flow

### For Local Password Users:
1. User signs up → `createUser()` hashes password → stores in `password_hash`
2. User logs in → `getUserByEmail()` fetches user with `password_hash as password`
3. `verifyPassword()` compares provided password to stored hash

### For OAuth Users:
1. User signs in with Google → no password needed → `password_hash` stays NULL
2. OAuth users should **never** try to login with password

## Potential Issue

Looking at the code in `lib/auth.js`:

```javascript
export async function getUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash as password, first_name, last_name, role, created_at FROM users WHERE email = $1',
    [email]
  );
  return rows[0];
}
```

And in `app/api/auth/login/route.js`:

```javascript
const user = await getUserByEmail(email);
if (!user) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}

const isValid = await verifyPassword(password, user.password);
```

**The problem**: If a user with that email exists but signed up via OAuth (password_hash is NULL), then `user.password` will be `null` or `undefined`. When we try to verify against a null password, it will fail.

## The Error You're Seeing

You said: "password hash doesn't exist"

This could mean:
1. **Database issue**: The column itself doesn't exist (unlikely if old users work)
2. **NULL value issue**: The column exists but has NULL values for some users
3. **Migration not run**: The OAuth migration never ran, so column is still NOT NULL and causing issues

## Diagnostic Steps Needed

I need you to run these checks in your production database:

### Check 1: Does password_hash column exist?

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';
```

Expected result:
- `column_name`: password_hash
- `data_type`: character varying (or varchar)
- `is_nullable`: **YES** (nullable is correct for OAuth support)

If `is_nullable` is **NO**, that's the problem! The migration didn't run.

### Check 2: What users exist and their password status?

```sql
SELECT id, email, 
       CASE WHEN password_hash IS NULL THEN 'OAuth (no password)' 
            WHEN password_hash IS NOT NULL THEN 'Local (has password)' 
       END as auth_type,
       role,
       created_at
FROM users 
ORDER BY created_at DESC
LIMIT 20;
```

This will show:
- Which users signed up with password vs OAuth
- If your account has a password or not

### Check 3: Check for constraints

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name LIKE '%password%';
```

## The Fix

**Before I make any changes, I need you to:**

1. Connect to your production database
2. Run the diagnostic queries above
3. Share the results with me

This will tell us:
- If the migration actually ran
- What state your users are in
- What the actual problem is

**Do NOT run any migrations yet** until we diagnose the issue. Making changes blindly could break things further.

## Why This Is Critical

Your production site is live. Any database change could:
- Lock out existing users
- Break OAuth logins
- Cause data loss

Let's diagnose first, then fix with surgical precision.

## Next Steps

1. You run the diagnostic queries
2. Share results with me
3. I analyze and propose exact fix
4. You review the fix
5. We execute together

This is the safe approach. Let's not make this worse than it already is.


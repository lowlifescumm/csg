# Quick Fix for Password Authentication

## The Problem

Your production database is missing the `password_hash` column. This is why you can't login.

## The Fix (Choose ONE Method)

### Method 1: SQL Only (Fastest - 2 minutes)

Run this SQL in your Render database:

1. Go to https://dashboard.render.com
2. Find your PostgreSQL database
3. Click "Connect" or "Shell"
4. Run this SQL:

```sql
-- Add password_hash column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

5. Then set your password (run this SQL):
```sql
-- Get a bcrypt hash for your password
-- For password 'TempPass123!', use this hash:
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'your-email@example.com';
```

**Wait!** You need to generate your own bcrypt hash. See Method 2 below.

### Method 2: Use the Script (Recommended - 5 minutes)

1. Pull the latest code from GitHub
2. Set up environment variable:
   - Get your DATABASE_URL from Render dashboard
   - Export it or add to .env.local

3. Run the fix script:
```bash
cd csg
node scripts/fix-password-hash-and-set-password.js ethan.fitzhenry@gmail.com YourNewPassword123!
```

This will:
- ✅ Add the column
- ✅ Set your password
- ✅ Verify it worked

### Method 3: Generate Your Own bcrypt Hash

If you want to use SQL only, generate the hash first:

**Option A: Node.js**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123!', 10).then(h => console.log(h));"
```

**Option B: Online Tool**
- Go to https://bcrypt-generator.com/
- Rounds: 10
- Enter your password
- Copy the hash
- Use it in the UPDATE SQL above

### After Running the Fix

1. Try logging in at https://cosmicspiritguide.com/login
2. If it works, **immediately change your password** in your profile settings
3. You're done! ✅

## What About OAuth?

Google OAuth will continue to work normally. OAuth users will have `password_hash = NULL`, which is fine.

## What About New Users?

New users CAN still create local accounts. If they later sign in with Google using the same email, the accounts will merge (google_id will be added to the existing user).

## Emergency Rollback

If something goes wrong:

```sql
-- Remove the column (only if needed)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
```

But don't run this unless the fix causes problems!


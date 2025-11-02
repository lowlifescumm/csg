# ⚡ QUICK FIX: Restore Your Login Access

## The Problem
Column `password_hash` is missing from your production database, so local login fails.

## The Solution (2 Minutes)

### Step 1: Find Your Account Email

Run this in Render database to see all users:

```sql
SELECT id, email, first_name, last_name, role FROM users;
```

Copy **your** email address from the results.

### Step 2: Add Column and Set Password

```sql
-- Add the column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Set password for YOUR account (replace with your email)
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'ethan.fitzhenry@gmail.com';  -- CHANGE THIS to your email from Step 1
```

### Step 3: Login

Login at https://cosmicspiritguide.com/login
- Email: **your email from Step 1**
- Password: `admin123`

### Option 2: Full SQL Script

1. Open https://dashboard.render.com
2. Open your database
3. Copy/paste `database/EMERGENCY_FIX.sql`
4. Execute it
5. Login with admin credentials

### Option 3: Using Script

```bash
cd csg
export DATABASE_URL="your-render-database-url"
node scripts/fix-password-hash-and-set-password.js your@email.com YourPassword123!
```

## After Login

Change your password in Profile Settings.

## OAuth

Google sign-in is unaffected. OAuth users have `password_hash = NULL`.

## New User Accounts

Users can still create local accounts or sign up with Google.


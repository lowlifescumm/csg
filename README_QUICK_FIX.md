# ⚡ QUICK FIX: Restore Your Login Access

## The Problem
Column `password_hash` is missing from your production database, so local login fails.

## The Solution (2 Minutes)

### Option 1: Using Render Database Shell (FASTEST)

1. Open https://dashboard.render.com
2. Open your PostgreSQL database
3. Open the Shell/Query tab
4. Paste and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
UPDATE users 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    updated_at = NOW()
WHERE email = 'admin@cosmicguide.com';
```

5. Login at https://cosmicspiritguide.com/login
   - Email: `admin@cosmicguide.com`
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


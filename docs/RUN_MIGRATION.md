# Running the is_primary Column Migration

## Problem
The `compatibility/top` API (and other routes) are failing with:
```
error: column "is_primary" does not exist
```

This is because the `birth_charts` and `natal_charts` tables are missing the `is_primary` column.

## Solution

### Option 1: Run the Migration Script (Recommended)

1. **Get your DATABASE_URL from Render:**
   - Go to Render Dashboard → Your Database → "Connections" tab
   - Copy the "Internal Database URL" or "External Connection String"

2. **Run the migration script:**
   ```bash
   # Set the DATABASE_URL
   export DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
   
   # Run the migration
   node scripts/run-is-primary-migration.mjs
   ```

### Option 2: Use Render's Database Console

1. Go to Render Dashboard → Your Database
2. Click "Connect" → "psql" (or use the SQL Editor)
3. Run this SQL:

```sql
BEGIN;

ALTER TABLE birth_charts
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

ALTER TABLE natal_charts
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_birth_charts_user_primary 
ON birth_charts(user_id, is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_natal_charts_user_primary 
ON natal_charts(user_id, is_primary) WHERE is_primary = true;

UPDATE birth_charts SET is_primary = true WHERE is_primary IS NULL;
UPDATE natal_charts SET is_primary = true WHERE is_primary IS NULL;

COMMIT;
```

### Option 3: Use psql Command Line

```bash
# Get DATABASE_URL from Render environment variables
psql "$DATABASE_URL" -f artifacts/sql/fix_is_primary_columns.sql
```

## Verification

After running the migration, test the API:
```bash
curl https://cosmicspiritguide.com/api/compatibility/top?userId=1
```

The error should be resolved! ✅


-- Migrate Old Credits to New Credit Ledger System
-- This script migrates credits from the old `credits` table to the new `credit_ledger` table

-- Step 1: Create migration ledger entries for all users with credits in old system
INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
SELECT 
  c.user_id,
  c.credits,
  'migration_from_old_system',
  jsonb_build_object(
    'old_credits', c.credits,
    'migrated_at', NOW(),
    'migration_note', 'Migrated from old credits table'
  ),
  NULL -- Migrated credits don't expire
FROM credits c
WHERE c.credits > 0
  AND NOT EXISTS (
    -- Don't migrate if user already has equivalent credits in new system
    SELECT 1 
    FROM credit_ledger cl
    WHERE cl.user_id = c.user_id
      AND (cl.source LIKE 'purchase_%' OR cl.source = 'migration_from_old_system')
    HAVING SUM(cl.delta) >= c.credits
  )
ON CONFLICT DO NOTHING;

-- Step 2: Update snapshots for all users
INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
SELECT 
  u.id,
  COALESCE((
    SELECT SUM(delta)
    FROM credit_ledger
    WHERE user_id = u.id
      AND (expires_at IS NULL OR expires_at > NOW())
  ), 0),
  NOW()
FROM users u
ON CONFLICT (user_id) 
DO UPDATE SET
  balance = COALESCE((
    SELECT SUM(delta)
    FROM credit_ledger
    WHERE user_id = u.id
      AND (expires_at IS NULL OR expires_at > NOW())
  ), 0),
  updated_at = NOW();

-- Step 3: Verification query (run separately to check results)
-- SELECT 
--   u.id as user_id,
--   u.email,
--   c.credits as old_credits,
--   COALESCE((
--     SELECT SUM(delta)
--     FROM credit_ledger
--     WHERE user_id = u.id
--       AND (expires_at IS NULL OR expires_at > NOW())
--   ), 0) as new_balance,
--   COALESCE((
--     SELECT SUM(delta)
--     FROM credit_ledger
--     WHERE user_id = u.id
--       AND source = 'migration_from_old_system'
--   ), 0) as migrated_credits
-- FROM users u
-- LEFT JOIN credits c ON u.id = c.user_id
-- WHERE c.credits > 0 OR EXISTS (
--   SELECT 1 FROM credit_ledger WHERE user_id = u.id
-- )
-- ORDER BY u.id;


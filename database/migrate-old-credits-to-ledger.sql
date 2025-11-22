-- Migrate Old Credits to New Credit Ledger System
-- This script migrates credits from the old `credits` table to the new `credit_ledger` table

-- Step 1: Create migration ledger entries for all users with credits in old system
-- Only migrate if user doesn't already have equivalent or more credits in new system
DO $$
DECLARE
  credit_record RECORD;
  existing_balance INTEGER;
  credits_to_migrate INTEGER;
BEGIN
  FOR credit_record IN 
    SELECT user_id, credits 
    FROM credits 
    WHERE credits > 0
  LOOP
    -- Calculate existing balance in new system
    SELECT COALESCE(SUM(delta), 0) INTO existing_balance
    FROM credit_ledger
    WHERE user_id = credit_record.user_id
      AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Only migrate if old credits > existing balance
    credits_to_migrate := credit_record.credits - existing_balance;
    
    IF credits_to_migrate > 0 THEN
      INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
      VALUES (
        credit_record.user_id,
        credits_to_migrate,
        'migration_from_old_system',
        jsonb_build_object(
          'old_credits', credit_record.credits,
          'existing_balance', existing_balance,
          'migrated_at', NOW(),
          'migration_note', 'Migrated from old credits table'
        ),
        NULL
      );
      
      RAISE NOTICE 'Migrated % credits for user % (had %, existing %)', 
        credits_to_migrate, credit_record.user_id, credit_record.credits, existing_balance;
    ELSE
      RAISE NOTICE 'Skipped user % (already has % credits, old system had %)', 
        credit_record.user_id, existing_balance, credit_record.credits;
    END IF;
  END LOOP;
END $$;

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


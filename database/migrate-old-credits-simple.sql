-- Simple Credit Migration Script
-- Run this in Render Database Console

-- Migrate credits from old table to new ledger
DO $$
DECLARE
  credit_record RECORD;
  existing_balance INTEGER;
  credits_to_migrate INTEGER;
  migrated_count INTEGER := 0;
  total_migrated INTEGER := 0;
BEGIN
  FOR credit_record IN 
    SELECT user_id, credits 
    FROM credits 
    WHERE credits > 0
    ORDER BY user_id
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
      
      migrated_count := migrated_count + 1;
      total_migrated := total_migrated + credits_to_migrate;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: % users migrated, % total credits migrated', migrated_count, total_migrated;
END $$;

-- Update all snapshots
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


-- Credit Ledger System Schema
-- Implements immutable ledger entries + balance snapshot pattern

-- =============================================================================
-- CREDIT LEDGER TABLE
-- Immutable ledger entries for all credit transactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS credit_ledger (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL, -- Positive for additions, negative for consumption/refunds
  source VARCHAR(100) NOT NULL, -- 'purchase_10', 'free_daily', 'subscription_monthly', 'reading_consumption', 'refund', etc.
  meta JSONB DEFAULT '{}', -- Additional metadata (pack_id, reading_id, purchase_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NULL, -- NULL for non-expiring credits (purchased), set for free credits (24h)
  
  -- Indexes for performance
  CONSTRAINT valid_delta CHECK (delta != 0)
);

CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at);
CREATE INDEX idx_credit_ledger_source ON credit_ledger(source);
CREATE INDEX idx_credit_ledger_expires_at ON credit_ledger(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================================
-- USER CREDIT SNAPSHOT TABLE
-- Balance cache for fast queries (updated after each ledger entry)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_credit_snapshot (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0, -- Total available credits (excluding expired)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_credit_snapshot_updated_at ON user_credit_snapshot(updated_at);

-- =============================================================================
-- ENSURE SUBSCRIPTION_TIER COLUMN EXISTS
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT NULL;

-- =============================================================================
-- FUNCTION: Update balance snapshot after ledger entry
-- =============================================================================
CREATE OR REPLACE FUNCTION update_credit_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate balance from ledger (excluding expired credits)
  INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
  VALUES (
    NEW.user_id,
    COALESCE((
      SELECT SUM(delta)
      FROM credit_ledger
      WHERE user_id = NEW.user_id
        AND (expires_at IS NULL OR expires_at > NOW())
    ), 0),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    balance = COALESCE((
      SELECT SUM(delta)
      FROM credit_ledger
      WHERE user_id = NEW.user_id
        AND (expires_at IS NULL OR expires_at > NOW())
    ), 0),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update snapshot on ledger insert
DROP TRIGGER IF EXISTS trigger_update_credit_snapshot ON credit_ledger;
CREATE TRIGGER trigger_update_credit_snapshot
  AFTER INSERT ON credit_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_snapshot();

-- =============================================================================
-- INITIALIZE SNAPSHOTS FOR EXISTING USERS
-- =============================================================================
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
ON CONFLICT (user_id) DO NOTHING;


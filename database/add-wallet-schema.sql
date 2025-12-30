-- Wallet Ledger System Schema
-- Implements immutable ledger entries + balance snapshot pattern for USD wallet
-- Strictly separate from credit_ledger system

-- =============================================================================
-- WALLET LEDGER TABLE
-- Immutable ledger entries for all USD wallet transactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS wallet_ledger (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL, -- Positive for additions, negative for deductions (USD)
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('FUNDING', 'SESSION_DEBIT', 'EARNING_CREDIT')),
  meta JSONB DEFAULT '{}', -- Additional metadata (session_id, payment_intent_id, advisor_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (amount != 0)
);

CREATE INDEX idx_wallet_ledger_user_id ON wallet_ledger(user_id);
CREATE INDEX idx_wallet_ledger_created_at ON wallet_ledger(created_at);
CREATE INDEX idx_wallet_ledger_transaction_type ON wallet_ledger(transaction_type);

-- =============================================================================
-- USER WALLET SNAPSHOT TABLE
-- Balance cache for fast queries (updated after each ledger entry)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_wallet_snapshot (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total USD balance
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_wallet_snapshot_updated_at ON user_wallet_snapshot(updated_at);

-- =============================================================================
-- FUNCTION: Update balance snapshot after ledger entry
-- =============================================================================
CREATE OR REPLACE FUNCTION update_wallet_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate balance from ledger
  INSERT INTO user_wallet_snapshot (user_id, balance, updated_at)
  VALUES (
    NEW.user_id,
    COALESCE((
      SELECT SUM(amount)
      FROM wallet_ledger
      WHERE user_id = NEW.user_id
    ), 0),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    balance = COALESCE((
      SELECT SUM(amount)
      FROM wallet_ledger
      WHERE user_id = NEW.user_id
    ), 0),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update snapshot on ledger insert
DROP TRIGGER IF EXISTS trigger_update_wallet_snapshot ON wallet_ledger;
CREATE TRIGGER trigger_update_wallet_snapshot
  AFTER INSERT ON wallet_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_snapshot();

-- =============================================================================
-- INITIALIZE SNAPSHOTS FOR EXISTING USERS
-- =============================================================================
INSERT INTO user_wallet_snapshot (user_id, balance, updated_at)
SELECT 
  u.id,
  COALESCE((
    SELECT SUM(amount)
    FROM wallet_ledger
    WHERE user_id = u.id
  ), 0),
  NOW()
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- Table and column comments
COMMENT ON TABLE wallet_ledger IS 'Immutable ledger entries for all USD wallet transactions (strictly separate from credit_ledger)';
COMMENT ON TABLE user_wallet_snapshot IS 'Balance cache for fast wallet balance queries (auto-updated via trigger)';
COMMENT ON COLUMN wallet_ledger.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN wallet_ledger.amount IS 'USD amount - positive for additions (FUNDING, EARNING_CREDIT), negative for deductions (SESSION_DEBIT)';
COMMENT ON COLUMN wallet_ledger.transaction_type IS 'Type of transaction: FUNDING (user adds money), SESSION_DEBIT (user pays for session), EARNING_CREDIT (advisor earns from session)';
COMMENT ON COLUMN wallet_ledger.meta IS 'Additional metadata (session_id, payment_intent_id, advisor_id, etc.)';
COMMENT ON COLUMN user_wallet_snapshot.balance IS 'Cached USD balance for fast queries (derived from wallet_ledger)';


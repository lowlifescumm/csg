-- =============================================================================
-- Wallet Schema Comments Migration
-- Copy and paste this entire block into pgAdmin 4 Query Tool and execute
-- =============================================================================

COMMENT ON TABLE wallet_ledger IS 'Immutable ledger entries for all USD wallet transactions. CRITICAL: Strictly separate from credit_ledger - no foreign keys to AI credits allowed.';

COMMENT ON TABLE user_wallet_snapshot IS 'Balance cache for fast wallet balance queries (auto-updated via trigger)';

COMMENT ON COLUMN wallet_ledger.user_id IS 'Foreign key to users table ONLY. Must never reference credit_ledger or reading_jobs.';

COMMENT ON COLUMN wallet_ledger.amount IS 'USD amount - positive for additions (FUNDING, EARNING_CREDIT), negative for deductions (SESSION_DEBIT)';

COMMENT ON COLUMN wallet_ledger.transaction_type IS 'Type of transaction: FUNDING (user adds money), SESSION_DEBIT (user pays for session), EARNING_CREDIT (advisor earns from session)';

COMMENT ON COLUMN wallet_ledger.meta IS 'Additional metadata (session_id, payment_intent_id, advisor_id, etc.). Must not contain references to credit_ledger entries.';

COMMENT ON COLUMN user_wallet_snapshot.balance IS 'Cached USD balance for fast queries (derived from wallet_ledger)';

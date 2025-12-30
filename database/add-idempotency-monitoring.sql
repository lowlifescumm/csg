-- Idempotency Hit Monitoring
-- Tracks when duplicate webhook events are detected, indicating the multi-webhook strategy is working
-- High numbers of idempotency hits = good (means we're preventing double-billing)

CREATE TABLE IF NOT EXISTS idempotency_hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- e.g., 'payment_intent.succeeded', 'checkout.session.completed'
  stripe_event_id VARCHAR(255), -- Stripe event ID (if available)
  payment_intent_id VARCHAR(255) NOT NULL, -- Payment intent that triggered the hit
  
  -- User & Transaction Info
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  original_ledger_id INTEGER, -- ID of the original ledger entry that was already processed
  
  -- Metadata
  metadata JSONB, -- Additional context (amount, session_id, etc.)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_idempotency_hits_created_at ON idempotency_hits(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_hits_event_type ON idempotency_hits(event_type);
CREATE INDEX IF NOT EXISTS idx_idempotency_hits_payment_intent_id ON idempotency_hits(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_hits_user_id ON idempotency_hits(user_id);

-- Index for time-series queries (recent hits, daily/weekly aggregations)
CREATE INDEX IF NOT EXISTS idx_idempotency_hits_created_at_desc ON idempotency_hits(created_at DESC);


-- Stripe Webhook Event Deduplication Table
-- Prevents duplicate processing of Stripe events (Stripe may send the same event more than once)

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_event_id ON stripe_processed_events(event_id);

-- Auto-cleanup: remove entries older than 30 days (Stripe retries are within 3 days max)
-- This can be run periodically or via pg_cron
COMMENT ON TABLE stripe_processed_events IS 'Deduplication log for Stripe webhook events. Entries older than 30 days can be safely removed.';

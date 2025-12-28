-- Premium Report Orders Table
-- Tracks premium report purchases and their status

CREATE TABLE IF NOT EXISTS premium_report_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL, -- ESSENTIAL, ADVANCED, MASTER
  report_name VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  amount_paid INTEGER NOT NULL, -- Amount in cents
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  report_pdf_url TEXT, -- URL to generated PDF when ready
  report_data JSONB, -- Store report data/metadata
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_premium_report_orders_user_id ON premium_report_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_report_orders_status ON premium_report_orders(status);
CREATE INDEX IF NOT EXISTS idx_premium_report_orders_stripe_session_id ON premium_report_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_premium_report_orders_created_at ON premium_report_orders(created_at);

-- Add comment
COMMENT ON TABLE premium_report_orders IS 'Tracks premium report purchases and their generation status';


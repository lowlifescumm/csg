CREATE TABLE IF NOT EXISTS report_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  report_type VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_purchases_user_payment 
ON report_purchases(user_id, stripe_payment_intent_id) 
WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_purchases_user_id ON report_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_report_purchases_status ON report_purchases(status);

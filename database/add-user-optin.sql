-- Add AI personalization opt-in flag
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_personalization_opt_in BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_ai_optin ON users(ai_personalization_opt_in);


-- Advisor Profile Schema
-- Adds advisor profile table for Live Advisors feature
-- Stores advisor-specific information including bio, specialties, status, and pricing

-- Advisor Profile table
CREATE TABLE IF NOT EXISTS advisor_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profile information
  bio TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of specialties like ["Tarot", "Astrology", "Natal Charts"] (defaults to empty array)
  is_advisor BOOLEAN DEFAULT false,
  per_minute_rate DECIMAL(10, 2), -- USD per minute rate (supports up to $99,999,999.99)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_profile_user_id ON advisor_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_profile_is_advisor ON advisor_profile(is_advisor) WHERE is_advisor = true;

-- Table and column comments
COMMENT ON TABLE advisor_profile IS 'Extended profile information for users who are advisors in the Live Advisors feature';
COMMENT ON COLUMN advisor_profile.user_id IS 'Foreign key to users table - one-to-one relationship';
COMMENT ON COLUMN advisor_profile.bio IS 'Advisor biography and description';
COMMENT ON COLUMN advisor_profile.specialties IS 'Array of advisor specialties (e.g., ["Tarot", "Astrology"])';
COMMENT ON COLUMN advisor_profile.is_advisor IS 'Flag to enable/disable advisor status independently of profile existence';
COMMENT ON COLUMN advisor_profile.per_minute_rate IS 'Pricing rate in USD per minute for advisor consultations';


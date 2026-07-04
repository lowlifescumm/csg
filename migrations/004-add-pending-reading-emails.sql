-- Migration: Add pending_reading_emails table for email capture gate
-- Created: 2026-06-29

-- Create table for storing emails captured before reading delivery
CREATE TABLE IF NOT EXISTS pending_reading_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  reading_id VARCHAR(255),
  reading_type VARCHAR(50) DEFAULT 'tarot',
  captured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_user BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, reading_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_pending_reading_emails_email 
  ON pending_reading_emails(email);

CREATE INDEX IF NOT EXISTS idx_pending_reading_emails_reading_id 
  ON pending_reading_emails(reading_id);

CREATE INDEX IF NOT EXISTS idx_pending_reading_emails_created_at 
  ON pending_reading_emails(created_at);

-- Newsletter subscribers table (if not exists)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(100) DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email 
  ON newsletter_subscribers(email);

COMMENT ON TABLE pending_reading_emails IS 
  'Stores emails captured via the reading gate before revealing full readings';
COMMENT ON TABLE newsletter_subscribers IS 
  'Newsletter subscribers captured from various sources';

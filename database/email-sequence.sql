-- Email nurture sequence schema for CosmicSpiritGuide
-- Run this to add email tracking tables

-- Email sequences table (tracks which emails user has received)
CREATE TABLE IF NOT EXISTS email_sequences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sequence_type VARCHAR(50) NOT NULL DEFAULT 'welcome_nurture',
    email_1_sent BOOLEAN DEFAULT FALSE,
    email_1_sent_at TIMESTAMP,
    email_2_sent BOOLEAN DEFAULT FALSE,
    email_2_sent_at TIMESTAMP,
    email_3_sent BOOLEAN DEFAULT FALSE,
    email_3_sent_at TIMESTAMP,
    email_4_sent BOOLEAN DEFAULT FALSE,
    email_4_sent_at TIMESTAMP,
    email_5_sent BOOLEAN DEFAULT FALSE,
    email_5_sent_at TIMESTAMP,
    email_6_sent BOOLEAN DEFAULT FALSE,
    email_6_sent_at TIMESTAMP,
    email_7_sent BOOLEAN DEFAULT FALSE,
    email_7_sent_at TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    unsubscribed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, sequence_type)
);

-- Email events log (for debugging/tracking)
CREATE TABLE IF NOT EXISTS email_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_type VARCHAR(50) NOT NULL,
    email_number INTEGER,
    status VARCHAR(20) NOT NULL, -- sent, delivered, opened, clicked, bounced, failed
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_type ON email_sequences(sequence_type);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_status ON email_events(status);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- View for users who need next email in sequence
CREATE OR REPLACE VIEW email_sequence_due AS
SELECT 
    es.user_id,
    es.sequence_type,
    es.email_1_sent,
    es.email_2_sent,
    es.email_3_sent,
    es.email_4_sent,
    es.email_5_sent,
    es.email_6_sent,
    es.email_7_sent,
    es.email_1_sent_at,
    es.email_2_sent_at,
    es.email_3_sent_at,
    es.email_4_sent_at,
    es.email_5_sent_at,
    es.email_6_sent_at,
    es.email_7_sent_at,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at as user_created_at,
    CASE 
        WHEN NOT es.email_1_sent THEN 1
        WHEN NOT es.email_2_sent AND es.email_1_sent_at < NOW() - INTERVAL '2 days' THEN 2
        WHEN NOT es.email_3_sent AND es.email_2_sent_at < NOW() - INTERVAL '3 days' THEN 3
        WHEN NOT es.email_4_sent AND es.email_3_sent_at < NOW() - INTERVAL '3 days' THEN 4
        WHEN NOT es.email_5_sent AND es.email_4_sent_at < NOW() - INTERVAL '4 days' THEN 5
        WHEN NOT es.email_6_sent AND es.email_5_sent_at < NOW() - INTERVAL '5 days' THEN 6
        WHEN NOT es.email_7_sent AND es.email_6_sent_at < NOW() - INTERVAL '7 days' THEN 7
        ELSE NULL
    END as next_email_number
FROM email_sequences es
JOIN users u ON es.user_id = u.id
WHERE es.completed = FALSE 
  AND es.unsubscribed = FALSE
  AND (
    NOT es.email_1_sent
    OR (NOT es.email_2_sent AND es.email_1_sent_at < NOW() - INTERVAL '2 days')
    OR (NOT es.email_3_sent AND es.email_2_sent_at < NOW() - INTERVAL '3 days')
    OR (NOT es.email_4_sent AND es.email_3_sent_at < NOW() - INTERVAL '3 days')
    OR (NOT es.email_5_sent AND es.email_4_sent_at < NOW() - INTERVAL '4 days')
    OR (NOT es.email_6_sent AND es.email_5_sent_at < NOW() - INTERVAL '5 days')
    OR (NOT es.email_7_sent AND es.email_6_sent_at < NOW() - INTERVAL '7 days')
  );

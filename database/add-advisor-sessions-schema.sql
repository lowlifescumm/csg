-- Advisor Sessions Schema
-- Defines the state machine for advisor chat/voice sessions
-- Lifecycle: REQUESTED -> ACTIVE -> COMPLETED/FAILED

-- Advisor Sessions table
CREATE TABLE IF NOT EXISTS advisor_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'ACTIVE', 'COMPLETED', 'FAILED')),
  start_time TIMESTAMP WITH TIME ZONE, -- Set when status becomes ACTIVE
  end_time TIMESTAMP WITH TIME ZONE, -- Set when status becomes COMPLETED or FAILED
  total_cost_usd DECIMAL(10, 2) DEFAULT 0, -- Total cost in USD for the session
  per_minute_rate DECIMAL(10, 2), -- Snapshot of advisor's rate at session start
  meta JSONB DEFAULT '{}', -- Additional metadata (twilio_call_sid, connection_type, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_user_id ON advisor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_advisor_id ON advisor_sessions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_status ON advisor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_start_time ON advisor_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_status_advisor ON advisor_sessions(status, advisor_id);

-- Table and column comments
COMMENT ON TABLE advisor_sessions IS 'Tracks advisor chat/voice session lifecycle (REQUESTED -> ACTIVE -> COMPLETED/FAILED)';
COMMENT ON COLUMN advisor_sessions.user_id IS 'Foreign key to users table - the client requesting the session';
COMMENT ON COLUMN advisor_sessions.advisor_id IS 'Foreign key to users table - the advisor providing the session';
COMMENT ON COLUMN advisor_sessions.status IS 'Session state: REQUESTED (initial), ACTIVE (billing occurs), COMPLETED (successful end), FAILED (error/connection loss)';
COMMENT ON COLUMN advisor_sessions.start_time IS 'Timestamp when session status changed to ACTIVE (billing starts)';
COMMENT ON COLUMN advisor_sessions.end_time IS 'Timestamp when session status changed to COMPLETED or FAILED (billing stops)';
COMMENT ON COLUMN advisor_sessions.total_cost_usd IS 'Total cost in USD billed for the session';
COMMENT ON COLUMN advisor_sessions.per_minute_rate IS 'Snapshot of advisor per_minute_rate at session start (for billing calculations)';
COMMENT ON COLUMN advisor_sessions.meta IS 'Additional metadata (Twilio call SID, connection_type, etc.)';


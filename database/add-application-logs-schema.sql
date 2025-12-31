-- Application Logs Schema
-- Adds application_logs table to track admin review actions on advisor applications
-- Stores adminId, advisorId, action, and timestamp for audit trail

-- Application Logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  advisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_logs_admin_id ON application_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_advisor_id ON application_logs(advisor_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_advisor_timestamp ON application_logs(advisor_id, timestamp DESC);

-- Table and column comments
COMMENT ON TABLE application_logs IS 'Tracks admin review actions on advisor applications for audit purposes';
COMMENT ON COLUMN application_logs.admin_id IS 'Foreign key to users table - admin who performed the action';
COMMENT ON COLUMN application_logs.advisor_id IS 'Foreign key to users table - advisor user being reviewed';
COMMENT ON COLUMN application_logs.action IS 'Action type performed (e.g., approved, rejected, pending, suspended)';
COMMENT ON COLUMN application_logs.timestamp IS 'Timestamp when the action occurred';


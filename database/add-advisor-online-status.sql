-- Advisor Online Status Schema
-- Adds online/offline status tracking for advisors with heartbeat mechanism
-- Enables real-time availability toggle and automatic offline detection

-- Add online status and heartbeat tracking columns
ALTER TABLE advisor_profile 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_profile_is_online 
ON advisor_profile(is_online) WHERE is_online = true;

CREATE INDEX IF NOT EXISTS idx_advisor_profile_last_heartbeat_at 
ON advisor_profile(last_heartbeat_at) WHERE is_online = true;

-- Column comments
COMMENT ON COLUMN advisor_profile.is_online IS 'Real-time online/offline status for advisors. Defaults to false (offline).';
COMMENT ON COLUMN advisor_profile.last_heartbeat_at IS 'Timestamp of last heartbeat ping. Used to detect stale connections and auto-reset to offline if heartbeat not received within timeout window.';


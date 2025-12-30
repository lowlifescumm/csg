-- WebRTC Signaling Schema
-- Stores temporary WebRTC signaling data (offers, answers, ICE candidates) for peer-to-peer connections

-- WebRTC Signaling table
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES advisor_sessions(id) ON DELETE CASCADE,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type VARCHAR(50) NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL, -- The actual SDP offer/answer or ICE candidate data
  consumed BOOLEAN DEFAULT false, -- Mark as consumed after retrieval
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_session_id ON webrtc_signaling(session_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_to_user_id ON webrtc_signaling(to_user_id, consumed) WHERE consumed = false;
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_created_at ON webrtc_signaling(created_at);

-- Table and column comments
COMMENT ON TABLE webrtc_signaling IS 'Temporary storage for WebRTC signaling data (offers, answers, ICE candidates) exchanged between peers during advisor sessions';
COMMENT ON COLUMN webrtc_signaling.session_id IS 'Foreign key to advisor_sessions table';
COMMENT ON COLUMN webrtc_signaling.from_user_id IS 'User ID of the peer sending the signal';
COMMENT ON COLUMN webrtc_signaling.to_user_id IS 'User ID of the peer receiving the signal';
COMMENT ON COLUMN webrtc_signaling.signal_type IS 'Type of signal: offer, answer, or ice-candidate';
COMMENT ON COLUMN webrtc_signaling.signal_data IS 'JSONB containing the actual SDP offer/answer or ICE candidate data';
COMMENT ON COLUMN webrtc_signaling.consumed IS 'Flag to mark signal as consumed after retrieval. Used for reliable delivery.';
COMMENT ON COLUMN webrtc_signaling.created_at IS 'Timestamp when signal was created. Used for cleanup of old signals.';


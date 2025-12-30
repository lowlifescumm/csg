-- Chat Messages Schema
-- Stores chat messages for advisor sessions
-- Messages are linked to advisor_sessions via session_id

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES advisor_sessions(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);

-- Table and column comments
COMMENT ON TABLE chat_messages IS 'Stores chat messages for advisor sessions';
COMMENT ON COLUMN chat_messages.session_id IS 'Foreign key to advisor_sessions table';
COMMENT ON COLUMN chat_messages.sender_id IS 'User ID of message sender (can be client user_id or advisor user_id)';
COMMENT ON COLUMN chat_messages.message_text IS 'The message content';


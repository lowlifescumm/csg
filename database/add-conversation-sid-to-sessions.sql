-- Add conversation_sid column to advisor_sessions table
-- Stores Twilio Conversations Service Conversation SID for chat sessions

-- Add conversation_sid column
ALTER TABLE advisor_sessions 
ADD COLUMN IF NOT EXISTS conversation_sid VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_conversation_sid ON advisor_sessions(conversation_sid) WHERE conversation_sid IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN advisor_sessions.conversation_sid IS 'Twilio Conversations Service Conversation SID (starts with CH...) - created when session status changes to ACTIVE';


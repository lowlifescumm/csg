-- Meditation MVP Database Schema
-- Run this script to add meditation tables to your database

-- Meditations catalog table
CREATE TABLE IF NOT EXISTS meditations (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL,
  narrator VARCHAR(100),
  premium BOOLEAN DEFAULT false,
  narration_audio_url TEXT NOT NULL,
  transcript TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure user_xp table exists (for XP awards)
CREATE TABLE IF NOT EXISTS user_xp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

-- User meditation sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meditation_id INTEGER NOT NULL REFERENCES meditations(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meditations_premium ON meditations(premium);
CREATE INDEX IF NOT EXISTS idx_meditations_tags ON meditations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_meditation_id ON meditation_sessions(meditation_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_started_at ON meditation_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_completed_at ON meditation_sessions(completed_at);

-- Sample meditations (for MVP)
INSERT INTO meditations (title, description, duration_seconds, narrator, premium, narration_audio_url, transcript, tags) VALUES
  ('Morning Clarity', 'Start your day with a clear and focused mind', 180, 'Sarah Moon', false, 'https://example.com/audio/morning-clarity.mp3', 'Welcome to Morning Clarity. Find a comfortable position and close your eyes. Take three deep breaths...', ARRAY['morning', 'focus', 'clarity']),
  ('Deep Sleep', 'Drift into peaceful, restorative sleep', 600, 'Michael Zen', false, 'https://example.com/audio/deep-sleep.mp3', 'Welcome to Deep Sleep. Lie down comfortably and let your body relax completely...', ARRAY['sleep', 'relaxation', 'night']),
  ('Anxiety Relief', 'Calm your mind and release tension', 300, 'Sarah Moon', false, 'https://example.com/audio/anxiety-relief.mp3', 'Welcome to Anxiety Relief. Notice any tension in your body and begin to release it...', ARRAY['anxiety', 'calm', 'stress']),
  ('Energy Boost', 'Recharge your body and mind', 240, 'Michael Zen', false, 'https://example.com/audio/energy-boost.mp3', 'Welcome to Energy Boost. Sit upright and feel your spine lengthen...', ARRAY['energy', 'motivation', 'daytime']),
  ('Loving Kindness', 'Cultivate compassion for yourself and others', 360, 'Sarah Moon', true, 'https://example.com/audio/loving-kindness.mp3', 'Welcome to Loving Kindness. This is a premium meditation. Begin by bringing to mind someone you love...', ARRAY['love', 'compassion', 'premium']),
  ('Chakra Balance', 'Align your energy centers for harmony', 420, 'Michael Zen', true, 'https://example.com/audio/chakra-balance.mp3', 'Welcome to Chakra Balance. This is a premium meditation. Visualize a red light at the base of your spine...', ARRAY['chakra', 'energy', 'premium']),
  ('Quick Reset', 'A brief pause to center yourself', 120, 'Sarah Moon', false, 'https://example.com/audio/quick-reset.mp3', 'Welcome to Quick Reset. Take a moment to pause and breathe...', ARRAY['quick', 'reset', 'breath'])
ON CONFLICT DO NOTHING;


-- Streak Milestones table
-- Tracks achieved streak milestones and their rewards

CREATE TABLE IF NOT EXISTS streak_milestones (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_days INTEGER NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  credits_awarded INTEGER DEFAULT 0,
  achieved_at TIMESTAMP DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, milestone_days)
);

CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON streak_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_unnotified ON streak_milestones(notified) WHERE notified = false;

COMMENT ON TABLE streak_milestones IS 'Tracks achieved daily streak milestones per user';
COMMENT ON COLUMN streak_milestones.milestone_days IS 'Streak length required for this milestone (7, 14, 30, 60, 100, 365)';
COMMENT ON COLUMN streak_milestones.notified IS 'Whether the user has been notified about this milestone';

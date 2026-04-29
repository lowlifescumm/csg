-- content-workflow tables
-- Run this once against the CSG Postgres database (from DATABASE_URL)
-- Hermes pipeline writes to these tables via POST /api/content-workflow

CREATE TABLE IF NOT EXISTS content_workflow (
  id            SERIAL PRIMARY KEY,
  calendar_id   VARCHAR(255) UNIQUE NOT NULL,
  blog_post_id  INTEGER REFERENCES blog_posts(id) ON DELETE SET NULL,
  current_step  VARCHAR(50)  NOT NULL DEFAULT 'research',
  step_status   VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_workflow_steps (
  id            SERIAL PRIMARY KEY,
  workflow_id   INTEGER NOT NULL REFERENCES content_workflow(id) ON DELETE CASCADE,
  step_name     VARCHAR(50) NOT NULL,
  step_status   VARCHAR(20) NOT NULL DEFAULT 'pending',
  step_data     JSONB,
  completed_at  TIMESTAMP,
  UNIQUE(workflow_id, step_name)
);

CREATE INDEX IF NOT EXISTS idx_content_workflow_calendar  ON content_workflow(calendar_id);
CREATE INDEX IF NOT EXISTS idx_content_workflow_blog_post ON content_workflow(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow    ON content_workflow_steps(workflow_id);

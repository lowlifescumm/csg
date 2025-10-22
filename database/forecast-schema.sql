-- Personalized Daily/Weekly Forecasts Schema
-- Adds forecast generation and user preferences for personalized astrological forecasts

-- User forecast preferences
CREATE TABLE IF NOT EXISTS forecast_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Delivery settings
  delivery_cadence VARCHAR(20) DEFAULT 'daily' CHECK (delivery_cadence IN ('daily', 'weekly', 'none')),
  delivery_time TIME DEFAULT '08:00:00',
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  
  -- Content preferences
  tone VARCHAR(20) DEFAULT 'spiritual' CHECK (tone IN ('spiritual', 'practical', 'concise', 'detailed')),
  default_length VARCHAR(20) DEFAULT 'medium' CHECK (default_length IN ('short', 'medium', 'long')),
  topics TEXT[] DEFAULT ARRAY['general'], -- ['love', 'career', 'health', 'general', 'spirituality']
  
  -- Feature flags
  include_actions BOOLEAN DEFAULT true,
  include_rituals BOOLEAN DEFAULT false,
  ai_rewrite_enabled BOOLEAN DEFAULT false, -- Premium feature
  
  -- Notification preferences
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Generated forecasts
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Forecast metadata
  forecast_date DATE NOT NULL,
  forecast_type VARCHAR(20) DEFAULT 'daily' CHECK (forecast_type IN ('daily', 'weekly', 'monthly')),
  length VARCHAR(20) DEFAULT 'medium' CHECK (length IN ('short', 'medium', 'long')),
  
  -- Content
  headline TEXT NOT NULL,
  theme TEXT, -- One-line summary
  full_text TEXT NOT NULL,
  tone VARCHAR(20),
  
  -- Transit data (denormalized for speed)
  transit_summary JSONB, -- Array of active transits with strength
  topics TEXT[], -- ['career', 'love', etc.]
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high')),
  confidence_score VARCHAR(20) DEFAULT 'medium' CHECK (confidence_score IN ('low', 'medium', 'high')),
  
  -- Actions and guidance
  suggested_actions JSONB, -- Array of action items
  rituals JSONB, -- Optional ritual suggestions
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  saved_to_journal BOOLEAN DEFAULT false,
  
  -- Caching
  cache_key TEXT,
  expires_at TIMESTAMP,
  
  UNIQUE(user_id, forecast_date, forecast_type)
);

-- Forecast templates (for different transit types)
CREATE TABLE IF NOT EXISTS forecast_templates (
  id SERIAL PRIMARY KEY,
  
  -- Template matching
  planet VARCHAR(20) NOT NULL, -- 'sun', 'moon', 'mars', etc.
  aspect VARCHAR(20) NOT NULL, -- 'conjunction', 'square', 'trine', etc.
  target_type VARCHAR(20) NOT NULL, -- 'natal_planet', 'house_cusp', 'angle'
  target VARCHAR(20), -- Specific planet or house
  
  -- Template content
  topic VARCHAR(20) NOT NULL, -- 'career', 'love', 'health', 'general'
  tone VARCHAR(20) NOT NULL, -- 'spiritual', 'practical', 'concise'
  
  headline_template TEXT NOT NULL, -- e.g. "{{planet}} {{aspect}} your {{target}} - {{theme}}"
  short_template TEXT NOT NULL,
  medium_template TEXT,
  long_template TEXT,
  
  -- Template variables: {{planet}}, {{aspect}}, {{target}}, {{house}}, {{sign}}, {{degree}}, {{orb}}
  
  -- Strength and priority
  strength VARCHAR(20) DEFAULT 'medium' CHECK (strength IN ('low', 'medium', 'high')),
  priority INTEGER DEFAULT 5, -- 1-10, used for ranking
  
  -- Suggested actions for this transit type
  default_actions JSONB, -- Array of action templates
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forecast_prefs_user ON forecast_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_user_date ON forecasts(user_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_forecasts_delivered ON forecasts(delivered_at) WHERE delivered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_forecasts_cache ON forecasts(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forecast_templates_lookup ON forecast_templates(planet, aspect, topic, tone);

-- View for user forecast dashboard
CREATE OR REPLACE VIEW user_forecast_dashboard AS
SELECT 
  f.id,
  f.user_id,
  f.forecast_date,
  f.forecast_type,
  f.headline,
  f.theme,
  f.urgency,
  f.confidence_score,
  f.topics,
  f.read_at IS NOT NULL as is_read,
  f.saved_to_journal,
  f.generated_at,
  jsonb_array_length(COALESCE(f.transit_summary, '[]'::jsonb)) as transit_count,
  jsonb_array_length(COALESCE(f.suggested_actions, '[]'::jsonb)) as action_count
FROM forecasts f
WHERE f.forecast_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.forecast_date DESC, f.generated_at DESC;

-- Seed some basic templates (spiritual tone, general topic)
INSERT INTO forecast_templates (planet, aspect, target_type, target, topic, tone, headline_template, short_template, medium_template, strength, priority, default_actions)
VALUES 
-- Mars transits
('mars', 'square', 'natal_planet', 'sun', 'general', 'spiritual', 
  'Dynamic Energy Alert: Mars Squares Your Sun',
  'Mars challenges your Sun today, bringing assertive energy. Channel this into productive action rather than conflict.',
  'Mars forms a challenging square to your natal Sun, activating your core identity and will. This transit brings intense energy that can manifest as assertiveness, impatience, or conflict. The key is conscious direction — use this power to push forward on important projects rather than burning bridges. Physical activity and creative expression are excellent outlets.',
  'high', 8,
  '["Take on a challenging project", "Exercise to release tension", "Practice patience in conflicts"]'),

('jupiter', 'trine', 'natal_planet', 'venus', 'love', 'spiritual',
  'Cosmic Blessing: Jupiter Harmonizes with Venus',
  'Jupiter expands your capacity for love and joy. Perfect time for connection and appreciation.',
  'Jupiter forms a harmonious trine to your natal Venus, blessing your relationships and creative pursuits with optimism and growth. This is a time of expanded heart energy — you naturally attract good things and people. Social activities flourish, and existing relationships deepen with ease.',
  'high', 7,
  '["Plan a special date or gathering", "Express gratitude to loved ones", "Start a creative project"]'),

('saturn', 'conjunction', 'natal_planet', 'mercury', 'career', 'practical',
  'Structure Your Thoughts: Saturn Aligns with Mercury',
  'Saturn brings discipline to your mental processes. Time to organize, plan, and commit to important decisions.',
  'Saturn conjoins your natal Mercury, bringing structure and seriousness to your thinking and communication. This transit favors long-term planning, contracts, and commitments. Your mind is methodical and thorough — perfect for tackling complex projects that require sustained focus. Be patient with learning curves.',
  'medium', 6,
  '["Create a detailed plan for a major goal", "Review and organize contracts", "Commit to a learning program"]'),

('moon', 'opposition', 'natal_planet', 'moon', 'general', 'spiritual',
  'Full Moon Energy: Emotional Illumination',
  'Your emotions are heightened today. A time for release, completion, and emotional awareness.',
  'The transiting Moon opposes your natal Moon, creating a Full Moon effect in your personal chart. This brings emotions to the surface and illuminates relationship dynamics. It''s a powerful time for emotional release and seeing clearly what needs to change or end. Trust your feelings.',
  'medium', 5,
  '["Journal your emotions", "Release what no longer serves", "Have an honest conversation"]'),

('venus', 'sextile', 'natal_planet', 'mars', 'love', 'concise',
  'Passion and Harmony',
  'Venus and Mars connect beautifully — love and desire align. Take initiative in relationships.',
  'Venus forms a supportive sextile to your Mars, harmonizing your desires with your ability to attract. This is excellent for romance, creativity, and balanced self-assertion.',
  'low', 4,
  '["Make the first move", "Wear something that makes you feel confident", "Create art"]')

ON CONFLICT DO NOTHING;

COMMENT ON TABLE forecast_preferences IS 'User preferences for personalized daily/weekly forecasts';
COMMENT ON TABLE forecasts IS 'Generated astrological forecasts for users';
COMMENT ON TABLE forecast_templates IS 'Templates for generating transit-specific forecast text';


-- Transit Tracker Database Schema
-- Comprehensive schema for natal charts, transits, subscriptions, and notifications

-- =============================================================================
-- NATAL CHARTS TABLE
-- Stores encrypted user birth data and calculated natal positions
-- =============================================================================
CREATE TABLE IF NOT EXISTS natal_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Birth Data (encrypted at rest)
  birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
  birth_time TIME NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location_name VARCHAR(255),
  
  -- Calculated Positions (stored as JSONB for flexibility)
  natal_positions JSONB NOT NULL, -- { "Sun": 101.23, "Moon": 45.67, ... }
  houses JSONB, -- House cusps and placements
  ascendant JSONB, -- Rising sign details
  midheaven JSONB, -- MC details
  
  -- Metadata
  chart_name VARCHAR(255), -- Optional name for multiple charts
  is_primary BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_user_primary_chart UNIQUE (user_id, is_primary) WHERE is_primary = true
);

CREATE INDEX idx_natal_charts_user_id ON natal_charts(user_id);
CREATE INDEX idx_natal_charts_created_at ON natal_charts(created_at);

-- =============================================================================
-- TRANSITS TABLE
-- Stores calculated transit events and their metadata
-- =============================================================================
CREATE TABLE IF NOT EXISTS transits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  natal_chart_id UUID NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
  
  -- Transit Details
  transiting_body VARCHAR(50) NOT NULL, -- Saturn, Jupiter, etc.
  natal_point VARCHAR(50) NOT NULL, -- Venus, Sun, etc.
  aspect VARCHAR(50) NOT NULL, -- conjunction, square, etc.
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE, -- When transit enters orb
  exact_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Peak exactitude
  end_time TIMESTAMP WITH TIME ZONE, -- When transit leaves orb
  
  -- Measurements
  orb DECIMAL(5, 2) NOT NULL, -- Current orb in degrees
  strength_score INTEGER, -- 0-100 intensity rating
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, past
  is_retrograde BOOLEAN DEFAULT false,
  
  -- Interpretation (cached)
  interpretation JSONB, -- Cached AI interpretation
  
  -- House Information
  affected_house INTEGER, -- 1-12
  house_meaning VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (status IN ('upcoming', 'active', 'past')),
  CHECK (strength_score >= 0 AND strength_score <= 100),
  CHECK (affected_house >= 1 AND affected_house <= 12)
);

CREATE INDEX idx_transits_user_id ON transits(user_id);
CREATE INDEX idx_transits_natal_chart_id ON transits(natal_chart_id);
CREATE INDEX idx_transits_exact_time ON transits(exact_time);
CREATE INDEX idx_transits_status ON transits(status);
CREATE INDEX idx_transits_user_status ON transits(user_id, status);

-- =============================================================================
-- TRANSIT SUBSCRIPTIONS / MONITORS
-- Defines which transits to monitor for each user
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  natal_chart_id UUID NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
  
  -- Monitoring Filters
  transiting_bodies TEXT[], -- Array of planets to monitor
  natal_points TEXT[], -- Array of natal points to track
  aspects TEXT[], -- Array of aspects to watch
  min_strength INTEGER DEFAULT 50, -- Minimum strength to notify
  
  -- Notification Preferences
  notify_email BOOLEAN DEFAULT true,
  notify_push BOOLEAN DEFAULT false,
  notify_webhook BOOLEAN DEFAULT false,
  webhook_url VARCHAR(500),
  
  -- Schedule
  is_active BOOLEAN DEFAULT true,
  last_check TIMESTAMP WITH TIME ZONE,
  next_check TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transit_subs_user_id ON transit_subscriptions(user_id);
CREATE INDEX idx_transit_subs_active ON transit_subscriptions(is_active);
CREATE INDEX idx_transit_subs_next_check ON transit_subscriptions(next_check);

-- =============================================================================
-- TRANSIT NOTIFICATIONS
-- Log of sent notifications for audit and deduplication
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transit_id UUID NOT NULL REFERENCES transits(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES transit_subscriptions(id) ON DELETE SET NULL,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- email, push, webhook
  event_type VARCHAR(50) NOT NULL, -- exact, entering, leaving
  
  -- Delivery
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  delivery_status VARCHAR(100),
  error_message TEXT,
  
  -- Payload (for webhooks)
  payload JSONB,
  
  -- Deduplication
  notification_hash VARCHAR(64) UNIQUE, -- Hash to prevent duplicates
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transit_notif_user_id ON transit_notifications(user_id);
CREATE INDEX idx_transit_notif_transit_id ON transit_notifications(transit_id);
CREATE INDEX idx_transit_notif_sent_at ON transit_notifications(sent_at);
CREATE INDEX idx_transit_notif_hash ON transit_notifications(notification_hash);

-- =============================================================================
-- EPHEMERIS CACHE
-- Cached planetary positions for performance
-- =============================================================================
CREATE TABLE IF NOT EXISTS ephemeris_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp
  calculation_time TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
  
  -- Planetary Positions (degrees of ecliptic longitude)
  positions JSONB NOT NULL, -- { "Sun": 123.45, "Moon": 234.56, ... }
  
  -- Metadata
  source VARCHAR(100) DEFAULT 'astronomy-engine',
  version VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ephemeris_cache_calc_time ON ephemeris_cache(calculation_time);

-- =============================================================================
-- TRANSIT COMPUTATION LOG
-- Audit trail for transit calculations
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_computation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Computation Details
  computation_type VARCHAR(50) NOT NULL, -- batch, on-demand, scheduled
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Results
  transits_found INTEGER DEFAULT 0,
  computation_time_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- running, completed, failed
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transit_comp_log_user_id ON transit_computation_log(user_id);
CREATE INDEX idx_transit_comp_log_created_at ON transit_computation_log(created_at);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active transits for a user
CREATE OR REPLACE VIEW active_user_transits AS
SELECT 
  t.*,
  nc.user_id,
  nc.natal_positions,
  u.email,
  u.first_name
FROM transits t
JOIN natal_charts nc ON t.natal_chart_id = nc.id
JOIN users u ON t.user_id = u.id
WHERE t.status = 'active'
ORDER BY t.strength_score DESC, t.exact_time ASC;

-- Upcoming high-strength transits
CREATE OR REPLACE VIEW upcoming_major_transits AS
SELECT 
  t.*,
  nc.user_id,
  u.email,
  u.first_name
FROM transits t
JOIN natal_charts nc ON t.natal_chart_id = nc.id
JOIN users u ON t.user_id = u.id
WHERE t.status = 'upcoming' 
  AND t.strength_score >= 70
  AND t.exact_time > NOW()
  AND t.exact_time < NOW() + INTERVAL '30 days'
ORDER BY t.exact_time ASC;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_natal_charts_updated_at ON natal_charts;
CREATE TRIGGER update_natal_charts_updated_at
  BEFORE UPDATE ON natal_charts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transits_updated_at ON transits;
CREATE TRIGGER update_transits_updated_at
  BEFORE UPDATE ON transits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transit_subs_updated_at ON transit_subscriptions;
CREATE TRIGGER update_transit_subs_updated_at
  BEFORE UPDATE ON transit_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old ephemeris cache (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ephemeris()
RETURNS void AS $$
BEGIN
  DELETE FROM ephemeris_cache 
  WHERE calculation_time < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to archive past transits (move to archive after 180 days)
CREATE OR REPLACE FUNCTION archive_old_transits()
RETURNS void AS $$
BEGIN
  UPDATE transits 
  SET status = 'past'
  WHERE exact_time < NOW() - INTERVAL '180 days'
    AND status != 'past';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PERMISSIONS (if using RLS)
-- =============================================================================

-- Enable Row Level Security if needed
-- ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transit_subscriptions ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment if using RLS):
-- CREATE POLICY natal_charts_user_policy ON natal_charts
--   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- =============================================================================
-- SAMPLE DATA CLEANUP FUNCTIONS
-- =============================================================================

-- Function to delete all user transit data (GDPR compliance)
CREATE OR REPLACE FUNCTION delete_user_transit_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM transit_notifications WHERE user_id = target_user_id;
  DELETE FROM transit_subscriptions WHERE user_id = target_user_id;
  DELETE FROM transits WHERE user_id = target_user_id;
  DELETE FROM natal_charts WHERE user_id = target_user_id;
  DELETE FROM transit_computation_log WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_transits_user_exact_time ON transits(user_id, exact_time DESC);
CREATE INDEX idx_transits_status_exact_time ON transits(status, exact_time);
CREATE INDEX idx_transits_user_status_exact ON transits(user_id, status, exact_time);

-- GIN index for JSONB fields for fast lookups
CREATE INDEX idx_natal_positions_gin ON natal_charts USING GIN (natal_positions);
CREATE INDEX idx_transit_interpretation_gin ON transits USING GIN (interpretation);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE natal_charts IS 'Stores user birth chart data with encrypted PII and calculated planetary positions';
COMMENT ON TABLE transits IS 'Computed transit events showing planetary interactions with natal chart';
COMMENT ON TABLE transit_subscriptions IS 'User preferences for which transits to monitor and how to notify';
COMMENT ON TABLE transit_notifications IS 'Audit log of all notifications sent to users';
COMMENT ON TABLE ephemeris_cache IS 'Cached planetary positions for performance optimization';
COMMENT ON TABLE transit_computation_log IS 'Audit trail of transit calculation operations';

-- =============================================================================
-- INITIAL GRANTS (adjust as needed for your deployment)
-- =============================================================================

-- Example grants (uncomment and adjust for your needs):
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;



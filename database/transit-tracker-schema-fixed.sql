-- Transit Tracker Database Schema (Fixed for INTEGER user IDs)
-- Compatible with existing users table that uses INTEGER for id

-- =============================================================================
-- NATAL CHARTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS natal_charts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Birth Data (encrypted at rest)
  birth_date TIMESTAMP WITH TIME ZONE NOT NULL,
  birth_time TIME NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  location_name VARCHAR(255),
  
  -- Calculated Positions (stored as JSONB for flexibility)
  natal_positions JSONB NOT NULL,
  houses JSONB,
  ascendant JSONB,
  midheaven JSONB,
  
  -- Metadata
  chart_name VARCHAR(255) DEFAULT 'Birth Chart',
  is_primary BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_natal_charts_user_id ON natal_charts(user_id);
CREATE INDEX idx_natal_charts_created_at ON natal_charts(created_at);
CREATE INDEX idx_natal_charts_primary ON natal_charts(user_id, is_primary);

-- =============================================================================
-- TRANSITS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS transits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  natal_chart_id INTEGER NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
  
  -- Transit Details
  transiting_body VARCHAR(50) NOT NULL,
  natal_point VARCHAR(50) NOT NULL,
  aspect VARCHAR(50) NOT NULL,
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE,
  exact_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Measurements
  orb DECIMAL(5, 2) NOT NULL,
  strength_score INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'upcoming',
  is_retrograde BOOLEAN DEFAULT false,
  
  -- Interpretation (cached)
  interpretation JSONB,
  
  -- House Information
  affected_house INTEGER,
  house_meaning VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (status IN ('upcoming', 'active', 'past')),
  CHECK (strength_score >= 0 AND strength_score <= 100),
  CHECK (affected_house >= 1 AND affected_house <= 12 OR affected_house IS NULL)
);

CREATE INDEX idx_transits_user_id ON transits(user_id);
CREATE INDEX idx_transits_natal_chart_id ON transits(natal_chart_id);
CREATE INDEX idx_transits_exact_time ON transits(exact_time);
CREATE INDEX idx_transits_status ON transits(status);
CREATE INDEX idx_transits_user_status ON transits(user_id, status);
CREATE INDEX idx_transits_user_exact_time ON transits(user_id, exact_time DESC);
CREATE INDEX idx_transits_status_exact_time ON transits(status, exact_time);
CREATE INDEX idx_transits_user_status_exact ON transits(user_id, status, exact_time);

-- =============================================================================
-- TRANSIT SUBSCRIPTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  natal_chart_id INTEGER NOT NULL REFERENCES natal_charts(id) ON DELETE CASCADE,
  
  -- Monitoring Filters
  transiting_bodies TEXT[],
  natal_points TEXT[],
  aspects TEXT[],
  min_strength INTEGER DEFAULT 50,
  
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
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transit_id INTEGER NOT NULL REFERENCES transits(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES transit_subscriptions(id) ON DELETE SET NULL,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  
  -- Delivery
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  delivery_status VARCHAR(100),
  error_message TEXT,
  
  -- Payload (for webhooks)
  payload JSONB,
  
  -- Deduplication
  notification_hash VARCHAR(64),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transit_notif_user_id ON transit_notifications(user_id);
CREATE INDEX idx_transit_notif_transit_id ON transit_notifications(transit_id);
CREATE INDEX idx_transit_notif_sent_at ON transit_notifications(sent_at);
CREATE INDEX idx_transit_notif_hash ON transit_notifications(notification_hash);
CREATE UNIQUE INDEX idx_transit_notif_hash_unique ON transit_notifications(notification_hash) WHERE notification_hash IS NOT NULL;

-- =============================================================================
-- EPHEMERIS CACHE
-- =============================================================================
CREATE TABLE IF NOT EXISTS ephemeris_cache (
  id SERIAL PRIMARY KEY,
  calculation_time TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
  positions JSONB NOT NULL,
  source VARCHAR(100) DEFAULT 'astronomy-engine',
  version VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ephemeris_cache_calc_time ON ephemeris_cache(calculation_time);

-- =============================================================================
-- TRANSIT COMPUTATION LOG
-- =============================================================================
CREATE TABLE IF NOT EXISTS transit_computation_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  computation_type VARCHAR(50) NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  transits_found INTEGER DEFAULT 0,
  computation_time_ms INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transit_comp_log_user_id ON transit_computation_log(user_id);
CREATE INDEX idx_transit_comp_log_created_at ON transit_computation_log(created_at);

-- =============================================================================
-- VIEWS
-- =============================================================================

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION cleanup_old_ephemeris()
RETURNS void AS $$
BEGIN
  DELETE FROM ephemeris_cache 
  WHERE calculation_time < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_old_transits()
RETURNS void AS $$
BEGIN
  UPDATE transits 
  SET status = 'past'
  WHERE exact_time < NOW() - INTERVAL '180 days'
    AND status != 'past';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_user_transit_data(target_user_id INTEGER)
RETURNS void AS $$
BEGIN
  DELETE FROM transit_notifications WHERE user_id = target_user_id;
  DELETE FROM transit_subscriptions WHERE user_id = target_user_id;
  DELETE FROM transits WHERE user_id = target_user_id;
  DELETE FROM natal_charts WHERE user_id = target_user_id;
  DELETE FROM transit_computation_log WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- GIN index for JSONB fields
CREATE INDEX idx_natal_positions_gin ON natal_charts USING GIN (natal_positions);
CREATE INDEX idx_transit_interpretation_gin ON transits USING GIN (interpretation);

-- Comments
COMMENT ON TABLE natal_charts IS 'Stores user birth chart data with encrypted PII and calculated planetary positions';
COMMENT ON TABLE transits IS 'Computed transit events showing planetary interactions with natal chart';
COMMENT ON TABLE transit_subscriptions IS 'User preferences for which transits to monitor and how to notify';
COMMENT ON TABLE transit_notifications IS 'Audit log of all notifications sent to users';
COMMENT ON TABLE ephemeris_cache IS 'Cached planetary positions for performance optimization';
COMMENT ON TABLE transit_computation_log IS 'Audit trail of transit calculation operations';




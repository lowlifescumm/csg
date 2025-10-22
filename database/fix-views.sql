-- Fix the duplicate column issue in views

DROP VIEW IF EXISTS active_user_transits;
CREATE VIEW active_user_transits AS
SELECT 
  t.*,
  nc.natal_positions,
  u.email,
  u.first_name
FROM transits t
JOIN natal_charts nc ON t.natal_chart_id = nc.id
JOIN users u ON t.user_id = u.id
WHERE t.status = 'active'
ORDER BY t.strength_score DESC, t.exact_time ASC;

DROP VIEW IF EXISTS upcoming_major_transits;
CREATE VIEW upcoming_major_transits AS
SELECT 
  t.*,
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




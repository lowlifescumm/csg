-- Add partner data support to premium_report_orders table
-- Run this migration to add partner data collection for Advanced/Master reports

ALTER TABLE premium_report_orders 
ADD COLUMN IF NOT EXISTS partner_data JSONB,
ADD COLUMN IF NOT EXISTS skip_partner_data BOOLEAN DEFAULT false;

-- Index for partner data queries
CREATE INDEX IF NOT EXISTS idx_premium_report_orders_partner_data 
ON premium_report_orders USING GIN (partner_data);

-- Add comment
COMMENT ON COLUMN premium_report_orders.partner_data IS 'Partner birth chart data for compatibility sections (birthDate, birthTime, location, latitude, longitude)';
COMMENT ON COLUMN premium_report_orders.skip_partner_data IS 'User opted to skip partner data (compatibility sections will be omitted)';


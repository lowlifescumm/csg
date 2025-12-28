-- PDF Template Storage Schema (Updated Version)
-- Supports both Postgres (UUID) and file storage patterns

-- PostgreSQL Schema
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id TEXT,
  template_json JSONB NOT NULL,
  preview_html TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_templates_owner ON report_templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_name ON report_templates(name);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_at ON report_templates(created_at DESC);

-- Optional: Add report_type if needed for filtering
-- ALTER TABLE report_templates ADD COLUMN report_type TEXT;
-- CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(report_type);

-- Comments
COMMENT ON TABLE report_templates IS 'Stores pdfme Designer export templates for WYSIWYG PDF generation';
COMMENT ON COLUMN report_templates.template_json IS 'Complete pdfme template JSON exported from Designer (https://pdfme.com/designer)';
COMMENT ON COLUMN report_templates.preview_html IS 'Optional HTML preview of the template for admin UI';









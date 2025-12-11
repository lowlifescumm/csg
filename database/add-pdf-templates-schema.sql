-- PDF Template Storage Schema for pdfme WYSIWYG Templates
-- This table stores exported templates from the pdfme Designer

CREATE TABLE IF NOT EXISTS pdf_templates (
  id SERIAL PRIMARY KEY,
  
  -- Template identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  
  -- Template type/category
  report_type VARCHAR(50) NOT NULL, -- 'ESSENTIAL', 'ADVANCED', 'MASTER', 'tarot', etc.
  version INTEGER DEFAULT 1,
  
  -- Template data (exported JSON from pdfme Designer)
  template_json JSONB NOT NULL, -- The full pdfme template structure
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Only one default per report_type
  
  -- Ownership and tracking
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Preview/thumbnail
  preview_url VARCHAR(500), -- Optional Cloudinary URL for template preview
  notes TEXT -- Internal notes about the template
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pdf_templates_report_type ON pdf_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_active ON pdf_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pdf_templates_default ON pdf_templates(report_type, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pdf_templates_slug ON pdf_templates(slug);

-- Constraint: Only one default template per report_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_pdf_templates_unique_default 
ON pdf_templates(report_type) 
WHERE is_default = true;

-- Comments for documentation
COMMENT ON TABLE pdf_templates IS 'Stores pdfme Designer export templates for WYSIWYG PDF generation';
COMMENT ON COLUMN pdf_templates.template_json IS 'Complete pdfme template JSON exported from Designer (https://pdfme.com/designer)';
COMMENT ON COLUMN pdf_templates.report_type IS 'Report type this template is designed for (ESSENTIAL, ADVANCED, MASTER, etc.)';


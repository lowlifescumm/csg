/**
 * Seed script to add a sample pdfme template to the database
 * 
 * Usage:
 *   node scripts/seed-template.js
 * 
 * Requires DATABASE_URL environment variable
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not set');
  console.error('Usage: DATABASE_URL="postgresql://..." node scripts/seed-template.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

/**
 * Insert template into database
 */
async function insertTemplate({ name, owner_id, template_json, preview_html }) {
  const client = await pool.connect();
  try {
    // Check if table exists, if not create it (for convenience)
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        owner_id TEXT,
        template_json JSONB NOT NULL,
        preview_html TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_report_templates_owner ON report_templates(owner_id);
      CREATE INDEX IF NOT EXISTS idx_report_templates_name ON report_templates(name);
    `);

    // Insert template
    const result = await client.query(
      `INSERT INTO report_templates (name, owner_id, template_json, preview_html)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, created_at`,
      [name, owner_id, JSON.stringify(template_json), preview_html || '']
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting template seed...');

    // Load sample template JSON
        // Try templates/ directory first, fallback to scripts/
        const templatePath = join(__dirname, '../templates/sample-pdfme.json');
        const fallbackPath = join(__dirname, 'sample-pdfme-template.json');
        let templateFile;
        try {
          require('fs').accessSync(templatePath);
          templateFile = templatePath;
        } catch {
          templateFile = fallbackPath;
        }
    const sampleTemplate = JSON.parse(readFileSync(templatePath, 'utf8'));

    // Generate preview HTML (simple placeholder)
    const previewHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Template Preview: sample-pdfme</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .field { margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #007bff; }
          .field-name { font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <h1>PDFme Template Preview</h1>
        <h2>Template: sample-pdfme</h2>
        <p>This template contains the following fields:</p>
        <div class="field">
          <span class="field-name">userName</span> - User's name (text field)
        </div>
        <div class="field">
          <span class="field-name">userSunSign</span> - User's sun sign (text field)
        </div>
        <div class="field">
          <span class="field-name">section1Title</span> - Section title (text field)
        </div>
        <div class="field">
          <span class="field-name">section1Content</span> - Section content (text field)
        </div>
        <div class="field">
          <span class="field-name">generatedAt</span> - Generation timestamp (text field)
        </div>
      </body>
      </html>
    `.trim();

    // Insert template
    const inserted = await insertTemplate({
      name: 'sample-pdfme',
      owner_id: 'internal',
      template_json: sampleTemplate,
      preview_html: previewHtml,
    });

    console.log('✅ Successfully seeded sample template!');
    console.log(`   ID: ${inserted.id}`);
    console.log(`   Name: ${inserted.name}`);
    console.log(`   Created: ${inserted.created_at}`);
    console.log('');
    console.log('📋 You can now use this template with:');
    console.log(`   curl -X POST "...?engine=template&templateId=${inserted.id}" ...`);
    
    return inserted;
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✨ Seed completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('💥 Seed failed:', e);
    process.exit(1);
  });


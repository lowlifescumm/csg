/**
 * Migration script to add pdf_templates table
 * Run with: node scripts/run-pdf-templates-migration.js "$DATABASE_URL"
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL not provided');
  console.error('Usage: node scripts/run-pdf-templates-migration.js "$DATABASE_URL"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../database/add-pdf-templates-schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Running migration: add-pdf-templates-schema.sql');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Table "pdf_templates" created with indexes and constraints.');
    
    // Verify the table exists
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'pdf_templates'
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification: pdf_templates table exists');
    } else {
      console.error('❌ Verification failed: pdf_templates table not found');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();


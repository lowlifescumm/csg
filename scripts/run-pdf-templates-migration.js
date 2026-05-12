const logger = require('./lib/logger');
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
  logger.error('❌ Error: DATABASE_URL not provided');
  logger.error('Usage: node scripts/run-pdf-templates-migration.js "$DATABASE_URL"');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('🔗 Connecting to database...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../database/add-pdf-templates-schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    logger.info('📋 Running migration: add-pdf-templates-schema.sql');
    await client.query(sql);
    
    logger.info('✅ Migration completed successfully!');
    logger.info('📊 Table "pdf_templates" created with indexes and constraints.');
    
    // Verify the table exists
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'pdf_templates'
    `);
    
    if (verifyResult.rows.length > 0) {
      logger.info('✅ Verification: pdf_templates table exists');
    } else {
      logger.error('❌ Verification failed: pdf_templates table not found');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();


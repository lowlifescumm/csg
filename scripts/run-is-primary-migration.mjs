#!/usr/bin/env node
/**
 * Run migration to add is_primary columns to birth_charts and natal_charts
 * 
 * Usage:
 *   node scripts/run-is-primary-migration.mjs
 * 
 * Requires DATABASE_URL environment variable
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Set it in Render dashboard or export it locally');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: Adding is_primary columns...\n');
    
    await client.query('BEGIN');
    
    // Add is_primary to birth_charts
    console.log('📝 Adding is_primary column to birth_charts...');
    await client.query(`
      ALTER TABLE birth_charts
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;
    `);
    console.log('   ✅ birth_charts.is_primary added');
    
    // Add is_primary to natal_charts
    console.log('📝 Adding is_primary column to natal_charts...');
    await client.query(`
      ALTER TABLE natal_charts
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;
    `);
    console.log('   ✅ natal_charts.is_primary added');
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_birth_charts_user_primary 
      ON birth_charts(user_id, is_primary) WHERE is_primary = true;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_natal_charts_user_primary 
      ON natal_charts(user_id, is_primary) WHERE is_primary = true;
    `);
    console.log('   ✅ Indexes created');
    
    // Set existing records to primary
    console.log('\n🔄 Updating existing records...');
    const birthResult = await client.query(`
      UPDATE birth_charts SET is_primary = true WHERE is_primary IS NULL;
    `);
    const natalResult = await client.query(`
      UPDATE natal_charts SET is_primary = true WHERE is_primary IS NULL;
    `);
    console.log(`   ✅ Updated ${birthResult.rowCount} birth_charts records`);
    console.log(`   ✅ Updated ${natalResult.rowCount} natal_charts records`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('   The compatibility/top API should now work correctly.\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Run reading_results migration
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node scripts/run-reading-results-migration.js [DATABASE_URL]');
  process.exit(1);
}

// Remove quotes if present
const dbUrl = connectionString.replace(/^["']|["']$/g, '');

// Render database requires SSL
const sslConfig = !dbUrl.includes('localhost') && dbUrl.includes('render.com') 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function main() {
  const client = await pool.connect();

  try {
    logger.info('🔗 Connected to database');
    const migrationPath = path.join(__dirname, '../database/add-reading-results.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          logger.info('✓ Executed:', statement.split('\n')[0].trim());
        } catch (error) {
          if (['42P07', '42710', '42723', '42P16', '42704'].includes(error.code)) {
            logger.info('⊘ Skipped (exists):', error.code, error.message.split('\n')[0]);
          } else {
            throw error;
          }
        }
      }
    }
    
    logger.info('✅ Reading results migration applied');
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();



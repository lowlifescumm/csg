const logger = require('./lib/logger');
#!/usr/bin/env node
/**
 * Apply Content Calendar Schema
 * 
 * Run: node scripts/apply-content-calendar-schema.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  logger.info('🔧 Applying content calendar schema...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read the SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, '../database/add-content-calendar-tracking.sql'),
      'utf8'
    );

    // Execute the SQL
    await pool.query(sqlFile);
    
    logger.info('✅ Schema applied successfully!');
    logger.info('\nTables created:');
    logger.info('  • content_calendar - 24 posts scheduled');
    logger.info('  • content_performance - Tracking metrics');
    logger.info('  • publishing_workflow - 9-step workflow');
    logger.info('  • content_briefs - SEO briefs for high-priority posts');
    
    // Verify the data
    const { rows: calendarCount } = await pool.query('SELECT COUNT(*) FROM content_calendar');
    logger.info(`\n📅 Content calendar entries: ${calendarCount[0].count}`);

  } catch (error) {
    logger.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();

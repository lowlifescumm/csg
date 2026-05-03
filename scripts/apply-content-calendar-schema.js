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
  console.log('🔧 Applying content calendar schema...\n');

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
    
    console.log('✅ Schema applied successfully!');
    console.log('\nTables created:');
    console.log('  • content_calendar - 24 posts scheduled');
    console.log('  • content_performance - Tracking metrics');
    console.log('  • publishing_workflow - 9-step workflow');
    console.log('  • content_briefs - SEO briefs for high-priority posts');
    
    // Verify the data
    const { rows: calendarCount } = await pool.query('SELECT COUNT(*) FROM content_calendar');
    console.log(`\n📅 Content calendar entries: ${calendarCount[0].count}`);

  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();

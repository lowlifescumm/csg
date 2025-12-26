/**
 * Direct migration runner - connects to production database and runs the migration
 * This uses the DATABASE_URL from environment
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the production database URL from the user rules
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://csgdata_prod_user:uLXdNFuffKC71C0AXfEh8qgBU77XtV14@dpg-d3lgj7pr0fns73dvvulg-a.oregon-postgres.render.com/csgdata_prod?sslmode=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '../database/add-share-reward-tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim());
    
    await client.query('BEGIN');
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✓ Executed:', statement.split('\n')[0].trim());
        } catch (error) {
          // Ignore "already exists" errors
          if (['42P07', '42710', '42723', '42P16'].includes(error.code)) {
            console.log('⊘ Skipped (already exists):', error.code);
          } else {
            throw error;
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Share reward tracking migration completed successfully!');
    console.log('   - Added has_rewarded_share column to users table');
    console.log('   - Created index for efficient querying');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Error code:', error.code);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });







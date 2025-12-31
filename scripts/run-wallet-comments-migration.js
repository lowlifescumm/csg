/**
 * Run Wallet Schema Comments Migration
 * Adds table and column comments to wallet_ledger and user_wallet_snapshot
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  console.error('Usage: node scripts/run-wallet-comments-migration.js [DATABASE_URL]');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔗 Connected to database');
    
    // Read the wallet schema file
    const migrationPath = path.join(__dirname, '../database/add-wallet-schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Extract only COMMENT statements
    const commentStatements = sql
      .split('\n')
      .filter(line => line.trim().startsWith('COMMENT ON'))
      .map(line => line.trim());
    
    if (commentStatements.length === 0) {
      console.log('⚠️  No COMMENT statements found in migration file');
      return;
    }
    
    console.log(`📝 Found ${commentStatements.length} COMMENT statements to execute\n`);
    
    // Execute each COMMENT statement
    for (const statement of commentStatements) {
      try {
        await client.query(statement);
        // Extract what we're commenting on for logging
        const match = statement.match(/COMMENT ON (?:TABLE|COLUMN) (\S+)/);
        const target = match ? match[1] : 'unknown';
        console.log(`✓ Comment added to: ${target}`);
      } catch (error) {
        // COMMENT statements don't have "already exists" errors, but log any issues
        console.error(`❌ Failed to add comment: ${error.message}`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
      }
    }
    
    console.log('\n✅ Wallet comments migration completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();


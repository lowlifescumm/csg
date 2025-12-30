/**
 * Run PSTN & Verification Migration (COS-34)
 * Adds phone_number and is_verified to users table
 * Adds phone_number and status to advisor_profile table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  console.error('Usage: node scripts/run-pstn-verification-migration.js [DATABASE_URL]');
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
    console.log('📋 Running PSTN & Verification migration (COS-34)...');
    
    const migrationPath = path.join(__dirname, '../database/add-pstn-verification-schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute SQL - handle DO blocks as single statements
    // Split by semicolon but preserve DO $$ ... END $$ blocks
    let statements = [];
    let currentStatement = '';
    let inDoBlock = false;
    
    const lines = sql.split('\n');
    for (const line of lines) {
      currentStatement += line + '\n';
      
      // Detect start of DO block
      if (line.trim().startsWith('DO $$')) {
        inDoBlock = true;
      }
      
      // Detect end of DO block
      if (inDoBlock && line.trim().endsWith('END $$;')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inDoBlock = false;
        continue;
      }
      
      // Regular statement end (semicolon outside DO block)
      if (!inDoBlock && line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Filter out empty statements and comments-only statements
    statements = statements.filter(s => {
      const trimmed = s.trim();
      return trimmed && !trimmed.startsWith('--') && trimmed.length > 0;
    });
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        // Extract first meaningful line for logging
        const firstLine = statement.split('\n').find(line => 
          line.trim() && 
          !line.trim().startsWith('--') && 
          !line.trim().startsWith('COMMENT')
        );
        if (firstLine) {
          const logLine = firstLine.trim().substring(0, 60);
          console.log('✓ Executed:', logLine + (logLine.length >= 60 ? '...' : ''));
        }
      } catch (error) {
        // Ignore "already exists" errors (column/constraint/index already exists)
        if (['42P07', '42710', '42723', '42P16', '42701'].includes(error.code)) {
          console.log('⊘ Skipped (already exists):', error.code, error.message.substring(0, 50));
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ PSTN & Verification migration completed successfully');
    console.log('📝 Added columns:');
    console.log('   - users.phone_number (VARCHAR(20))');
    console.log('   - users.is_verified (BOOLEAN)');
    console.log('   - advisor_profile.phone_number (VARCHAR(20))');
    console.log('   - advisor_profile.status (VARCHAR(20) with CHECK constraint)');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();


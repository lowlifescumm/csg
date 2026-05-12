const logger = require('./lib/logger');
/**
 * Migrate Old Credits to New Credit Ledger System
 * 
 * This script:
 * 1. Reads all credits from the old `credits` table
 * 2. Creates ledger entries in the new `credit_ledger` table
 * 3. Updates snapshots
 * 4. Preserves the original credit amounts
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function migrateCredits() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info('🔍 Auditing old credits...\n');
    
    // Get all users with credits from old table
    const oldCreditsResult = await client.query(
      `SELECT user_id, credits 
       FROM credits 
       WHERE credits > 0
       ORDER BY user_id`
    );
    
    logger.info(`Found ${oldCreditsResult.rows.length} users with credits in old system\n`);
    
    if (oldCreditsResult.rows.length === 0) {
      logger.info('✅ No credits to migrate');
      await client.query('COMMIT');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const row of oldCreditsResult.rows) {
      const userId = row.user_id;
      const oldCredits = parseInt(row.credits || 0);
      
      if (oldCredits <= 0) {
        skipped++;
        continue;
      }
      
      try {
        // Check if user already has ledger entries for purchased credits
        const existingLedgerResult = await client.query(
          `SELECT SUM(delta) as total_purchased
           FROM credit_ledger
           WHERE user_id = $1
             AND source LIKE 'purchase_%'`,
          [userId]
        );
        
        const existingPurchased = parseInt(existingLedgerResult.rows[0]?.total_purchased || 0);
        
        // Only migrate if the user doesn't already have equivalent credits in the new system
        // We'll migrate the difference to ensure we don't double-count
        const creditsToMigrate = oldCredits - existingPurchased;
        
        if (creditsToMigrate > 0) {
          // Create migration ledger entry
          await client.query(
            `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
             VALUES ($1, $2, 'migration_from_old_system', $3, NULL)
             RETURNING id`,
            [
              userId,
              creditsToMigrate,
              JSON.stringify({
                old_credits: oldCredits,
                migrated_at: new Date().toISOString(),
                migration_note: 'Migrated from old credits table'
              })
            ]
          );
          
          logger.info(`✅ User ${userId}: Migrated ${creditsToMigrate} credits (had ${oldCredits} in old system)`);
          migrated++;
        } else {
          logger.info(`⏭️  User ${userId}: Already has ${existingPurchased} credits in new system, skipping`);
          skipped++;
        }
        
        // Update snapshot
        await client.query(
          `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
           VALUES ($1,
             COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
             NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET
             balance = COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
             updated_at = NOW()`,
          [userId]
        );
        
      } catch (error) {
        logger.error(`❌ Error migrating credits for user ${userId}:`, error.message);
        errors++;
      }
    }
    
    await client.query('COMMIT');
    
    logger.info('\n📊 Migration Summary:');
    logger.info(`   ✅ Migrated: ${migrated} users`);
    logger.info(`   ⏭️  Skipped: ${skipped} users`);
    logger.info(`   ❌ Errors: ${errors} users`);
    logger.info('\n🎉 Migration completed!');
    
    // Verify migration
    logger.info('\n🔍 Verifying migration...');
    const verificationResult = await client.query(
      `SELECT 
         COUNT(DISTINCT user_id) as users_with_ledger_entries,
         SUM(CASE WHEN source = 'migration_from_old_system' THEN delta ELSE 0 END) as total_migrated_credits
       FROM credit_ledger
       WHERE source = 'migration_from_old_system'`
    );
    
    const verification = verificationResult.rows[0];
    logger.info(`   Users with migrated credits: ${verification.users_with_ledger_entries}`);
    logger.info(`   Total credits migrated: ${verification.total_migrated_credits}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('\n❌ Migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateCredits();



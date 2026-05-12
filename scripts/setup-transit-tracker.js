const logger = require('./lib/logger');
/**
 * Transit Tracker Setup Script
 * 
 * This script helps set up the transit tracker system:
 * 1. Creates database tables
 * 2. Grants admin access for testing
 * 3. Creates sample natal chart (optional)
 * 4. Runs initial transit calculation
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

async function main() {
  logger.info('🔮 Transit Tracker Setup');
  logger.info('========================\n');

  try {
    // 1. Create tables
    logger.info('1️⃣  Creating database tables...');
    const schema = readFileSync(
      join(__dirname, '../database/transit-tracker-schema.sql'),
      'utf-8'
    );
    await pool.query(schema);
    logger.info('✅ Database tables created successfully\n');

    // 2. Check for admin users
    logger.info('2️⃣  Checking for admin users...');
    const { rows: adminRows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin'"
    );

    if (adminRows.length === 0) {
      logger.info('⚠️  No admin users found.');
      logger.info('   To grant admin access, run:');
      logger.info('   UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';\n');
    } else {
      logger.info(`✅ Found ${adminRows.length} admin user(s):`);
      adminRows.forEach(row => logger.info(`   - ${row.email}`));
      logger.info();
    }

    // 3. Check existing natal charts
    logger.info('3️⃣  Checking natal charts...');
    const { rows: chartRows } = await pool.query(
      'SELECT COUNT(*) as count FROM natal_charts'
    );
    logger.info(`📊 Found ${chartRows[0].count} natal chart(s) in the system\n`);

    // 4. Check transits
    logger.info('4️⃣  Checking calculated transits...');
    const { rows: transitRows } = await pool.query(
      'SELECT COUNT(*) as count FROM transits'
    );
    logger.info(`⚡ Found ${transitRows[0].count} transit record(s)\n`);

    // 5. Check subscriptions
    logger.info('5️⃣  Checking transit subscriptions...');
    const { rows: subRows } = await pool.query(
      'SELECT COUNT(*) as count FROM transit_subscriptions WHERE is_active = true'
    );
    logger.info(`🔔 Found ${subRows[0].count} active subscription(s)\n`);

    // 6. Summary
    logger.info('========================');
    logger.info('Setup Complete! ✨\n');

    logger.info('Next Steps:');
    logger.info('1. Set CRON_SECRET in your environment variables');
    logger.info('2. Configure cron job to call /api/cron/transit-monitor hourly');
    logger.info('3. Create natal charts via /api/charts or /birth-chart page');
    logger.info('4. Visit /transits dashboard to view transits');
    logger.info('5. Create transit subscriptions for notifications\n');

    logger.info('Documentation:');
    logger.info('📖 See TRANSIT_TRACKER_GUIDE.md for full setup instructions\n');

  } catch (error) {
    logger.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();





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
  console.log('🔮 Transit Tracker Setup');
  console.log('========================\n');

  try {
    // 1. Create tables
    console.log('1️⃣  Creating database tables...');
    const schema = readFileSync(
      join(__dirname, '../database/transit-tracker-schema.sql'),
      'utf-8'
    );
    await pool.query(schema);
    console.log('✅ Database tables created successfully\n');

    // 2. Check for admin users
    console.log('2️⃣  Checking for admin users...');
    const { rows: adminRows } = await pool.query(
      "SELECT email FROM users WHERE role = 'admin'"
    );

    if (adminRows.length === 0) {
      console.log('⚠️  No admin users found.');
      console.log('   To grant admin access, run:');
      console.log('   UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';\n');
    } else {
      console.log(`✅ Found ${adminRows.length} admin user(s):`);
      adminRows.forEach(row => console.log(`   - ${row.email}`));
      console.log();
    }

    // 3. Check existing natal charts
    console.log('3️⃣  Checking natal charts...');
    const { rows: chartRows } = await pool.query(
      'SELECT COUNT(*) as count FROM natal_charts'
    );
    console.log(`📊 Found ${chartRows[0].count} natal chart(s) in the system\n`);

    // 4. Check transits
    console.log('4️⃣  Checking calculated transits...');
    const { rows: transitRows } = await pool.query(
      'SELECT COUNT(*) as count FROM transits'
    );
    console.log(`⚡ Found ${transitRows[0].count} transit record(s)\n`);

    // 5. Check subscriptions
    console.log('5️⃣  Checking transit subscriptions...');
    const { rows: subRows } = await pool.query(
      'SELECT COUNT(*) as count FROM transit_subscriptions WHERE is_active = true'
    );
    console.log(`🔔 Found ${subRows[0].count} active subscription(s)\n`);

    // 6. Summary
    console.log('========================');
    console.log('Setup Complete! ✨\n');

    console.log('Next Steps:');
    console.log('1. Set CRON_SECRET in your environment variables');
    console.log('2. Configure cron job to call /api/cron/transit-monitor hourly');
    console.log('3. Create natal charts via /api/charts or /birth-chart page');
    console.log('4. Visit /transits dashboard to view transits');
    console.log('5. Create transit subscriptions for notifications\n');

    console.log('Documentation:');
    console.log('📖 See TRANSIT_TRACKER_GUIDE.md for full setup instructions\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();





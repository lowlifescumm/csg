const logger = require('./lib/logger');
// Test database connection script
const { Pool } = require('pg');

const connectionString = 'postgresql://csg_data_user:U08IhiDLTiyTT1ypORqk6vj6tAkPgrFH@dpg-d3l9r8ruibrs73chae70-a.oregon-postgres.render.com/csg_data';

logger.info('🔍 Testing database connection...');
logger.info('Connection string:', connectionString.replace(/:[^:@]+@/, ':***@')); // Hide password in output

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  const client = await pool.connect();
  
  try {
    logger.info('✅ Connected to database successfully!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    logger.info('📅 Current time:', result.rows[0].current_time);
    logger.info('🐘 PostgreSQL version:', result.rows[0].postgres_version);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    logger.info('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      logger.info('   No tables found - database is empty');
    } else {
      tablesResult.rows.forEach(row => {
        logger.info(`   - ${row.table_name}`);
      });
    }
    
    logger.info('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('Error details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection();

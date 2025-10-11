// Test database connection script
const { Pool } = require('pg');

const connectionString = 'postgresql://csg_data_user:U08IhiDLTiyTT1ypORqk6vj6tAkPgrFH@dpg-d3l9r8ruibrs73chae70-a/csg_data';

console.log('🔍 Testing database connection...');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':***@')); // Hide password in output

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database successfully!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].postgres_version);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found - database is empty');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    console.log('🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection();

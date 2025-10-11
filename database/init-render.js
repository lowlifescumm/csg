// Database initialization script for Render PostgreSQL
const { Pool } = require('pg');

// Connection string for Render database
const connectionString = 'postgresql://csg_data_user:U08IhiDLTiyTT1ypORqk6vj6tAkPgrFH@dpg-d3l9r8ruibrs73chae70-a/csg_data';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connected to Render database');
    
    // Create tables
    console.log('📋 Creating database tables...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Credits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        credits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Credits table created');

    // Readings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        question TEXT,
        result JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Readings table created');

    // Birth charts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS birth_charts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        birth_date DATE NOT NULL,
        birth_time TIME,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        chart_data JSONB NOT NULL,
        interpretation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Birth charts table created');

    // Subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Subscriptions table created');

    // Horoscopes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS horoscopes (
        id SERIAL PRIMARY KEY,
        sign VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(sign, date)
      )
    `);
    console.log('✅ Horoscopes table created');

    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_birth_charts_user_id ON birth_charts(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id)',
      'CREATE INDEX IF NOT EXISTS idx_horoscopes_sign_date ON horoscopes(sign, date)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('✅ Database indexes created');

    // Insert default admin user
    console.log('👤 Creating default admin user...');
    const adminPasswordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password: admin123
    
    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@cosmicguide.com', adminPasswordHash, 'Admin', 'User', 'admin']);
    
    console.log('✅ Default admin user created (email: admin@cosmicguide.com, password: admin123)');

    // Insert default credits for admin user
    await client.query(`
      INSERT INTO credits (user_id, credits) 
      SELECT id, 1000 FROM users WHERE email = 'admin@cosmicguide.com' 
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Default credits assigned to admin user');

    console.log('🎉 Database initialization completed successfully!');
    console.log('📝 Admin credentials:');
    console.log('   Email: admin@cosmicguide.com');
    console.log('   Password: admin123');
    console.log('   Credits: 1000');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('✅ Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });

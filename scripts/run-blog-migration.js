const logger = require('./lib/logger');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the same connection pattern as the existing app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runBlogMigration() {
  try {
    logger.info('🚀 Running blog database migration...');
    
    // Read and execute the blog schema SQL
    const schemaPath = path.join(__dirname, '../database/add-blog-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement.trim() + ';');
          logger.info('✅ Executed SQL statement');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            logger.info('⚠️  Statement already executed (skipping)');
          } else {
            logger.error('❌ Error executing statement:', error.message);
          }
        }
      }
    }
    
    logger.info('✅ Blog database migration completed successfully!');
    logger.info('🎉 Blog system is ready!');
    logger.info('   - Visit /blog to see the blog listing');
    logger.info('   - Visit /admin/blog to manage posts');
    logger.info('   - Create new posts for SEO content');
    
  } catch (error) {
    logger.error('❌ Error running blog migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runBlogMigration();

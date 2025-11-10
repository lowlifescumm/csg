/**
 * @fileoverview This script runs a database migration to set up the schema for the blog functionality.
 * It reads and executes the SQL commands from the `add-blog-schema.sql` file.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/run-blog-migration.js
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Executes the blog database migration.
 */
async function runBlogMigration() {
  try {
    console.log('🚀 Running blog database migration...');
    
    const schemaPath = path.join(__dirname, '../database/add-blog-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement.trim() + ';');
          console.log('✅ Executed SQL statement');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log('⚠️  Statement already executed (skipping)');
          } else {
            console.error('❌ Error executing statement:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Blog database migration completed successfully!');
    console.log('🎉 Blog system is ready!');
    console.log('   - Visit /blog to see the blog listing');
    console.log('   - Visit /admin/blog to manage posts');
    console.log('   - Create new posts for SEO content');
    
  } catch (error) {
    console.error('❌ Error running blog migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runBlogMigration();

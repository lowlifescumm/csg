const logger = require('./lib/logger');
#!/usr/bin/env node

import { Pool } from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function fixReadingTable() {
  try {
    logger.info("Connecting to database...");
    
    // Test connection
    const { rows } = await pool.query("SELECT NOW()");
    logger.info("✅ Database connection successful:", rows[0].now);
    
    // Check current table structure
    logger.info("\n📋 Current readings table structure:");
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'readings' 
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      logger.info(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if reading_type column exists
    const hasReadingType = columns.some(col => col.column_name === 'reading_type');
    
    if (!hasReadingType) {
      logger.info("\n🔧 Adding missing columns to readings table...");
      
      // Read and execute the migration
      const migrationSQL = readFileSync(join(__dirname, '../database/add-reading-fields.sql'), 'utf8');
      await pool.query(migrationSQL);
      
      logger.info("✅ Migration completed successfully!");
      
      // Verify the columns were added
      logger.info("\n📋 Updated readings table structure:");
      const { rows: newColumns } = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'readings' 
        ORDER BY ordinal_position
      `);
      
      newColumns.forEach(col => {
        logger.info(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      logger.info("✅ reading_type column already exists!");
    }
    
  } catch (error) {
    logger.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixReadingTable();


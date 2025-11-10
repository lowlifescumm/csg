#!/usr/bin/env node
/**
 * @fileoverview This script checks the 'readings' table for missing columns and applies a database migration to add them.
 * It is designed to update the table to a newer schema that includes additional fields for readings.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/fix-reading-table.js
 */
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

/**
 * Checks the 'readings' table for the 'reading_type' column and, if missing,
 * applies a migration to add it and other related columns.
 */
async function fixReadingTable() {
  try {
    console.log("Connecting to database...");
    
    const { rows } = await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful:", rows[0].now);
    
    console.log("\n📋 Current readings table structure:");
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'readings' 
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    const hasReadingType = columns.some(col => col.column_name === 'reading_type');
    
    if (!hasReadingType) {
      console.log("\n🔧 Adding missing columns to readings table...");
      
      const migrationSQL = readFileSync(join(__dirname, '../database/add-reading-fields.sql'), 'utf8');
      await pool.query(migrationSQL);
      
      console.log("✅ Migration completed successfully!");
      
      console.log("\n📋 Updated readings table structure:");
      const { rows: newColumns } = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'readings' 
        ORDER BY ordinal_position
      `);
      
      newColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      console.log("✅ reading_type column already exists!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixReadingTable();

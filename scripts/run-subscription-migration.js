import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function runMigration() {
    let pool;
    try {
        // Import pool after env vars are loaded
        const dbModule = await import('../lib/db.js');
        pool = dbModule.pool;

        console.log('Starting migration...');

        const sqlPath = path.join(__dirname, '../database/add-subscription-enhancements.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL:');
        console.log(sql);

        await pool.query(sql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

runMigration();

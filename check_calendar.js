import { pool } from './lib/db.js';

async function checkCalendar() {
  try {
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('All tables:', allTables.rows.map(r => r.table_name).join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCalendar();

import { pool } from '../../../lib/db.js';

export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    }, { status: 503 });
  }
}

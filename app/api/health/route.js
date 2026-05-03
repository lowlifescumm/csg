import { pool } from '../../../lib/db.js';

export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Groq API key is configured
    const groqConfigured = !!process.env.GROQ_API_KEY;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      groq: groqConfigured ? 'configured' : 'missing',
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

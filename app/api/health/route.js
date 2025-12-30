import { pool } from '../../../lib/db.js';

export async function GET() {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Get pool statistics for monitoring
    const poolStats = {
      totalCount: pool.totalCount || 0,
      idleCount: pool.idleCount || 0,
      waitingCount: pool.waitingCount || 0,
      max: pool.options?.max || 0,
      min: pool.options?.min || 0,
    };
    
    // Calculate usage percentage
    const usagePercent = poolStats.max > 0 
      ? Math.round((poolStats.totalCount / poolStats.max) * 100)
      : 0;
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      pool: {
        ...poolStats,
        usage_percent: usagePercent,
        available: poolStats.max - poolStats.totalCount,
      }
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

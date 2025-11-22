#!/usr/bin/env node

/**
 * Job Worker
 * Processes reading generation jobs from the queue
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

// This will be run as a separate process or cron job
// For now, we'll create a simple worker that can be called from API routes

const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  process.exit(1);
}

const dbUrl = connectionString.replace(/^["']|["']$/g, '');
const sslConfig = !dbUrl.includes('localhost') && dbUrl.includes('render.com') 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function processNextJob(queue = 'default') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get next queued job
    const { rows } = await client.query(
      `SELECT * FROM reading_jobs
       WHERE status = 'queued' 
         AND queue = $1
         AND (retry_count < max_retries OR max_retries IS NULL)
         AND (started_at IS NULL OR started_at < NOW() - INTERVAL '5 minutes')
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      [queue]
    );
    
    if (rows.length === 0) {
      await client.query('COMMIT');
      return null;
    }
    
    const job = rows[0];
    
    // Update status to running
    await client.query(
      `UPDATE reading_jobs
       SET status = 'running', started_at = NOW(), retry_count = retry_count + 1
       WHERE id = $1`,
      [job.id]
    );
    
    await client.query('COMMIT');
    
    console.log(`[JobWorker] Processing job ${job.id} (${job.reading_type})`);
    
    // Process job (this would call the actual job processor)
    // For now, just log
    return job;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[JobWorker] Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Simple polling worker
async function startWorker(queue = 'default', interval = 5000) {
  console.log(`[JobWorker] Starting worker for queue: ${queue}`);
  
  setInterval(async () => {
    try {
      const job = await processNextJob(queue);
      if (job) {
        console.log(`[JobWorker] Processed job ${job.id}`);
      }
    } catch (error) {
      console.error('[JobWorker] Error processing job:', error);
    }
  }, interval);
}

// Run if called directly
if (require.main === module) {
  const queue = process.argv[2] || 'default';
  const interval = parseInt(process.argv[3]) || 5000;
  
  startWorker(queue, interval);
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[JobWorker] Shutting down...');
    pool.end();
    process.exit(0);
  });
}

module.exports = { processNextJob, startWorker };


import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
/**
 * Job Queue System
 * PostgreSQL-based job queue with retry logic and failure handling
 */

import { pool } from './db.js';
import { markJobFailed, markJobQueued, markJobCompleted } from './reading-jobs.js';
import { refundCredits } from './credit-engine.js';

const JOB_STATES = {
  PENDING_VALIDATION: 'pending_validation',
  PENDING_CHARGE: 'pending_charge',
  FAILED_CHARGE: 'failed_charge',
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  COMPLETED: 'completed',
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 5000; // 5 seconds

/**
 * Get next job from queue
 * Uses SELECT FOR UPDATE SKIP LOCKED to ensure only one worker processes a job
 */
export async function getNextJob(queue = 'default', limit = 1) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get jobs that are queued and lock them
    const { rows } = await client.query(
      `SELECT * FROM reading_jobs
       WHERE status = $1 
         AND queue = $2
         AND (retry_count < max_retries OR max_retries IS NULL)
         AND (started_at IS NULL OR started_at < NOW() - INTERVAL '5 minutes')
       ORDER BY created_at ASC
       LIMIT $3
       FOR UPDATE SKIP LOCKED`,
      [JOB_STATES.QUEUED, queue, limit]
    );
    
    // Update status to running and set started_at
    if (rows.length > 0) {
      const jobIds = rows.map(j => j.id);
      await client.query(
        `UPDATE reading_jobs
         SET status = $1, started_at = NOW(), retry_count = retry_count + 1
         WHERE id = ANY($2)`,
        [JOB_STATES.RUNNING, jobIds]
      );
    }
    
    await client.query('COMMIT');
    return rows;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[JobQueue] Error getting next job:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark job as succeeded
 */
export async function markJobSucceeded(jobId, readingResultId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { rows } = await client.query(
      `UPDATE reading_jobs
       SET status = $1,
           reading_id = $2,
           completed_at = NOW(),
           progress_percent = 100,
           progress_message = 'Completed successfully'
       WHERE id = $3
       RETURNING *`,
      [JOB_STATES.SUCCEEDED, readingResultId, jobId]
    );
    
    await client.query('COMMIT');
    return rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[JobQueue] Error marking job succeeded:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Mark job as failed with automatic refund
 */
export async function markJobFailedWithRefund(jobId, reason, errorDetails = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get job details
    const { rows: jobRows } = await client.query(
      'SELECT * FROM reading_jobs WHERE id = $1',
      [jobId]
    );
    
    if (!jobRows.length) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Job not found' };
    }
    
    const job = jobRows[0];
    
    // Check if we should retry
    const shouldRetry = job.retry_count < (job.max_retries || DEFAULT_MAX_RETRIES);
    
    if (shouldRetry) {
      // Retry - reset status to queued with delay
      await client.query(
        `UPDATE reading_jobs
         SET status = $1,
             last_error = $2,
             started_at = NOW() + INTERVAL '${DEFAULT_RETRY_DELAY} milliseconds',
             progress_message = $3
         WHERE id = $4`,
        [
          JOB_STATES.QUEUED,
          reason || 'Job failed, will retry',
          `Retry ${job.retry_count + 1}/${job.max_retries || DEFAULT_MAX_RETRIES}`,
          jobId
        ]
      );
      
      await client.query('COMMIT');
      return { success: true, retry: true, retryCount: job.retry_count + 1 };
    }
    
    // Max retries reached - refund and mark as failed
    let refundResult = null;
    if (job.ledger_entry_id && !job.refund_ledger_id && job.charge_amount) {
      refundResult = await refundCredits(
        job.user_id,
        job.charge_amount,
        `Job failed: ${reason}`,
        {
          reading_job_id: job.id,
          ledger_entry_id: job.ledger_entry_id,
        }
      );
      
      if (!refundResult.success) {
        logger.error('[JobQueue] Failed to refund credits for job', jobId, refundResult.error);
      }
    }
    
    // Mark as permanently failed
    await client.query(
      `UPDATE reading_jobs
       SET status = $1,
           refund_ledger_id = COALESCE(refund_ledger_id, $2),
           last_error = $3,
           completed_at = NOW(),
           progress_percent = 0,
           progress_message = $4
       WHERE id = $5
       RETURNING *`,
      [
        JOB_STATES.FAILED,
        refundResult?.ledger_id || null,
        reason || 'Job failed after max retries',
        'Failed permanently - credits refunded',
        jobId
      ]
    );
    
    await client.query('COMMIT');
    return { success: true, refunded: !!refundResult?.success, refundResult };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[JobQueue] Error marking job failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update job progress
 */
export async function updateJobProgress(jobId, percent, message) {
  const { rows } = await pool.query(
    `UPDATE reading_jobs
     SET progress_percent = $1,
         progress_message = $2
     WHERE id = $3
     RETURNING *`,
    [percent, message, jobId]
  );
  return rows[0] || null;
}

/**
 * Process a single job
 * This should be called by the worker process
 */
export async function processJob(job, jobProcessor) {
  const { id: jobId, user_id: userId, reading_type: readingType, options } = job;
  
  try {
    logger.info(`[JobQueue] Processing job ${jobId} (${readingType})`);
    
    // Update progress
    await updateJobProgress(jobId, 10, 'Starting processing...');
    
    // Call the job processor function
    const result = await jobProcessor(job, async (progress, message) => {
      await updateJobProgress(jobId, progress, message);
    });
    
    // Store results in reading_results table
    // Include HTML in content_json for download functionality
    const contentToStore = {
      ...(result.content || {}),
      html: result.html || null,
      sections: result.sections || null,
    };
    
    const { rows: resultRows } = await pool.query(
      `INSERT INTO reading_results (
        user_id, reading_job_id, reading_type, content_json, status, progress_percent, completed_at
      ) VALUES ($1, $2, $3, $4, $5, 100, NOW())
      RETURNING id`,
      [userId, jobId, readingType, JSON.stringify(contentToStore), 'completed']
    );
    
    const readingResultId = resultRows[0].id;
    
    // Link PDF if generated
    if (result.pdfUrl) {
      await pool.query(
        'UPDATE reading_results SET pdf_url = $1 WHERE id = $2',
        [result.pdfUrl, readingResultId]
      );
    }
    
    // Mark job as succeeded (reading_id points to reading_results.id)
    await markJobSucceeded(jobId, readingResultId);
    
    logger.info(`[JobQueue] Job ${jobId} completed successfully`);
    
    return { success: true, readingResultId, result };
  } catch (error) {
    logger.error(`[JobQueue] Job ${jobId} failed:`, error);
    
    // Mark as failed (with automatic refund if max retries reached)
    await markJobFailedWithRefund(jobId, error.message, error);
    
    throw error;
  }
}

/**
 * Worker function - polls for jobs and processes them
 */
export async function startWorker(queue = 'default', jobProcessor, options = {}) {
  const { 
    pollInterval = 5000, // 5 seconds
    batchSize = 1,
    concurrency = 1 
  } = options;
  
  logger.info(`[JobQueue] Starting worker for queue: ${queue}`);
  
  let isRunning = true;
  const processing = new Set();
  
  const processBatch = async () => {
    if (!isRunning) return;
    
    try {
      // Get next batch of jobs
      const jobs = await getNextJob(queue, batchSize);
      
      if (jobs.length === 0) {
        // No jobs available, wait and poll again
        setTimeout(processBatch, pollInterval);
        return;
      }
      
      // Process jobs (respect concurrency limit)
      const availableSlots = concurrency - processing.size;
      const jobsToProcess = jobs.slice(0, availableSlots);
      
      for (const job of jobsToProcess) {
        processing.add(job.id);
        
        // Process job asynchronously
        processJob(job, jobProcessor)
          .then(() => {
            logger.info(`[JobQueue] Job ${job.id} processed successfully`);
          })
          .catch((error) => {
            logger.error(`[JobQueue] Job ${job.id} processing error:`, error);
          })
          .finally(() => {
            processing.delete(job.id);
          });
      }
      
      // Continue polling
      setTimeout(processBatch, pollInterval);
    } catch (error) {
      logger.error('[JobQueue] Worker error:', error);
      setTimeout(processBatch, pollInterval);
    }
  };
  
  // Start processing
  processBatch();
  
  // Return stop function
  return () => {
    isRunning = false;
    logger.info(`[JobQueue] Worker stopped for queue: ${queue}`);
  };
}

export { JOB_STATES };


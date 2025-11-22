import { pool } from './db.js';
import { refundCredits } from './credit-engine.js';

export function serializeJob(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    reading_type: row.reading_type,
    status: row.status,
    queue: row.queue,
    options: row.options,
    idempotency_key: row.idempotency_key,
    dependency_version: row.dependency_version,
    missing_recommended: row.missing_recommended,
    auto_created: row.auto_created,
    ledger_entry_id: row.ledger_entry_id,
    refund_ledger_id: row.refund_ledger_id,
    reading_id: row.reading_id,
    charge_amount: row.charge_amount,
    last_error: row.last_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function findJobByIdempotency(userId, idempotencyKey) {
  if (!idempotencyKey) return null;
  const { rows } = await pool.query(
    `SELECT * FROM reading_jobs WHERE idempotency_key = $1 AND user_id = $2 LIMIT 1`,
    [idempotencyKey, userId],
  );
  return rows[0] || null;
}

export async function getJobById(jobId) {
  const { rows } = await pool.query(`SELECT * FROM reading_jobs WHERE id = $1`, [jobId]);
  return rows[0] || null;
}

export async function createJobRecord({
  userId,
  readingType,
  queue = 'default',
  options = {},
  idempotencyKey,
  dependencyVersion,
  missingRecommended = [],
  autoCreated = [],
  maxRetries = 3,
}) {
  const { rows } = await pool.query(
    `INSERT INTO reading_jobs (
      user_id, reading_type, queue, status, options, idempotency_key,
      dependency_version, missing_recommended, auto_created, max_retries
    ) VALUES ($1, $2, $3, 'pending_charge', $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      userId,
      readingType,
      queue,
      JSON.stringify(options || {}),
      idempotencyKey,
      dependencyVersion || null,
      JSON.stringify(missingRecommended || []),
      JSON.stringify(autoCreated || []),
      maxRetries,
    ],
  );

  return rows[0];
}

export async function markJobChargeFailed(jobId, errorMessage) {
  const { rows } = await pool.query(
    `UPDATE reading_jobs
     SET status = 'failed_charge',
         last_error = $2
     WHERE id = $1
     RETURNING *`,
    [jobId, errorMessage || 'credit_charge_failed'],
  );
  return rows[0] || null;
}

export async function markJobQueued(jobId, ledgerEntryId, cost) {
  const { rows } = await pool.query(
    `UPDATE reading_jobs
     SET status = 'queued',
         ledger_entry_id = $2,
         charge_amount = $3
     WHERE id = $1
     RETURNING *`,
    [jobId, ledgerEntryId, cost],
  );
  return rows[0] || null;
}

export async function enqueueReadingJob(job) {
  if (!job) return null;
  console.log('[ReadingJobs] Enqueued job', job.id, 'for', job.reading_type);
  return job;
}

export async function markJobFailed(jobId, reason, { refund = true } = {}) {
  const job = await getJobById(jobId);
  if (!job) return null;

  if (job.status === 'failed') return job;

  let refundResult = null;
  if (refund && job.ledger_entry_id && !job.refund_ledger_id && job.charge_amount) {
    refundResult = await refundCredits(job.user_id, job.charge_amount, reason || 'reading_failed', {
      reading_job_id: job.id,
      ledger_entry_id: job.ledger_entry_id,
    });

    if (!refundResult.success) {
      console.error('[ReadingJobs] Failed to refund credits for job', jobId, refundResult.error);
    }
  }

  const { rows } = await pool.query(
    `UPDATE reading_jobs
     SET status = 'failed',
         refund_ledger_id = COALESCE(refund_ledger_id, $2),
         last_error = $3
     WHERE id = $1
     RETURNING *`,
    [jobId, refundResult?.ledger_id || null, reason || 'reading_failed'],
  );
  return rows[0] || null;
}

export async function markJobCompleted(jobId, readingId) {
  const { rows } = await pool.query(
    `UPDATE reading_jobs
     SET status = 'completed',
         reading_id = $2
     WHERE id = $1
     RETURNING *`,
    [jobId, readingId],
  );
  return rows[0] || null;
}

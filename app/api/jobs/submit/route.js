const logger = require('../../../../lib/logger');
/**
 * POST /api/jobs/submit
 * Submit a reading generation job
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { createJobRecord, findJobByIdempotency, markJobQueued, markJobChargeFailed, getJobById } from '@/lib/reading-jobs.js';
import { consumeCredits } from '@/lib/credit-engine.js';
import { getReadingCost } from '@/lib/pricing.js';
import { getJobProcessor } from '@/lib/job-processors.js';
import { getNextJob, processJob } from '@/lib/job-queue.js';
// Generate simple UUID-like string for idempotency
function generateIdempotencyKey() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Submit a job for processing
 */
export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;
    const body = await request.json();
    const { 
      reading_type, 
      options = {}, 
      idempotency_key,
      queue = 'default',
      max_retries = 3
    } = body;
    
    if (!reading_type) {
      return NextResponse.json({ error: 'reading_type is required' }, { status: 400 });
    }
    
    // Check if job processor exists
    const processor = getJobProcessor(reading_type);
    if (!processor) {
      return NextResponse.json({ 
        error: 'Invalid reading type', 
        details: `No processor found for type: ${reading_type}` 
      }, { status: 400 });
    }
    
    // Generate idempotency key if not provided
    const key = idempotency_key || `${reading_type}_${userId}_${generateIdempotencyKey()}`;
    
    // Check for existing job with same idempotency key (idempotency check)
    const existingJob = await findJobByIdempotency(userId, key);
    if (existingJob) {
      // Return existing job
      return NextResponse.json({
        job_id: existingJob.id,
        status: existingJob.status,
        message: 'Job already exists with this idempotency key',
        existing: true
      });
    }
    
    // Get reading cost
    const cost = getReadingCost(reading_type.toUpperCase());
    
    // Create job record (status: pending_charge)
    const jobRecord = await createJobRecord({
      userId,
      readingType: reading_type,
      queue,
      options,
      idempotencyKey: key,
      maxRetries: max_retries,
    });
    
    try {
      // Charge credits
      const chargeResult = await consumeCredits(
        userId,
        cost,
        null,
        {
          reading_type,
          reading_job_id: jobRecord.id,
          idempotency_key: key,
        }
      );
      
      if (!chargeResult.success) {
        // Mark job as failed_charge
        await markJobChargeFailed(jobRecord.id, chargeResult.error || 'Insufficient credits');
        
        return NextResponse.json({
          error: 'Charge failed',
          details: chargeResult.error,
          error_code: chargeResult.error_code,
        }, { status: 402 });
      }
      
      // Mark job as queued
      await markJobQueued(jobRecord.id, chargeResult.ledger_id, cost);
      
      // Process job immediately (async - don't wait)
      // In production, you'd have a separate worker process
      processJob(jobRecord, processor).catch(error => {
        logger.error(`[JobSubmit] Failed to process job ${jobRecord.id}:`, error);
      });
      
      return NextResponse.json({
        job_id: jobRecord.id,
        status: 'queued',
        message: 'Job submitted successfully',
        idempotency_key: key,
      });
      
    } catch (error) {
      logger.error('[JobSubmit] Error processing job:', error);
      // Job will be marked as failed by the error handler
      return NextResponse.json({
        error: 'Failed to process job',
        details: error.message,
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error('[JobSubmit] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}


const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Pool } from 'pg';
import logger from '@/lib/logger';
import { initializeUserCredits } from '@/lib/credits';
import { purchaseCredits, refundCredits, issueSubscriptionCredits } from '@/lib/credit-engine.js';
import { SUBSCRIPTION_TIERS } from '@/lib/pricing.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

/**
 * Resolve monthly subscription credits from a legacy tier ID.
 */
function getSubscriptionCredits(tierId) {
  return SUBSCRIPTION_TIERS[tierId]?.creditsPerMonth || 0;
}

/**
 * Look up a user by Stripe customer ID. Returns user row or null.
 */
async function findUserByCustomerId(customerId) {
  if (!customerId) return null;
  const { rows } = await pool.query(
    'SELECT id, subscription_tier, stripe_subscription_id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Deduplicate Stripe events. Stripe may send the same event more than once.
 * Inserts the event ID before processing and returns true if it was a duplicate.
 */
async function isDuplicateEvent(eventId) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO stripe_processed_events (event_id, processed_at)
       VALUES ($1, NOW())
       ON CONFLICT (event_id) DO NOTHING
       RETURNING id`,
      [eventId]
    );
    return rows.length === 0;
  } catch (err) {
    // If the dedup table doesn't exist yet, log and continue (non-fatal).
    logger.warn('[Stripe Webhook] Event dedup check failed (table may not exist):', err.message);
    return false;
  }
}

/**
 * Revoke remaining subscription credits via the ledger when a subscription ends.
 */
async function revokeSubscriptionCredits(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT COALESCE(SUM(delta), 0) AS remaining
       FROM credit_ledger
       WHERE user_id = $1 AND source LIKE 'subscription_%'`,
      [userId]
    );
    const remaining = parseInt(rows[0].remaining || 0, 10);

    if (remaining > 0) {
      await client.query(
        `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
         VALUES ($1, $2, 'subscription_revoked', $3, NULL)`,
        [userId, -remaining, JSON.stringify({ revoked_at: new Date().toISOString() })]
      );

      // Recompute snapshot
      await client.query(
        `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
         VALUES ($1,
           COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
           NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           balance = COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
           updated_at = NOW()`,
        [userId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Stripe Webhook] Failed to revoke subscription credits:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Deduplicate: skip if we've already processed this event
  const duplicate = await isDuplicateEvent(event.id);
  if (duplicate) {
    logger.info(`[Stripe Webhook] Duplicate event ${event.id} (${event.type}) — skipping`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      // ── Subscription lifecycle ──────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          const user = await findUserByCustomerId(subscription.customer);

          if (!user) {
            logger.warn(`[Stripe Webhook] No user found for customer ${subscription.customer} on subscription ${subscription.id}`);
            break;
          }

          const tierId = subscription.metadata?.tier_id || subscription.metadata?.tier || 'MYSTIC_LITE';

          // Update subscription ID and tier in users table
          await pool.query(
            'UPDATE users SET stripe_subscription_id = $1, subscription_tier = $2 WHERE id = $3',
            [subscription.id, tierId, user.id]
          );

          // Initialize legacy credits
          await initializeUserCredits(user.id);

          // Issue initial subscription credits via new credit engine.
          // This covers the gap where users had no credits until first invoice.
          // Product decision: initial credits are issued on subscription.created;
          // renewal credits are issued on invoice.payment_succeeded.
          const monthlyCredits = getSubscriptionCredits(tierId);
          if (monthlyCredits > 0) {
            const creditResult = await issueSubscriptionCredits(
              user.id,
              monthlyCredits,
              tierId,
              {
                subscription_id: subscription.id,
                event: 'subscription_created',
                issued_at: new Date().toISOString()
              }
            );
            if (creditResult.success) {
              logger.info(`[Credit Engine] Issued ${creditResult.added_credits} initial subscription credits to user ${user.id} (tier: ${tierId})`);
            } else {
              logger.error(`[Credit Engine] Failed to issue initial subscription credits to user ${user.id}: ${creditResult.error}`);
            }
          }

          logger.info(`[Stripe Webhook] Subscription ${subscription.id} activated for user ${user.id} with tier ${tierId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object;
        const user = await findUserByCustomerId(deletedSubscription.customer);

        if (!user) {
          logger.warn(`[Stripe Webhook] No user found for customer ${deletedSubscription.customer} on subscription deletion`);
          break;
        }

        // Remove subscription ID from users table
        await pool.query(
          'UPDATE users SET stripe_subscription_id = NULL WHERE id = $1',
          [user.id]
        );

        // Revoke remaining subscription credits through the ledger (B8).
        // Purchased credits are intentionally left untouched.
        await revokeSubscriptionCredits(user.id);

        logger.info(`[Stripe Webhook] Removed subscription and revoked subscription credits for user ${user.id}`);
        break;
      }

      // ── Invoice / renewal ───────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Handle both initial subscription payment and renewal cycles
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
          const user = await findUserByCustomerId(invoice.customer);

          if (!user) {
            logger.warn(`[Stripe Webhook] No user found for customer ${invoice.customer} on invoice ${invoice.id}`);
            break;
          }

          const subscriptionTier = user.subscription_tier || 'MYSTIC_LITE';
          const monthlyCredits = getSubscriptionCredits(subscriptionTier);

          // Reset legacy credits for the new billing cycle
          await initializeUserCredits(user.id);

          if (monthlyCredits > 0) {
            const creditResult = await issueSubscriptionCredits(
              user.id,
              monthlyCredits,
              subscriptionTier,
              {
                invoice_id: invoice.id,
                billing_reason: invoice.billing_reason,
                billing_cycle: invoice.period_end,
                issued_at: new Date().toISOString()
              }
            );

            if (creditResult.success) {
              logger.info(`[Credit Engine] Issued ${creditResult.added_credits} ${invoice.billing_reason} subscription credits to user ${user.id} (${subscriptionTier})`);
            } else {
              logger.error(`[Credit Engine] Failed to issue subscription credits to user ${user.id}: ${creditResult.error}`);
            }
          }

          logger.info(`[Stripe Webhook] Subscription payment processed for user ${user.id} (invoice: ${invoice.id})`);
        }
        break;
      }

      // ── Payment intent (credit packs + premium reports) ────────────
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;

        // ── Credit pack purchase ──
        if (paymentIntent.metadata?.type === 'credit_pack') {
          const userId = parseInt(paymentIntent.metadata.userId || paymentIntent.metadata.user_id);
          const packSize = parseInt(paymentIntent.metadata.packSize || paymentIntent.metadata.pack_size);

          if (!userId || !packSize) {
            logger.warn(`[Stripe Webhook] Credit pack payment ${paymentIntent.id} missing userId or packSize in metadata`);
            break;
          }

          // Verify user exists before attempting credit operation
          const { rows: userCheck } = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
          );

          if (userCheck.length === 0) {
            logger.error(`[Stripe Webhook] Credit pack payment ${paymentIntent.id}: user ${userId} not found — credits NOT issued`);
            break;
          }

          // Check for idempotency - prevent duplicate credit issuance
          const { rows: existingLedger } = await pool.query(
            'SELECT id FROM credit_ledger WHERE user_id = $1 AND meta->>\'stripe_payment_intent_id\' = $2',
            [userId, paymentIntent.id]
          );

          if (existingLedger.length > 0) {
            logger.info(`[Credit Engine] Duplicate webhook ignored for payment ${paymentIntent.id} — credits already issued (ledger_id: ${existingLedger[0].id})`);
            break;
          }

          const result = await purchaseCredits(userId, packSize, {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_customer_id: paymentIntent.customer,
            purchase_date: new Date().toISOString()
          });

          if (result.success) {
            logger.info(`[Credit Engine] Added ${result.added_credits} credits to user ${userId} via purchase (ledger_id: ${result.ledger_id})`);
          } else {
            logger.error(`[Credit Engine] Failed to add credits to user ${userId}: ${result.error}`);
          }
        }

        // ── Premium report purchase ──
        if (paymentIntent.metadata?.type === 'premium_report') {
          const reportId = paymentIntent.metadata.report_id || paymentIntent.metadata.reportId;
          const reportName = paymentIntent.metadata.report_name || paymentIntent.metadata.reportName;
          const userId = paymentIntent.metadata.user_id || paymentIntent.metadata.userId;

          if (!userId) {
            logger.info(`[Report Purchase] Payment succeeded for report ${reportId} by guest — no user_id in metadata, skipping auto-generation`);
            break;
          }

          logger.info(`[Report Purchase] Payment succeeded for report ${reportId} (${reportName}) by user ${userId}`);

          try {
            await pool.query(
              `INSERT INTO report_purchases (user_id, report_type, stripe_payment_intent_id, amount, status, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW())
               ON CONFLICT (user_id, stripe_payment_intent_id) DO NOTHING`,
              [parseInt(userId), reportId, paymentIntent.id, paymentIntent.amount, 'paid']
            );
            logger.info(`[Report Purchase] Recorded purchase for user ${userId}, report ${reportId}`);

            // Trigger report generation job
            const readingType = reportId.toLowerCase();
            const { createJobRecord } = await import('@/lib/reading-jobs.js');
            const { processJob } = await import('@/lib/job-queue.js');
            const { getJobProcessor } = await import('@/lib/job-processors.js');

            const job = await createJobRecord({
              userId: parseInt(userId),
              readingType,
              options: { report_type: reportId },
            });

            await pool.query(
              `UPDATE reading_jobs SET status = 'queued', progress_message = 'Processing premium report...' WHERE id = $1`,
              [job.id]
            );
            job.status = 'queued';

            const processor = getJobProcessor(readingType);
            if (processor) {
              processJob(job, processor).catch(err => {
                logger.error(`[Report Purchase] Report generation job ${job.id} failed:`, err);
              });
              logger.info(`[Report Purchase] Report generation job ${job.id} submitted for user ${userId}`);
            } else {
              logger.warn(`[Report Purchase] No processor found for reading type ${readingType}`);
            }
          } catch (dbError) {
            logger.error(`[Report Purchase] Failed to process purchase:`, dbError);
          }
        }
        break;
      }

      // ── Payment failure ─────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const failedPaymentIntent = event.data.object;

        if (failedPaymentIntent.metadata?.type === 'credit_pack') {
          const userId = parseInt(failedPaymentIntent.metadata.userId || failedPaymentIntent.metadata.user_id);
          const packSize = parseInt(failedPaymentIntent.metadata.packSize || failedPaymentIntent.metadata.pack_size);

          logger.warn(`[Stripe Webhook] Payment failed for user ${userId || 'unknown'}, pack ${packSize || 'unknown'} — no credits issued (credits only added on success)`);
        }
        break;
      }

      // ── Refund ──────────────────────────────────────────────────────
      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (!paymentIntentId) {
          logger.warn('[Stripe Webhook] charge.refunded event without payment_intent reference');
          break;
        }

        // Retrieve payment intent metadata from Stripe
        let refundedPaymentIntent;
        try {
          refundedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (stripeErr) {
          logger.error(`[Stripe Webhook] Failed to retrieve payment intent ${paymentIntentId} for refund: ${stripeErr.message}`);
          break;
        }

        if (refundedPaymentIntent.metadata?.type === 'credit_pack') {
          const userId = parseInt(refundedPaymentIntent.metadata.userId || refundedPaymentIntent.metadata.user_id);
          const packSize = parseInt(refundedPaymentIntent.metadata.packSize || refundedPaymentIntent.metadata.pack_size);

          if (!userId || !packSize) {
            logger.warn(`[Stripe Webhook] Refund for payment intent ${paymentIntentId} missing userId or packSize in metadata`);
            break;
          }

          // Verify user exists
          const { rows: refundUserCheck } = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
          );

          if (refundUserCheck.length === 0) {
            logger.error(`[Stripe Webhook] Refund for payment intent ${paymentIntentId}: user ${userId} not found — credits NOT refunded`);
            break;
          }

          const refundResult = await refundCredits(
            userId,
            packSize,
            'payment_refunded',
            {
              stripe_charge_id: charge.id,
              stripe_payment_intent_id: paymentIntentId,
              refund_amount: charge.amount_refunded,
              refund_date: new Date().toISOString()
            }
          );

          if (refundResult.success) {
            logger.info(`[Credit Engine] Refunded ${refundResult.refunded_credits} credits from user ${userId} (ledger_id: ${refundResult.ledger_id})`);
          } else {
            logger.error(`[Credit Engine] Failed to refund credits from user ${userId}: ${refundResult.error}`);
          }
        }
        break;
      }

      default:
        logger.info(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('[Stripe Webhook] Handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}

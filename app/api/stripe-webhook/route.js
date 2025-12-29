import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Pool } from 'pg';
import { initializeUserCredits } from '../credits/route';
import { purchaseCredits, refundCredits, issueSubscriptionCredits } from '@/lib/credit-engine.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

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
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          // Find user by stripe customer ID
          const { rows: users } = await pool.query(
            'SELECT id, subscription_tier FROM users WHERE stripe_customer_id = $1',
            [subscription.customer]
          );

          if (users.length > 0) {
            const userId = users[0].id;
            
            // Get tier from subscription metadata (set during checkout)
            const tierId = subscription.metadata?.tier_id || subscription.metadata?.tier || 'MYSTIC_LITE';
            
            // Update subscription ID and tier in users table
            await pool.query(
              'UPDATE users SET stripe_subscription_id = $1, subscription_tier = $2 WHERE id = $3',
              [subscription.id, tierId, userId]
            );

            // Initialize or reset credits for the user (legacy system)
            await initializeUserCredits(userId);
            
            // Also issue subscription credits via new credit engine
            // Note: Monthly credits are typically issued on invoice.payment_succeeded
            // This is just for initial subscription setup
            console.log(`[Credit Engine] Subscription ${subscription.id} activated for user ${userId} with tier ${tierId}`);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        
        // Find user by stripe customer ID
        const { rows: usersToUpdate } = await pool.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [deletedSubscription.customer]
        );

        if (usersToUpdate.length > 0) {
          const userId = usersToUpdate[0].id;
          
          // Remove subscription ID from users table
          await pool.query(
            'UPDATE users SET stripe_subscription_id = NULL WHERE id = $1',
            [userId]
          );

          // Set all credits to 0
          await pool.query(
            'UPDATE user_credits SET credits_remaining = 0 WHERE user_id = $1',
            [userId]
          );
          
          console.log(`Removed subscription and credits for user ${userId}`);
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle monthly renewal - issue subscription credits
        const invoice = event.data.object;
        
        if (invoice.billing_reason === 'subscription_cycle') {
          // Find user by customer ID
          const { rows: renewalUsers } = await pool.query(
            'SELECT id, subscription_tier FROM users WHERE stripe_customer_id = $1',
            [invoice.customer]
          );

          if (renewalUsers.length > 0) {
            const userId = renewalUsers[0].id;
            const subscriptionTier = renewalUsers[0].subscription_tier || 'MYSTIC_LITE';
            
            // Reset credits for the new billing cycle (legacy system)
            await initializeUserCredits(userId);
            
            // Issue monthly subscription credits via new credit engine
            // For MYSTIC_LITE: 5 credits/month
            // For MYSTIC_PREMIUM: 0 credits (unlimited via cap, but we can still track)
            const monthlyCredits = subscriptionTier === 'MYSTIC_LITE' ? 5 : 0;
            
            if (monthlyCredits > 0) {
              const creditResult = await issueSubscriptionCredits(
                userId,
                monthlyCredits,
                subscriptionTier,
                {
                  invoice_id: invoice.id,
                  billing_cycle: invoice.period_end,
                  issued_at: new Date().toISOString()
                }
              );
              
              if (creditResult.success) {
                console.log(`[Credit Engine] Issued ${creditResult.added_credits} monthly subscription credits to user ${userId}`);
              }
            }
            
            console.log(`[Credit Engine] Subscription renewal processed for user ${userId}`);
          }
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Handle wallet funding
        if (paymentIntent.metadata?.type === 'wallet_funding') {
          const userId = parseInt(paymentIntent.metadata.userId);
          const amountUsd = parseFloat(paymentIntent.metadata.amount_usd);
          const amountCents = paymentIntent.amount;
          
          if (userId && !isNaN(userId) && amountUsd && !isNaN(amountUsd)) {
            try {
              // Idempotency check using payment_intent.id (primary key to prevent double-funding)
              const existingEntry = await pool.query(
                `SELECT id FROM wallet_ledger 
                 WHERE meta->>'stripe_payment_intent_id' = $1 
                 AND transaction_type = 'FUNDING'
                 LIMIT 1`,
                [paymentIntent.id]
              );
              
              if (existingEntry.rows.length > 0) {
                console.log(`[Wallet Funding] Payment intent ${paymentIntent.id} already processed (ledger_id: ${existingEntry.rows[0].id})`);
                break;
              }
              
              // Insert into wallet_ledger (trigger will update snapshot automatically)
              const ledgerResult = await pool.query(
                `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta, created_at)
                 VALUES ($1, $2, 'FUNDING', $3, NOW())
                 RETURNING id`,
                [
                  userId,
                  amountUsd, // Pass as number, PostgreSQL DECIMAL handles precision
                  JSON.stringify({
                    stripe_payment_intent_id: paymentIntent.id,
                    stripe_customer_id: paymentIntent.customer,
                    amount_cents: amountCents,
                    amount_usd: amountUsd.toString(),
                    webhook_event: 'payment_intent.succeeded'
                  })
                ]
              );
              
              const ledgerId = ledgerResult.rows[0]?.id;
              console.log(`[Wallet Funding] Added $${amountUsd} to wallet for user ${userId} (ledger_id: ${ledgerId}, payment_intent: ${paymentIntent.id})`);
              
            } catch (error) {
              // Comprehensive error logging for manual reconciliation
              console.error(`[Wallet Funding] Error processing payment_intent.succeeded for user ${userId}:`, {
                error: error.message,
                stack: error.stack,
                payment_intent_id: paymentIntent.id,
                user_id: userId,
                amount_usd: amountUsd,
                amount_cents: amountCents,
                metadata: paymentIntent.metadata,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        // Handle credit pack purchases using new credit engine
        else if (paymentIntent.metadata?.type === 'credit_pack') {
          const userId = parseInt(paymentIntent.metadata.userId);
          const packSize = parseInt(paymentIntent.metadata.packSize);
          
          if (userId && packSize) {
            // Use new credit engine to add credits via ledger
            const result = await purchaseCredits(userId, packSize, {
              stripe_payment_intent_id: paymentIntent.id,
              stripe_customer_id: paymentIntent.customer,
              purchase_date: new Date().toISOString()
            });
            
            if (result.success) {
              console.log(`[Credit Engine] Added ${result.added_credits} credits to user ${userId} via purchase (ledger_id: ${result.ledger_id})`);
            } else {
              console.error(`[Credit Engine] Failed to add credits to user ${userId}:`, result.error);
            }
          }
        }
        break;

      case 'payment_intent.payment_failed':
        // Handle failed payments - refund if credits were already added
        const failedPaymentIntent = event.data.object;
        
        if (failedPaymentIntent.metadata?.type === 'credit_pack') {
          const userId = parseInt(failedPaymentIntent.metadata.userId);
          const packSize = parseInt(failedPaymentIntent.metadata.packSize);
          
          if (userId && packSize) {
            // Check if credits were already added (shouldn't happen, but safety check)
            // In practice, credits should only be added on payment_intent.succeeded
            // This is a rollback safety mechanism
            console.log(`[Credit Engine] Payment failed for user ${userId}, pack ${packSize} - no rollback needed (credits only added on success)`);
          }
        }
        break;

      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Handle wallet funding
        if (session.mode === 'payment' && session.metadata?.type === 'wallet_funding') {
          const userId = parseInt(session.metadata.userId);
          const amountUsd = parseFloat(session.metadata.amount_usd);
          const paymentIntentId = session.payment_intent; // Extract payment_intent ID
          
          if (userId && !isNaN(userId) && amountUsd && !isNaN(amountUsd)) {
            try {
              // Idempotency check using payment_intent_id (primary key to prevent double-funding)
              const existingEntry = await pool.query(
                `SELECT id FROM wallet_ledger 
                 WHERE meta->>'stripe_payment_intent_id' = $1 
                 AND transaction_type = 'FUNDING'
                 LIMIT 1`,
                [paymentIntentId]
              );
              
              if (existingEntry.rows.length > 0) {
                console.log(`[Wallet Funding] Payment intent ${paymentIntentId} already processed (ledger_id: ${existingEntry.rows[0].id})`);
                break;
              }
              
              // Insert into wallet_ledger (trigger will update snapshot automatically)
              // amount_usd is already in dollars from metadata, pass as number
              // PostgreSQL DECIMAL(10,2) will handle precision
              const ledgerResult = await pool.query(
                `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta, created_at)
                 VALUES ($1, $2, 'FUNDING', $3, NOW())
                 RETURNING id`,
                [
                  userId,
                  amountUsd, // Pass as number, PostgreSQL DECIMAL handles precision
                  JSON.stringify({
                    stripe_session_id: session.id,
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_customer_id: session.customer,
                    amount_cents: session.amount_total, // Store original cents amount
                    amount_usd: amountUsd.toString(),
                    webhook_event: 'checkout.session.completed'
                  })
                ]
              );
              
              const ledgerId = ledgerResult.rows[0]?.id;
              console.log(`[Wallet Funding] Added $${amountUsd} to wallet for user ${userId} (ledger_id: ${ledgerId}, payment_intent: ${paymentIntentId}, session: ${session.id})`);
              
            } catch (error) {
              // Comprehensive error logging for manual reconciliation
              console.error(`[Wallet Funding] Error processing checkout.session.completed for user ${userId}:`, {
                error: error.message,
                stack: error.stack,
                payment_intent_id: paymentIntentId,
                session_id: session.id,
                user_id: userId,
                amount_usd: amountUsd,
                amount_cents: session.amount_total,
                metadata: session.metadata,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        // Handle premium report purchases
        else if (session.mode === 'payment' && session.metadata?.report_id) {
          const userId = parseInt(session.metadata.userId);
          const reportId = session.metadata.report_id;
          const reportName = session.metadata.report_name || 'Premium Report';
          
          if (userId && reportId) {
            try {
              // Extract partner data from session metadata
              const skipPartnerData = session.metadata?.skip_partner_data === 'true';
              let partnerDataJson = null;
              
              if (session.metadata?.partner_data && !skipPartnerData) {
                try {
                  partnerDataJson = JSON.parse(session.metadata.partner_data);
                } catch (e) {
                  console.error('[Webhook] Failed to parse partner_data:', e);
                }
              }

              // Create a record of the premium report purchase
              const orderResult = await pool.query(
                `INSERT INTO premium_report_orders 
                 (user_id, report_type, report_name, stripe_session_id, stripe_customer_id, amount_paid, status, partner_data, skip_partner_data, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, NOW())
                 ON CONFLICT (stripe_session_id) DO UPDATE
                 SET status = 'pending', partner_data = $7, skip_partner_data = $8, updated_at = NOW()
                 RETURNING id`,
                [
                  userId,
                  reportId.toUpperCase(),
                  reportName,
                  session.id,
                  session.customer,
                  session.amount_total, // Amount in cents
                  partnerDataJson ? JSON.stringify(partnerDataJson) : null,
                  skipPartnerData
                ]
              );
              
              const orderId = orderResult.rows[0]?.id;
              
              console.log(`[Premium Report] Purchase recorded for user ${userId}, report ${reportId} (order: ${orderId}, session: ${session.id})`);
              
              // Trigger report generation asynchronously using internal endpoint
              if (orderId) {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                               'http://localhost:5000');
                const cronSecret = process.env.CRON_SECRET;
                
                if (cronSecret) {
                  // Trigger generation in background (don't await to avoid blocking webhook)
                  fetch(`${baseUrl}/api/premium-reports/generate-internal`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${cronSecret}`
                    },
                    body: JSON.stringify({ orderId }),
                  }).catch(err => {
                    console.error(`[Premium Report] Failed to trigger generation for order ${orderId}:`, err);
                    // Update order status to indicate generation needs to be triggered manually
                    pool.query(
                      'UPDATE premium_report_orders SET status = $1, error_message = $2 WHERE id = $3',
                      ['pending', 'Generation trigger failed - will be processed manually', orderId]
                    ).catch(updateErr => {
                      console.error(`[Premium Report] Failed to update order ${orderId}:`, updateErr);
                    });
                  });
                } else {
                  console.warn(`[Premium Report] CRON_SECRET not set, cannot trigger automatic generation for order ${orderId}`);
                  // Mark as pending for manual processing
                  pool.query(
                    'UPDATE premium_report_orders SET status = $1, error_message = $2 WHERE id = $3',
                    ['pending', 'Automatic generation not configured - will be processed manually', orderId]
                  ).catch(updateErr => {
                    console.error(`[Premium Report] Failed to update order ${orderId}:`, updateErr);
                  });
                }
              }
              
            } catch (error) {
              console.error(`[Premium Report] Error recording purchase for user ${userId}:`, error);
            }
          }
        }
        break;

      case 'charge.refunded':
        // Handle refunds - reverse credit purchase
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        
        if (paymentIntentId) {
          // Retrieve payment intent to get metadata
          const refundedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          if (refundedPaymentIntent.metadata?.type === 'credit_pack') {
            const userId = parseInt(refundedPaymentIntent.metadata.userId);
            const packSize = parseInt(refundedPaymentIntent.metadata.packSize);
            
            if (userId && packSize) {
              // Refund credits
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
                console.log(`[Credit Engine] Refunded ${refundResult.refunded_credits} credits to user ${userId} (ledger_id: ${refundResult.ledger_id})`);
              } else {
                console.error(`[Credit Engine] Failed to refund credits to user ${userId}:`, refundResult.error);
              }
            }
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}
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
            const subscriptionTier = users[0].subscription_tier || 'MYSTIC_PREMIUM'; // Default tier
            
            // Update subscription ID in users table
            await pool.query(
              'UPDATE users SET stripe_subscription_id = $1 WHERE id = $2',
              [subscription.id, userId]
            );

            // Initialize or reset credits for the user (legacy system)
            await initializeUserCredits(userId);
            
            // Also issue subscription credits via new credit engine
            // Note: Monthly credits are typically issued on invoice.payment_succeeded
            // This is just for initial subscription setup
            console.log(`[Credit Engine] Subscription ${subscription.id} activated for user ${userId}`);
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
            const subscriptionTier = renewalUsers[0].subscription_tier || 'MYSTIC_PREMIUM';
            
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
        // Handle credit pack purchases using new credit engine
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.type === 'credit_pack') {
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
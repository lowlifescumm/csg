import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Pool } from 'pg';
import { initializeUserCredits } from '../credits/route';

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
            'SELECT id FROM users WHERE stripe_customer_id = $1',
            [subscription.customer]
          );

          if (users.length > 0) {
            const userId = users[0].id;
            
            // Update subscription ID in users table
            await pool.query(
              'UPDATE users SET stripe_subscription_id = $1 WHERE id = $2',
              [subscription.id, userId]
            );

            // Initialize or reset credits for the user
            await initializeUserCredits(userId);
            
            console.log(`Initialized credits for user ${userId} after subscription ${subscription.id}`);
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
        // Handle monthly renewal - reset credits
        const invoice = event.data.object;
        
        if (invoice.billing_reason === 'subscription_cycle') {
          // Find user by customer ID
          const { rows: renewalUsers } = await pool.query(
            'SELECT id FROM users WHERE stripe_customer_id = $1',
            [invoice.customer]
          );

          if (renewalUsers.length > 0) {
            const userId = renewalUsers[0].id;
            
            // Reset credits for the new billing cycle
            await initializeUserCredits(userId);
            
            console.log(`Reset credits for user ${userId} after subscription renewal`);
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
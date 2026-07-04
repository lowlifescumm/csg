const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription-service.js';
import { getSubscriptionTierById } from '@/lib/pricing.js';
import { pool } from '@/lib/db.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const runtime = 'nodejs';

async function isAdmin(userId) {
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  return rows[0]?.role === 'admin';
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { user_id: targetUserIdInput, tier, createCheckout = true } = payload || {};

    const tierConfig = getSubscriptionTierById((tier || '').toUpperCase());
    if (!tierConfig) {
      return NextResponse.json({ error: 'invalid_tier' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numericTargetUserId = Number(targetUserIdInput ?? authResult.userId);
    if (!Number.isInteger(numericTargetUserId) || numericTargetUserId <= 0) {
      return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 });
    }

    if (numericTargetUserId !== authResult.userId) {
      const admin = await isAdmin(authResult.userId);
      if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // If createCheckout is true, create a Stripe checkout session
    if (createCheckout) {
      const { rows: userRows } = await pool.query(
        'SELECT id, email, first_name, last_name, stripe_customer_id FROM users WHERE id = $1',
        [numericTargetUserId]
      );
      const user = userRows[0];

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      let customerId = user.stripe_customer_id;

      // Create or retrieve Stripe customer
      if (!customerId || customerId === 'cus_admin_lifetime' || !customerId.startsWith('cus_')) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          metadata: {
            userId: numericTargetUserId.toString(),
          },
        });
        customerId = customer.id;
        await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, numericTargetUserId]);
      } else {
        try {
          await stripe.customers.retrieve(customerId);
        } catch (err) {
          if (err.code === 'resource_missing') {
            const customer = await stripe.customers.create({
              email: user.email,
              name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
              metadata: {
                userId: numericTargetUserId.toString(),
              },
            });
            customerId = customer.id;
            await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, numericTargetUserId]);
          } else {
            throw err;
          }
        }
      }

      // Get or create Stripe price for this tier
      // First, try to find existing price by metadata
      const prices = await stripe.prices.list({
        limit: 100,
        active: true,
      });

      let priceId = prices.data.find(
        (p) =>
          p.recurring?.interval === 'month' &&
          p.unit_amount === tierConfig.priceInCents &&
          p.metadata?.tier_id === tierConfig.id
      )?.id;

      // If not found, create it dynamically
      if (!priceId) {
        const products = await stripe.products.list({ limit: 100, active: true });
        let product = products.data.find(
          (p) => p.metadata?.subscription_tier === tierConfig.id
        );

        if (!product) {
          product = await stripe.products.create({
            name: tierConfig.name,
            description: tierConfig.description || `${tierConfig.creditsPerMonth} credits/month, ${tierConfig.rolloverDays}-day rollover, ${tierConfig.reportDiscountPercent}% report discount`,
            metadata: {
              subscription_tier: tierConfig.id,
              credits_per_month: tierConfig.creditsPerMonth.toString(),
              rollover_days: tierConfig.rolloverDays.toString(),
              report_discount: tierConfig.reportDiscountPercent.toString(),
              priority_access: tierConfig.priorityAccess.toString(),
              app: 'cosmic-spiritual-guide',
            },
          });
        }

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: tierConfig.priceInCents,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: {
            tier_id: tierConfig.id,
            app: 'cosmic-spiritual-guide',
          },
        });

        priceId = price.id;
      }

      const hostHeader = request.headers.get('host');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (hostHeader ? `https://${hostHeader}` : 'http://localhost:5000');

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing?canceled=true`,
        metadata: {
          userId: numericTargetUserId.toString(),
          tier: tierConfig.id,
        },
        subscription_data: {
          metadata: {
            userId: numericTargetUserId.toString(),
            tier: tierConfig.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } else {
      // Direct activation without checkout (for admin/testing)
      const { activateSubscription } = await import('@/lib/subscription-service.js');
      const activation = await activateSubscription(numericTargetUserId, tierConfig.id);
      const status = await getSubscriptionStatus(numericTargetUserId);

      return NextResponse.json({
        success: true,
        activation,
        status,
      });
    }
  } catch (error) {
    logger.error('[Subscription Activate] Error:', error);
    return NextResponse.json(
      { error: 'activation_failed', details: error.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/marketplace/wallet/fund
 * Create Stripe Checkout session for wallet funding (arbitrary USD amounts)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { getUserById, updateUserStripeInfo } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  badRequestResponse, 
  errorResponse 
} from '@/lib/api-response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const runtime = 'nodejs';

// Wallet funding limits
const MIN_AMOUNT_USD = 1;
const MAX_AMOUNT_USD = 10000;

export async function POST(request) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return unauthorizedResponse('Authentication required');
    }

    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;

    if (!userId || isNaN(userId)) {
      return unauthorizedResponse('Invalid user ID');
    }

    // Get user from database
    const user = await getUserById(userId);
    if (!user) {
      return badRequestResponse('User not found');
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const amount = body.amount;

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      return badRequestResponse('Amount is required and must be a number');
    }

    if (amount < MIN_AMOUNT_USD) {
      return badRequestResponse(`Minimum funding amount is $${MIN_AMOUNT_USD}`);
    }

    if (amount > MAX_AMOUNT_USD) {
      return badRequestResponse(`Maximum funding amount is $${MAX_AMOUNT_USD}`);
    }

    // Ensure or create Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId || customerId === 'cus_admin_lifetime' || !customerId.startsWith('cus_')) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      await updateUserStripeInfo(userId, customerId, null);
    } else {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err) {
        if (err.code === 'resource_missing') {
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            metadata: {
              userId: userId.toString(),
            },
          });
          customerId = customer.id;
          await updateUserStripeInfo(userId, customerId, null);
        } else {
          throw err;
        }
      }
    }

    // Convert USD to cents for Stripe
    const amountCents = Math.round(amount * 100);

    // Get base URL for redirects
    const hostHeader = request.headers.get('host');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (hostHeader ? `https://${hostHeader}` : 'http://localhost:5000');

    // Create Stripe Checkout session with price_data for arbitrary amount
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wallet Funding',
              description: `Add $${amount.toFixed(2)} to your wallet balance`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?wallet_funded=true&amount=${amount}`,
      cancel_url: `${baseUrl}/dashboard?wallet_funding_canceled=true`,
      metadata: {
        type: 'wallet_funding',
        userId: userId.toString(),
        amount_usd: amount.toString(),
      },
    });

    return successResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
      amount: amount,
    });
  } catch (error) {
    console.error('[Wallet Fund] Error:', error);
    return errorResponse(
      'Failed to create checkout session',
      500,
      error.message
    );
  }
}


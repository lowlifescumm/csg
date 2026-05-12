import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getUserById, updateUserStripeInfo } from '@/lib/db';
import { SUBSCRIPTION_TIERS, getSubscriptionTierById } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Get Stripe price ID for subscription tier
 * First checks environment variables, then searches Stripe by metadata
 */
async function getStripePriceId(tierId) {
  // Check environment variables first (set after running setup script)
  const envPriceId = process.env[`STRIPE_PRICE_ID_${tierId}`];
  if (envPriceId) {
    return envPriceId;
  }

  // Search Stripe for product with matching tier metadata
  try {
    const tier = getSubscriptionTierById(tierId);
    if (!tier) {
      throw new Error(`Unknown subscription tier: ${tierId}`);
    }

    // List all active products (Stripe doesn't support metadata filtering in list())
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    // Filter products by metadata to find the matching tier
    const matchingProduct = products.data.find(
      (p) => p.metadata && p.metadata.subscription_tier === tierId
    );

    if (!matchingProduct) {
      throw new Error(`No Stripe product found for tier: ${tierId}. Please run the setup script first.`);
    }

    const product = matchingProduct;
    
    // Get prices for this product
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: 'recurring',
    });

    if (prices.data.length === 0) {
      throw new Error(`No Stripe price found for product: ${product.name}`);
    }

    // Return the first recurring price
    return prices.data[0].id;
  } catch (error) {
    logger.error(`[Stripe] Error finding price for tier ${tierId}:`, error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get tier from request body (defaults to MYSTIC_LITE)
    const body = await request.json().catch(() => ({}));
    const tierId = body.tier || 'MYSTIC_LITE';
    const tier = getSubscriptionTierById(tierId);

    if (!tier) {
      return NextResponse.json({ error: `Invalid subscription tier: ${tierId}` }, { status: 400 });
    }

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id.toString(),
        },
      });
      customerId = customer.id;
      await updateUserStripeInfo(user.id, customerId, null);
    }

    // Get Stripe price ID for this tier
    const priceId = await getStripePriceId(tierId);

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
      subscription_data: {
        metadata: {
          tier_id: tierId,
          tier_name: tier.name,
          credits_per_month: tier.creditsPerMonth.toString(),
          rollover_days: tier.rolloverDays.toString(),
          report_discount_percent: tier.reportDiscountPercent.toString(),
        },
      },
      success_url: `${baseUrl}/subscription?success=true&tier=${tierId}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        tier_id: tierId,
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      tier: tierId,
      tierName: tier.name,
      price: tier.priceInCents / 100,
    });
  } catch (error) {
    logger.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

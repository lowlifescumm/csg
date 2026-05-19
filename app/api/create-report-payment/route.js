import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getUserById, updateUserStripeInfo } from '@/lib/db';
import { pool } from '@/lib/db.js';
import logger from '@/lib/logger';
import { getPremiumReportById, PREMIUM_REPORTS } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Get or create Stripe product/price for a premium report
 */
async function getOrCreateReportPrice(report) {
  const productKey = `report_${report.id}`;
  const envPriceId = process.env[`STRIPE_PRICE_ID_${productKey}`];
  if (envPriceId) {
    return envPriceId;
  }

  // Search for existing product
  const products = await stripe.products.list({
    limit: 100,
    active: true,
  });

  const existingProduct = products.data.find(
    (p) => p.metadata && p.metadata.report_id === report.id
  );

  if (existingProduct) {
    const prices = await stripe.prices.list({
      product: existingProduct.id,
      active: true,
      type: 'one_time',
    });
    if (prices.data.length > 0) {
      return prices.data[0].id;
    }
  }

  // Create new product + price
  const product = await stripe.products.create({
    name: report.name,
    description: report.description,
    metadata: {
      report_id: report.id,
      report_name: report.name,
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: report.priceInCents,
    currency: 'usd',
    metadata: {
      report_id: report.id,
    },
  });

  return price.id;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { reportId, partnerData, skipPartnerData } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = getPremiumReportById(reportId);
    if (!report) {
      return NextResponse.json({ error: `Invalid report type: ${reportId}` }, { status: 400 });
    }

    // Auth is optional for report purchases — users can be prompted to log in after payment
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = token ? verifyToken(token) : null;

    let user = null;
    let customerId = null;

    if (decoded) {
      user = await getUserById(decoded.userId);
      if (user) {
        customerId = user.stripe_customer_id;
      }
    }

    // Check if authenticated user has a birth chart
    if (user) {
      const { rows: chartRows } = await pool.query(
        'SELECT id FROM birth_charts WHERE user_id = $1 LIMIT 1',
        [user.id]
      );
      if (chartRows.length === 0) {
        return NextResponse.json({
          error: 'You need a birth chart before purchasing a report.',
          requiresBirthChart: true,
          message: 'Please create your free birth chart first.',
        }, { status: 400 });
      }
    }

    if (!customerId) {
      // Create a guest customer — will be linked to account after signup if needed
      const customer = await stripe.customers.create({
        metadata: {
          report_id: reportId,
          ...(user ? { userId: user.id.toString() } : {}),
        },
      });
      customerId = customer.id;
      if (user) {
        await updateUserStripeInfo(user.id, customerId, null);
      }
    }

    const priceId = await getOrCreateReportPrice(report);

    const hostHeader = request.headers.get('host');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (hostHeader ? `https://${hostHeader}` : 'http://localhost:5000');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/reports/success?session_id={CHECKOUT_SESSION_ID}&report=${reportId}`,
      cancel_url: `${baseUrl}/services?canceled=true`,
      metadata: {
        report_id: reportId,
        report_name: report.name,
        user_id: user?.id?.toString() || '',
        type: 'premium_report',
        has_partner_data: partnerData ? 'true' : 'false',
        skip_partner_data: skipPartnerData ? 'true' : 'false',
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      reportId,
      reportName: report.name,
      price: report.priceInCents / 100,
    });
  } catch (error) {
    logger.error('Report payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

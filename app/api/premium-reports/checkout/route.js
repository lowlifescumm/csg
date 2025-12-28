import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getUserById, updateUserStripeInfo, pool } from '@/lib/db';
import { PREMIUM_REPORTS, getPremiumReportById } from '@/lib/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Get Stripe price ID for premium report
 * Searches Stripe by metadata to find the matching report product and price
 */
async function getStripePriceId(reportId) {
  try {
    const report = getPremiumReportById(reportId);
    if (!report) {
      throw new Error(`Unknown premium report: ${reportId}`);
    }

    // List all active products
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    // Filter products by metadata to find the matching report
    const matchingProduct = products.data.find(
      (p) => p.metadata && p.metadata.report_type === reportId.toUpperCase()
    );

    if (!matchingProduct) {
      throw new Error(`No Stripe product found for report: ${reportId}. Please run the setup script first.`);
    }

    // Get prices for this product (one-time payments, not recurring)
    const prices = await stripe.prices.list({
      product: matchingProduct.id,
      active: true,
      type: 'one_time',
    });

    // Find the price that matches the current pricing
    const matchingPrice = prices.data.find(
      (p) => p.unit_amount === report.priceInCents
    );

    if (!matchingPrice) {
      // If no exact match, use the most recent price
      if (prices.data.length > 0) {
        return prices.data[0].id;
      }
      throw new Error(`No Stripe price found for product: ${matchingProduct.name}`);
    }

    return matchingPrice.id;
  } catch (error) {
    console.error(`[Stripe] Error finding price for report ${reportId}:`, error);
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

    // Get report ID and partner data from request body
    const body = await request.json().catch(() => ({}));
    const reportId = body.reportId;
    const partnerData = body.partnerData || null;
    const skipPartnerData = body.skipPartnerData === true;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = getPremiumReportById(reportId);

    if (!report) {
      return NextResponse.json({ error: `Invalid premium report: ${reportId}` }, { status: 400 });
    }

    // Validate partner data for Advanced/Master reports
    if ((reportId === 'ADVANCED' || reportId === 'MASTER') && !skipPartnerData) {
      if (!partnerData) {
        return NextResponse.json({
          error: 'Partner data required',
          message: 'Partner information is required for compatibility sections. Please provide partner data or check the option to skip it.',
          requiresPartnerData: true
        }, { status: 400 });
      }

      // Validate partner data has required fields
      if (!partnerData.birthDate || !partnerData.birthTime || 
          partnerData.latitude === undefined || partnerData.longitude === undefined) {
        return NextResponse.json({
          error: 'Incomplete partner data',
          message: 'Partner data is incomplete. Please provide birth date, birth time, and location coordinates.',
          requiresPartnerData: true
        }, { status: 400 });
      }
    }

    // Check if user has birth chart data (required for all premium reports)
    try {
      // Check natal_charts table first
      let chartResult = await pool.query(
        'SELECT id FROM natal_charts WHERE user_id = $1 AND is_primary = true LIMIT 1',
        [user.id]
      );

      // Fallback to birth_charts table
      if (chartResult.rows.length === 0) {
        chartResult = await pool.query(
          'SELECT id FROM birth_charts WHERE user_id = $1 LIMIT 1',
          [user.id]
        );
      }

      if (chartResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Birth chart required',
          message: 'You need to create a birth chart before purchasing premium reports. This is free and only takes a minute!',
          requiresBirthChart: true,
          birthChartUrl: '/birth-chart?redirect=/services'
        }, { status: 400 });
      }
    } catch (error) {
      console.error('[Checkout] Error checking birth chart:', error);
      // Continue anyway - let generation fail later if needed
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

    // Get Stripe price ID for this report
    const priceId = await getStripePriceId(reportId);

    const hostHeader = request.headers.get('host');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (hostHeader ? `https://${hostHeader}` : 'http://localhost:5000');

    // Prepare metadata including partner data
    const sessionMetadata = {
      userId: user.id.toString(),
      report_id: reportId,
      report_name: report.name,
      report_type: reportId.toUpperCase(),
      skip_partner_data: skipPartnerData ? 'true' : 'false',
    };

    // Store partner data in metadata if provided
    if (partnerData && !skipPartnerData) {
      sessionMetadata.partner_data = JSON.stringify(partnerData);
    }

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
      success_url: `${baseUrl}/premium-reports/checkout?success=true&reportId=${reportId}`,
      cancel_url: `${baseUrl}/services?canceled=true`,
      metadata: sessionMetadata,
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      reportId: reportId,
      reportName: report.name,
      price: report.priceInCents / 100,
    });
  } catch (error) {
    console.error('Premium report checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


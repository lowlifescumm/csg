import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { Pool } from 'pg';
import logger from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

const ONE_TIME_READING_PRICE = 999;

/**
 * GET /api/verify-payment?session_id=cs_xxx
 * Verifies a Stripe Checkout Session payment for premium report purchases.
 * Used by /reports/success page after Stripe checkout redirect.
 * Does NOT require authentication — guest users can purchase reports.
 */
export async function GET(request) {
  try {
    const sessionId = request.nextUrl?.searchParams?.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        error: 'Payment not completed',
      }, { status: 400 });
    }

    const metadata = session.metadata || {};
    const reportId = metadata.report_id;
    const reportName = metadata.report_name;

    return NextResponse.json({
      success: true,
      status: 'succeeded',
      reportName,
      reportId,
      amount: session.amount_total,
    });
  } catch (error) {
    logger.error('[VerifyPayment] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { paymentIntentId } = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { rows: existingPurchase } = await pool.query(
      'SELECT id FROM moon_reading_purchases WHERE payment_intent_id = $1',
      [paymentIntentId],
    );

    if (existingPurchase.length > 0) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ success: false, status: paymentIntent.status }, { status: 400 });
    }

    if (paymentIntent.amount !== ONE_TIME_READING_PRICE) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    if (paymentIntent.metadata?.type !== 'moon_reading_one_time') {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO moon_reading_purchases (user_id, payment_intent_id, amount, status, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, paymentIntent.id, paymentIntent.amount, paymentIntent.status],
    );

    return NextResponse.json({ success: true, status: 'succeeded' });
  } catch (error) {
    logger.error('[VerifyPayment] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

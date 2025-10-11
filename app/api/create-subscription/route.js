import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';
import { getUserById, updateUserStripeInfo } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Cosmic Spiritual Guide - Premium Subscription',
            description: 'Monthly credits: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits',
          },
          unit_amount: 2999,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/subscription?success=true`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId: user.id.toString(),
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

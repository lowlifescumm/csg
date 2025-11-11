import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const ONE_TIME_READING_PRICE = 999;

export async function POST(req) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: ONE_TIME_READING_PRICE,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'moon_reading_one_time',
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

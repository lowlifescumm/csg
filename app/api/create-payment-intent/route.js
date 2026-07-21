import { NextResponse } from "next/server";
import Stripe from "stripe";
import logger from "@/lib/logger";
import { parsePaymentAmount } from "@/lib/payment-amount.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const parsed = parsePaymentAmount(body.amount);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const amount = parsed.amount;

    const metadata = body.metadata && typeof body.metadata === "object"
      ? body.metadata
      : { type: "moon_reading_one_time" };

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: body.currency || "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    logger.error("Payment intent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

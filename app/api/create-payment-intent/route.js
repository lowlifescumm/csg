import { NextResponse } from "next/server";
import Stripe from "stripe";
import logger from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const DEFAULT_ONE_TIME_READING_PRICE = 999;

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

let amount;
if (body.amount === undefined || body.amount === null) {
  amount = DEFAULT_ONE_TIME_READING_PRICE;
} else {
  const parsed = Number(body.amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  amount = parsed;
}

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

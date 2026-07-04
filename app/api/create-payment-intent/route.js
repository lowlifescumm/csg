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

    const amount =
      typeof body.amount === "number" && body.amount > 0
        ? body.amount
        : typeof body.amount === "string" && !isNaN(Number(body.amount)) && Number(body.amount) > 0
        ? Number(body.amount)
        : DEFAULT_ONE_TIME_READING_PRICE;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
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

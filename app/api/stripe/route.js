// /app/api/stripe/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  // Implement your webhook logic here (signature verify, event types, etc.)
  return NextResponse.json({ received: true });
}

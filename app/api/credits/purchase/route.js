import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { pool } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { packSize, packPrice } = await request.json();
    
    // Validate pack
    const validPacks = [
      { size: 10, price: 999, name: "10 Credits" },
      { size: 25, price: 1999, name: "25 Credits" },
      { size: 50, price: 3499, name: "50 Credits" },
      { size: 100, price: 5999, name: "100 Credits" }
    ];
    const pack = validPacks.find(p => p.size === packSize && p.price === packPrice);
    if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

    // Get user's Stripe customer ID
    const { rows } = await pool.query("SELECT stripe_customer_id FROM users WHERE id=$1", [decoded.userId]);
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: packPrice,
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: decoded.userId,
        packSize: packSize.toString(),
        type: 'credit_pack'
      }
    });

    return NextResponse.json({ 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      packName: pack.name 
    });
  } catch (err) {
    console.error("Credit purchase error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

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

    // Get user's info and Stripe customer ID
    const { rows } = await pool.query("SELECT id, email, first_name, last_name, stripe_customer_id FROM users WHERE id=$1", [decoded.userId]);
    const user = rows[0];
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.stripe_customer_id;

    // Create or verify Stripe customer
    if (!customerId || customerId === 'cus_admin_lifetime' || !customerId.startsWith('cus_')) {
      // Create new customer if none exists or if it's a placeholder value
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        metadata: {
          userId: decoded.userId.toString(),
        },
      });
      customerId = customer.id;
      
      // Save customer ID to database
      await pool.query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [customerId, decoded.userId]
      );
    } else {
      // Verify customer exists in Stripe
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err) {
        if (err.code === 'resource_missing') {
          // Customer doesn't exist in Stripe, create a new one
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
            metadata: {
              userId: decoded.userId.toString(),
            },
          });
          customerId = customer.id;
          
          // Update database with new customer ID
          await pool.query(
            "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
            [customerId, decoded.userId]
          );
        } else {
          throw err; // Re-throw other errors
        }
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: packPrice,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: decoded.userId.toString(),
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
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      type: err.type,
      statusCode: err.statusCode
    });
    return NextResponse.json({ 
      error: "Failed to create payment",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

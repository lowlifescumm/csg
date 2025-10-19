# Stripe Products Setup Guide

## Current Issue
Your Stripe products are not appearing in the dashboard because the application uses **dynamic product creation** during checkout rather than pre-created products.

## Products That Should Exist

### 1. Credit Packs (One-time purchases)
- **10 Credits Pack** - $9.99
- **25 Credits Pack** - $19.99  
- **50 Credits Pack** - $34.99
- **100 Credits Pack** - $59.99

### 2. Premium Subscription
- **Cosmic Spiritual Guide - Premium Subscription** - $29.99/month
- Includes: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits

## Setup Options

### Option 1: Manual Setup in Stripe Dashboard (Recommended)

1. **Go to your Stripe Dashboard** → Products
2. **Create each product manually:**

#### Credit Packs:
- **Product Name**: "10 Credits Pack"
- **Description**: "Perfect for trying out readings"
- **Price**: $9.99 (one-time)
- **Product Name**: "25 Credits Pack"  
- **Description**: "Great for regular use"
- **Price**: $19.99 (one-time)
- **Product Name**: "50 Credits Pack"
- **Description**: "Best value for frequent users"
- **Price**: $34.99 (one-time)
- **Product Name**: "100 Credits Pack"
- **Description**: "Maximum value pack"
- **Price**: $59.99 (one-time)

#### Premium Subscription:
- **Product Name**: "Cosmic Spiritual Guide - Premium Subscription"
- **Description**: "Monthly credits: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits"
- **Price**: $29.99/month (recurring)

### Option 2: Use the Setup Script

1. **Update your environment variables** with real Stripe keys:
   ```bash
   # In your .env.local file, replace with your actual Stripe keys:
   STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
   ```

2. **Run the setup script**:
   ```bash
   cd e:\merge\csg
   node scripts/setup-stripe-products.js
   ```

## Current Application Behavior

The application currently creates products **dynamically** during checkout:

### Credit Purchases:
- Uses `stripe.paymentIntents.create()` with dynamic pricing
- No pre-created products needed
- Products won't appear in dashboard

### Subscription:
- Uses `stripe.checkout.sessions.create()` with `price_data`
- Creates product on-the-fly during checkout
- Product won't appear in dashboard

## Recommendation

**Keep the current dynamic approach** - it's actually more flexible and doesn't require pre-created products. The products not appearing in your dashboard is **normal behavior** for this implementation.

If you want products to appear in your dashboard, you'll need to:

1. **Update the application code** to use pre-created product IDs
2. **Create the products manually** in Stripe dashboard
3. **Modify the checkout flow** to reference existing products

## Verification

To verify your Stripe integration is working:

1. **Check your Stripe Dashboard** → Payments
2. **Look for successful transactions** (even if products don't show)
3. **Test the checkout flow** in your application
4. **Check webhook events** in Stripe Dashboard → Webhooks

## Next Steps

1. **Test your current setup** - it should work fine as-is
2. **If you want products in dashboard**, use Option 1 (manual setup)
3. **Update environment variables** with real Stripe keys
4. **Test the complete flow** from checkout to webhook processing

#!/usr/bin/env node

/**
 * Stripe Setup Verification Script
 * Checks your current Stripe configuration and provides recommendations
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '../env.local' });

async function verifyStripeSetup() {
  console.log('🔍 Verifying Stripe Setup for Cosmic Spiritual Guide...\n');

  // Check environment variables
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('📋 Environment Variables:');
  console.log(`   STRIPE_SECRET_KEY: ${stripeSecretKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${stripePublishableKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✅ Set' : '❌ Missing'}`);

  if (!stripeSecretKey || stripeSecretKey.includes('your-stripe-secret-key-here')) {
    console.log('\n❌ Stripe Secret Key is not properly configured!');
    console.log('   Please update your .env.local file with your actual Stripe keys.');
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    // Test API connection
    console.log('\n🔌 Testing Stripe API Connection...');
    const account = await stripe.accounts.retrieve();
    console.log(`   ✅ Connected to Stripe account: ${account.display_name || account.id}`);
    console.log(`   📊 Account type: ${account.type}`);
    console.log(`   🌍 Country: ${account.country}`);

    // Check existing products
    console.log('\n📦 Checking Existing Products...');
    const products = await stripe.products.list({ limit: 100 });
    console.log(`   📊 Total products found: ${products.data.length}`);

    if (products.data.length > 0) {
      console.log('\n   📋 Existing Products:');
      products.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.id})`);
        console.log(`      Active: ${product.active ? '✅' : '❌'}`);
        console.log(`      Description: ${product.description || 'No description'}`);
      });
    } else {
      console.log('   ℹ️  No products found - this is normal for dynamic product creation');
    }

    // Check webhooks
    console.log('\n🔗 Checking Webhooks...');
    const webhooks = await stripe.webhookEndpoints.list();
    console.log(`   📊 Total webhooks found: ${webhooks.data.length}`);

    if (webhooks.data.length > 0) {
      console.log('\n   📋 Webhook Endpoints:');
      webhooks.data.forEach((webhook, index) => {
        console.log(`   ${index + 1}. ${webhook.url}`);
        console.log(`      Status: ${webhook.status}`);
        console.log(`      Events: ${webhook.enabled_events.length} events`);
      });
    } else {
      console.log('   ⚠️  No webhooks found - you may need to set up webhooks for subscription handling');
    }

    // Check recent payments
    console.log('\n💳 Checking Recent Payments...');
    const payments = await stripe.paymentIntents.list({ limit: 5 });
    console.log(`   📊 Recent payments: ${payments.data.length}`);

    if (payments.data.length > 0) {
      console.log('\n   📋 Recent Payment Intents:');
      payments.data.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.id}`);
        console.log(`      Amount: $${(payment.amount / 100).toFixed(2)}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Created: ${new Date(payment.created * 1000).toLocaleDateString()}`);
      });
    } else {
      console.log('   ℹ️  No recent payments found');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (products.data.length === 0) {
      console.log('   📦 Products: Your app uses dynamic product creation (normal)');
      console.log('      - Products are created during checkout');
      console.log('      - They won\'t appear in your dashboard');
      console.log('      - This is the expected behavior for your current setup');
    }

    if (webhooks.data.length === 0) {
      console.log('   🔗 Webhooks: You should set up webhooks for subscription handling');
      console.log('      - Go to Stripe Dashboard → Webhooks');
      console.log('      - Add endpoint: https://your-domain.com/api/stripe-webhook');
      console.log('      - Select events: customer.subscription.*, invoice.payment_succeeded');
    }

    console.log('\n✅ Stripe setup verification complete!');
    console.log('\n📚 Next Steps:');
    console.log('   1. Test your checkout flow in the application');
    console.log('   2. Set up webhooks if not already done');
    console.log('   3. Monitor payments in Stripe Dashboard → Payments');

  } catch (error) {
    console.error('\n❌ Error verifying Stripe setup:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Solution: Update your STRIPE_SECRET_KEY in .env.local with your actual Stripe secret key');
    }
  }
}

// Run the script
if (require.main === module) {
  verifyStripeSetup();
}

module.exports = { verifyStripeSetup };

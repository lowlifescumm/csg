const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Stripe Setup Verification Script
 * Checks your current Stripe configuration and provides recommendations
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '../env.local' });

async function verifyStripeSetup() {
  logger.info('🔍 Verifying Stripe Setup for Cosmic Spiritual Guide...\n');

  // Check environment variables
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  logger.info('📋 Environment Variables:');
  logger.info(`   STRIPE_SECRET_KEY: ${stripeSecretKey ? '✅ Set' : '❌ Missing'}`);
  logger.info(`   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${stripePublishableKey ? '✅ Set' : '❌ Missing'}`);
  logger.info(`   STRIPE_WEBHOOK_SECRET: ${webhookSecret ? '✅ Set' : '❌ Missing'}`);

  if (!stripeSecretKey || stripeSecretKey.includes('your-stripe-secret-key-here')) {
    logger.info('\n❌ Stripe Secret Key is not properly configured!');
    logger.info('   Please update your .env.local file with your actual Stripe keys.');
    return;
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    // Test API connection
    logger.info('\n🔌 Testing Stripe API Connection...');
    const account = await stripe.accounts.retrieve();
    logger.info(`   ✅ Connected to Stripe account: ${account.display_name || account.id}`);
    logger.info(`   📊 Account type: ${account.type}`);
    logger.info(`   🌍 Country: ${account.country}`);

    // Check existing products
    logger.info('\n📦 Checking Existing Products...');
    const products = await stripe.products.list({ limit: 100 });
    logger.info(`   📊 Total products found: ${products.data.length}`);

    if (products.data.length > 0) {
      logger.info('\n   📋 Existing Products:');
      products.data.forEach((product, index) => {
        logger.info(`   ${index + 1}. ${product.name} (${product.id})`);
        logger.info(`      Active: ${product.active ? '✅' : '❌'}`);
        logger.info(`      Description: ${product.description || 'No description'}`);
      });
    } else {
      logger.info('   ℹ️  No products found - this is normal for dynamic product creation');
    }

    // Check webhooks
    logger.info('\n🔗 Checking Webhooks...');
    const webhooks = await stripe.webhookEndpoints.list();
    logger.info(`   📊 Total webhooks found: ${webhooks.data.length}`);

    if (webhooks.data.length > 0) {
      logger.info('\n   📋 Webhook Endpoints:');
      webhooks.data.forEach((webhook, index) => {
        logger.info(`   ${index + 1}. ${webhook.url}`);
        logger.info(`      Status: ${webhook.status}`);
        logger.info(`      Events: ${webhook.enabled_events.length} events`);
      });
    } else {
      logger.info('   ⚠️  No webhooks found - you may need to set up webhooks for subscription handling');
    }

    // Check recent payments
    logger.info('\n💳 Checking Recent Payments...');
    const payments = await stripe.paymentIntents.list({ limit: 5 });
    logger.info(`   📊 Recent payments: ${payments.data.length}`);

    if (payments.data.length > 0) {
      logger.info('\n   📋 Recent Payment Intents:');
      payments.data.forEach((payment, index) => {
        logger.info(`   ${index + 1}. ${payment.id}`);
        logger.info(`      Amount: $${(payment.amount / 100).toFixed(2)}`);
        logger.info(`      Status: ${payment.status}`);
        logger.info(`      Created: ${new Date(payment.created * 1000).toLocaleDateString()}`);
      });
    } else {
      logger.info('   ℹ️  No recent payments found');
    }

    // Recommendations
    logger.info('\n💡 Recommendations:');
    
    if (products.data.length === 0) {
      logger.info('   📦 Products: Your app uses dynamic product creation (normal)');
      logger.info('      - Products are created during checkout');
      logger.info('      - They won\'t appear in your dashboard');
      logger.info('      - This is the expected behavior for your current setup');
    }

    if (webhooks.data.length === 0) {
      logger.info('   🔗 Webhooks: You should set up webhooks for subscription handling');
      logger.info('      - Go to Stripe Dashboard → Webhooks');
      logger.info('      - Add endpoint: https://your-domain.com/api/stripe-webhook');
      logger.info('      - Select events: customer.subscription.*, invoice.payment_succeeded');
    }

    logger.info('\n✅ Stripe setup verification complete!');
    logger.info('\n📚 Next Steps:');
    logger.info('   1. Test your checkout flow in the application');
    logger.info('   2. Set up webhooks if not already done');
    logger.info('   3. Monitor payments in Stripe Dashboard → Payments');

  } catch (error) {
    logger.error('\n❌ Error verifying Stripe setup:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      logger.info('\n💡 Solution: Update your STRIPE_SECRET_KEY in .env.local with your actual Stripe secret key');
    }
  }
}

// Run the script
if (require.main === module) {
  verifyStripeSetup();
}

module.exports = { verifyStripeSetup };

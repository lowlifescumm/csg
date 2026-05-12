const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * ⚠️  DEPRECATED: This script is deprecated and should not be used.
 * 
 * This script uses hardcoded pricing that may not match the current pricing configuration.
 * Please use the newer version instead:
 * 
 *   → csg/scripts/setup-stripe-products-v2.js
 * 
 * The v2 script uses the centralized pricing configuration from lib/pricing.js,
 * ensuring consistency across the application.
 * 
 * This file is kept for reference only and may be removed in a future release.
 */

/**
 * Stripe Products Setup Script
 * Creates all necessary products and prices in Stripe for Cosmic Spiritual Guide
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '../env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  // Credit Packs
  {
    name: '10 Credits Pack',
    description: 'Perfect for trying out readings',
    prices: [
      {
        unit_amount: 999, // $9.99
        currency: 'usd',
        recurring: null
      }
    ]
  },
  {
    name: '25 Credits Pack', 
    description: 'Great for regular use',
    prices: [
      {
        unit_amount: 1999, // $19.99
        currency: 'usd',
        recurring: null
      }
    ]
  },
  {
    name: '50 Credits Pack',
    description: 'Best value for frequent users', 
    prices: [
      {
        unit_amount: 3499, // $34.99
        currency: 'usd',
        recurring: null
      }
    ]
  },
  {
    name: '100 Credits Pack',
    description: 'Maximum value pack',
    prices: [
      {
        unit_amount: 5999, // $59.99
        currency: 'usd',
        recurring: null
      }
    ]
  },
  // Premium Subscription
  {
    name: 'Cosmic Spiritual Guide - Premium Subscription',
    description: 'Monthly credits: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits',
    prices: [
      {
        unit_amount: 2999, // $29.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      }
    ]
  }
];

async function createProducts() {
  logger.info('🚀 Setting up Stripe products for Cosmic Spiritual Guide...\n');
  logger.info('⚠️  Creating new products (ignoring existing ones)...\n');

  try {
    for (const productData of products) {
      logger.info(`📦 Creating product: ${productData.name}`);

      // Create the product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        type: 'service',
        metadata: {
          app: 'cosmic-spiritual-guide',
          created_by: 'setup-script'
        }
      });

      logger.info(`   ✅ Product created: ${product.id}`);

      // Create prices for the product
      for (const priceData of productData.prices) {
        const priceConfig = {
          product: product.id,
          unit_amount: priceData.unit_amount,
          currency: priceData.currency,
          metadata: {
            app: 'cosmic-spiritual-guide',
            created_by: 'setup-script'
          }
        };

        // Only add recurring if it's not null
        if (priceData.recurring) {
          priceConfig.recurring = priceData.recurring;
        }

        const price = await stripe.prices.create(priceConfig);

        logger.info(`   💰 Price created: ${price.id} (${priceData.currency.toUpperCase()} ${(priceData.unit_amount / 100).toFixed(2)})`);
      }

      logger.info('');
    }

    logger.info('🎉 All products and prices created successfully!');
    logger.info('\n📋 Summary:');
    logger.info('   • 4 Credit Pack products with one-time prices');
    logger.info('   • 1 Premium Subscription product with recurring price');
    logger.info('   • All products are now available in your Stripe dashboard');
    
    logger.info('\n🔗 Next steps:');
    logger.info('   1. Check your Stripe dashboard to verify products');
    logger.info('   2. Update your application to use these product IDs if needed');
    logger.info('   3. Test the checkout flow with these products');

  } catch (error) {
    logger.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createProducts();
}

module.exports = { createProducts, products };

#!/usr/bin/env node
/**
 * @fileoverview This script sets up the necessary products and prices in Stripe for the application.
 * It creates credit packs and a premium subscription product.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/setup-stripe-products.js
 *
 * @environment_variables
 * - STRIPE_SECRET_KEY: Your Stripe secret key.
 */
const Stripe = require('stripe');
require('dotenv').config({ path: '../env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  {
    name: '10 Credits Pack',
    description: 'Perfect for trying out readings',
    prices: [
      {
        unit_amount: 999,
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
        unit_amount: 1999,
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
        unit_amount: 3499,
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
        unit_amount: 5999,
        currency: 'usd',
        recurring: null
      }
    ]
  },
  {
    name: 'Cosmic Spiritual Guide - Premium Subscription',
    description: 'Monthly credits: 4 moon readings, 2 compatibility reports, 2 birth charts + unlimited tarot & transits',
    prices: [
      {
        unit_amount: 2999,
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      }
    ]
  }
];

/**
 * Creates the products and their corresponding prices in Stripe.
 */
async function createProducts() {
  console.log('🚀 Setting up Stripe products for Cosmic Spiritual Guide...\n');
  console.log('⚠️  Creating new products (ignoring existing ones)...\n');

  try {
    for (const productData of products) {
      console.log(`📦 Creating product: ${productData.name}`);

      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        type: 'service',
        metadata: {
          app: 'cosmic-spiritual-guide',
          created_by: 'setup-script'
        }
      });

      console.log(`   ✅ Product created: ${product.id}`);

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

        if (priceData.recurring) {
          priceConfig.recurring = priceData.recurring;
        }

        const price = await stripe.prices.create(priceConfig);

        console.log(`   💰 Price created: ${price.id} (${priceData.currency.toUpperCase()} ${(priceData.unit_amount / 100).toFixed(2)})`);
      }

      console.log('');
    }

    console.log('🎉 All products and prices created successfully!');
    console.log('\n📋 Summary:');
    console.log('   • 4 Credit Pack products with one-time prices');
    console.log('   • 1 Premium Subscription product with recurring price');
    console.log('   • All products are now available in your Stripe dashboard');
    
    console.log('\n🔗 Next steps:');
    console.log('   1. Check your Stripe dashboard to verify products');
    console.log('   2. Update your application to use these product IDs if needed');
    console.log('   3. Test the checkout flow with these products');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createProducts();
}

module.exports = { createProducts, products };

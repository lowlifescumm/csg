#!/usr/bin/env node

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
  console.log('🚀 Setting up Stripe products for Cosmic Spiritual Guide...\n');
  console.log('⚠️  Creating new products (ignoring existing ones)...\n');

  try {
    for (const productData of products) {
      console.log(`📦 Creating product: ${productData.name}`);

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

      console.log(`   ✅ Product created: ${product.id}`);

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

// Run the script
if (require.main === module) {
  createProducts();
}

module.exports = { createProducts, products };

#!/usr/bin/env node

/**
 * Stripe Products Setup Script v2
 * Creates all necessary products and prices in Stripe for Cosmic Spiritual Guide
 * Updated to match new pricing structure: Lite/Premium tiers and direct-pay reports
 */

const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  // Credit Packs
  {
    name: '10 Credits Pack',
    description: 'Perfect for trying out readings',
    metadata: {
      pack_type: 'credit_pack',
      credits: '10',
      app: 'cosmic-spiritual-guide'
    },
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
    metadata: {
      pack_type: 'credit_pack',
      credits: '25',
      app: 'cosmic-spiritual-guide'
    },
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
    metadata: {
      pack_type: 'credit_pack',
      credits: '50',
      app: 'cosmic-spiritual-guide'
    },
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
    metadata: {
      pack_type: 'credit_pack',
      credits: '100',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 5999, // $59.99
        currency: 'usd',
        recurring: null
      }
    ]
  },
  // Subscription Tiers
  {
    name: 'Mystic Lite',
    description: 'Essential cosmic guidance - 60 credits/month, 90-day rollover, 5% report discount',
    metadata: {
      subscription_tier: 'MYSTIC_LITE',
      credits_per_month: '60',
      rollover_days: '90',
      report_discount: '5',
      priority_access: 'false',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 1999, // $19.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          tier_id: 'MYSTIC_LITE'
        }
      }
    ]
  },
  {
    name: 'Mystic Premium',
    description: 'Unlimited spiritual insight - 150 credits/month, 180-day rollover, 10% report discount, priority queue',
    metadata: {
      subscription_tier: 'MYSTIC_PREMIUM',
      credits_per_month: '150',
      rollover_days: '180',
      report_discount: '10',
      priority_access: 'true',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 3999, // $39.99
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          tier_id: 'MYSTIC_PREMIUM'
        }
      }
    ]
  },
  // Direct-Pay Reports
  {
    name: 'Essential Report',
    description: 'Tarot + Moon + short forecast',
    metadata: {
      report_type: 'ESSENTIAL',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 4900, // $49
        currency: 'usd',
        recurring: null,
        metadata: {
          report_key: 'ESSENTIAL'
        }
      }
    ]
  },
  {
    name: 'Advanced Report',
    description: 'Full natal + compatibility + forecast',
    metadata: {
      report_type: 'ADVANCED',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 14900, // $149
        currency: 'usd',
        recurring: null,
        metadata: {
          report_key: 'ADVANCED'
        }
      }
    ]
  },
  {
    name: 'Master Report',
    description: 'Deep-dive multi-cycle destiny profile',
    metadata: {
      report_type: 'MASTER',
      app: 'cosmic-spiritual-guide'
    },
    prices: [
      {
        unit_amount: 24900, // $249
        currency: 'usd',
        recurring: null,
        metadata: {
          report_key: 'MASTER'
        }
      }
    ]
  }
];

async function createProducts() {
  console.log('🚀 Setting up Stripe products for Cosmic Spiritual Guide v2...\n');
  console.log('⚠️  Creating new products (ignoring existing ones)...\n');

  const createdProducts = {
    creditPacks: [],
    subscriptions: [],
    reports: []
  };

  try {
    for (const productData of products) {
      console.log(`📦 Creating product: ${productData.name}`);

      // Create the product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        type: 'service',
        metadata: {
          ...productData.metadata,
          created_by: 'setup-script-v2',
          created_at: new Date().toISOString()
        }
      });

      console.log(`   ✅ Product created: ${product.id}`);

      // Create prices for the product
      const createdPrices = [];
      for (const priceData of productData.prices) {
        const priceConfig = {
          product: product.id,
          unit_amount: priceData.unit_amount,
          currency: priceData.currency,
          metadata: {
            ...(priceData.metadata || {}),
            app: 'cosmic-spiritual-guide',
            created_by: 'setup-script-v2'
          }
        };

        // Only add recurring if it's not null
        if (priceData.recurring) {
          priceConfig.recurring = priceData.recurring;
        }

        const price = await stripe.prices.create(priceConfig);
        createdPrices.push(price);

        const priceType = priceData.recurring ? 'recurring' : 'one-time';
        console.log(`   💰 Price created: ${price.id} (${priceData.currency.toUpperCase()} ${(priceData.unit_amount / 100).toFixed(2)} - ${priceType})`);
      }

      // Categorize for summary
      if (productData.metadata?.pack_type === 'credit_pack') {
        createdProducts.creditPacks.push({ product, prices: createdPrices });
      } else if (productData.metadata?.subscription_tier) {
        createdProducts.subscriptions.push({ product, prices: createdPrices });
      } else if (productData.metadata?.report_type) {
        createdProducts.reports.push({ product, prices: createdPrices });
      }

      console.log('');
    }

    console.log('🎉 All products and prices created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • ${createdProducts.creditPacks.length} Credit Pack products with one-time prices`);
    console.log(`   • ${createdProducts.subscriptions.length} Subscription tier products with recurring prices`);
    console.log(`   • ${createdProducts.reports.length} Direct-pay Report products with one-time prices`);
    console.log('   • All products are now available in your Stripe dashboard');
    
    console.log('\n📝 Product IDs (save these for reference):');
    console.log('\n   Credit Packs:');
    createdProducts.creditPacks.forEach(({ product, prices }) => {
      console.log(`     ${product.name}: Product ${product.id}, Price ${prices[0].id}`);
    });
    
    console.log('\n   Subscriptions:');
    createdProducts.subscriptions.forEach(({ product, prices }) => {
      console.log(`     ${product.name}: Product ${product.id}, Price ${prices[0].id}`);
    });
    
    console.log('\n   Reports:');
    createdProducts.reports.forEach(({ product, prices }) => {
      console.log(`     ${product.name}: Product ${product.id}, Price ${prices[0].id}`);
    });
    
    console.log('\n🔗 Next steps:');
    console.log('   1. Check your Stripe dashboard to verify products');
    console.log('   2. Update your application to use these product/price IDs if needed');
    console.log('   3. Test the checkout flow with these products');
    console.log('   4. Update subscription activation to use Stripe Checkout Sessions with these prices');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Details:', error.raw?.message);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createProducts();
}

module.exports = { createProducts, products };


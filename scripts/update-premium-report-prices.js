#!/usr/bin/env node

/**
 * Update Premium Report Prices in Stripe
 * 
 * This script updates the prices for Essential, Advanced, and Master reports in Stripe.
 * Since Stripe prices are immutable, this script:
 * 1. Finds existing products by metadata
 * 2. Creates new prices with updated amounts
 * 3. Optionally deactivates old prices
 * 
 * Usage:
 *   node scripts/update-premium-report-prices.js [--deactivate-old]
 */

const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Updated pricing from lib/pricing.js
const UPDATED_PRICES = {
  ESSENTIAL: {
    unit_amount: 1999, // $19.99
    description: 'Premium Tarot + Moon Reading + short Transit Forecast (fast 2–4 min PDF)'
  },
  ADVANCED: {
    unit_amount: 3900, // $39
    description: 'Full Birth Chart + Compatibility + Extended Transit Forecast (4–6 min PDF)'
  },
  MASTER: {
    unit_amount: 7499, // $74.99
    description: 'Comprehensive Birth Chart + Advanced Compatibility + Multi-cycle Forecast + Timeline etc. (6–8 min PDF)'
  }
};

async function updateReportPrices(deactivateOld = false) {
  console.log('🔄 Updating Premium Report Prices in Stripe...\n');
  console.log('⚠️  Note: Stripe prices are immutable. New prices will be created.\n');

  const results = {
    updated: [],
    errors: []
  };

  try {
    // Get all active products
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    // Process each report type
    for (const [reportType, priceData] of Object.entries(UPDATED_PRICES)) {
      console.log(`📦 Processing ${reportType} Report...`);

      // Find product by metadata
      const product = products.data.find(
        (p) => p.metadata && p.metadata.report_type === reportType
      );

      if (!product) {
        console.log(`   ⚠️  Product not found for ${reportType}. Skipping.`);
        console.log(`   💡 Run setup-stripe-products-v2.js to create the product first.\n`);
        results.errors.push({
          reportType,
          error: 'Product not found'
        });
        continue;
      }

      console.log(`   ✅ Found product: ${product.name} (${product.id})`);

      // Get existing prices
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      // Check if a price with the new amount already exists
      const existingPrice = existingPrices.data.find(
        (p) => p.unit_amount === priceData.unit_amount && !p.recurring
      );

      if (existingPrice) {
        console.log(`   ✅ Price already exists: ${existingPrice.id} ($${(priceData.unit_amount / 100).toFixed(2)})`);
        results.updated.push({
          reportType,
          productId: product.id,
          priceId: existingPrice.id,
          amount: priceData.unit_amount,
          status: 'already_exists'
        });
        console.log('');
        continue;
      }

      // Update product description if needed
      if (product.description !== priceData.description) {
        await stripe.products.update(product.id, {
          description: priceData.description
        });
        console.log(`   ✅ Updated product description`);
      }

      // Create new price
      const newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.unit_amount,
        currency: 'usd',
        metadata: {
          report_key: reportType,
          app: 'cosmic-spiritual-guide',
          created_by: 'update-premium-report-prices-script',
          updated_at: new Date().toISOString()
        }
      });

      console.log(`   ✅ Created new price: ${newPrice.id} ($${(priceData.unit_amount / 100).toFixed(2)})`);

      // Optionally deactivate old prices
      if (deactivateOld) {
        const oldPrices = existingPrices.data.filter(
          (p) => p.unit_amount !== priceData.unit_amount && !p.recurring
        );

        for (const oldPrice of oldPrices) {
          await stripe.prices.update(oldPrice.id, {
            active: false
          });
          console.log(`   🗑️  Deactivated old price: ${oldPrice.id} ($${(oldPrice.unit_amount / 100).toFixed(2)})`);
        }
      }

      results.updated.push({
        reportType,
        productId: product.id,
        priceId: newPrice.id,
        amount: priceData.unit_amount,
        status: 'created'
      });

      console.log('');
    }

    // Summary
    console.log('🎉 Update Summary:');
    console.log(`   • ${results.updated.length} report(s) processed`);
    console.log(`   • ${results.errors.length} error(s)\n`);

    if (results.updated.length > 0) {
      console.log('📋 Updated Reports:');
      results.updated.forEach(({ reportType, priceId, amount, status }) => {
        const statusIcon = status === 'already_exists' ? '✅' : '🆕';
        console.log(`   ${statusIcon} ${reportType}: Price ${priceId} ($${(amount / 100).toFixed(2)})`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(({ reportType, error }) => {
        console.log(`   • ${reportType}: ${error}`);
      });
    }

    console.log('\n🔗 Next steps:');
    console.log('   1. Verify prices in Stripe dashboard');
    console.log('   2. Test checkout flow with new prices');
    console.log('   3. Update your application to use the new price IDs if needed');
    if (!deactivateOld) {
      console.log('   4. Run with --deactivate-old flag to deactivate old prices');
    }

  } catch (error) {
    console.error('❌ Error updating prices:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.error('   Details:', error.raw?.message);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const deactivateOld = process.argv.includes('--deactivate-old');

// Run the script
if (require.main === module) {
  updateReportPrices(deactivateOld);
}

module.exports = { updateReportPrices, UPDATED_PRICES };


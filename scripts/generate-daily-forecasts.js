#!/usr/bin/env node
/**
 * Daily Forecast Generation Job
 * 
 * Run this script daily (e.g., via cron) to generate forecasts for all active users
 * 
 * Usage:
 *   node scripts/generate-daily-forecasts.js
 * 
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   OPENAI_API_KEY - OpenAI API key (for AI rewrites)
 *   NODE_ENV - production|development
 * 
 * Cron example (run at 6 AM daily):
 *   0 6 * * * cd /path/to/app && node scripts/generate-daily-forecasts.js >> logs/forecasts.log 2>&1
 */

import { pool } from '../lib/db.js';
import { generateForecast, saveForecast, getForecastPreferences } from '../lib/forecast-engine.js';

const BATCH_SIZE = 10; // Process users in batches
const DELAY_MS = 1000; // Delay between batches (rate limiting)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getActiveUsers() {
  // Get users who have:
  // 1. A natal chart
  // 2. Forecast preferences with cadence !== 'none'
  // 3. Are admin or have active subscription
  const result = await pool.query(`
    SELECT DISTINCT u.id, u.email, u.role, u.stripe_subscription_id,
           fp.delivery_cadence, fp.tone, fp.default_length, fp.topics,
           fp.include_actions, fp.ai_rewrite_enabled
    FROM users u
    LEFT JOIN forecast_preferences fp ON fp.user_id = u.id
    WHERE (
      EXISTS (SELECT 1 FROM natal_charts WHERE user_id = u.id AND is_primary = true)
      OR EXISTS (SELECT 1 FROM birth_charts WHERE user_id = u.id)
    )
    AND (fp.delivery_cadence = 'daily' OR fp.delivery_cadence IS NULL)
    AND (u.role = 'admin' OR u.stripe_subscription_id IS NOT NULL)
    ORDER BY u.id
  `);
  
  return result.rows;
}

async function generateForecastForUser(user, date) {
  try {
    console.log(`[${user.id}] Generating forecast for ${user.email}...`);
    
    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM forecasts WHERE user_id = $1 AND forecast_date = $2 AND forecast_type = $3',
      [user.id, date, 'daily']
    );
    
    if (existing.rows.length > 0) {
      console.log(`[${user.id}] Forecast already exists, skipping`);
      return { status: 'skipped', reason: 'already_exists' };
    }
    
    // Get preferences
    const prefs = await getForecastPreferences(user.id);
    
    // Check if AI rewrite is allowed
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';
    const aiRewrite = (isAdmin || isPremium) && prefs.ai_rewrite_enabled;
    
    // Generate forecast
    const forecast = await generateForecast(user.id, date, {
      type: 'daily',
      length: prefs.default_length,
      tone: prefs.tone,
      topics: prefs.topics,
      includeActions: prefs.include_actions,
      aiRewrite,
    });
    
    // Save to database
    const forecastId = await saveForecast(forecast);
    
    console.log(`[${user.id}] ✓ Forecast generated successfully (ID: ${forecastId})`);
    
    // TODO: Send email notification if email_enabled
    if (prefs.email_enabled) {
      console.log(`[${user.id}] TODO: Send email notification`);
    }
    
    return { status: 'success', forecastId };
  } catch (error) {
    console.error(`[${user.id}] ✗ Error generating forecast:`, error.message);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  const startTime = Date.now();
  console.log('=== Daily Forecast Generation ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    // Get today's date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    console.log(`Generating forecasts for: ${dateStr}`);
    
    // Get active users
    const users = await getActiveUsers();
    console.log(`Found ${users.length} active users`);
    
    if (users.length === 0) {
      console.log('No users to process');
      return;
    }
    
    // Process in batches
    const results = {
      success: 0,
      skipped: 0,
      error: 0,
      total: users.length,
    };
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
      
      // Process batch in parallel
      const promises = batch.map(user => generateForecastForUser(user, dateStr));
      const batchResults = await Promise.all(promises);
      
      // Tally results
      batchResults.forEach(result => {
        results[result.status]++;
      });
      
      // Delay between batches (rate limiting)
      if (i + BATCH_SIZE < users.length) {
        console.log(`Waiting ${DELAY_MS}ms before next batch...`);
        await sleep(DELAY_MS);
      }
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=== Summary ===');
    console.log(`Total users: ${results.total}`);
    console.log(`✓ Success: ${results.success}`);
    console.log(`⊘ Skipped: ${results.skipped}`);
    console.log(`✗ Errors: ${results.error}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    
    // Exit with error code if there were failures
    if (results.error > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateDailyForecasts };


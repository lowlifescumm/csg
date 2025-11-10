#!/usr/bin/env node
/**
 * @fileoverview This script generates daily astrological forecasts for all active users.
 * It is intended to be run as a daily cron job.
 * 
 * @usage
 * To run this script, use the following command:
 * node scripts/generate-daily-forecasts.js
 * 
 * @cron_example
 * 0 6 * * * cd /path/to/app && node scripts/generate-daily-forecasts.js >> logs/forecasts.log 2>&1
 */

import { pool } from '../lib/db.js';
import { generateForecast, saveForecast, getForecastPreferences } from '../lib/forecast-engine.js';

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

/**
 * A utility function to introduce a delay.
 * @param {number} ms - The delay in milliseconds.
 * @returns {Promise<void>}
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retrieves a list of active users who are eligible for daily forecasts.
 * @returns {Promise<Array<object>>} A list of active users.
 */
async function getActiveUsers() {
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

/**
 * Generates and saves a daily forecast for a single user.
 * @param {object} user - The user object.
 * @param {string} date - The date for the forecast in YYYY-MM-DD format.
 * @returns {Promise<object>} An object indicating the status of the forecast generation.
 */
async function generateForecastForUser(user, date) {
  try {
    console.log(`[${user.id}] Generating forecast for ${user.email}...`);
    
    const existing = await pool.query(
      'SELECT id FROM forecasts WHERE user_id = $1 AND forecast_date = $2 AND forecast_type = $3',
      [user.id, date, 'daily']
    );
    
    if (existing.rows.length > 0) {
      console.log(`[${user.id}] Forecast already exists, skipping`);
      return { status: 'skipped', reason: 'already_exists' };
    }
    
    const prefs = await getForecastPreferences(user.id);
    
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';
    const aiRewrite = (isAdmin || isPremium) && prefs.ai_rewrite_enabled;
    
    const forecast = await generateForecast(user.id, date, {
      type: 'daily',
      length: prefs.default_length,
      tone: prefs.tone,
      topics: prefs.topics,
      includeActions: prefs.include_actions,
      aiRewrite,
    });
    
    const forecastId = await saveForecast(forecast);
    
    console.log(`[${user.id}] ✓ Forecast generated successfully (ID: ${forecastId})`);
    
    if (prefs.email_enabled) {
      console.log(`[${user.id}] TODO: Send email notification`);
    }
    
    return { status: 'success', forecastId };
  } catch (error) {
    console.error(`[${user.id}] ✗ Error generating forecast:`, error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * The main function that orchestrates the forecast generation process.
 */
async function main() {
  const startTime = Date.now();
  console.log('=== Daily Forecast Generation ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    console.log(`Generating forecasts for: ${dateStr}`);
    
    const users = await getActiveUsers();
    console.log(`Found ${users.length} active users`);
    
    if (users.length === 0) {
      console.log('No users to process');
      return;
    }
    
    const results = {
      success: 0,
      skipped: 0,
      error: 0,
      total: users.length,
    };
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
      
      const promises = batch.map(user => generateForecastForUser(user, dateStr));
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(result => {
        results[result.status]++;
      });
      
      if (i + BATCH_SIZE < users.length) {
        console.log(`Waiting ${DELAY_MS}ms before next batch...`);
        await sleep(DELAY_MS);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=== Summary ===');
    console.log(`Total users: ${results.total}`);
    console.log(`✓ Success: ${results.success}`);
    console.log(`⊘ Skipped: ${results.skipped}`);
    console.log(`✗ Errors: ${results.error}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Completed at: ${new Date().toISOString()}`);
    
    if (results.error > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateDailyForecasts };

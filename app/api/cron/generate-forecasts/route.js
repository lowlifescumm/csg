/**
 * Forecast Generation Cron Job
 * 
 * This endpoint should be called daily by an external cron service
 * (e.g., Render Cron Jobs, Vercel Cron, or external monitoring service)
 * 
 * Security: Protect with a secret token
 */

import { NextResponse } from 'next/server';
import { generateForecast, saveForecast, getForecastPreferences } from '@/lib/forecast-engine.js';
import { pool } from '@/lib/db.js';
import logger from '@/lib/logger.js';

export const dynamic = 'force-dynamic';

const BATCH_SIZE = 10; // Process users in batches
const DELAY_MS = 1000; // Delay between batches (rate limiting)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getActiveUsers() {
  // Get users who have:
  // 1. A natal chart
  // 2. Forecast preferences with cadence === 'daily'
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
    AND (u.role = 'admin' OR u.stripe_subscription_id IS NOT NULL AND u.stripe_subscription_id != '')
    ORDER BY u.id
  `);
  
  return result.rows;
}

async function generateForecastForUser(user, date) {
  try {
    logger.info(`[${user.id}] Generating forecast for ${user.email}...`);
    
    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM forecasts WHERE user_id = $1 AND forecast_date = $2 AND forecast_type = $3',
      [user.id, date, 'daily']
    );
    
    if (existing.rows.length > 0) {
      logger.info(`[${user.id}] Forecast already exists, skipping`);
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
    
    logger.info(`[${user.id}] ✓ Forecast generated successfully (ID: ${forecastId})`);
    
    return { status: 'success', forecastId };
  } catch (error) {
    logger.error(`[${user.id}] ✗ Error generating forecast:`, error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Get users with weekly forecast delivery cadence
 */
async function getActiveWeeklyUsers() {
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
    AND fp.delivery_cadence = 'weekly'
    AND (u.role = 'admin' OR u.stripe_subscription_id IS NOT NULL AND u.stripe_subscription_id != '')
    ORDER BY u.id
  `);
  return result.rows;
}

/**
 * Get the Monday of the current week
 */
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate weekly forecast for a single user
 */
async function generateWeeklyForecastForUser(user, weekStartStr) {
  try {
    logger.info(`[${user.id}] Generating weekly forecast for ${user.email}...`);
    
    const existing = await pool.query(
      'SELECT id FROM forecasts WHERE user_id = $1 AND forecast_date = $2 AND forecast_type = $3',
      [user.id, weekStartStr, 'weekly']
    );
    
    if (existing.rows.length > 0) {
      logger.info(`[${user.id}] Weekly forecast already exists, skipping`);
      return { status: 'skipped', reason: 'already_exists' };
    }
    
    const prefs = await getForecastPreferences(user.id);
    
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';
    const aiRewrite = (isAdmin || isPremium) && prefs.ai_rewrite_enabled;
    
    const forecast = await generateForecast(user.id, weekStartStr, {
      type: 'weekly',
      length: prefs.default_length,
      tone: prefs.tone,
      topics: prefs.topics,
      includeActions: prefs.include_actions,
      aiRewrite,
    });
    
    const forecastId = await saveForecast(forecast);
    
    logger.info(`[${user.id}] ✓ Weekly forecast generated successfully (ID: ${forecastId})`);
    
    return { status: 'success', forecastId };
  } catch (error) {
    logger.error(`[${user.id}] ✗ Error generating weekly forecast:`, error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * GET /api/cron/generate-forecasts
 * Run the daily forecast generation service (and weekly on Mondays)
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req) {
  const startTime = Date.now();
  
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    logger.info('[Cron Debug] Auth header received:', authHeader);
    logger.info('[Cron Debug] CRON_SECRET exists:', !!cronSecret);

    if (!cronSecret) {
      logger.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 500 });
    }

    // CRITICAL: Render environment variables often have trailing newlines
    // We must aggressively trim to remove any whitespace/newlines
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    logger.info('[Cron Debug] Secret length:', trimmedSecret.length);
    logger.info('[Cron Debug] Header length:', trimmedHeader?.length);
    logger.info('[Cron Debug] Expected full (masked):', `Bearer ${trimmedSecret.substring(0, 10)}...${trimmedSecret.substring(trimmedSecret.length - 4)}`);
    logger.info('[Cron Debug] Received full:', trimmedHeader);
    logger.info('[Cron Debug] Exact match:', trimmedHeader === expectedAuth);
    logger.info('[Cron Debug] Secret has whitespace:', cronSecret !== trimmedSecret);
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      logger.warn('[Cron] Unauthorized cron job attempt');
      logger.warn('[Cron Debug] Expected length:', expectedAuth.length);
      logger.warn('[Cron Debug] Received length:', trimmedHeader?.length);
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          expectedLength: expectedAuth.length,
          receivedLength: trimmedHeader?.length,
          firstCharsMatch: trimmedHeader?.substring(0, 20) === expectedAuth.substring(0, 20),
          lastCharsMatch: trimmedHeader?.substring(trimmedHeader.length - 10) === expectedAuth.substring(expectedAuth.length - 10)
        }
      }, { status: 401 });
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // ===== DAILY FORECASTS =====
    logger.info('[Cron] Starting daily forecast generation...');
    logger.info(`[Cron] Generating forecasts for: ${dateStr}`);
    
    const users = await getActiveUsers();
    logger.info(`[Cron] Found ${users.length} active daily users`);
    
    const results = {
      success: 0,
      skipped: 0,
      error: 0,
      total: users.length,
    };
    
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      logger.info(`[Cron] Processing daily batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(users.length / BATCH_SIZE)}`);
      
      const promises = batch.map(user => generateForecastForUser(user, dateStr));
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(result => {
        results[result.status]++;
      });
      
      if (i + BATCH_SIZE < users.length) {
        await sleep(DELAY_MS);
      }
    }
    
    // ===== WEEKLY FORECASTS (Mondays only) =====
    const isMonday = today.getDay() === 1;
    const weeklyResults = { success: 0, skipped: 0, error: 0, total: 0 };
    
    if (isMonday) {
      const weekStart = getMondayOfWeek(today);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      logger.info(`[Cron] Today is Monday — starting weekly forecast generation for week of ${weekStartStr}...`);
      
      const weeklyUsers = await getActiveWeeklyUsers();
      weeklyResults.total = weeklyUsers.length;
      logger.info(`[Cron] Found ${weeklyUsers.length} active weekly users`);
      
      for (let i = 0; i < weeklyUsers.length; i += BATCH_SIZE) {
        const batch = weeklyUsers.slice(i, i + BATCH_SIZE);
        logger.info(`[Cron] Processing weekly batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(weeklyUsers.length / BATCH_SIZE)}`);
        
        const promises = batch.map(user => generateWeeklyForecastForUser(user, weekStartStr));
        const batchResults = await Promise.all(promises);
        
        batchResults.forEach(result => {
          weeklyResults[result.status]++;
        });
        
        if (i + BATCH_SIZE < weeklyUsers.length) {
          await sleep(DELAY_MS);
        }
      }
      
      logger.info('[Cron] === Weekly Forecast Generation Summary ===');
      logger.info(`[Cron] Weekly total: ${weeklyResults.total}`);
      logger.info(`[Cron] ✓ Success: ${weeklyResults.success}`);
      logger.info(`[Cron] ⊘ Skipped: ${weeklyResults.skipped}`);
      logger.info(`[Cron] ✗ Errors: ${weeklyResults.error}`);
    } else {
      logger.info(`[Cron] Today is not Monday (day ${today.getDay()}), skipping weekly forecast generation`);
    }
    
    // Combined summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('[Cron] === Combined Forecast Generation Summary ===');
    logger.info(`[Cron] Daily — Total: ${results.total}, Success: ${results.success}, Skipped: ${results.skipped}, Errors: ${results.error}`);
    logger.info(`[Cron] Weekly — Total: ${weeklyResults.total}, Success: ${weeklyResults.success}, Skipped: ${weeklyResults.skipped}, Errors: ${weeklyResults.error}`);
    logger.info(`[Cron] Duration: ${duration}s`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      daily: results,
      weekly: weeklyResults,
      duration: `${duration}s`
    });

  } catch (error) {
    logger.error('[Cron] Forecast generation job failed:', error);
    return NextResponse.json({
      error: 'Job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/cron/generate-forecasts
 * Alternative method for cron services that use POST
 */
export async function POST(req) {
  return GET(req);
}

